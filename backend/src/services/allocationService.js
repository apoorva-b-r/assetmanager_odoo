const { randomUUID } = require("crypto");
const { PrismaClient } = require("@prisma/client");
const { notify } = require("./notify");
const { logActivity } = require("./activityLog");

class ApiError extends Error {
  constructor(status, code, message, data) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

const prisma = new PrismaClient();
const store = {
  transferRequests: [],
};

const allocationSelect = {
  id: true,
  allocatedAt: true,
  expectedReturnDate: true,
  returnedAt: true,
  returnCondition: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  assetId: true,
  employeeId: true,
  departmentId: true,
  asset: {
    select: {
      id: true,
      tag: true,
      name: true,
      status: true,
    },
  },
  employee: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
    },
  },
  department: {
    select: {
      id: true,
      name: true,
    },
  },
};

function nowIso() {
  return new Date().toISOString();
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function createError(status, code, message, data) {
  return new ApiError(status, code, message, data);
}

function normalizeEmployee(allocation) {
  if (allocation.employee) {
    return {
      id: allocation.employee.id,
      name: allocation.employee.name,
    };
  }

  if (allocation.department) {
    return {
      id: allocation.department.id,
      name: allocation.department.name,
    };
  }

  return {
    id: allocation.employeeId || allocation.departmentId || allocation.id,
    name: "Current holder",
  };
}

async function listAllocations({ assetId, status } = {}) {
  const where = {};

  if (assetId) {
    where.assetId = assetId;
  }

  if (status) {
    where.status = status;
  }

  return prisma.allocation.findMany({
    where,
    orderBy: { allocatedAt: 'desc' },
    select: allocationSelect,
  });
}

async function createAllocation(payload, actorId) {
  if (!payload || !payload.assetId) {
    throw createError(400, "VALIDATION_ERROR", "assetId is required.");
  }

  if (!payload.employeeId && !payload.departmentId) {
    throw createError(400, "VALIDATION_ERROR", "employeeId or departmentId is required.");
  }

  if (payload.employeeId && payload.departmentId) {
    throw createError(400, "VALIDATION_ERROR", "Provide either employeeId or departmentId, not both.");
  }

  const expectedReturnDate = parseDate(payload.expectedReturnDate);

  if (!expectedReturnDate) {
    throw createError(400, "VALIDATION_ERROR", "expectedReturnDate must be a valid ISO date.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const asset = await tx.asset.findUnique({
      where: { id: payload.assetId },
      select: {
        id: true,
        tag: true,
        name: true,
        status: true,
      },
    });

    if (!asset) {
      throw createError(404, "ASSET_NOT_FOUND", "Asset not found.");
    }

    const existingAllocation = await tx.allocation.findFirst({
      where: {
        assetId: payload.assetId,
        status: 'ACTIVE',
      },
      select: allocationSelect,
    });

    if (existingAllocation) {
      throw createError(409, "ALLOCATION_CONFLICT", "Asset is already allocated.", {
        currentHolder: normalizeEmployee(existingAllocation),
      });
    }

    if (asset.status !== 'AVAILABLE') {
      throw createError(409, "ASSET_NOT_AVAILABLE", `Asset ${asset.tag || asset.name} is currently ${asset.status}.`, {
        assetId: asset.id,
        assetStatus: asset.status,
      });
    }

    const allocation = await tx.allocation.create({
      data: {
        assetId: payload.assetId,
        employeeId: payload.employeeId ?? null,
        departmentId: payload.departmentId ?? null,
        expectedReturnDate,
        status: 'ACTIVE',
      },
      select: allocationSelect,
    });

    await tx.asset.update({
      where: { id: asset.id },
      data: {
        status: 'ALLOCATED',
      },
    });

    return { allocation, asset };
  });

  const recipientIds = new Set([actorId]);
  if (payload.employeeId) {
    recipientIds.add(payload.employeeId);
  }

  const message = `Asset ${result.asset.tag || result.asset.name} allocated successfully.`;

  await Promise.all([
    ...Array.from(recipientIds).filter(Boolean).map((userId) => notify(userId, 'ASSET_ASSIGNED', message, result.allocation.id)),
    actorId
      ? logActivity(actorId, 'ASSET_ALLOCATED', 'Allocation', result.allocation.id, {
          assetId: result.asset.id,
          assetTag: result.asset.tag,
          employeeId: payload.employeeId ?? null,
          departmentId: payload.departmentId ?? null,
        })
      : Promise.resolve(),
  ]);

  return result.allocation;
}

