const ScopeItem = require('../models/ScopeItem');
const Project = require('../models/Project');
const ChangeOrder = require('../models/ChangeOrder');
const ClientRequest = require('../models/ClientRequest');

/** Structured app error helper */
const appError = (status, appCode, message) => {
  const err = new Error(message);
  err.status = status;
  err.appCode = appCode;
  return err;
};

/**
 * Verify the project exists and belongs to the authenticated freelancer.
 * Returns the project document on success, throws appError otherwise.
 */
const requireProjectOwnership = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) throw appError(404, 'NOT_FOUND', 'Project not found');
  if (project.freelancerId.toString() !== userId) {
    throw appError(403, 'FORBIDDEN', 'You do not have access to this project');
  }
  return project;
};

// ─── GET /api/projects/:id/scope-items ───────────────────────────────────────
const getScopeItems = async (req, res, next) => {
  try {
    await requireProjectOwnership(req.params.id, req.user.id);

    const items = await ScopeItem.find({ projectId: req.params.id }).sort({ createdAt: 1 });
    return res.status(200).json({ scopeItems: items });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/projects/:id/scope-items ──────────────────────────────────────
const createScopeItem = async (req, res, next) => {
  try {
    await requireProjectOwnership(req.params.id, req.user.id);

    const { title, description, categoryTag, estimatedHours } = req.body;

    // Explicit validation (belt-and-suspenders alongside Mongoose)
    if (!title || !categoryTag || estimatedHours === undefined) {
      return next(
        appError(400, 'VALIDATION_ERROR', 'title, categoryTag, and estimatedHours are required')
      );
    }

    if (title.trim().length < 3 || title.trim().length > 150) {
      return next(appError(400, 'VALIDATION_ERROR', 'title must be 3–150 characters'));
    }

    if (!/^[a-z0-9-]+$/.test(categoryTag.trim())) {
      return next(
        appError(
          400,
          'VALIDATION_ERROR',
          'categoryTag must contain only lowercase letters, numbers, and hyphens'
        )
      );
    }

    if (categoryTag.trim().length < 2 || categoryTag.trim().length > 30) {
      return next(appError(400, 'VALIDATION_ERROR', 'categoryTag must be 2–30 characters'));
    }

    const hours = Number(estimatedHours);
    if (isNaN(hours) || hours <= 0 || hours > 500) {
      return next(
        appError(400, 'VALIDATION_ERROR', 'estimatedHours must be a number greater than 0 and at most 500')
      );
    }

    const item = await ScopeItem.create({
      projectId: req.params.id,
      title: title.trim(),
      description: description ? description.trim() : '',
      categoryTag: categoryTag.trim().toLowerCase(),
      estimatedHours: hours,
    });

    return res.status(201).json({ scopeItem: item });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/scope-items/:id ────────────────────────────────────────────────
const updateScopeItem = async (req, res, next) => {
  try {
    const item = await ScopeItem.findById(req.params.id);
    if (!item) return next(appError(404, 'NOT_FOUND', 'Scope item not found'));

    // Verify ownership via the parent project
    await requireProjectOwnership(item.projectId, req.user.id);

    const { title, description, categoryTag, estimatedHours } = req.body;

    if (title !== undefined) {
      if (title.trim().length < 3 || title.trim().length > 150) {
        return next(appError(400, 'VALIDATION_ERROR', 'title must be 3–150 characters'));
      }
      item.title = title.trim();
    }

    if (description !== undefined) {
      item.description = description.trim();
    }

    if (categoryTag !== undefined) {
      const tag = categoryTag.trim().toLowerCase();
      if (!/^[a-z0-9-]+$/.test(tag) || tag.length < 2 || tag.length > 30) {
        return next(
          appError(
            400,
            'VALIDATION_ERROR',
            'categoryTag must be 2–30 characters with only lowercase letters, numbers, and hyphens'
          )
        );
      }
      item.categoryTag = tag;
    }

    if (estimatedHours !== undefined) {
      const hours = Number(estimatedHours);
      if (isNaN(hours) || hours <= 0 || hours > 500) {
        return next(
          appError(400, 'VALIDATION_ERROR', 'estimatedHours must be greater than 0 and at most 500')
        );
      }
      item.estimatedHours = hours;
    }

    await item.save();
    return res.status(200).json({ scopeItem: item });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/scope-items/:id ─────────────────────────────────────────────
// Business Rule BR6: Cannot delete if the item has a linked change order.
// A scope item is linked to a change order via its category tag being matched
// by a request that then has a change order. We check via ClientRequest.
const deleteScopeItem = async (req, res, next) => {
  try {
    const item = await ScopeItem.findById(req.params.id);
    if (!item) return next(appError(404, 'NOT_FOUND', 'Scope item not found'));

    await requireProjectOwnership(item.projectId, req.user.id);

    // BR6: Check if any client request classified as in_scope (matching this tag)
    // has a linked change order
    const linkedRequest = await ClientRequest.findOne({
      projectId: item.projectId,
      categoryTag: item.categoryTag,
      changeOrderId: { $ne: null },
    });

    if (linkedRequest) {
      return next(
        appError(
          409,
          'CONFLICT',
          'Cannot delete this scope item because it has a linked change order'
        )
      );
    }

    await item.deleteOne();
    return res.status(200).json({ message: 'Scope item deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getScopeItems, createScopeItem, updateScopeItem, deleteScopeItem };
