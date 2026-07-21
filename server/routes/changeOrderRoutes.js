const express = require('express');
const {
  getChangeOrder,
  updateChangeOrder,
  sendChangeOrder,
  deleteChangeOrder,
} = require('../controllers/changeOrderController');
const { verifyJWT } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(verifyJWT);

router.get('/:id', getChangeOrder);
router.put('/:id', updateChangeOrder);
router.put('/:id/send', sendChangeOrder);
router.delete('/:id', deleteChangeOrder);

module.exports = router;
