const jwt = require('jsonwebtoken');
const User = require('../models/User');

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'admin@gmail.com')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    const user = await User.findById(decoded.id).select('email phone name itNumber isAdmin');

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    // Prefer admin role from signed token, then DB/admin-email fallback.
    // This prevents stale DB flags from blocking valid admin sessions.
    if (!user.isAdmin && decoded?.isAdmin === true) {
      user.isAdmin = true;
    }

    // Fallback: trust configured admin email(s) when DB/token admin flag is missing.
    if (!user.isAdmin && ADMIN_EMAILS.includes(String(user.email || '').toLowerCase())) {
      user.isAdmin = true;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next();
  }
  return res.status(403).json({ message: 'Admin access required' });
};

module.exports = { protect, adminOnly };
