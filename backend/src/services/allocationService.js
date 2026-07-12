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

async function returnAllocation(allocationId, payload, actor) {
  const actorId = actor?.id;
  const actorRole = actor?.role;
  const actorDeptId = actor?.departmentId;

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

  // Authorization check: ASSET_MANAGER and ADMIN may return any.
  // EMPLOYEE / DEPT_HEAD may only return their own or department's allocation.
  const isAssetManagerOrAdmin = actorRole === 'ASSET_MANAGER' || actorRole === 'ADMIN';
  const isOwnEmployeeAllocation = allocation.employeeId === actorId;
  const isOwnDepartmentAllocation = allocation.departmentId && allocation.departmentId === actorDeptId;

  if (!isAssetManagerOrAdmin && !isOwnEmployeeAllocation && !isOwnDepartmentAllocation) {
    throw createError(403, "UNAUTHORIZED_ROLE", "You are not authorized to return this allocation.");
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

async function listTransferRequests({ status } = {}) {
  const where = {};

  if (status) {
    where.status = status;
  }

  return prisma.transferRequest.findMany({
    where,
    orderBy: { requestedAt: 'desc' },
    select: {
      id: true,
      reason: true,
      status: true,
      requestedAt: true,
      updatedAt: true,
      assetId: true,
      fromUserId: true,
      toUserId: true,
      decidedById: true,
      asset: {
        select: {
          id: true,
          tag: true,
          name: true,
        },
      },
      fromUser: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          departmentId: true,
        },
      },
      toUser: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          departmentId: true,
        },
      },
      decidedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          departmentId: true,
        },
      },
    },
  });
}

async function createTransferRequest(payload, actorId) {
  if (!payload || !payload.assetId || !payload.toUserId) {
    throw createError(400, "VALIDATION_ERROR", "assetId and toUserId are required.");
  }

  const currentAllocation = await prisma.allocation.findFirst({
    where: {
      assetId: payload.assetId,
      status: 'ACTIVE',
    },
    select: allocationSelect,
  });

  const transferRequest = await prisma.transferRequest.create({
    data: {
      assetId: payload.assetId,
      fromUserId: currentAllocation?.employeeId || payload.fromUserId || actorId,
      toUserId: payload.toUserId,
      reason: payload.reason,
    },
    select: {
      id: true,
      reason: true,
      status: true,
      requestedAt: true,
      updatedAt: true,
      assetId: true,
      fromUserId: true,
      toUserId: true,
      decidedById: true,
    },
  });

  if (actorId) {
    await logActivity(actorId, 'TRANSFER_REQUESTED', 'TransferRequest', transferRequest.id, {
      assetId: payload.assetId,
      toUserId: payload.toUserId,
    });
  }

  return transferRequest;
}

