const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Helper to check if user exists
async function validateUserExists(userId) {
  if (!userId) return true;
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  return !!user;
}

// Helper to check if department exists
async function validateDepartmentExists(deptId) {
  if (!deptId) return true;
  const dept = await prisma.department.findUnique({
    where: { id: deptId },
  });
  return !!dept;
}

// GET /api/departments
router.get('/', authenticate, async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        head: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          }
        },
        parentDepartment: true,
      }
    });

    return res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error('Fetch departments error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve departments.',
    });
  }
});

// GET /api/departments/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        head: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          }
        },
        parentDepartment: true,
      }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        code: 'DEPARTMENT_NOT_FOUND',
        message: 'Department not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Fetch department details error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve department details.',
    });
  }
});

// POST /api/departments
router.post('/', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, headId, parentDepartmentId, status } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Department name is required.',
      });
    }

    // Validate headId
    if (headId) {
      const headExists = await validateUserExists(headId);
      if (!headExists) {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: `The specified head user ID (${headId}) does not exist.`,
        });
      }
    }

    // Validate parentDepartmentId
    if (parentDepartmentId) {
      const parentExists = await validateDepartmentExists(parentDepartmentId);
      if (!parentExists) {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: `The specified parent department ID (${parentDepartmentId}) does not exist.`,
        });
      }
    }

    const newDepartment = await prisma.department.create({
      data: {
        name: name.trim(),
        headId: headId || null,
        parentDepartmentId: parentDepartmentId || null,
        status: status || 'ACTIVE',
      },
      include: {
        head: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          }
        },
        parentDepartment: true,
      }
    });

    return res.status(201).json({
      success: true,
      data: newDepartment,
    });
  } catch (error) {
    console.error('Create department error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create department.',
    });
  }
});

// PUT /api/departments/:id
router.put('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, headId, parentDepartmentId, status } = req.body;

    // Check if target department exists
    const existingDept = await prisma.department.findUnique({
      where: { id },
    });

    if (!existingDept) {
      return res.status(404).json({
        success: false,
        code: 'DEPARTMENT_NOT_FOUND',
        message: 'Department to update not found.',
      });
    }

    // Prevent self-parenting
    if (parentDepartmentId && parentDepartmentId === id) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'A department cannot be its own parent.',
      });
    }

    // Validate headId
    if (headId) {
      const headExists = await validateUserExists(headId);
      if (!headExists) {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: `The specified head user ID (${headId}) does not exist.`,
        });
      }
    }

    // Validate parentDepartmentId
    if (parentDepartmentId) {
      const parentExists = await validateDepartmentExists(parentDepartmentId);
      if (!parentExists) {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: `The specified parent department ID (${parentDepartmentId}) does not exist.`,
        });
      }
    }

    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existingDept.name,
        headId: headId !== undefined ? (headId || null) : existingDept.headId,
        parentDepartmentId: parentDepartmentId !== undefined ? (parentDepartmentId || null) : existingDept.parentDepartmentId,
        status: status !== undefined ? status : existingDept.status,
      },
      include: {
        head: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          }
        },
        parentDepartment: true,
      }
    });

    return res.status(200).json({
      success: true,
      data: updatedDepartment,
    });
  } catch (error) {
    console.error('Update department error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update department.',
    });
  }
});

module.exports = router;
