'use strict';

/**
 * notificationRoutes.js
 *
 * All routes are JWT-protected. Business logic lives in notificationController.js.
 *
 * Endpoints:
 *   GET /api/notifications          — get latest 30 notifications
 *   PUT /api/notifications/read-all — mark all as read   (must be before /:id/read)
 *   PUT /api/notifications/:id/read — mark one as read
 */

const express = require('express');
const { verifyJWT } = require('../middleware/authMiddleware');
const {
  getNotifications,
  markOneRead,
  markAllRead,
} = require('../controllers/notificationController');

const router = express.Router();
router.use(verifyJWT);

// NOTE: /read-all must be declared BEFORE /:id/read to avoid Express treating
// "read-all" as an :id param.
router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markOneRead);

module.exports = router;
