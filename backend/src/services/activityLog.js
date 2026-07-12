const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Creates and persists an ActivityLog entry in the database.
 * 
 * @param {string} userId - User UUID executing the action
 * @param {string} action - Action description (e.g. 'ASSET_CREATED', 'ROLE_PROMOTED')
 * @param {string} entityType - Entity type acted upon (e.g. 'Asset', 'User')
 * @param {string} entityId - Entity ID acted upon
 * @param {Object|null} details - Optional details object (stored directly in Json field)
 * @returns {Promise<Object>} The created activity log object
 */
async function logActivity(userId, action, entityType, entityId, details = null) {
  try {
    const log = await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details: details || null,
      },
    });
    return log;
  } catch (error) {
    console.error('Error creating activity log service:', error);
    throw error;
  }
}

module.exports = {
  logActivity,
};
