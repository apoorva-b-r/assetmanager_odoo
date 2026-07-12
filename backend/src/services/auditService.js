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

const auditCycleSelect = {
  id: true,
  name: true,
  scopeLocation: true,
  startDate: true,
  endDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  scopeDepartmentId: true,
  createdById: true,
  scopeDepartment: {
    select: {
      id: true,
      name: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
    },
  },
  auditors: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
    },
  },
};

const auditItemSelect = {
  id: true,
  verificationStatus: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  auditCycleId: true,
  assetId: true,
  auditorId: true,
  asset: {
    select: {
      id: true,
      tag: true,
      name: true,
      status: true,
      categoryId: true,
      location: true,
    },
  },
  auditor: {
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

async function listAuditCycles() {
  return prisma.auditCycle.findMany({
    orderBy: { createdAt: 'desc' },
    select: auditCycleSelect,
  });
}

async function createAuditCycle(payload, actorId) {
  if (!payload || !payload.name || !payload.startDate || !payload.endDate) {
    throw createError(400, "VALIDATION_ERROR", "name, startDate and endDate are required.");
  }

  if (!actorId) {
    throw createError(401, "UNAUTHENTICATED", "Authentication required.");
  }

  const startDate = new Date(payload.startDate);
  const endDate = new Date(payload.endDate);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate >= endDate) {
    throw createError(400, "VALIDATION_ERROR", "startDate must be before endDate.");
  }

  const auditorIds = Array.isArray(payload.auditorIds) ? payload.auditorIds.filter(Boolean) : [];

  // Find assets in location
  let where = {};
  if (payload.scopeLocation) {
    where.location = { equals: payload.scopeLocation, mode: 'insensitive' };
  }
  
  let assets = await prisma.asset.findMany({ where });

  // If department filter is set, filter assets by active allocation
  if (payload.scopeDepartmentId) {
    const activeAllocations = await prisma.allocation.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { departmentId: payload.scopeDepartmentId },
          { employee: { departmentId: payload.scopeDepartmentId } }
        ]
      },
      select: { assetId: true }
    });
    const allocatedAssetIds = new Set(activeAllocations.map(a => a.assetId));
    assets = assets.filter(asset => allocatedAssetIds.has(asset.id));
  }

  const defaultAuditorId = auditorIds[0] || actorId;
  const auditItemsData = assets.map(asset => ({
    assetId: asset.id,
    auditorId: defaultAuditorId,
    verificationStatus: 'PENDING',
  }));

  const cycle = await prisma.auditCycle.create({
    data: {
      name: payload.name,
      scopeDepartmentId: payload.scopeDepartmentId ?? null,
      scopeLocation: payload.scopeLocation ?? null,
      startDate,
      endDate,
      createdById: actorId,
      auditors: auditorIds.length
        ? {
            connect: auditorIds.map((id) => ({ id })),
          }
        : undefined,
      auditItems: auditItemsData.length ? {
        create: auditItemsData
      } : undefined
    },
    select: auditCycleSelect,
  });

  await Promise.all([
    ...auditorIds.map((auditorId) => notify(auditorId, 'AUDIT_CYCLE_ASSIGNED', `You were assigned to audit cycle ${cycle.name}.`, cycle.id)),
    logActivity(actorId, 'AUDIT_CYCLE_CREATED', 'AuditCycle', cycle.id, {
      name: cycle.name,
      scopeDepartmentId: cycle.scopeDepartmentId,
      scopeLocation: cycle.scopeLocation,
      auditorIds,
    }),
  ]);

  return cycle;
}