async function returnAllocation(allocationId, payload, actorId) {
  const allocation = await prisma.allocation.findUnique({
    where: { id: allocationId },
    select: allocationSelect,
  });

  if (!allocation) {
    throw createError(404, "NOT_FOUND", "Allocation not found.");
  }

  if (allocation.status !== "ACTIVE") {
    throw createError(400, "INVALID_STATE", "Allocation is not active.");
  }

  const updatedAllocation = await prisma.$transaction(async (tx) => {
    const nextAllocation = await tx.allocation.update({
      where: { id: allocationId },
      data: {
        status: 'RETURNED',
        returnedAt: new Date(),
        returnCondition: payload?.returnCondition ?? null,
      },
      select: allocationSelect,
    });

    await tx.asset.update({
      where: { id: allocation.assetId },
      data: {
        status: 'AVAILABLE',
      },
    });

    return nextAllocation;
  });

  if (actorId) {
    await Promise.all([
      notify(actorId, 'ASSET_RETURNED', `Allocation ${updatedAllocation.id} was returned.`, updatedAllocation.id),
      logActivity(actorId, 'ASSET_RETURNED', 'Allocation', updatedAllocation.id, {
        assetId: updatedAllocation.assetId,
        allocationId: updatedAllocation.id,
      }),
    ]);
  }

  return updatedAllocation;
}

function listTransferRequests({ status } = {}) {
  return store.transferRequests.filter((request) => {
    if (status && request.status !== status) {
      return false;
    }

    return true;
  });
}

function createTransferRequest(payload) {
  if (!payload || !payload.assetId || !payload.toUserId) {
    throw createError(400, "VALIDATION_ERROR", "assetId and toUserId are required.");
  }

  const transferRequest = {
    id: randomUUID(),
    assetId: payload.assetId,
    fromUserId: payload.fromUserId ?? null,
    fromUserName: payload.fromUserName ?? "Current Holder",
    toUserId: payload.toUserId,
    toUserName: payload.toUserName ?? "Requested User",
    reason: payload.reason ?? "",
    status: "REQUESTED",
    requestedAt: nowIso(),
    decidedById: null,
  };

  store.transferRequests.unshift(transferRequest);
  return transferRequest;
}

function approveTransferRequest(transferRequestId) {
  const transferRequest = store.transferRequests.find((request) => request.id === transferRequestId);

  if (!transferRequest) {
    throw createError(404, "NOT_FOUND", "Transfer request not found.");
  }

  if (transferRequest.status !== "REQUESTED") {
    throw createError(400, "INVALID_STATE", "Transfer request is not pending.");
  }

  const currentAllocation = store.allocations.find(
    (allocation) => allocation.assetId === transferRequest.assetId && allocation.status === "ACTIVE",
  );

  if (currentAllocation) {
    currentAllocation.status = "RETURNED";
    currentAllocation.returnedAt = nowIso();
    currentAllocation.returnCondition = "TRANSFERRED";
  }

  const newAllocation = {
    id: randomUUID(),
    assetId: transferRequest.assetId,
    employeeId: transferRequest.toUserId,
    employeeName: transferRequest.toUserName,
    departmentId: null,
    allocatedAt: nowIso(),
    expectedReturnDate: null,
    returnedAt: null,
    returnCondition: null,
    status: "ACTIVE",
  };

  store.allocations.unshift(newAllocation);

  transferRequest.status = "APPROVED";
  transferRequest.decidedById = null;
  transferRequest.decidedAt = nowIso();
  transferRequest.resultAllocationId = newAllocation.id;

  return {
    transferRequest,
    allocation: newAllocation,
  };
}

function rejectTransferRequest(transferRequestId) {
  const transferRequest = store.transferRequests.find((request) => request.id === transferRequestId);

  if (!transferRequest) {
    throw createError(404, "NOT_FOUND", "Transfer request not found.");
  }

  if (transferRequest.status !== "REQUESTED") {
    throw createError(400, "INVALID_STATE", "Transfer request is not pending.");
  }

  transferRequest.status = "REJECTED";
  transferRequest.decidedAt = nowIso();
  return transferRequest;
}

module.exports = {
  ApiError,
  createError,
  listAllocations,
  createAllocation,
  returnAllocation,
  listTransferRequests,
  createTransferRequest,
  approveTransferRequest,
  rejectTransferRequest,
};