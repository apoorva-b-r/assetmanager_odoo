const express = require("express");
const {
  ApiError,
  closeAuditCycle,
  createAuditCycle,
  listAuditCycles,
  verifyAuditItem,
} = require("../services/auditService");
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

router.post("/", requireRole("ADMIN"), async (req, res) => {
  try {
    const auditCycle = await createAuditCycle(req.body ?? {}, req.user?.id);
    return res.status(201).json({ success: true, data: { auditCycle } });
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/", async (req, res) => {
  try {
    const auditCycles = await listAuditCycles();
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

router.put("/items/:id/verify", async (req, res) => {
  try {
    const auditItem = await verifyAuditItem(req.params.id, req.body ?? {}, req.user?.id);
    return res.json({ success: true, data: { auditItem } });
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    const cycle = await prisma.auditCycle.findUnique({
      where: { id: req.params.id },
      include: {
        auditors: {
          select: { id: true, name: true, email: true, role: true }
        },
        scopeDepartment: {
          select: { id: true, name: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        auditItems: {
          include: {
            asset: true,
            auditor: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    if (!cycle) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "Audit cycle not found."
      });
    }

    return res.json({ success: true, data: cycle });
  } catch (error) {
    return sendError(res, error);
  }
});

router.put("/:id/close", requireRole("ADMIN"), async (req, res) => {
  try {
    const result = await closeAuditCycle(req.params.id, req.user?.id);
    return res.json({ success: true, data: result });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
