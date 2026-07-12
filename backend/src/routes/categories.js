const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/asset-categories
router.get('/', authenticate, async (req, res) => {
  try {
    const categories = await prisma.assetCategory.findMany();
    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Fetch categories error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve asset categories.',
    });
  }
});

// GET /api/asset-categories/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.assetCategory.findUnique({
      where: { id },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        code: 'CATEGORY_NOT_FOUND',
        message: 'Asset category not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Fetch category details error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve asset category details.',
    });
  }
});

// POST /api/asset-categories
router.post('/', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, warrantyPeriodMonths } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Asset category name is required.',
      });
    }

    const trimmedName = name.trim();

    // Check duplicate name
    const existingCategory = await prisma.assetCategory.findUnique({
      where: { name: trimmedName },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        code: 'CATEGORY_ALREADY_EXISTS',
        message: 'An asset category with this name already exists.',
      });
    }

    const newCategory = await prisma.assetCategory.create({
      data: {
        name: trimmedName,
        warrantyPeriodMonths: warrantyPeriodMonths !== undefined ? parseInt(warrantyPeriodMonths, 10) : null,
      },
    });

    return res.status(201).json({
      success: true,
      data: newCategory,
    });
  } catch (error) {
    console.error('Create category error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create asset category.',
    });
  }
});

// PUT /api/asset-categories/:id
router.put('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, warrantyPeriodMonths } = req.body;

    // Check existence
    const existingCategory = await prisma.assetCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        code: 'CATEGORY_NOT_FOUND',
        message: 'Asset category to update not found.',
      });
    }

    let trimmedName = existingCategory.name;
    if (name !== undefined) {
      if (name.trim() === '') {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Asset category name cannot be empty.',
        });
      }
      trimmedName = name.trim();

      // Check duplicate name if changed
      if (trimmedName !== existingCategory.name) {
        const duplicateCategory = await prisma.assetCategory.findUnique({
          where: { name: trimmedName },
        });

        if (duplicateCategory) {
          return res.status(400).json({
            success: false,
            code: 'CATEGORY_ALREADY_EXISTS',
            message: 'An asset category with this name already exists.',
          });
        }
      }
    }

    const updatedCategory = await prisma.assetCategory.update({
      where: { id },
      data: {
        name: trimmedName,
        warrantyPeriodMonths: warrantyPeriodMonths !== undefined 
          ? (warrantyPeriodMonths !== null ? parseInt(warrantyPeriodMonths, 10) : null)
          : existingCategory.warrantyPeriodMonths,
      },
    });

    return res.status(200).json({
      success: true,
      data: updatedCategory,
    });
  } catch (error) {
    console.error('Update category error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update asset category.',
    });
  }
});

module.exports = router;
