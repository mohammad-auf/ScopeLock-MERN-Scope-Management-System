const Project = require('../models/Project');
const ScopeItem = require('../models/ScopeItem');
const ClientRequest = require('../models/ClientRequest');
const ChangeOrder = require('../models/ChangeOrder');
const Notification = require('../models/Notification');
const { classify } = require('../utils/scopeMatcher');

/** Structured app error helper */
const appError = (status, appCode, message) => {
  const err = new Error(message);
  err.status = status;
  err.appCode = appCode;
  return err;
};

/**
 * Resolve a portal token → project document.
 * Returns 404 if the token doesn't match any project (Section 17).
 */
const requirePortalToken = async (token) => {
  const project = await Project.findOne({ portalToken: token });
  if (!project) throw appError(404, 'NOT_FOUND', 'Invalid or expired portal link');
  return project;
};

/** Create a freelancer notification (fire-and-forget — never blocks the response) */
const notify = async (freelancerId, projectId, message) => {
  try {
    await Notification.create({ freelancerId, projectId, message });
  } catch (err) {
    console.error(`[NOTIFY] Failed to create notification: ${err.message}`);
  }
};

// ─── GET /api/portal/:token ──────────────────────────────────────────────────
// Returns project info the client needs to render the portal page.
const getPortalProject = async (req, res, next) => {
  try {
    const project = await requirePortalToken(req.params.token);

    // Expose only the fields the client portal needs
    return res.status(200).json({
      project: {
        _id: project._id,
        title: project.title,
        clientName: project.clientName,
        status: project.status,
        totalPrice: project.totalPrice,
        totalHours: project.totalHours,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/portal/:token/tags ─────────────────────────────────────────────
// Returns the list of unique category tags for this project (for the request form dropdown).
const getPortalTags = async (req, res, next) => {
  try {
    const project = await requirePortalToken(req.params.token);
    const items = await ScopeItem.find({ projectId: project._id }).select('categoryTag');
    const tags = [...new Set(items.map((i) => i.categoryTag))].sort();
    return res.status(200).json({ tags });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/portal/:token/requests ────────────────────────────────────────
// Submit a client request; run scope classifier; create notification (FR24).
// Rate-limited to 20/hr per token via express-rate-limit in the route file.
const submitRequest = async (req, res, next) => {
  try {
    const project = await requirePortalToken(req.params.token);
    const { requestText, categoryTag } = req.body;

    // Validate request text (PRD §18)
    if (!requestText || typeof requestText !== 'string') {
      return next(appError(400, 'VALIDATION_ERROR', 'requestText is required'));
    }
    const trimmedText = requestText.trim();
    if (trimmedText.length < 10 || trimmedText.length > 2000) {
      return next(
        appError(400, 'VALIDATION_ERROR', 'requestText must be 10–2000 characters')
      );
    }

    // Validate optional categoryTag — must match an existing project tag if provided (PRD §18)
    let normalizedTag = null;
    if (categoryTag && categoryTag.trim()) {
      normalizedTag = categoryTag.trim().toLowerCase();
      const scopeItems = await ScopeItem.find({ projectId: project._id });
      const projectTags = scopeItems.map((i) => i.categoryTag.toLowerCase());
      if (!projectTags.includes(normalizedTag)) {
        return next(
          appError(
            400,
            'VALIDATION_ERROR',
            `Category tag "${normalizedTag}" does not match any existing scope item tag`
          )
        );
      }
    }

    // Load scope items for classification
    const scopeItems = await ScopeItem.find({ projectId: project._id });

    // Classify the request using the isolated match engine (NFR6, PRD §18)
    const classification = classify(trimmedText, normalizedTag, scopeItems);

    // Persist the request
    const clientRequest = await ClientRequest.create({
      projectId: project._id,
      requestText: trimmedText,
      categoryTag: normalizedTag,
      classification,
    });

    // FR24: Notify the freelancer
    await notify(
      project.freelancerId,
      project._id,
      `New ${classification.replace('_', ' ')} request on "${project.title}": "${trimmedText.slice(0, 60)}${trimmedText.length > 60 ? '…' : ''}"`
    );

    return res.status(201).json({
      clientRequest: {
        _id: clientRequest._id,
        classification,
        createdAt: clientRequest.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/portal/:token/timeline ─────────────────────────────────────────
// Simplified timeline: original scope items + approved change orders (FR23).
const getPortalTimeline = async (req, res, next) => {
  try {
    const project = await requirePortalToken(req.params.token);

    // Original scope items (ordered by creation)
    const scopeItems = await ScopeItem.find({ projectId: project._id })
      .sort({ createdAt: 1 })
      .select('title estimatedHours categoryTag createdAt');

    // Approved change orders (ordered by resolvedAt)
    const changeOrders = await ChangeOrder.find({
      projectId: project._id,
      status: 'approved',
    })
      .sort({ resolvedAt: 1 })
      .select('description estimatedHours price resolvedAt createdAt');

    // Build a unified timeline
    const timeline = [
      ...scopeItems.map((item) => ({
        type: 'scope_item',
        _id: item._id,
        title: item.title,
        hours: item.estimatedHours,
        price: null,
        tag: item.categoryTag,
        date: item.createdAt,
      })),
      ...changeOrders.map((co) => ({
        type: 'change_order',
        _id: co._id,
        title: co.description,
        hours: co.estimatedHours,
        price: co.price,
        tag: null,
        date: co.resolvedAt || co.createdAt,
      })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    return res.status(200).json({
      timeline,
      project: {
        title: project.title,
        clientName: project.clientName,
        status: project.status,
        totalHours: project.totalHours,
        totalPrice: project.totalPrice,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/portal/:token/change-orders ────────────────────────────────────
// Returns all "sent" change orders the client can respond to.
const getPortalChangeOrders = async (req, res, next) => {
  try {
    const project = await requirePortalToken(req.params.token);

    const changeOrders = await ChangeOrder.find({
      projectId: project._id,
      status: 'sent',
    })
      .sort({ createdAt: -1 })
      .select('description estimatedHours price isBlocking status createdAt');

    return res.status(200).json({ changeOrders });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/portal/:token/change-orders/:id/approve ────────────────────────
// Client approves a sent change order (FR16).
// Updates project totalPrice and totalHours (FR18). Notifies freelancer (FR25).
const approveChangeOrder = async (req, res, next) => {
  try {
    const project = await requirePortalToken(req.params.token);

    const co = await ChangeOrder.findOne({
      _id: req.params.id,
      projectId: project._id,
    });

    if (!co) return next(appError(404, 'NOT_FOUND', 'Change order not found'));

    // Only "sent" orders can be approved (valid transition: sent → approved)
    if (co.status !== 'sent') {
      return next(
        appError(
          409,
          'CONFLICT',
          `Change order cannot be approved from status "${co.status}"`
        )
      );
    }

    co.status = 'approved';
    co.resolvedAt = new Date();
    await co.save();

    // FR18: Update project running totals
    project.totalPrice += co.price;
    project.totalHours += co.estimatedHours;

    // BR4: If this was blocking, un-pause the project
    if (co.isBlocking) {
      const otherBlocking = await ChangeOrder.exists({
        projectId: project._id,
        isBlocking: true,
        status: 'sent',
        _id: { $ne: co._id },
      });
      if (!otherBlocking) project.status = 'active';
    }

    await project.save();

    // FR25: Notify freelancer
    await notify(
      project.freelancerId,
      project._id,
      `Client approved a change order on "${project.title}" — $${co.price.toFixed(2)} added`
    );

    return res.status(200).json({ changeOrder: co, project });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/portal/:token/change-orders/:id/decline ────────────────────────
// Client declines a sent change order (FR17).
// BR5: Declining does NOT update project totals. Notifies freelancer (FR25).
const declineChangeOrder = async (req, res, next) => {
  try {
    const project = await requirePortalToken(req.params.token);

    const co = await ChangeOrder.findOne({
      _id: req.params.id,
      projectId: project._id,
    });

    if (!co) return next(appError(404, 'NOT_FOUND', 'Change order not found'));

    if (co.status !== 'sent') {
      return next(
        appError(
          409,
          'CONFLICT',
          `Change order cannot be declined from status "${co.status}"`
        )
      );
    }

    co.status = 'declined';
    co.resolvedAt = new Date();
    await co.save();

    // BR4: If this was a blocking CO, un-pause the project on decline too
    if (co.isBlocking) {
      const otherBlocking = await ChangeOrder.exists({
        projectId: project._id,
        isBlocking: true,
        status: 'sent',
        _id: { $ne: co._id },
      });
      if (!otherBlocking) {
        project.status = 'active';
        await project.save();
      }
    }

    // FR25: Notify freelancer (BR5: totals unchanged)
    await notify(
      project.freelancerId,
      project._id,
      `Client declined a change order on "${project.title}" — no change to project totals`
    );

    return res.status(200).json({ changeOrder: co });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPortalProject,
  getPortalTags,
  submitRequest,
  getPortalTimeline,
  getPortalChangeOrders,
  approveChangeOrder,
  declineChangeOrder,
};
