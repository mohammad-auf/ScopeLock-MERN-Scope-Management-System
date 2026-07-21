const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * verifyJWT — Validates the Authorization: Bearer <token> header.
 * Attaches req.user = { id, name, email } on success.
 * Returns 401 UNAUTHORIZED if the token is missing, malformed, or expired.
 */
const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'No token provided' },
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message:
            jwtErr.name === 'TokenExpiredError'
              ? 'Token has expired'
              : 'Invalid token',
        },
      });
    }

    // Confirm the user still exists in the database
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'User no longer exists' },
      });
    }

    req.user = { id: user._id.toString(), name: user.name, email: user.email };
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { verifyJWT };
