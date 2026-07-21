const express = require('express');
const {
  updateScopeItem,
  deleteScopeItem,
} = require('../controllers/scopeController');
const { verifyJWT } = require('../middleware/authMiddleware');

// Mounted at /api/scope-items
// All routes require a valid JWT
const router = express.Router();
router.use(verifyJWT);

router.put('/:id', updateScopeItem);
router.delete('/:id', deleteScopeItem);

module.exports = router;
