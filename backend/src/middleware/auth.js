const { PrismaClient } = require('@prisma/client');
const { verify } = require('../services/jwt');

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Check cookies first (usually parsed by cookie-parser)
    if (req.cookies && req.cookies.af_token) {
      token = req.cookies.af_token;
    } 
    // Fallback: Check standard HTTP Cookie header manually if cookie-parser is not active yet
    else if (req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {});
      token = cookies.af_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHENTICATED',
        message: 'Authentication token is missing. Please log in.',
      });
    }

    // Verify token using JWT_SECRET
    const decoded = verify(token, process.env.JWT_SECRET || 'af_jwt_secret_token_123_456');

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHENTICATED',
        message: 'Invalid session token payload.',
      });
    }

    // Fetch active user from database on each request (as per requirement)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        departmentId: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHENTICATED',
        message: 'Session invalid: User no longer exists.',
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        code: 'USER_INACTIVE',
        message: 'Your account has been deactivated.',
      });
    }

    // Attach sanitized user to the request object
    req.user = user;
    next();
  } catch (error) {
    console.error('JWT authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Your session has expired. Please log in again.',
      });
    }

    return res.status(401).json({
      success: false,
      code: 'UNAUTHENTICATED',
      message: 'Invalid session token.',
    });
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHENTICATED',
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        code: 'UNAUTHORIZED_ROLE',
        message: `Role unauthorized. Required: [${allowedRoles.join(', ')}]. Current: ${req.user.role}`,
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  requireRole,
};
