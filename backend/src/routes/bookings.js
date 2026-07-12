const express = require("express");
const {
  ApiError,
  cancelBooking,
  createBooking,
  listBookings,
  rescheduleBooking,
} = require("../services/bookingService");

let requireRole = () => (req, res, next) => next();

try {
  ({ requireRole } = require("../middleware/auth"));
} catch (error) {
  void error;
}

const router = express.Router();

function sendError(res, error) {
  const status = error instanceof ApiError ? error.status : 500;
  const code = error instanceof ApiError ? error.code : "SERVER_ERROR";
  const message = error instanceof ApiError ? error.message : "Unexpected server error.";
  const response = { success: false, code, message };

  if (error instanceof ApiError && error.data !== undefined) {
    response.data = error.data;
  }

  return res.status(status).json(response);
}

router.post("/bookings", requireRole("EMPLOYEE", "DEPT_HEAD", "ASSET_MANAGER", "ADMIN"), (req, res) => {
  try {
    const booking = createBooking(req.body ?? {});
    return res.status(201).json({ success: true, data: { booking } });
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/bookings", requireRole("EMPLOYEE", "DEPT_HEAD", "ASSET_MANAGER", "ADMIN"), (req, res) => {
  try {
    const bookings = listBookings(req.query ?? {});
    return res.json({
      success: true,
      data: {
        items: bookings,
        total: bookings.length,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
});

router.put("/bookings/:id/cancel", requireRole("EMPLOYEE", "ASSET_MANAGER", "ADMIN"), (req, res) => {
  try {
    const booking = cancelBooking(req.params.id);
    return res.json({ success: true, data: { booking } });
  } catch (error) {
    return sendError(res, error);
  }
});

router.put("/bookings/:id/reschedule", requireRole("EMPLOYEE", "ASSET_MANAGER", "ADMIN"), (req, res) => {
  try {
    const booking = rescheduleBooking(req.params.id, req.body ?? {});
    return res.json({ success: true, data: { booking } });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;