async function approveTransferRequest(transferRequestId, actorId) {
  const result = await prisma.$transaction(async (tx) => {
    const transferRequest = await tx.transferRequest.findUnique({
      where: { id: transferRequestId },
      select: {
        id: true,
        assetId: true,
        fromUserId: true,
        toUserId: true,
        reason: true,
        status: true,
        requestedAt: true,
        updatedAt: true,
        decidedById: true,
        asset: {
          select: {
            id: true,
            tag: true,
            name: true,
            status: true,
          },
        },
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            departmentId: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            departmentId: true,
          },
        },
      },
    });

    if (!transferRequest) {
      throw createError(404, "NOT_FOUND", "Transfer request not found.");
    }

    if (transferRequest.status !== 'REQUESTED') {
      throw createError(400, "INVALID_STATE", "Transfer request is not pending.");
    }

    const currentAllocation = await tx.allocation.findFirst({
      where: {
        assetId: transferRequest.assetId,
        status: 'ACTIVE',
      },
      select: allocationSelect,
    });

    if (!currentAllocation) {
      throw createError(409, "ALLOCATION_CONFLICT", "Asset has already been returned or reallocated.", {
        currentHolder: transferRequest.fromUser
          ? {
              id: transferRequest.fromUser.id,
              name: transferRequest.fromUser.name,
            }
          : null,
      });
    }

    if (currentAllocation.employeeId && transferRequest.fromUserId && currentAllocation.employeeId !== transferRequest.fromUserId) {
      throw createError(409, "ALLOCATION_CONFLICT", "Allocation holder changed before transfer approval.", {
        currentHolder: normalizeEmployee(currentAllocation),
      });
    }

    const returnedAllocation = await tx.allocation.update({
      where: { id: currentAllocation.id },
      data: {
        status: 'RETURNED',
        returnedAt: new Date(),
        returnCondition: 'TRANSFERRED',
      },
      select: allocationSelect,
    });

    const newAllocation = await tx.allocation.create({
      data: {
        assetId: transferRequest.assetId,
        employeeId: transferRequest.toUserId,
        expectedReturnDate: currentAllocation.expectedReturnDate,
        status: 'ACTIVE',
      },
      select: allocationSelect,
    });

    await tx.asset.update({
      where: { id: transferRequest.assetId },
      data: {
        status: 'ALLOCATED',
      },
    });

    const updatedTransferRequest = await tx.transferRequest.update({
      where: { id: transferRequest.id },
      data: {
        status: 'APPROVED',
        decidedById: actorId ?? null,
      },
      select: {
        id: true,
        reason: true,
        status: true,
        requestedAt: true,
        updatedAt: true,
        assetId: true,
        fromUserId: true,
        toUserId: true,
        decidedById: true,
        asset: {
          select: {
            id: true,
            tag: true,
            name: true,
          },
        },
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            departmentId: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            departmentId: true,
          },
        },
        decidedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            departmentId: true,
          },
        },
      },
    });

    return {
      transferRequest: updatedTransferRequest,
      oldAllocation: returnedAllocation,
      allocation: newAllocation,
      asset: transferRequest.asset,
    };
  });

  if (actorId) {
    await Promise.all([
      notify(result.transferRequest.toUserId, 'TRANSFER_APPROVED', `Transfer approved for ${result.asset.tag || result.asset.name}.`, result.transferRequest.id),
      notify(result.oldAllocation.employeeId || actorId, 'TRANSFER_APPROVED', `Transfer approved for ${result.asset.tag || result.asset.name}.`, result.transferRequest.id),
      logActivity(actorId, 'TRANSFER_APPROVED', 'TransferRequest', result.transferRequest.id, {
        assetId: result.asset.id,
        oldAllocationId: result.oldAllocation.id,
        newAllocationId: result.allocation.id,
        toUserId: result.transferRequest.toUserId,
      }),
    ]);
  }

  return {
    transferRequest: result.transferRequest,
    allocation: result.allocation,
  };
}

async function rejectTransferRequest(transferRequestId, actorId) {
  const transferRequest = await prisma.transferRequest.findUnique({
    where: { id: transferRequestId },
    select: {
      id: true,
      reason: true,
      status: true,
      requestedAt: true,
      updatedAt: true,
      assetId: true,
      fromUserId: true,
      toUserId: true,
      decidedById: true,
      asset: {
        select: {
          id: true,
          tag: true,
          name: true,
        },
      },
      fromUser: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          departmentId: true,
        },
      },
      toUser: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          departmentId: true,
        },
      },
    },
  });

  if (!transferRequest) {
    throw createError(404, "NOT_FOUND", "Transfer request not found.");
  }

  if (transferRequest.status !== 'REQUESTED') {
    throw createError(400, "INVALID_STATE", "Transfer request is not pending.");
  }

  const updatedTransferRequest = await prisma.transferRequest.update({
    where: { id: transferRequestId },
    data: {
      status: 'REJECTED',
      decidedById: actorId ?? null,
    },
    select: {
      id: true,
      reason: true,
      status: true,
      requestedAt: true,
      updatedAt: true,
      assetId: true,
      fromUserId: true,
      toUserId: true,
      decidedById: true,
      asset: {
        select: {
          id: true,
          tag: true,
          name: true,
        },
      },
      fromUser: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          departmentId: true,
        },
      },
      toUser: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          departmentId: true,
        },
      },
      decidedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          departmentId: true,
        },
      },
    },
  });

  if (actorId) {
    await Promise.all([
      notify(updatedTransferRequest.toUserId, 'TRANSFER_REJECTED', `Transfer rejected for ${updatedTransferRequest.asset.tag || updatedTransferRequest.asset.name}.`, updatedTransferRequest.id),
      logActivity(actorId, 'TRANSFER_REJECTED', 'TransferRequest', updatedTransferRequest.id, {
        assetId: updatedTransferRequest.assetId,
        toUserId: updatedTransferRequest.toUserId,
      }),
    ]);
  }

  return updatedTransferRequest;
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