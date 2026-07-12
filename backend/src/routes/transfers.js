const express = require("express");
const {
  ApiError,
  approveTransferRequest,
  createTransferRequest,
  listTransferRequests,
  rejectTransferRequest,
} = require("../services/allocationService");

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

router.post("/transfer-requests", requireRole("EMPLOYEE", "DEPT_HEAD", "ASSET_MANAGER", "ADMIN"), (req, res) => {
  try {
    const transferRequest = createTransferRequest(req.body ?? {});
    return res.status(201).json({ success: true, data: { transferRequest } });
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/transfer-requests", requireRole("EMPLOYEE", "DEPT_HEAD", "ASSET_MANAGER", "ADMIN"), (req, res) => {
  try {
    const transferRequests = listTransferRequests(req.query ?? {});
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
  "/transfer-requests/:id/approve",
  requireRole("ASSET_MANAGER", "DEPT_HEAD"),
  (req, res) => {
    try {
      const result = approveTransferRequest(req.params.id);
      return res.json({ success: true, data: result });
    } catch (error) {
      return sendError(res, error);
    }
  },
);

router.put(
  "/transfer-requests/:id/reject",
  requireRole("ASSET_MANAGER", "DEPT_HEAD"),
  (req, res) => {
    try {
      const transferRequest = rejectTransferRequest(req.params.id);
      return res.json({ success: true, data: { transferRequest } });
    } catch (error) {
      return sendError(res, error);
    }
  },
);

module.exports = router;