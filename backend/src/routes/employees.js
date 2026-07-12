const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const { sanitizeUser } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/employees (ADMIN, ASSET_MANAGER, DEPT_HEAD)
router.get('/', authenticate, requireRole('ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD'), async (req, res) => {
  try {
    const { department, role } = req.query;
    const where = {};

    // Filter by role if provided
    if (role) {
      const validRoles = ['EMPLOYEE', 'DEPT_HEAD', 'ASSET_MANAGER', 'ADMIN'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: `Invalid role parameter: ${role}. Must be one of: [${validRoles.join(', ')}]`,
        });
      }
      where.role = role;
    }

    // Filter by department (ID or case-insensitive name) if provided
    if (department) {
      where.department = {
        OR: [
          { id: department },
          { name: { equals: department, mode: 'insensitive' } },
        ],
      };
    }

    const employees = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        departmentId: true,
        createdAt: true,
      },
    });

    const sanitizedEmployees = employees.map(sanitizeUser);

    return res.status(200).json({
      success: true,
      data: sanitizedEmployees,
    });
  } catch (error) {
    console.error('Fetch employees directory error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve employee directory.',
    });
  }
});

// PUT /api/employees/:id/role (ADMIN only)
router.put('/:id/role', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Role parameter is required.',
      });
    }

    // Role promotion guard: only allow DEPT_HEAD or ASSET_MANAGER
    const allowedPromotionRoles = ['DEPT_HEAD', 'ASSET_MANAGER'];
    if (!allowedPromotionRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ROLE_PROMOTION',
        message: `Invalid role promotion: ${role}. Admin can only promote to DEPT_HEAD or ASSET_MANAGER.`,
      });
    }

    // Verify employee user exists
    const employee = await prisma.user.findUnique({
      where: { id },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'Employee user not found.',
      });
    }

    // Update employee role in database
    const updatedEmployee = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        departmentId: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        user: sanitizeUser(updatedEmployee),
      },
    });
  } catch (error) {
    console.error('Role promotion error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to promote employee.',
    });
  }
});

module.exports = router;
