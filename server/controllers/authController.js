const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SALT_ROUNDS = 10;

/** Helper: sign a JWT for the given user id */
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '7d',
  });

/** Helper: create a structured app error */
const appError = (status, appCode, message) => {
  const err = new Error(message);
  err.status = status;
  err.appCode = appCode;
  return err;
};

// ─── POST /api/auth/register ────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Field presence validation
    if (!name || !email || !password) {
      return next(
        appError(400, 'VALIDATION_ERROR', 'Name, email, and password are required')
      );
    }

    // Name length
    if (name.trim().length < 2) {
      return next(
        appError(400, 'VALIDATION_ERROR', 'Name must be at least 2 characters')
      );
    }

    // Basic email format
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return next(
        appError(400, 'VALIDATION_ERROR', 'Please enter a valid email address')
      );
    }

    // Password length
    if (password.length < 8) {
      return next(
        appError(400, 'VALIDATION_ERROR', 'Password must be at least 8 characters')
      );
    }

    // Check for duplicate email
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return next(
        appError(400, 'VALIDATION_ERROR', 'An account with this email already exists')
      );
    }

    // Hash password (minimum 10 rounds — NFR2)
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
    });

    const token = signToken(user._id);

    return res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/login ────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(
        appError(400, 'VALIDATION_ERROR', 'Email and password are required')
      );
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Use a constant-time comparison even when user is not found (prevents timing attacks)
    const passwordMatch = user
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, '$2b$10$invalidhashpadding/invalidhash/invalid');

    if (!user || !passwordMatch) {
      return next(
        appError(401, 'UNAUTHORIZED', 'Invalid email or password')
      );
    }

    const token = signToken(user._id);

    return res.status(200).json({ token, user });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
// Returns the currently authenticated user (useful for frontend token validation)
const getMe = async (req, res, next) => {
  try {
    // req.user is set by verifyJWT middleware
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(appError(404, 'NOT_FOUND', 'User not found'));
    }
    return res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
