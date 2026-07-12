const express = require("express");
const {
  ApiError,
  approveTransferRequest,
  createTransferRequest,
  listTransferRequests,
  rejectTransferRequest,
} = require("../services/allocationService");
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
    const transferRequest = await createTransferRequest(req.body ?? {}, req.user?.id);
    return res.status(201).json({ success: true, data: { transferRequest } });
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/", async (req, res) => {
  try {
    const transferRequests = await listTransferRequests(req.query ?? {});
    return res.json({
      success: true,
      data: {
        items: transferRequests,
        total: transferRequests.length,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
});

router.put(
  "/:id/approve",
  requireRole("ASSET_MANAGER", "DEPT_HEAD"),
  async (req, res) => {
    try {
      const result = await approveTransferRequest(req.params.id, req.user?.id);
      return res.json({ success: true, data: result });
    } catch (error) {
      return sendError(res, error);
    }
  },
);

router.put(
  "/:id/reject",
  requireRole("ASSET_MANAGER", "DEPT_HEAD"),
  async (req, res) => {
    try {
      const transferRequest = await rejectTransferRequest(req.params.id, req.user?.id);
      return res.json({ success: true, data: { transferRequest } });
    } catch (error) {
      return sendError(res, error);
    }
  },
);

module.exports = router;