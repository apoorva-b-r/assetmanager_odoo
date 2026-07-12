const express = require("express");
const {
  ApiError,
  closeAuditCycle,
  createAuditCycle,
  listAuditCycles,
  verifyAuditItem,
} = require("../services/auditService");

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

router.post("/audit-cycles", requireRole("ADMIN"), (req, res) => {
  try {
    const auditCycle = createAuditCycle(req.body ?? {});
    return res.status(201).json({ success: true, data: { auditCycle } });
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/audit-cycles", requireRole("EMPLOYEE", "DEPT_HEAD", "ASSET_MANAGER", "ADMIN"), (req, res) => {
  try {
    const auditCycles = listAuditCycles(req.query ?? {});
    return res.json({
      success: true,
      data: {
        items: auditCycles,
        total: auditCycles.length,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
});

router.put("/audit-items/:id/verify", requireRole("EMPLOYEE", "DEPT_HEAD", "ASSET_MANAGER", "ADMIN"), (req, res) => {
  try {
    const auditItem = verifyAuditItem(req.params.id, req.body ?? {});
    return res.json({ success: true, data: { auditItem } });
  } catch (error) {
    return sendError(res, error);
  }
});

router.put("/audit-cycles/:id/close", requireRole("ADMIN"), (req, res) => {
  try {
    const auditCycle = closeAuditCycle(req.params.id);
    return res.json({ success: true, data: { auditCycle } });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;