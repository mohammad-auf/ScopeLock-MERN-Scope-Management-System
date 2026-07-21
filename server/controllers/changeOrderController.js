'use strict';

/**
 * changeOrderController.js
 *
 * Freelancer-facing handlers for ChangeOrder documents.
 * Client-facing approve/decline is handled in portalController.js.
 *
 * PRD references enforced here:
 *   FR13  price = estimatedHours × project.hourlyRate
 *   FR14  freelancer may edit estimatedHours of a DRAFT CO; price recomputes
 *   FR15  freelancer sends a DRAFT CO to the client
 *   FR18  approving a CO increments project totalPrice and totalHours
 *   FR19  freelancer marks a CO as blocking at creation
 *   FR20  only one blocking CO may be pending (status='sent') per project
 *   FR21  approved COs appear on the project timeline (via timeline endpoint)
 *   NFR5  an approved CO cannot be edited or deleted through any endpoint
 *   BR2   price always = estimatedHours × hourlyRate; recomputed on hours change
 *   BR3   a CO cannot be edited once its status changes from draft to sent
 *   BR4   a blocking CO sets project.status to 'paused'; cleared on resolve
 *   BR5   declining a CO does not change project totals
 */

const ChangeOrder = require('../models/ChangeOrder');
const ClientRequest = require('../models/ClientRequest');
const Project = require('../models/Project');
const Notification = require('../models/Notification');

const appError = (status, code, message) => {
  const err = new Error(message);
  err.status = status;
  err.appCode = code;
  return err;
};

/** Verify project ownership; returns project or throws */
const requireProjectOwnership = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) throw appError(404, 'NOT_FOUND', 'Project not found');
  if (project.freelancerId.toString() !== userId.toString()) {
    throw appError(403, 'FORBIDDEN', 'You do not own this project');
  }
  return project;
};

/** Verify CO ownership by checking its project */
const requireCOOwnership = async (coId, userId) => {
  const co = await ChangeOrder.findById(coId);
  if (!co) throw appError(404, 'NOT_FOUND', 'Change order not found');
  await requireProjectOwnership(co.projectId, userId); // throws if not owner
  return co;
};

/** Fire-and-forget notification */
const notify = async (freelancerId, projectId, message) => {
  try {
    await Notification.create({ freelancerId, projectId, message });
  } catch (e) {
    console.error(`[NOTIFY] ${e.message}`);
  }
};

