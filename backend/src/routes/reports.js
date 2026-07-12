const express = require("express");

let requireRole = () => (req, res, next) => next();

try {
  ({ requireRole } = require("../middleware/auth"));
} catch (error) {
  void error;
}

const router = express.Router();

function response(res, data) {
  return res.json({ success: true, data });
}

router.get("/reports/utilization", requireRole("EMPLOYEE", "DEPT_HEAD", "ASSET_MANAGER", "ADMIN"), (req, res) => {
  return response(res, {
    labels: ["IT", "HR", "Finance"],
    values: [18, 11, 7],
  });
});

router.get(
  "/reports/maintenance-frequency",
  requireRole("EMPLOYEE", "DEPT_HEAD", "ASSET_MANAGER", "ADMIN"),
  (req, res) => {
    return response(res, {
      labels: ["Laptop", "Monitor", "Conference Room"],
      values: [5, 3, 2],
    });
  },
);

router.get(
  "/reports/upcoming-maintenance",
  requireRole("EMPLOYEE", "DEPT_HEAD", "ASSET_MANAGER", "ADMIN"),
  (req, res) => {
    return response(res, {
      items: [
        { id: "report-asset-1", name: "Dell Laptop", dueDate: "2026-07-15T09:00:00.000Z" },
        { id: "report-asset-2", name: "Conference Room B2", dueDate: "2026-07-16T09:00:00.000Z" },
      ],
      total: 2,
    });
  },
);

router.get(
  "/reports/department-allocation",
  requireRole("EMPLOYEE", "DEPT_HEAD", "ASSET_MANAGER", "ADMIN"),
  (req, res) => {
    return response(res, {
      labels: ["IT", "Operations", "Sales"],
      values: [9, 6, 4],
    });
  },
);

router.get(
  "/reports/booking-heatmap",
  requireRole("EMPLOYEE", "DEPT_HEAD", "ASSET_MANAGER", "ADMIN"),
  (req, res) => {
    return response(res, {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      values: [2, 4, 3, 5, 1],
    });
  },
);

module.exports = router;