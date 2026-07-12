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
  cycles: [],
  items: [],
};

function createError(status, code, message, data) {
  return new ApiError(status, code, message, data);
}

function listAuditCycles() {
  return store.cycles;
}

function createAuditCycle(payload) {
  if (!payload || !payload.name) {
    throw createError(400, "VALIDATION_ERROR", "name is required.");
  }

  const cycle = {
    id: randomUUID(),
    name: payload.name,
    scopeDepartmentId: payload.scopeDepartmentId ?? null,
    scopeLocation: payload.scopeLocation ?? null,
    startDate: payload.startDate ?? null,
    endDate: payload.endDate ?? null,
    status: "OPEN",
    createdById: payload.createdById ?? null,
    auditorIds: Array.isArray(payload.auditorIds) ? payload.auditorIds : [],
  };

  store.cycles.unshift(cycle);
  return cycle;
}

function verifyAuditItem(itemId, payload) {
  const item =
    store.items.find((candidate) => candidate.id === itemId) ??
    (() => {
      const created = {
        id: itemId,
        auditCycleId: payload?.auditCycleId ?? null,
        assetId: payload?.assetId ?? null,
        auditorId: payload?.auditorId ?? null,
        verificationStatus: "PENDING",
        notes: null,
      };
      store.items.unshift(created);
      return created;
    })();

  item.verificationStatus = payload?.verificationStatus ?? "VERIFIED";
  item.notes = payload?.notes ?? null;
  return item;
}

function closeAuditCycle(cycleId) {
  const cycle = store.cycles.find((candidate) => candidate.id === cycleId);

  if (!cycle) {
    throw createError(404, "NOT_FOUND", "Audit cycle not found.");
  }

  if (cycle.status === "CLOSED") {
    throw createError(400, "INVALID_STATE", "Audit cycle is already closed.");
  }

  cycle.status = "CLOSED";
  cycle.closedAt = new Date().toISOString();
  return cycle;
}

module.exports = {
  ApiError,
  createError,
  listAuditCycles,
  createAuditCycle,
  verifyAuditItem,
  closeAuditCycle,
};