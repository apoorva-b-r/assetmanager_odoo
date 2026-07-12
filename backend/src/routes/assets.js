const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const { logActivity } = require('../services/activityLog');

const router = express.Router();
const prisma = new PrismaClient();

// Helper to query and generate the next sequential asset tag
async function generateNextAssetTag(tx) {
  const assets = await tx.asset.findMany({
    where: {
      tag: {
        startsWith: 'AF-',
      },
    },
    select: {
      tag: true,
    },
  });

  let maxNum = 0;
  for (const asset of assets) {
    const parts = asset.tag.split('-');
    if (parts.length === 2) {
      const num = parseInt(parts[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  const paddedNum = String(nextNum).padStart(4, '0');
  return `AF-${paddedNum}`;
}

// Helper to handle asset creation with bounded retries on tag conflict
async function createAssetWithRetry(assetData, maxRetries = 5) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      // Run inside transaction to ensure isolation during tag checking
      const newAsset = await prisma.$transaction(async (tx) => {
        const nextTag = await generateNextAssetTag(tx);
        
        return await tx.asset.create({
          data: {
            ...assetData,
            tag: nextTag,
          },
          include: {
            category: true,
          },
        });
      }, {
        isolationLevel: 'Serializable', // Enforce strict isolation
      });
      return newAsset;
    } catch (error) {
      // Prisma code for unique constraint violation is P2002
      const isUniqueTagConflict = error.code === 'P2002' && error.meta?.target?.includes('tag');
      if (isUniqueTagConflict) {
        attempt++;
        console.warn(`[CONCURRENCY TRY] Tag collision occurred. Retrying... Attempt ${attempt}/${maxRetries}`);
        continue;
      }
      throw error; // Re-throw other errors immediately
    }
  }
  throw new Error('Failed to generate a unique asset tag after maximum retries.');
}

// POST /api/assets (ADMIN and ASSET_MANAGER only)
router.post('/', authenticate, requireRole('ADMIN', 'ASSET_MANAGER'), async (req, res) => {
  try {
    const {
      name,
      categoryId,
      serialNumber,
      acquisitionDate,
      acquisitionCost,
      condition,
      location,
      isBookable,
      photoUrl,
    } = req.body;

    // Validate required fields
    if (!name || name.trim() === '' || !categoryId || !acquisitionDate || acquisitionCost === undefined || !condition || !location) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Name, categoryId, acquisitionDate, acquisitionCost, condition, and location are required.',
      });
    }

    // Validate categoryId reference
    const categoryExists = await prisma.assetCategory.findUnique({
      where: { id: categoryId },
    });
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: `The specified category ID (${categoryId}) does not exist.`,
      });
    }

    // Parse types
    const parsedDate = new Date(acquisitionDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Invalid acquisitionDate format.',
      });
    }

    const parsedCost = parseFloat(acquisitionCost);
    if (isNaN(parsedCost)) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Invalid acquisitionCost. Must be a number.',
      });
    }

    // Validate serialNumber uniqueness if provided
    if (serialNumber && serialNumber.trim() !== '') {
      const existingSerial = await prisma.asset.findUnique({
        where: { serialNumber: serialNumber.trim() },
      });
      if (existingSerial) {
        return res.status(400).json({
          success: false,
          code: 'SERIAL_NUMBER_ALREADY_EXISTS',
          message: `An asset with serial number (${serialNumber}) already exists.`,
        });
      }
    }

    // Prepare asset data (ignoring client-provided tag)
    const assetData = {
      name: name.trim(),
      categoryId,
      serialNumber: serialNumber ? serialNumber.trim() : null,
      acquisitionDate: parsedDate,
      acquisitionCost: parsedCost,
      condition: condition.trim(),
      location: location.trim(),
      isBookable: isBookable !== undefined ? Boolean(isBookable) : false,
      photoUrl: photoUrl ? photoUrl.trim() : null,
      status: 'AVAILABLE',
    };

    // Create with retry policy
    const newAsset = await createAssetWithRetry(assetData);

    // Logging Activity as side-effect
    await logActivity(req.user.id, 'ASSET_CREATED', 'Asset', newAsset.id, {
      tag: newAsset.tag,
      name: newAsset.name,
    });

    return res.status(201).json({
      success: true,
      data: newAsset,
    });
  } catch (error) {
    console.error('Create asset error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to register new asset.',
    });
  }
});

// GET /api/assets (Authenticated users)
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, category, status, department, location } = req.query;
    const where = {};

    // 1. Partial search on name or tag
    if (search && search.trim() !== '') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tag: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 2. Exact match categoryId or case-insensitive category name
    if (category && category.trim() !== '') {
      where.category = {
        OR: [
          { id: category },
          { name: { equals: category, mode: 'insensitive' } },
        ],
      };
    }

    // 3. Exact match status enum
    if (status && status.trim() !== '') {
      const validStatuses = ['AVAILABLE', 'ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED'];
      if (validStatuses.includes(status)) {
        where.status = status;
      } else {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: `Invalid status parameter: ${status}.`,
        });
      }
    }

    // 4. Case-insensitive partial match on location
    if (location && location.trim() !== '') {
      where.location = {
        contains: location,
        mode: 'insensitive',
      };
    }

    // 5. Allocation-based department filtering
    if (department && department.trim() !== '') {
      where.allocations = {
        some: {
          status: 'ACTIVE',
          department: {
            OR: [
              { id: department },
              { name: { equals: department, mode: 'insensitive' } },
            ],
          },
        },
      };
    }

    const assets = await prisma.asset.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: assets,
    });
  } catch (error) {
    console.error('Fetch assets error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve assets list.',
    });
  }
});

// GET /api/assets/:id (Authenticated users)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        code: 'ASSET_NOT_FOUND',
        message: 'Asset not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    console.error('Fetch asset details error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve asset details.',
    });
  }
});

// GET /api/assets/:id/history (Authenticated users)
router.get('/:id/history', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if asset exists first
    const assetExists = await prisma.asset.findUnique({
      where: { id },
    });

    if (!assetExists) {
      return res.status(404).json({
        success: false,
        code: 'ASSET_NOT_FOUND',
        message: 'Asset not found.',
      });
    }

    // Retrieve history directly from DB relations, sorted chronologically desc
    const assetWithHistory = await prisma.asset.findUnique({
      where: { id },
      select: {
        allocations: {
          orderBy: { allocatedAt: 'desc' },
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        maintenanceRequests: {
          orderBy: { createdAt: 'desc' },
          include: {
            raisedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        allocations: assetWithHistory.allocations || [],
        maintenance: assetWithHistory.maintenanceRequests || [],
      },
    });
  } catch (error) {
    console.error('Fetch asset history error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve asset history.',
    });
  }
});

module.exports = router;