async function verifyAuditItem(itemId, payload, actorId) {
  if (!payload || !payload.verificationStatus) {
    throw createError(400, "VALIDATION_ERROR", "verificationStatus is required.");
  }

  const validStatuses = ['PENDING', 'VERIFIED', 'MISSING', 'DAMAGED'];
  if (!validStatuses.includes(payload.verificationStatus)) {
    throw createError(400, "VALIDATION_ERROR", `verificationStatus must be one of: ${validStatuses.join(', ')}.`);
  }

  const item = await prisma.$transaction(async (tx) => {
    const existing = await tx.auditItem.findUnique({
      where: { id: itemId },
      select: auditItemSelect,
    });

    if (existing) {
      const cycle = await tx.auditCycle.findUnique({
        where: { id: existing.auditCycleId },
        select: {
          id: true,
          status: true,
          auditors: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!cycle) {
        throw createError(404, "AUDIT_CYCLE_NOT_FOUND", "Audit cycle not found.");
      }

      if (cycle.status === 'CLOSED') {
        throw createError(400, "INVALID_STATE", "Audit cycle is already closed.");
      }

      if (actorId && cycle.auditors.length && !cycle.auditors.some((auditor) => auditor.id === actorId)) {
        throw createError(403, "UNAUTHORIZED_ROLE", "You are not assigned to this audit cycle.");
      }

      return tx.auditItem.update({
        where: { id: itemId },
        data: {
          verificationStatus: payload.verificationStatus,
          notes: payload.notes ?? null,
          auditorId: payload.auditorId ?? existing.auditorId,
        },
        select: auditItemSelect,
      });
    }

    if (!payload.auditCycleId || !payload.assetId || !payload.auditorId) {
      throw createError(400, "VALIDATION_ERROR", "auditCycleId, assetId and auditorId are required for a new audit item.");
    }

    const cycle = await tx.auditCycle.findUnique({
      where: { id: payload.auditCycleId },
      select: {
        id: true,
        status: true,
        auditors: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!cycle) {
      throw createError(404, "AUDIT_CYCLE_NOT_FOUND", "Audit cycle not found.");
    }

    if (cycle.status === 'CLOSED') {
      throw createError(400, "INVALID_STATE", "Audit cycle is already closed.");
    }

    if (actorId && cycle.auditors.length && !cycle.auditors.some((auditor) => auditor.id === actorId)) {
      throw createError(403, "UNAUTHORIZED_ROLE", "You are not assigned to this audit cycle.");
    }

    return tx.auditItem.create({
      data: {
        auditCycleId: payload.auditCycleId,
        assetId: payload.assetId,
        auditorId: payload.auditorId,
        verificationStatus: payload.verificationStatus,
        notes: payload.notes ?? null,
      },
      select: auditItemSelect,
    });
  });

  if (actorId) {
    await logActivity(actorId, 'AUDIT_ITEM_VERIFIED', 'AuditItem', item.id, {
      auditCycleId: item.auditCycleId,
      assetId: item.assetId,
      verificationStatus: item.verificationStatus,
    });
  }

  return item;
}

async function closeAuditCycle(cycleId, actorId) {
  const result = await prisma.$transaction(async (tx) => {
    const cycle = await tx.auditCycle.findUnique({
      where: { id: cycleId },
      select: {
        id: true,
        name: true,
        status: true,
        auditors: {
          select: { id: true },
        },
      },
    });

    if (!cycle) {
      throw createError(404, "NOT_FOUND", "Audit cycle not found.");
    }

    if (cycle.status === 'CLOSED') {
      throw createError(400, "INVALID_STATE", "Audit cycle is already closed.");
    }

    const items = await tx.auditItem.findMany({
      where: { auditCycleId: cycleId },
      select: auditItemSelect,
    });

    const missingItems = items.filter((item) => item.verificationStatus === 'MISSING');
    const damagedItems = items.filter((item) => item.verificationStatus === 'DAMAGED');

    for (const item of missingItems) {
      await tx.asset.update({
        where: { id: item.assetId },
        data: { status: 'LOST' },
      });
    }

    for (const item of damagedItems) {
      await tx.asset.update({
        where: { id: item.assetId },
        data: { condition: 'DAMAGED' },
      });
    }

    const updatedCycle = await tx.auditCycle.update({
      where: { id: cycleId },
      data: { status: 'CLOSED' },
      select: auditCycleSelect,
    });

    return {
      auditCycle: updatedCycle,
      discrepancies: [...missingItems, ...damagedItems],
      missingItems,
      damagedItems,
    };
  });

  if (actorId) {
    await logActivity(actorId, 'AUDIT_CYCLE_CLOSED', 'AuditCycle', result.auditCycle.id, {
      discrepancyCount: result.discrepancies.length,
      missingCount: result.missingItems.length,
      damagedCount: result.damagedItems.length,
    });
  }

  return result;
}

module.exports = {
  ApiError,
  createError,
  listAuditCycles,
  createAuditCycle,
  verifyAuditItem,
  closeAuditCycle,
};
