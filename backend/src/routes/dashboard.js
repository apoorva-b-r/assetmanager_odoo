const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { sanitizeUser } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/dashboard/summary
router.get('/summary', authenticate, async (req, res) => {
  try {
    const now = new Date();
    
    // Compute local calendar day boundaries for maintenanceToday
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    // Compute expectedReturnDate boundary (+7 days) for upcomingReturns
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Execute aggregate/count and collection fetches concurrently
    const [
      availableCount,
      allocatedCount,
      maintenanceTodayCount,
      activeBookingsCount,
      pendingTransfersCount,
      upcomingReturnsCount,
      overdueAllocations,
      recentActivityLogs,
    ] = await Promise.all([
      // 1. available count
      prisma.asset.count({
        where: { status: 'AVAILABLE' },
      }),
      // 2. allocated count
      prisma.asset.count({
        where: { status: 'ALLOCATED' },
      }),
      // 3. maintenanceToday count
      prisma.maintenanceRequest.count({
        where: {
          createdAt: {
            gte: startOfToday,
            lt: startOfTomorrow,
          },
        },
      }),
      // 4. activeBookings count
      prisma.booking.count({
        where: { status: 'ONGOING' },
      }),
      // 5. pendingTransfers count
      prisma.transferRequest.count({
        where: { status: 'REQUESTED' },
      }),
      // 6. upcomingReturns count
      prisma.allocation.count({
        where: {
          status: 'ACTIVE',
          expectedReturnDate: {
            gte: now,
            lte: sevenDaysLater,
          },
        },
      }),
      // 7. overdue list (ACTIVE and expectedReturnDate < now)
      prisma.allocation.findMany({
        where: {
          status: 'ACTIVE',
          expectedReturnDate: {
            lt: now,
          },
        },
        include: {
          asset: true,
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
              departmentId: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          expectedReturnDate: 'asc', // Sort most overdue first
        },
      }),
      // 8. recentActivity list (latest 10 logs)
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
              departmentId: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    // Sanitize employee structures under overdue allocations
    const sanitizedOverdue = overdueAllocations.map(alloc => ({
      ...alloc,
      employee: alloc.employee ? sanitizeUser(alloc.employee) : null,
    }));

    // Sanitize user structures under recent activity
    const sanitizedActivity = recentActivityLogs.map(log => ({
      ...log,
      user: log.user ? sanitizeUser(log.user) : null,
    }));

    return res.status(200).json({
      success: true,
      data: {
        available: availableCount,
        allocated: allocatedCount,
        maintenanceToday: maintenanceTodayCount,
        activeBookings: activeBookingsCount,
        pendingTransfers: pendingTransfersCount,
        upcomingReturns: upcomingReturnsCount,
        overdue: sanitizedOverdue,
        recentActivity: sanitizedActivity,
      },
    });
  } catch (error) {
    console.error('Fetch dashboard summary error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve dashboard summary.',
    });
  }
});

module.exports = router;
