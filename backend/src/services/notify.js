const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Creates and persists a Notification for a given user.
 * 
 * @param {string} userId - Target user UUID
 * @param {string} type - Notification category/type enum string
 * @param {string} message - User-facing notification text
 * @param {string|null} relatedEntityId - Optional related entity ID (e.g. assetId, bookingId)
 * @returns {Promise<Object>} The created notification object
 */
async function notify(userId, type, message, relatedEntityId = null) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        relatedEntityId: relatedEntityId || null,
      },
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification service:', error);
    throw error;
  }
}

module.exports = {
  notify,
};
