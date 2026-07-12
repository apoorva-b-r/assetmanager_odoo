const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to serialize and sanitize user objects consistently
function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    departmentId: user.departmentId || null,
    createdAt: user.createdAt,
  };
}

// POST /signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate inputs
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Name, email, and password are required.',
      });
    }

    // Force email comparison lowercase to prevent duplicate case-sensitive issues
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email address already exists.',
      });
    }

    // Securely hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Create user. Force role to 'EMPLOYEE' and ignore any role self-elevation attempts
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: hashedPassword,
        role: 'EMPLOYEE', // ALWAYS force EMPLOYEE
        status: 'ACTIVE',
      },
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

    return res.status(201).json({
      success: true,
      data: {
        user: sanitizeUser(newUser),
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to complete signup.',
    });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    // Compare passwords
    const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    // Check if user is ACTIVE
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        code: 'USER_INACTIVE',
        message: 'Your account has been deactivated.',
      });
    }

    // Keep JWT payload minimal (userId only as per requirement)
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'af_jwt_secret_token_123_456',
      { expiresIn: '24h' }
    );

    // Set cookie af_token
    res.cookie('af_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    return res.status(200).json({
      success: true,
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to log in.',
    });
  }
});

// POST /logout
router.post('/logout', (req, res) => {
  res.clearCookie('af_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return res.status(200).json({
    success: true,
    data: {},
  });
});

// GET /me
router.get('/me', authenticate, (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      user: sanitizeUser(req.user),
    },
  });
});

module.exports = router;
