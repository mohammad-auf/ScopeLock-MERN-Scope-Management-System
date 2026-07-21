const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { verifyJWT } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected — returns the authenticated user (for frontend token refresh/validation)
router.get('/me', verifyJWT, getMe);

module.exports = router;
