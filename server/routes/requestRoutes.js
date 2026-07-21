const express = require('express');
const { createChangeOrderFromRequest } = require('../controllers/requestController');
const { verifyJWT } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(verifyJWT);

// Create a draft change order from a request
router.post('/:id/change-order', createChangeOrderFromRequest);

module.exports = router;
