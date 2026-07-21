import React, { useState } from 'react';
import InlineError from '../shared/InlineError';

/**
 * ScopeItemRow — a single scope item displayed in the list.
 * Supports inline editing (toggled by the Edit button).
 *
 * Props:
 *   item         ScopeItem object
 *   onUpdate     (id, data) => Promise<void>
 *   onDelete     (id) => void   — triggers parent confirmation
 *   isDeletable  boolean        — false when item has a linked change order
 */
const ScopeItemRow = ({ item, onUpdate, onDelete, isDeletable }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState({
    title: item.title,
    description: item.description || '',
    categoryTag: item.categoryTag,
    estimatedHours: String(item.estimatedHours),
  });
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');

  const set = (field) => (e) =>
    setFields((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!fields.title.trim()) errs.title = 'Title is required';
    else if (fields.title.trim().length < 3) errs.title = 'Min 3 characters';
    else if (fields.title.trim().length > 150) errs.title = 'Max 150 characters';

    const tag = fields.categoryTag.trim().toLowerCase();
    if (!tag) errs.categoryTag = 'Tag is required';
    else if (!/^[a-z0-9-]+$/.test(tag)) errs.categoryTag = 'Lowercase letters, numbers, hyphens only';
    else if (tag.length < 2 || tag.length > 30) errs.categoryTag = '2–30 characters';

    const h = Number(fields.estimatedHours);
    if (!fields.estimatedHours) errs.estimatedHours = 'Hours required';
    else if (isNaN(h) || h <= 0) errs.estimatedHours = 'Must be > 0';
    else if (h > 500) errs.estimatedHours = 'Max 500';

    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSaveError('');
    setSaving(true);
    try {
      await onUpdate(item._id, {
        title: fields.title.trim(),
        description: fields.description.trim(),
        categoryTag: fields.categoryTag.trim().toLowerCase(),
        estimatedHours: Number(fields.estimatedHours),
      });
      setEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.error?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setErrors({});
    setSaveError('');
    setFields({
      title: item.title,
      description: item.description || '',
      categoryTag: item.categoryTag,
      estimatedHours: String(item.estimatedHours),
    });
  };

  if (editing) {
    return (
      <li className="scope-item-row scope-item-row--editing">
        <div className="scope-edit-grid">
          {/* Title */}
          <div className="form-group scope-edit-field--title">
            <label htmlFor={`edit-title-${item._id}`} className="form-label">Title</label>
            <input
              id={`edit-title-${item._id}`}
              type="text"
              className={`form-input${errors.title ? ' input-error' : ''}`}
              value={fields.title}
              onChange={set('title')}
              maxLength={150}
              aria-describedby={errors.title ? `err-title-${item._id}` : undefined}
            />
            <InlineError id={`err-title-${item._id}`} message={errors.title} />
          </div>

          {/* Category Tag */}
          <div className="form-group scope-edit-field--tag">
            <label htmlFor={`edit-tag-${item._id}`} className="form-label">Tag</label>
            <input
              id={`edit-tag-${item._id}`}
              type="text"
              className={`form-input${errors.categoryTag ? ' input-error' : ''}`}
              value={fields.categoryTag}
              onChange={set('categoryTag')}
              maxLength={30}
              aria-describedby={errors.categoryTag ? `err-tag-${item._id}` : undefined}
            />
            <InlineError id={`err-tag-${item._id}`} message={errors.categoryTag} />
          </div>

          {/* Estimated Hours */}
          <div className="form-group scope-edit-field--hours">
            <label htmlFor={`edit-hours-${item._id}`} className="form-label">Hours</label>
            <input
              id={`edit-hours-${item._id}`}
              type="number"
              className={`form-input${errors.estimatedHours ? ' input-error' : ''}`}
              value={fields.estimatedHours}
              onChange={set('estimatedHours')}
              min={0.01}
              max={500}
              step={0.5}
              aria-describedby={errors.estimatedHours ? `err-hours-${item._id}` : undefined}
            />
            <InlineError id={`err-hours-${item._id}`} message={errors.estimatedHours} />
          </div>

          {/* Description (full width) */}
          <div className="form-group scope-edit-field--desc">
            <label htmlFor={`edit-desc-${item._id}`} className="form-label">Description <span className="form-label-optional">(optional)</span></label>
            <textarea
              id={`edit-desc-${item._id}`}
              className="form-input form-textarea"
              value={fields.description}
              onChange={set('description')}
              rows={2}
              placeholder="Brief description of what this item covers"
            />
          </div>
        </div>

        {saveError && <p role="alert" className="form-api-error" style={{ margin: '0.5rem 0 0' }}>{saveError}</p>}

        <div className="scope-item-actions">
          <button className="btn btn-ghost btn-sm" onClick={handleCancel} disabled={saving}>Cancel</button>
          <button
            id={`save-scope-${item._id}`}
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="scope-item-row">
      <div className="scope-item-main">
        <div className="scope-item-header">
          <span className="scope-item-title">{item.title}</span>
          <span className="scope-tag">{item.categoryTag}</span>
        </div>
        {item.description && (
          <p className="scope-item-desc">{item.description}</p>
        )}
      </div>

      <div className="scope-item-meta">
        <span className="scope-item-hours">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          {item.estimatedHours} h
        </span>

        <div className="scope-item-btns">
          <button
            id={`edit-scope-${item._id}`}
            className="btn btn-ghost btn-sm"
            onClick={() => setEditing(true)}
            aria-label={`Edit ${item.title}`}
          >
            Edit
          </button>
          <button
            id={`delete-scope-${item._id}`}
            className={`btn btn-sm ${isDeletable ? 'btn-danger-ghost' : 'btn-disabled'}`}
            onClick={() => isDeletable && onDelete(item._id, item.title)}
            aria-label={isDeletable ? `Delete ${item.title}` : `Cannot delete — ${item.title} has a linked change order`}
            title={!isDeletable ? 'Cannot delete: this item has a linked change order' : undefined}
            aria-disabled={!isDeletable}
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
};

export default ScopeItemRow;
