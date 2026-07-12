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

const maintenanceSelect = {
  id: true,
  issueDescription: true,
  priority: true,
  photoUrl: true,
  status: true,
  technicianName: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
  assetId: true,
  raisedById: true,
  decidedById: true,
  asset: {
    select: {
      id: true,
      tag: true,
      name: true,
      status: true,
    },
  },
  raisedBy: {
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
};

function createError(status, code, message, data) {
  return new ApiError(status, code, message, data);
}

async function listMaintenanceRequests({ status } = {}) {
  const where = {};

  if (status) {
    where.status = status;
  }

  return prisma.maintenanceRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: maintenanceSelect,
  });
}

async function createMaintenanceRequest(payload, actorId) {
  if (!payload || !payload.assetId || !payload.issueDescription) {
    throw createError(400, "VALIDATION_ERROR", "assetId and issueDescription are required.");
  }

  if (!actorId) {
    throw createError(401, "UNAUTHENTICATED", "Authentication required.");
  }

  const request = await prisma.$transaction(async (tx) => {
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

    return tx.maintenanceRequest.create({
      data: {
        assetId: payload.assetId,
        issueDescription: payload.issueDescription,
        priority: payload.priority ?? 'MEDIUM',
        photoUrl: payload.photoUrl ?? null,
        raisedById: actorId,
      },
      select: maintenanceSelect,
    });
  });

  await Promise.all([
    notify(actorId, 'MAINTENANCE_REQUEST_CREATED', `Maintenance request created for ${request.asset.tag || request.asset.name}.`, request.id),
    logActivity(actorId, 'MAINTENANCE_REQUEST_CREATED', 'MaintenanceRequest', request.id, {
      assetId: request.assetId,
      priority: request.priority,
    }),
  ]);

  return request;
}

async function approveMaintenanceRequest(requestId, actorId) {
  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.maintenanceRequest.findUnique({
      where: { id: requestId },
      select: maintenanceSelect,
    });

    if (!request) {
      throw createError(404, "NOT_FOUND", "Maintenance request not found.");
    }

    if (request.status !== 'PENDING') {
      throw createError(400, "INVALID_STATE", "Maintenance request is already in a terminal state.");
    }

    // Select deterministic technician from controlled pool
    const technicians = ["Alex Carter", "Jordan Vance", "Taylor Morgan", "Sam Elliott"];
    const sum = requestId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const assignedTechnician = technicians[sum % technicians.length];

    const updatedRequest = await tx.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        status: 'TECHNICIAN_ASSIGNED',
        technicianName: assignedTechnician,
        decidedById: actorId,
      },
      select: maintenanceSelect,
    });

    const updatedAsset = await tx.asset.update({
      where: { id: request.assetId },
      data: {
        status: 'UNDER_MAINTENANCE',
      },
      select: {
        id: true,
        tag: true,
        name: true,
        status: true,
      },
    });

    return { request: updatedRequest, asset: updatedAsset };
  });

  await Promise.all([
    notify(result.request.raisedById, 'MAINTENANCE_APPROVED', `Maintenance approved and technician assigned for ${result.asset.tag || result.asset.name}.`, result.request.id),
    logActivity(actorId, 'MAINTENANCE_APPROVED', 'MaintenanceRequest', result.request.id, {
      assetId: result.request.assetId,
      technicianName: result.request.technicianName,
    }),
  ]);

  return result.request;
}

async function rejectMaintenanceRequest(requestId, payload, actorId) {
  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.maintenanceRequest.findUnique({
      where: { id: requestId },
      select: maintenanceSelect,
    });

    if (!request) {
      throw createError(404, "NOT_FOUND", "Maintenance request not found.");
    }

    if (request.status !== 'PENDING') {
      throw createError(400, "INVALID_STATE", "Maintenance request is already in a terminal state.");
    }

    return tx.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        decidedById: actorId,
      },
      select: maintenanceSelect,
    });
  });

  await Promise.all([
    notify(result.raisedById, 'MAINTENANCE_REJECTED', `Maintenance rejected for ${result.asset.tag || result.asset.name}.`, result.id),
    logActivity(actorId, 'MAINTENANCE_REJECTED', 'MaintenanceRequest', result.id, {
      assetId: result.assetId,
      reason: payload?.reason ?? null,
    }),
  ]);

  return result;
}

