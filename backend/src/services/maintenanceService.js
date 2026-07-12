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
  requests: [],
};

function createError(status, code, message, data) {
  return new ApiError(status, code, message, data);
}

function listMaintenanceRequests({ status } = {}) {
  return store.requests.filter((request) => {
    if (status && request.status !== status) {
      return false;
    }
    return true;
  });
}

function createMaintenanceRequest(payload) {
  if (!payload || !payload.assetId || !payload.issueDescription) {
    throw createError(400, "VALIDATION_ERROR", "assetId and issueDescription are required.");
  }

  const request = {
    id: randomUUID(),
    assetId: payload.assetId,
    raisedById: payload.raisedById ?? null,
    issueDescription: payload.issueDescription,
    priority: payload.priority ?? "MEDIUM",
    photoUrl: payload.photoUrl ?? null,
    status: "PENDING",
    technicianName: null,
    decidedById: null,
    resolvedAt: null,
  };

  store.requests.unshift(request);
  return request;
}

function getRequest(requestId) {
  const request = store.requests.find((item) => item.id === requestId);

  if (!request) {
    throw createError(404, "NOT_FOUND", "Maintenance request not found.");
  }

  return request;
}

function approveMaintenanceRequest(requestId) {
  const request = getRequest(requestId);

  if (request.status !== "PENDING") {
    throw createError(400, "INVALID_STATE", "Maintenance request is already in a terminal state.");
  }

  request.status = "APPROVED";
  request.decidedById = null;
  request.decidedAt = new Date().toISOString();
  request.assetStatus = "UNDER_MAINTENANCE";
  return request;
}

function rejectMaintenanceRequest(requestId, payload) {
  const request = getRequest(requestId);

  if (request.status !== "PENDING") {
    throw createError(400, "INVALID_STATE", "Maintenance request is already in a terminal state.");
  }

  request.status = "REJECTED";
  request.rejectionReason = payload?.reason ?? null;
  request.decidedAt = new Date().toISOString();
  return request;
}

function assignTechnician(requestId, payload) {
  const request = getRequest(requestId);

  if (!payload?.technicianName) {
    throw createError(400, "VALIDATION_ERROR", "technicianName is required.");
  }

  if (!["APPROVED", "TECHNICIAN_ASSIGNED", "IN_PROGRESS"].includes(request.status)) {
    throw createError(400, "INVALID_STATE", "Maintenance request cannot be assigned a technician now.");
  }

  request.status = "TECHNICIAN_ASSIGNED";
  request.technicianName = payload.technicianName;
  return request;
}

function resolveMaintenanceRequest(requestId) {
  const request = getRequest(requestId);

  if (!["APPROVED", "TECHNICIAN_ASSIGNED", "IN_PROGRESS"].includes(request.status)) {
    throw createError(400, "INVALID_STATE", "Maintenance request cannot be resolved now.");
  }

  request.status = "RESOLVED";
  request.resolvedAt = new Date().toISOString();
  request.assetStatus = "AVAILABLE";
  return request;
}

module.exports = {
  ApiError,
  createError,
  listMaintenanceRequests,
  createMaintenanceRequest,
  approveMaintenanceRequest,
  rejectMaintenanceRequest,
  assignTechnician,
  resolveMaintenanceRequest,
};