const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const authRouter = require('./routes/auth');
const departmentsRouter = require('./routes/departments');
const categoriesRouter = require('./routes/categories');
const employeesRouter = require('./routes/employees');
const allocationsRouter = require('./routes/allocations');
const transfersRouter = require('./routes/transfers');
const bookingsRouter = require('./routes/bookings');
const maintenanceRouter = require('./routes/maintenance');
const notificationsRouter = require('./routes/notifications');
const activityLogsRouter = require('./routes/activityLogs');
const assetsRouter = require('./routes/assets');

const prisma = new PrismaClient();
const app = express();

// Apply global middleware
app.use(cors());
app.use(express.json());

// Mount routers
app.use('/api/auth', authRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/asset-categories', categoriesRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/allocations', allocationsRouter);
app.use('/api/transfer-requests', transfersRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/maintenance-requests', maintenanceRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/activity-logs', activityLogsRouter);
app.use('/api/assets', assetsRouter);

// Health endpoint returning PostgreSQL reachability status
const checkHealth = async (req, res) => {
  try {
    // Simple query to verify connection to the database
    await prisma.$queryRaw`SELECT 1`;
    
    return res.status(200).json({
      success: true,
      data: {
        status: 'UP',
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return res.status(500).json({
      success: false,
      code: 'DATABASE_UNREACHABLE',
      message: 'PostgreSQL database is not reachable.',
      details: error.message,
    });
  }
};

app.get('/health', checkHealth);
app.get('/api/health', checkHealth);

// Express Error Handler for uncaught issues
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  return res.status(500).json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred.',
  });
});

module.exports = app;
