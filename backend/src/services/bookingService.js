const { PrismaClient } = require("@prisma/client");
const { notify } = require("./notify");
const { logActivity } = require("./activityLog");

class ApiError extends Error {
  constructor(status, code, message, data) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

const prisma = new PrismaClient();

const bookingSelect = {
  id: true,
  startTime: true,
  endTime: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  resourceAssetId: true,
  bookedById: true,
  resourceAsset: {
    select: {
      id: true,
      tag: true,
      name: true,
      isBookable: true,
      status: true,
    },
  },
  bookedBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
    },
  },
};

function createError(status, code, message, data) {
  return new ApiError(status, code, message, data);
}

function toDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function overlaps(newStart, newEnd, existingStart, existingEnd) {
  return newStart < existingEnd && newEnd > existingStart;
}

async function listBookings({ resourceAssetId, date } = {}) {
  const where = {};

  if (resourceAssetId) {
    where.resourceAssetId = resourceAssetId;
  }

  if (date) {
    const day = new Date(date);

    if (Number.isNaN(day.getTime())) {
      throw createError(400, "VALIDATION_ERROR", "date must be a valid ISO date.");
    }

    const startOfDay = new Date(day);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(day);
    endOfDay.setHours(23, 59, 59, 999);

    where.startTime = {
      gte: startOfDay,
      lte: endOfDay,
    };
  }

  return prisma.booking.findMany({
    where,
    orderBy: { startTime: 'asc' },
    select: bookingSelect,
  });
}

async function createBooking(payload, actorId) {
  if (!payload || !payload.resourceAssetId || !payload.startTime || !payload.endTime) {
    throw createError(400, "VALIDATION_ERROR", "resourceAssetId, startTime and endTime are required.");
  }

  const startTime = toDate(payload.startTime);
  const endTime = toDate(payload.endTime);

  if (!startTime || !endTime || startTime >= endTime) {
    throw createError(400, "VALIDATION_ERROR", "startTime must be before endTime.");
  }

  const bookedById = payload.bookedById || actorId;

  if (!bookedById) {
    throw createError(400, "VALIDATION_ERROR", "bookedById is required.");
  }

  const booking = await prisma.$transaction(async (tx) => {
    const asset = await tx.asset.findUnique({
      where: { id: payload.resourceAssetId },
      select: {
        id: true,
        tag: true,
        name: true,
        isBookable: true,
        status: true,
      },
    });

    if (!asset) {
      throw createError(404, "ASSET_NOT_FOUND", "Bookable asset not found.");
    }

    if (!asset.isBookable) {
      throw createError(400, "ASSET_NOT_BOOKABLE", `Asset ${asset.tag || asset.name} is not bookable.`);
    }

    const conflictingBooking = await tx.booking.findFirst({
      where: {
        resourceAssetId: payload.resourceAssetId,
        status: {
          not: 'CANCELLED',
        },
        AND: [
          {
            startTime: {
              lt: endTime,
            },
          },
          {
            endTime: {
              gt: startTime,
            },
          },
        ],
      },
      select: bookingSelect,
    });

    if (conflictingBooking) {
      throw createError(409, "BOOKING_CONFLICT", "Booking overlaps with an existing reservation.", {
        currentBooking: conflictingBooking,
      });
    }

    return tx.booking.create({
      data: {
        resourceAssetId: payload.resourceAssetId,
        bookedById,
        startTime,
        endTime,
        status: 'UPCOMING',
      },
      select: bookingSelect,
    });
  });

  await Promise.all([
    notify(bookedById, 'BOOKING_CONFIRMED', `Booking confirmed for asset ${booking.resourceAsset.tag || booking.resourceAsset.name}.`, booking.id),
    actorId
      ? logActivity(actorId, 'BOOKING_CREATED', 'Booking', booking.id, {
          resourceAssetId: booking.resourceAssetId,
          startTime: booking.startTime,
          endTime: booking.endTime,
        })
      : Promise.resolve(),
  ]);

  return booking;
}

async function cancelBooking(bookingId, actorId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: bookingSelect,
  });

  if (!booking) {
    throw createError(404, "NOT_FOUND", "Booking not found.");
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'CANCELLED',
    },
    select: bookingSelect,
  });

  if (actorId) {
    await Promise.all([
      notify(updatedBooking.bookedById, 'BOOKING_CANCELLED', `Booking cancelled for asset ${updatedBooking.resourceAsset.tag || updatedBooking.resourceAsset.name}.`, updatedBooking.id),
      logActivity(actorId, 'BOOKING_CANCELLED', 'Booking', updatedBooking.id, {
        resourceAssetId: updatedBooking.resourceAssetId,
      }),
    ]);
  }

  return updatedBooking;
}

async function rescheduleBooking(bookingId, payload, actorId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: bookingSelect,
  });

  if (!booking) {
    throw createError(404, "NOT_FOUND", "Booking not found.");
  }

  const startTime = toDate(payload?.startTime);
  const endTime = toDate(payload?.endTime);

  if (!startTime || !endTime || startTime >= endTime) {
    throw createError(400, "VALIDATION_ERROR", "startTime must be before endTime.");
  }

  const updatedBooking = await prisma.$transaction(async (tx) => {
    const conflictingBooking = await tx.booking.findFirst({
      where: {
        resourceAssetId: booking.resourceAssetId,
        status: {
          not: 'CANCELLED',
        },
        id: {
          not: booking.id,
        },
        AND: [
          {
            startTime: {
              lt: endTime,
            },
          },
          {
            endTime: {
              gt: startTime,
            },
          },
        ],
      },
      select: bookingSelect,
    });

    if (conflictingBooking) {
      throw createError(409, "BOOKING_CONFLICT", "Booking overlaps with an existing reservation.", {
        currentBooking: conflictingBooking,
      });
    }

    return tx.booking.update({
      where: { id: booking.id },
      data: {
        startTime,
        endTime,
      },
      select: bookingSelect,
    });
  });

  if (actorId) {
    await Promise.all([
      notify(updatedBooking.bookedById, 'BOOKING_UPDATED', `Booking rescheduled for asset ${updatedBooking.resourceAsset.tag || updatedBooking.resourceAsset.name}.`, updatedBooking.id),
      logActivity(actorId, 'BOOKING_RESCHEDULED', 'Booking', updatedBooking.id, {
        resourceAssetId: updatedBooking.resourceAssetId,
        startTime: updatedBooking.startTime,
        endTime: updatedBooking.endTime,
      }),
    ]);
  }

  return updatedBooking;
}

module.exports = {
  ApiError,
  createError,
  listBookings,
  createBooking,
  cancelBooking,
  rescheduleBooking,
};