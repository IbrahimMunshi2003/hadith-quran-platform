const express = require('express');
const jwt = require('jsonwebtoken');
const { requireAdmin } = require('../middleware/adminAuth');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per IP
  message: { error: 'Too many login attempts. Please try again later.' }
});

const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 12 * 60 * 60 * 1000,
  path: '/'
};

const clearCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/'
};

router.post('/login', loginLimiter, async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is required for admin authentication.');
    }
    const username = String(req.body.username || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const ip = req.ip || req.connection.remoteAddress;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      await AuditLog.create({ action: 'login_failed', username, ipAddress: ip, details: 'User not found' });
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    if (admin.isLocked()) {
      await AuditLog.create({ action: 'login_locked_out', username, ipAddress: ip });
      return res.status(401).json({ error: 'Account temporarily locked due to multiple failed attempts. Try again later.' });
    }

    const isValidPassword = await admin.comparePassword(password);
    
    if (!isValidPassword) {
      admin.failedLoginAttempts += 1;
      if (admin.failedLoginAttempts >= 5) {
        admin.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
      }
      await admin.save();
      await AuditLog.create({ action: 'login_failed', username, ipAddress: ip, details: 'Invalid password' });
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Success
    admin.failedLoginAttempts = 0;
    admin.lockUntil = undefined;
    admin.lastLogin = Date.now();
    await admin.save();
    
    await AuditLog.create({ action: 'login_success', username, ipAddress: ip });

    const token = jwt.sign(
      {
        username: admin.username,
        role: admin.role,
        id: admin._id
      },
      process.env.JWT_SECRET,
      {
        subject: admin.username,
        expiresIn: process.env.ADMIN_TOKEN_EXPIRES_IN || '12h'
      }
    );

    // Set HTTP-only cookie
    res.cookie('admin_token', token, cookieOptions);

    return res.json({
      user: {
        username: admin.username,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'Unable to login at this time.' });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("admin_token", clearCookieOptions);

  return res.json({ success: true });
});

router.get('/me', requireAdmin, async (req, res) => {
  return res.json({
    user: {
      username: req.admin.username,
      role: req.admin.role
    }
  });
});

router.post('/change-password', requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.admin.id);
    
    if (!admin) return res.status(404).json({ error: 'Admin not found.' });
    
    const isValid = await admin.comparePassword(currentPassword);
    if (!isValid) return res.status(400).json({ error: 'Incorrect current password.' });

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    admin.passwordHash = newPassword; // Will be hashed by pre-save hook
    await admin.save();
    
    await AuditLog.create({ action: 'password_changed', username: admin.username, ipAddress: req.ip || req.connection.remoteAddress });

    return res.json({ success: true });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/change-username', requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newUsername } = req.body;
    const admin = await Admin.findById(req.admin.id);
    
    if (!admin) return res.status(404).json({ error: 'Admin not found.' });
    
    const isValid = await admin.comparePassword(currentPassword);
    if (!isValid) return res.status(400).json({ error: 'Incorrect current password.' });

    if (!newUsername || newUsername.length < 4) {
      return res.status(400).json({ error: 'Username must be at least 4 characters long.' });
    }

    const usernameLower = newUsername.trim().toLowerCase();
    
    const existing = await Admin.findOne({ username: usernameLower });
    if (existing && existing._id.toString() !== admin._id.toString()) {
      return res.status(400).json({ error: 'Username already taken.' });
    }

    const oldUsername = admin.username;
    admin.username = usernameLower;
    await admin.save();

    await AuditLog.create({ action: 'username_changed', username: usernameLower, details: { oldUsername }, ipAddress: req.ip || req.connection.remoteAddress });

    // Issue a new token
    const token = jwt.sign(
      { username: admin.username, role: admin.role, id: admin._id },
      process.env.JWT_SECRET,
      { subject: admin.username, expiresIn: process.env.ADMIN_TOKEN_EXPIRES_IN || '12h' }
    );

    res.cookie("admin_token", token, cookieOptions);

    return res.json({ success: true, user: { username: admin.username, role: admin.role } });
  } catch (err) {
    console.error('Change username error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
