const { randomUUID } = require("crypto");

class ApiError extends Error {
  constructor(status, code, message, data) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

const store = {
  bookings: [],
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

function listBookings({ resourceAssetId, date } = {}) {
  return store.bookings.filter((booking) => {
    if (resourceAssetId && booking.resourceAssetId !== resourceAssetId) {
      return false;
    }

    if (!date) {
      return true;
    }

    const day = new Date(date);
    if (Number.isNaN(day.getTime())) {
      return false;
    }

    return booking.startTime.slice(0, 10) === day.toISOString().slice(0, 10);
  });
}

function createBooking(payload) {
  if (!payload || !payload.resourceAssetId || !payload.startTime || !payload.endTime) {
    throw createError(400, "VALIDATION_ERROR", "resourceAssetId, startTime and endTime are required.");
  }

  const startTime = toDate(payload.startTime);
  const endTime = toDate(payload.endTime);

  if (!startTime || !endTime || startTime >= endTime) {
    throw createError(400, "VALIDATION_ERROR", "startTime must be before endTime.");
  }

  const conflictingBooking = store.bookings.find((booking) => {
    if (booking.resourceAssetId !== payload.resourceAssetId) {
      return false;
    }

    if (booking.status === "CANCELLED") {
      return false;
    }

    return overlaps(startTime, endTime, new Date(booking.startTime), new Date(booking.endTime));
  });

  if (conflictingBooking) {
    throw createError(409, "BOOKING_CONFLICT", "Booking overlaps with an existing reservation.", {
      currentBooking: conflictingBooking,
    });
  }

  const booking = {
    id: randomUUID(),
    resourceAssetId: payload.resourceAssetId,
    bookedById: payload.bookedById ?? null,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    status: "UPCOMING",
  };

  store.bookings.unshift(booking);
  return booking;
}

function cancelBooking(bookingId) {
  const booking = store.bookings.find((item) => item.id === bookingId);

  if (!booking) {
    throw createError(404, "NOT_FOUND", "Booking not found.");
  }

  booking.status = "CANCELLED";
  return booking;
}

function rescheduleBooking(bookingId, payload) {
  const booking = store.bookings.find((item) => item.id === bookingId);

  if (!booking) {
    throw createError(404, "NOT_FOUND", "Booking not found.");
  }

  const startTime = toDate(payload?.startTime);
  const endTime = toDate(payload?.endTime);

  if (!startTime || !endTime || startTime >= endTime) {
    throw createError(400, "VALIDATION_ERROR", "startTime must be before endTime.");
  }

  const conflictingBooking = store.bookings.find((candidate) => {
    if (candidate.id === booking.id) {
      return false;
    }

    if (candidate.resourceAssetId !== booking.resourceAssetId) {
      return false;
    }

    if (candidate.status === "CANCELLED") {
      return false;
    }

    return overlaps(startTime, endTime, new Date(candidate.startTime), new Date(candidate.endTime));
  });

  if (conflictingBooking) {
    throw createError(409, "BOOKING_CONFLICT", "Booking overlaps with an existing reservation.", {
      currentBooking: conflictingBooking,
    });
  }

  booking.startTime = startTime.toISOString();
  booking.endTime = endTime.toISOString();
  return booking;
}

module.exports = {
  ApiError,
  createError,
  listBookings,
  createBooking,
  cancelBooking,
  rescheduleBooking,
};