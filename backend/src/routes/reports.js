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
    const bookings = await prisma.booking.findMany({ select: { startTime: true } });
    const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));

    bookings.forEach((booking) => {
      const hour = new Date(booking.startTime).getHours();
      if (buckets[hour]) {
        buckets[hour].count += 1;
      }
    });

    return response(res, buckets);
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