// ─── GET /api/projects/:id/change-orders ─────────────────────────────────────
// All COs for a project, newest first.
const getChangeOrders = async (req, res, next) => {
  try {
    await requireProjectOwnership(req.params.id, req.user.id);

    const changeOrders = await ChangeOrder.find({ projectId: req.params.id })
      .sort({ createdAt: -1 })
      .populate('requestId', 'requestText categoryTag classification');

    return res.status(200).json({ changeOrders });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/change-orders/:id ──────────────────────────────────────────────
const getChangeOrder = async (req, res, next) => {
  try {
    const co = await requireCOOwnership(req.params.id, req.user.id);
    await co.populate('requestId', 'requestText categoryTag classification');
    return res.status(200).json({ changeOrder: co });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/change-orders/:id ──────────────────────────────────────────────
// Edit description and/or estimatedHours of a DRAFT CO.
// FR14: price recomputes whenever estimatedHours changes.
// BR3 / NFR5: no edits allowed once status ≠ 'draft'.
const updateChangeOrder = async (req, res, next) => {
  try {
    const co = await requireCOOwnership(req.params.id, req.user.id);

    // BR3 / NFR5: only draft COs are editable
    if (co.status !== 'draft') {
      return next(
        appError(
          409,
          'CONFLICT',
          `Change order cannot be edited from status "${co.status}"`
        )
      );
    }

    const project = await Project.findById(co.projectId);

    const { description, estimatedHours } = req.body;
    let changed = false;

    if (description !== undefined) {
      if (typeof description !== 'string' || !description.trim()) {
        return next(appError(400, 'VALIDATION_ERROR', 'description cannot be empty'));
      }
      co.description = description.trim();
      changed = true;
    }

    if (estimatedHours !== undefined) {
      const hours = Number(estimatedHours);
      if (isNaN(hours) || hours <= 0 || hours > 500) {
        return next(
          appError(
            400,
            'VALIDATION_ERROR',
            'estimatedHours must be a number greater than 0 and at most 500'
          )
        );
      }
      co.estimatedHours = hours;
      // FR14 / BR2: recompute price whenever hours change
      co.price = hours * project.hourlyRate;
      changed = true;
    }

    if (!changed) {
      return next(appError(400, 'VALIDATION_ERROR', 'Provide at least one field to update'));
    }

    await co.save();
    return res.status(200).json({ changeOrder: co });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/change-orders/:id/send ─────────────────────────────────────────
// Transition: draft → sent (FR15).
// BR4: if isBlocking → project.status = 'paused'.
// FR20 guard: only one blocking CO may be pending per project.
const sendChangeOrder = async (req, res, next) => {
  try {
    const co = await requireCOOwnership(req.params.id, req.user.id);

    // Valid transition: draft → sent only
    if (co.status !== 'draft') {
      return next(
        appError(
          409,
          'CONFLICT',
          `Change order cannot be sent from status "${co.status}"`
        )
      );
    }

    // FR20: if blocking, ensure no other blocking CO is already sent
    if (co.isBlocking) {
      const existing = await ChangeOrder.findOne({
        projectId: co.projectId,
        isBlocking: true,
        status: 'sent',
        _id: { $ne: co._id },
      });
      if (existing) {
        return next(
          appError(
            409,
            'CONFLICT',
            'A blocking change order is already pending for this project'
          )
        );
      }
    }

    co.status = 'sent';
    await co.save();

    // BR4: blocking CO pauses the project
    if (co.isBlocking) {
      await Project.findByIdAndUpdate(co.projectId, { status: 'paused' });
    }

    return res.status(200).json({ changeOrder: co });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/change-orders/:id ───────────────────────────────────────────
// Only draft COs may be deleted (NFR5: approved COs are immutable).
const deleteChangeOrder = async (req, res, next) => {
  try {
    const co = await requireCOOwnership(req.params.id, req.user.id);

    // NFR5: approved COs cannot be deleted
    if (co.status === 'approved') {
      return next(
        appError(409, 'CONFLICT', 'An approved change order cannot be deleted')
      );
    }
    // Also block deleting a sent CO (must be declined or re-drafted)
    if (co.status === 'sent') {
      return next(
        appError(409, 'CONFLICT', 'A sent change order cannot be deleted; ask the client to decline it')
      );
    }

    // Unlink from the originating request so a new CO can be created (BR1)
    await ClientRequest.findByIdAndUpdate(co.requestId, { changeOrderId: null });

    await ChangeOrder.findByIdAndDelete(co._id);

    return res.status(200).json({ message: 'Change order deleted' });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/projects/:id/timeline ──────────────────────────────────────────
// FR21 / FR22: original scope items + approved COs in chronological order.
// Freelancer-facing (full details). Client-facing version lives in portalController.
const getTimeline = async (req, res, next) => {
  try {
    const project = await requireProjectOwnership(req.params.id, req.user.id);

    const ScopeItem = require('../models/ScopeItem');

    const [scopeItems, changeOrders] = await Promise.all([
      ScopeItem.find({ projectId: project._id })
        .sort({ createdAt: 1 })
        .select('title description estimatedHours categoryTag createdAt'),
      ChangeOrder.find({ projectId: project._id, status: 'approved' })
        .sort({ resolvedAt: 1 })
        .populate('requestId', 'requestText categoryTag classification'),
    ]);

    const timeline = [
      ...scopeItems.map((item) => ({
        type: 'scope_item',
        _id: item._id,
        title: item.title,
        description: item.description,
        hours: item.estimatedHours,
        price: null,
        tag: item.categoryTag,
        date: item.createdAt,
      })),
      ...changeOrders.map((co) => ({
        type: 'change_order',
        _id: co._id,
        title: co.description,
        description: co.requestId?.requestText || null,
        hours: co.estimatedHours,
        price: co.price,
        tag: co.requestId?.categoryTag || null,
        requestClassification: co.requestId?.classification || null,
        date: co.resolvedAt || co.createdAt,
      })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    return res.status(200).json({
      timeline,
      project: {
        _id: project._id,
        title: project.title,
        status: project.status,
        totalHours: project.totalHours,
        totalPrice: project.totalPrice,
        hourlyRate: project.hourlyRate,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getChangeOrders,
  getChangeOrder,
  updateChangeOrder,
  sendChangeOrder,
  deleteChangeOrder,
  getTimeline,
};
