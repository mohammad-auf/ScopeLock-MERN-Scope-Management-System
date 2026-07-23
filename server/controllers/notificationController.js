'use strict';

/**
 * notificationController.js
 *
 * Business logic for freelancer notification management.
 * All routes are protected by verifyJWT middleware (applied in notificationRoutes.js).
 *
 * Routes:
 *   GET  /api/notifications          → getNotifications
 *   PUT  /api/notifications/:id/read → markOneRead
 *   PUT  /api/notifications/read-all → markAllRead
 */

const Notification = require('../models/Notification');

const appError = (status, code, message) => {
  const err = new Error(message);
  err.status = status;
  err.appCode = code;
  return err;
};

// ─── GET /api/notifications ───────────────────────────────────────────────────
// Returns the latest 30 notifications for the authenticated freelancer.
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ freelancerId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30);
    return res.status(200).json({ notifications });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/notifications/:id/read ─────────────────────────────────────────
// Mark a single notification as read. Only the owning freelancer can mark their own.
const markOneRead = async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, freelancerId: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notif) {
      return next(appError(404, 'NOT_FOUND', 'Notification not found'));
    }
    return res.status(200).json({ notification: notif });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/notifications/read-all ─────────────────────────────────────────
// Mark ALL unread notifications as read for the authenticated freelancer.
const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { freelancerId: req.user.id, isRead: false },
      { isRead: true }
    );
    return res.status(200).json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, markOneRead, markAllRead };
