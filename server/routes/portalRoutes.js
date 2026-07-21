const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  getPortalProject,
  getPortalTags,
  submitRequest,
  getPortalTimeline,
  getPortalChangeOrders,
  approveChangeOrder,
  declineChangeOrder,
} = require('../controllers/portalController');

const router = express.Router();

/**
 * Rate limiter for the request submission endpoint.
 * PRD Section 21: at most 20 requests per hour per portal token.
 * The key is the portal token (from the URL) so each project gets
 * its own independent bucket.
 */
const submitRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: (req) => req.params.token || 'anonymous',
  message: {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Too many requests submitted. Please wait before submitting again.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Public portal routes (no JWT required) ───────────────────────────────────
// Validated by portal token only (PRD Section 17).

// Project info
router.get('/:token', getPortalProject);

// Available tags for the request form dropdown
router.get('/:token/tags', getPortalTags);

// Submit a client request (rate-limited: 20/hr per token)
router.post('/:token/requests', submitRateLimit, submitRequest);

// Simplified timeline (original scope + approved COs)
router.get('/:token/timeline', getPortalTimeline);

// Pending (sent) change orders the client can respond to
router.get('/:token/change-orders', getPortalChangeOrders);

// Approve / Decline a change order
router.put('/:token/change-orders/:id/approve', approveChangeOrder);
router.put('/:token/change-orders/:id/decline', declineChangeOrder);

module.exports = router;
