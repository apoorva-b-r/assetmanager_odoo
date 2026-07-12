const express = require("express");
const {
  ApiError,
  cancelBooking,
  createBooking,
  listBookings,
  rescheduleBooking,
} = require("../services/bookingService");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

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

router.post("/", async (req, res) => {
  try {
    const booking = await createBooking(req.body ?? {}, req.user?.id);
    return res.status(201).json({ success: true, data: { booking } });
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/", async (req, res) => {
  try {
    const bookings = await listBookings(req.query ?? {});
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

router.put("/:id/cancel", requireRole("EMPLOYEE", "ASSET_MANAGER", "ADMIN"), async (req, res) => {
  try {
    const booking = await cancelBooking(req.params.id, req.user?.id);
    return res.json({ success: true, data: { booking } });
  } catch (error) {
    return sendError(res, error);
  }
});

router.put("/:id/reschedule", requireRole("EMPLOYEE", "ASSET_MANAGER", "ADMIN"), async (req, res) => {
  try {
    const booking = await rescheduleBooking(req.params.id, req.body ?? {}, req.user?.id);
    return res.json({ success: true, data: { booking } });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;