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
    const maintenanceRequest = await createMaintenanceRequest(req.body ?? {}, req.user?.id);
    return res.status(201).json({ success: true, data: { maintenanceRequest } });
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/", async (req, res) => {
  try {
    const maintenanceRequests = await listMaintenanceRequests(req.query ?? {});
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

router.put("/:id/approve", requireRole("ASSET_MANAGER"), async (req, res) => {
  try {
    const maintenanceRequest = await approveMaintenanceRequest(req.params.id, req.user?.id);
    return res.json({ success: true, data: { maintenanceRequest } });
  } catch (error) {
    return sendError(res, error);
  }
});

router.put("/:id/reject", requireRole("ASSET_MANAGER"), async (req, res) => {
  try {
    const maintenanceRequest = await rejectMaintenanceRequest(req.params.id, req.body ?? {}, req.user?.id);
    return res.json({ success: true, data: { maintenanceRequest } });
  } catch (error) {
    return sendError(res, error);
  }
});

router.put("/:id/assign-technician", requireRole("ASSET_MANAGER"), async (req, res) => {
  try {
    const maintenanceRequest = await assignTechnician(req.params.id, req.body ?? {}, req.user?.id);
    return res.json({ success: true, data: { maintenanceRequest } });
  } catch (error) {
    return sendError(res, error);
  }
});

router.put("/:id/resolve", requireRole("ASSET_MANAGER"), async (req, res) => {
  try {
    const maintenanceRequest = await resolveMaintenanceRequest(req.params.id, req.user?.id);
    return res.json({ success: true, data: { maintenanceRequest } });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
