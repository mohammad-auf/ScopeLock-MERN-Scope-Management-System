const express = require('express');
const {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const {
  getScopeItems,
  createScopeItem,
} = require('../controllers/scopeController');
const { getRequests } = require('../controllers/requestController');
const {
  getChangeOrders,
  getTimeline,
} = require('../controllers/changeOrderController');
const { verifyJWT } = require('../middleware/authMiddleware');

const router = express.Router();

// All project routes require a valid JWT (NFR3)
router.use(verifyJWT);

// Project CRUD
router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// Nested scope item routes under /api/projects/:id/scope-items
router.get('/:id/scope-items', getScopeItems);
router.post('/:id/scope-items', createScopeItem);

// Nested request routes
router.get('/:id/requests', getRequests);

// Nested change order routes
router.get('/:id/change-orders', getChangeOrders);

// Timeline route
router.get('/:id/timeline', getTimeline);

module.exports = router;
