const { randomUUID } = require("crypto");

class ApiError extends Error {
  constructor(status, code, message, data) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

const store = {
  allocations: [],
  transferRequests: [],
};

function nowIso() {
  return new Date().toISOString();
}

function createError(status, code, message, data) {
  return new ApiError(status, code, message, data);
}

function normalizeEmployee(allocation) {
  return {
    id: allocation.employeeId,
    name: allocation.employeeName,
  };
}

function listAllocations({ assetId, status } = {}) {
  return store.allocations.filter((allocation) => {
    if (assetId && allocation.assetId !== assetId) {
      return false;
    }
    if (status && allocation.status !== status) {
      return false;
    }
    return true;
  });
}

function createAllocation(payload) {
  if (!payload || !payload.assetId) {
    throw createError(400, "VALIDATION_ERROR", "assetId is required.");
  }

  const existingAllocation = store.allocations.find(
    (allocation) => allocation.assetId === payload.assetId && allocation.status === "ACTIVE",
  );

  if (existingAllocation) {
    throw createError(409, "ALLOCATION_CONFLICT", "Asset is already allocated.", {
      currentHolder: normalizeEmployee(existingAllocation),
    });
  }

  const allocation = {
    id: randomUUID(),
    assetId: payload.assetId,
    employeeId: payload.employeeId ?? null,
    employeeName: payload.employeeName ?? "Mock Employee",
    departmentId: payload.departmentId ?? null,
    allocatedAt: nowIso(),
    expectedReturnDate: payload.expectedReturnDate ?? null,
    returnedAt: null,
    returnCondition: null,
    status: "ACTIVE",
  };

  store.allocations.unshift(allocation);
  return allocation;
}

function returnAllocation(allocationId, payload) {
  const allocation = store.allocations.find((item) => item.id === allocationId);

  if (!allocation) {
    throw createError(404, "NOT_FOUND", "Allocation not found.");
  }

  if (allocation.status !== "ACTIVE") {
    throw createError(400, "INVALID_STATE", "Allocation is not active.");
  }

  allocation.status = "RETURNED";
  allocation.returnedAt = nowIso();
  allocation.returnCondition = payload?.returnCondition ?? null;
  return allocation;
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