async function assignTechnician(requestId, payload, actorId) {
  if (!payload?.technicianName) {
    throw createError(400, "VALIDATION_ERROR", "technicianName is required.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.maintenanceRequest.findUnique({
      where: { id: requestId },
      select: maintenanceSelect,
    });

    if (!request) {
      throw createError(404, "NOT_FOUND", "Maintenance request not found.");
    }

    if (!['APPROVED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS'].includes(request.status)) {
      throw createError(400, "INVALID_STATE", "Maintenance request cannot be assigned a technician now.");
    }

    return tx.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        status: 'TECHNICIAN_ASSIGNED',
        technicianName: payload.technicianName,
        decidedById: actorId,
      },
      select: maintenanceSelect,
    });
  });

  await Promise.all([
    notify(result.raisedById, 'MAINTENANCE_TECHNICIAN_ASSIGNED', `Technician assigned for ${result.asset.tag || result.asset.name}.`, result.id),
    logActivity(actorId, 'MAINTENANCE_TECHNICIAN_ASSIGNED', 'MaintenanceRequest', result.id, {
      assetId: result.assetId,
      technicianName: payload.technicianName,
    }),
  ]);

  return result;
}

async function startMaintenanceRequest(requestId, actorId) {
  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.maintenanceRequest.findUnique({
      where: { id: requestId },
      select: maintenanceSelect,
    });

    if (!request) {
      throw createError(404, "NOT_FOUND", "Maintenance request not found.");
    }

    if (request.status !== 'TECHNICIAN_ASSIGNED') {
      throw createError(400, "INVALID_STATE", "Maintenance request must be in TECHNICIAN_ASSIGNED state to start work.");
    }

    return tx.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        status: 'IN_PROGRESS',
        decidedById: actorId,
      },
      select: maintenanceSelect,
    });
  });

  await Promise.all([
    notify(result.raisedById, 'MAINTENANCE_IN_PROGRESS', `Maintenance started for ${result.asset.tag || result.asset.name}.`, result.id),
    logActivity(actorId, 'MAINTENANCE_IN_PROGRESS', 'MaintenanceRequest', result.id, {
      assetId: result.assetId,
    }),
  ]);

  return result;
}

async function resolveMaintenanceRequest(requestId, actorId) {
  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.maintenanceRequest.findUnique({
      where: { id: requestId },
      select: maintenanceSelect,
    });

    if (!request) {
      throw createError(404, "NOT_FOUND", "Maintenance request not found.");
    }

    if (!['APPROVED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS'].includes(request.status)) {
      throw createError(400, "INVALID_STATE", "Maintenance request cannot be resolved now.");
    }

    const activeAllocation = await tx.allocation.findFirst({
      where: {
        assetId: request.assetId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    const nextAssetStatus = activeAllocation ? 'ALLOCATED' : 'AVAILABLE';

    const updatedRequest = await tx.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        decidedById: actorId,
      },
      select: maintenanceSelect,
    });

    const updatedAsset = await tx.asset.update({
      where: { id: request.assetId },
      data: {
        status: nextAssetStatus,
      },
      select: {
        id: true,
        tag: true,
        name: true,
        status: true,
      },
    });

    return { request: updatedRequest, asset: updatedAsset };
  });

  await Promise.all([
    notify(result.request.raisedById, 'MAINTENANCE_RESOLVED', `Maintenance resolved for ${result.asset.tag || result.asset.name}.`, result.request.id),
    logActivity(actorId, 'MAINTENANCE_RESOLVED', 'MaintenanceRequest', result.request.id, {
      assetId: result.request.assetId,
      assetStatus: result.asset.status,
    }),
  ]);

  return result.request;
}

module.exports = {
  ApiError,
  createError,
  listMaintenanceRequests,
  createMaintenanceRequest,
  approveMaintenanceRequest,
  rejectMaintenanceRequest,
  assignTechnician,
  startMaintenanceRequest,
  resolveMaintenanceRequest,
};
