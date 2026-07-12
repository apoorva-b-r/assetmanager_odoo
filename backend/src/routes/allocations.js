const express = require("express");
const {
  ApiError,
  createAllocation,
  listAllocations,
  returnAllocation,
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

router.post("/allocations", requireRole("ASSET_MANAGER", "DEPT_HEAD"), (req, res) => {
  try {
    const allocation = createAllocation(req.body ?? {});
    return res.status(201).json({ success: true, data: { allocation } });
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/allocations", requireRole("EMPLOYEE", "DEPT_HEAD", "ASSET_MANAGER", "ADMIN"), (req, res) => {
  try {
    const allocations = listAllocations(req.query ?? {});
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
  "/allocations/:id/return",
  requireRole("ASSET_MANAGER", "EMPLOYEE", "DEPT_HEAD", "ADMIN"),
  (req, res) => {
    try {
      const allocation = returnAllocation(req.params.id, req.body ?? {});
      return res.json({ success: true, data: { allocation } });
    } catch (error) {
      return sendError(res, error);
    }
  },
);

module.exports = router;