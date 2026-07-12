const express = require("express");
const {
  ApiError,
  createAllocation,
  listAllocations,
  returnAllocation,
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

router.post("/", requireRole("ASSET_MANAGER", "DEPT_HEAD"), async (req, res) => {
  try {
    const allocation = await createAllocation(req.body ?? {}, req.user?.id);
    return res.status(201).json({ success: true, data: { allocation } });
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/", async (req, res) => {
  try {
    const allocations = await listAllocations(req.query ?? {});
    return res.json({
      success: true,
      data: {
        items: allocations,
        total: allocations.length,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
});

router.post(
  "/:id/return",
  requireRole("ASSET_MANAGER", "EMPLOYEE", "DEPT_HEAD", "ADMIN"),
  async (req, res) => {
    try {
      const allocation = await returnAllocation(req.params.id, req.body ?? {}, req.user?.id);
      return res.json({ success: true, data: { allocation } });
    } catch (error) {
      return sendError(res, error);
    }
  },
);

module.exports = router;