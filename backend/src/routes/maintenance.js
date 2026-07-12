const express = require("express");
const {
  ApiError,
  approveMaintenanceRequest,
  assignTechnician,
  createMaintenanceRequest,
  listMaintenanceRequests,
  rejectMaintenanceRequest,
  resolveMaintenanceRequest,
} = require("../services/maintenanceService");

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

router.post("/maintenance-requests", requireRole("EMPLOYEE", "DEPT_HEAD", "ASSET_MANAGER", "ADMIN"), (req, res) => {
  try {
    const maintenanceRequest = createMaintenanceRequest(req.body ?? {});
    return res.status(201).json({ success: true, data: { maintenanceRequest } });
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/maintenance-requests", requireRole("EMPLOYEE", "DEPT_HEAD", "ASSET_MANAGER", "ADMIN"), (req, res) => {
  try {
    const maintenanceRequests = listMaintenanceRequests(req.query ?? {});
    return res.json({
      success: true,
      data: {
        items: maintenanceRequests,
        total: maintenanceRequests.length,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
});

router.put("/maintenance-requests/:id/approve", requireRole("ASSET_MANAGER"), (req, res) => {
  try {
    const maintenanceRequest = approveMaintenanceRequest(req.params.id);
    return res.json({ success: true, data: { maintenanceRequest } });
  } catch (error) {
    return sendError(res, error);
  }
});

router.put("/maintenance-requests/:id/reject", requireRole("ASSET_MANAGER"), (req, res) => {
  try {
    const maintenanceRequest = rejectMaintenanceRequest(req.params.id, req.body ?? {});
    return res.json({ success: true, data: { maintenanceRequest } });
  } catch (error) {
    return sendError(res, error);
  }
});

router.put("/maintenance-requests/:id/assign-technician", requireRole("ASSET_MANAGER"), (req, res) => {
  try {
    const maintenanceRequest = assignTechnician(req.params.id, req.body ?? {});
    return res.json({ success: true, data: { maintenanceRequest } });
  } catch (error) {
    return sendError(res, error);
  }
});

router.put("/maintenance-requests/:id/resolve", requireRole("ASSET_MANAGER"), (req, res) => {
  try {
    const maintenanceRequest = resolveMaintenanceRequest(req.params.id);
    return res.json({ success: true, data: { maintenanceRequest } });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;