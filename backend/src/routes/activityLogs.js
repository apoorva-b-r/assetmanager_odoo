const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const { sanitizeUser } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/activity-logs (ADMIN only)
router.get('/', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { userId, entityType } = req.query;
    const where = {};

    if (userId) {
      where.userId = userId;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    const logs = await prisma.activityLog.findMany({
      where,
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
    });

    // Sanitize user details within logs if present
    const sanitizedLogs = logs.map(log => ({
      ...log,
      user: log.user ? sanitizeUser(log.user) : null,
    }));

    return res.status(200).json({
      success: true,
      data: sanitizedLogs,
    });
  } catch (error) {
    console.error('Fetch activity logs error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve activity logs.',
    });
  }
});

module.exports = router;
