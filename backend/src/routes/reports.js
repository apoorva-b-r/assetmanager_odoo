const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middleware/auth");

const prisma = new PrismaClient();
const router = express.Router();
router.use(authenticate);

function sendError(res, error) {
  return res.status(500).json({
    success: false,
    code: "SERVER_ERROR",
    message: error.message || "Unexpected server error.",
  });
}

function response(res, data) {
  return res.json({ success: true, data });
}

router.get("/utilization", async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      select: { id: true, name: true },
    });
    const allocations = await prisma.allocation.findMany({
      select: { departmentId: true },
    });

    const counts = departments.map((department) => ({
      departmentId: department.id,
      departmentName: department.name,
      totalAllocations: allocations.filter((allocation) => allocation.departmentId === department.id).length,
    }));

    return response(res, counts);
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/maintenance-frequency", async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      select: { id: true, name: true, categoryId: true },
    });
    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      select: { assetId: true },
    });

    const byAsset = assets.map((asset) => ({
      assetId: asset.id,
      assetName: asset.name,
      categoryId: asset.categoryId,
      maintenanceCount: maintenanceRequests.filter((request) => request.assetId === asset.id).length,
    }));

    return response(res, byAsset);
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/upcoming-maintenance", async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      where: {
        OR: [
          { status: 'UNDER_MAINTENANCE' },
          { condition: { contains: 'maintenance', mode: 'insensitive' } },
        ],
      },
      select: { id: true, tag: true, name: true, status: true, categoryId: true, location: true },
    });

    return response(res, {
      items: assets.map((asset) => ({
        id: asset.id,
        tag: asset.tag,
        name: asset.name,
        status: asset.status,
        categoryId: asset.categoryId,
        location: asset.location,
      })),
      total: assets.length,
    });
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/department-allocation", async (req, res) => {
  try {
    const departments = await prisma.department.findMany({ select: { id: true, name: true } });
    const allocations = await prisma.allocation.findMany({ select: { departmentId: true } });

    return response(res, departments.map((department) => ({
      departmentId: department.id,
      departmentName: department.name,
      allocationCount: allocations.filter((allocation) => allocation.departmentId === department.id).length,
    })));
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/booking-heatmap", async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        status: { not: 'CANCELLED' }
      },
      select: { startTime: true }
    });

    const heatmapData = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 8; hour <= 20; hour++) {
        heatmapData.push({ day, hour, count: 0 });
      }
    }

    bookings.forEach((booking) => {
      const date = new Date(booking.startTime);
      const day = date.getDay();
      const hour = date.getHours();
      
      const cell = heatmapData.find(item => item.day === day && item.hour === hour);
      if (cell) {
        cell.count += 1;
      }
    });

    return response(res, heatmapData);
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/summary", async (req, res) => {
  try {
    const totalAssets = await prisma.asset.count();
    const allocatedAssets = await prisma.asset.count({ where: { status: 'ALLOCATED' } });
    const availableAssets = await prisma.asset.count({ where: { status: 'AVAILABLE' } });
    const underMaintenanceAssets = await prisma.asset.count({ where: { status: 'UNDER_MAINTENANCE' } });
    const activeBookings = await prisma.booking.count({ where: { status: 'ONGOING' } });
    const openMaintenanceRequests = await prisma.maintenanceRequest.count({ where: { status: 'PENDING' } });

    return response(res, {
      totalAssets,
      allocatedAssets,
      availableAssets,
      underMaintenanceAssets,
      activeBookings,
      openMaintenanceRequests,
    });
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/most-used", async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      select: {
        id: true,
        tag: true,
        name: true,
        category: { select: { name: true } },
        _count: {
          select: { allocations: true }
        }
      },
      orderBy: {
        allocations: { _count: 'desc' }
      },
      take: 5
    });
    return response(res, assets.map(a => ({
      id: a.id,
      tag: a.tag,
      name: a.name,
      categoryName: a.category?.name || "Uncategorized",
      usageCount: a._count.allocations
    })));
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/idle", async (req, res) => {
  try {
    const idleAssets = await prisma.asset.findMany({
      where: {
        allocations: {
          none: {}
        }
      },
      select: {
        id: true,
        tag: true,
        name: true,
        category: { select: { name: true } },
        createdAt: true
      },
      take: 5
    });
    return response(res, idleAssets.map(a => ({
      id: a.id,
      tag: a.tag,
      name: a.name,
      categoryName: a.category?.name || "Uncategorized",
      createdAt: a.createdAt
    })));
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/requiring-attention", async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      where: {
        OR: [
          { status: 'UNDER_MAINTENANCE' },
          {
            maintenanceRequests: {
              some: {}
            }
          }
        ]
      },
      select: {
        id: true,
        tag: true,
        name: true,
        status: true,
        condition: true,
        _count: {
          select: { maintenanceRequests: true }
        }
      },
      orderBy: {
        maintenanceRequests: { _count: 'desc' }
      },
      take: 5
    });
    return response(res, assets.map(a => ({
      id: a.id,
      tag: a.tag,
      name: a.name,
      status: a.status,
      condition: a.condition,
      maintenanceCount: a._count.maintenanceRequests
    })));
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/maintenance-trend", async (req, res) => {
  try {
    const requests = await prisma.maintenanceRequest.findMany({
      select: { createdAt: true }
    });

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return {
        month: months[d.getMonth()],
        year: d.getFullYear(),
        monthIdx: d.getMonth(),
        count: 0
      };
    });

    requests.forEach((req) => {
      const date = new Date(req.createdAt);
      const match = trend.find(t => t.monthIdx === date.getMonth() && t.year === date.getFullYear());
      if (match) {
        match.count += 1;
      }
    });

    return response(res, trend.map(t => ({ name: t.month, count: t.count })));
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
