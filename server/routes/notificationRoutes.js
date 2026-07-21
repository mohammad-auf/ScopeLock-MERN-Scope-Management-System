const express = require('express');
const Notification = require('../models/Notification');
const { verifyJWT } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(verifyJWT);

// GET /api/notifications — latest 30 for the authenticated freelancer
router.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ freelancerId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30);
    return res.status(200).json({ notifications });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, freelancerId: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Notification not found' } });
    return res.status(200).json({ notification: notif });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ freelancerId: req.user.id, isRead: false }, { isRead: true });
    return res.status(200).json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

