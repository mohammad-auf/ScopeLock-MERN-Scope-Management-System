'use strict';

/**
 * requestController.js
 *
 * Freelancer-facing handlers for ClientRequest documents.
 * Client submission is handled in portalController.js.
 *
 * Routes wired in projectRoutes.js (nested) and requestRoutes.js (standalone).
 */

const ClientRequest = require('../models/ClientRequest');
const ChangeOrder = require('../models/ChangeOrder');
const Project = require('../models/Project');
const Notification = require('../models/Notification');

const appError = (status, code, message) => {
  const err = new Error(message);
  err.status = status;
  err.appCode = code;
  return err;
};

/** Verify project ownership; throw 403/404 on failure */
const requireProjectOwnership = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) throw appError(404, 'NOT_FOUND', 'Project not found');
  if (project.freelancerId.toString() !== userId.toString()) {
    throw appError(403, 'FORBIDDEN', 'You do not own this project');
  }
  return project;
};

// ─── GET /api/projects/:id/requests ──────────────────────────────────────────
// Returns all requests for a project, newest first (FR11).
const getRequests = async (req, res, next) => {
  try {
    await requireProjectOwnership(req.params.id, req.user.id);

    const requests = await ClientRequest.find({ projectId: req.params.id })
      .sort({ createdAt: -1 })
      .populate('changeOrderId', 'status estimatedHours price description');

    return res.status(200).json({ requests });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/requests/:id/change-order ─────────────────────────────────────
// Generate a draft change order from a request (FR12, FR13).
// Business rules:
//   BR1 — a request can be linked to at most one change order.
//   FR12 — only possible_extra or unclear requests can generate a CO.
//   FR13 — price = estimatedHours × project.hourlyRate.
//   FR20 — only one blocking CO may be pending per project.
//   BR4  — if isBlocking, project.status → 'paused'.
const createChangeOrderFromRequest = async (req, res, next) => {
  try {
    // Load the request and verify ownership via its project
    const clientRequest = await ClientRequest.findById(req.params.id);
    if (!clientRequest) return next(appError(404, 'NOT_FOUND', 'Request not found'));

    const project = await requireProjectOwnership(clientRequest.projectId, req.user.id);

    // FR12: only possible_extra or unclear can generate a CO
    if (clientRequest.classification === 'in_scope') {
      return next(
        appError(
          409,
          'CONFLICT',
          'Cannot create a change order for an in-scope request'
        )
      );
    }

    // BR1: at most one change order per request
    if (clientRequest.changeOrderId) {
      return next(
        appError(
          409,
          'CONFLICT',
          'A change order already exists for this request'
        )
      );
    }

    const { description, estimatedHours, isBlocking } = req.body;

    // Validate description
    if (!description || typeof description !== 'string' || !description.trim()) {
      return next(appError(400, 'VALIDATION_ERROR', 'description is required'));
    }

    // Validate estimatedHours (PRD §18: > 0 and ≤ 500)
    const hours = Number(estimatedHours);
    if (!estimatedHours || isNaN(hours) || hours <= 0 || hours > 500) {
      return next(
        appError(400, 'VALIDATION_ERROR', 'estimatedHours must be a number greater than 0 and at most 500')
      );
    }

    // FR20 / BR4: only one blocking CO may be pending per project
    const blocking = Boolean(isBlocking);
    if (blocking) {
      const existingBlocking = await ChangeOrder.findOne({
        projectId: project._id,
        isBlocking: true,
        status: 'sent',
      });
      if (existingBlocking) {
        return next(
          appError(
            409,
            'CONFLICT',
            'A blocking change order is already pending for this project'
          )
        );
      }
    }

    // FR13 / BR2: price = estimatedHours × project.hourlyRate
    const price = hours * project.hourlyRate;

    const changeOrder = await ChangeOrder.create({
      projectId: project._id,
      requestId: clientRequest._id,
      description: description.trim(),
      estimatedHours: hours,
      price,
      isBlocking: blocking,
      status: 'draft',
    });

    // Link back to the request (BR1)
    clientRequest.changeOrderId = changeOrder._id;
    await clientRequest.save();

    return res.status(201).json({ changeOrder });
  } catch (err) {
    next(err);
  }
};

module.exports = { getRequests, createChangeOrderFromRequest };
