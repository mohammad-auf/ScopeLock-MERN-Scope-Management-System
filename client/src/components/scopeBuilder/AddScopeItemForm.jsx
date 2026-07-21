import React, { useState } from 'react';
import InlineError from '../shared/InlineError';

/**
 * AddScopeItemForm — collapsible "Add Scope Item" form at the top of the scope builder.
 * Props:
 *   onAdd        (data) => Promise<void>
 *   existingTags string[]   — tags already on the project (for datalist autocomplete)
 */
const AddScopeItemForm = ({ onAdd, existingTags = [] }) => {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState({
    title: '',
    description: '',
    categoryTag: '',
    estimatedHours: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) =>
    setFields((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!fields.title.trim()) errs.title = 'Title is required';
    else if (fields.title.trim().length < 3) errs.title = 'Min 3 characters';
    else if (fields.title.trim().length > 150) errs.title = 'Max 150 characters';

    const tag = fields.categoryTag.trim().toLowerCase();
    if (!tag) errs.categoryTag = 'Category tag is required';
    else if (!/^[a-z0-9-]+$/.test(tag)) errs.categoryTag = 'Lowercase letters, numbers, hyphens only';
    else if (tag.length < 2 || tag.length > 30) errs.categoryTag = '2–30 characters';

    const h = Number(fields.estimatedHours);
    if (!fields.estimatedHours) errs.estimatedHours = 'Estimated hours required';
    else if (isNaN(h) || h <= 0) errs.estimatedHours = 'Must be greater than 0';
    else if (h > 500) errs.estimatedHours = 'Maximum is 500';

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setApiError('');
    setSubmitting(true);
    try {
      await onAdd({
        title: fields.title.trim(),
        description: fields.description.trim(),
        categoryTag: fields.categoryTag.trim().toLowerCase(),
        estimatedHours: Number(fields.estimatedHours),
      });
      // Reset form but leave open for quick successive adds
      setFields({ title: '', description: '', categoryTag: '', estimatedHours: '' });
    } catch (err) {
      setApiError(err.response?.data?.error?.message || 'Failed to add scope item');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        id="add-scope-item-btn"
        className="btn btn-primary"
        onClick={() => setOpen(true)}
      >
        + Add Scope Item
      </button>
    );
  }

  return (
    <div className="add-scope-form">
      <div className="add-scope-form-header">
        <h3 className="add-scope-form-title">New Scope Item</h3>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { setOpen(false); setErrors({}); setApiError(''); }}
          aria-label="Close form"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="scope-add-grid">
          {/* Title */}
          <div className="form-group scope-add-field--title">
            <label htmlFor="new-scope-title" className="form-label">
              Title <span aria-hidden="true">*</span>
            </label>
            <input
              id="new-scope-title"
              type="text"
              className={`form-input${errors.title ? ' input-error' : ''}`}
              value={fields.title}
              onChange={set('title')}
              placeholder="e.g. User authentication flow"
              maxLength={150}
              aria-required="true"
              aria-describedby={errors.title ? 'new-scope-title-err' : undefined}
              autoFocus
            />
            <InlineError id="new-scope-title-err" message={errors.title} />
          </div>

          {/* Category Tag */}
          <div className="form-group scope-add-field--tag">
            <label htmlFor="new-scope-tag" className="form-label">
              Category tag <span aria-hidden="true">*</span>
            </label>
            <input
              id="new-scope-tag"
              type="text"
              list="existing-tags"
              className={`form-input${errors.categoryTag ? ' input-error' : ''}`}
              value={fields.categoryTag}
              onChange={set('categoryTag')}
              placeholder="e.g. backend"
              maxLength={30}
              aria-required="true"
              aria-describedby={errors.categoryTag ? 'new-scope-tag-err' : 'new-scope-tag-hint'}
            />
            <datalist id="existing-tags">
              {existingTags.map((t) => <option key={t} value={t} />)}
            </datalist>
            <span id="new-scope-tag-hint" className="form-hint">
              Lowercase, numbers, hyphens only — used to classify client requests
            </span>
            <InlineError id="new-scope-tag-err" message={errors.categoryTag} />
          </div>

          {/* Estimated Hours */}
          <div className="form-group scope-add-field--hours">
            <label htmlFor="new-scope-hours" className="form-label">
              Estimated hours <span aria-hidden="true">*</span>
            </label>
            <input
              id="new-scope-hours"
              type="number"
              className={`form-input${errors.estimatedHours ? ' input-error' : ''}`}
              value={fields.estimatedHours}
              onChange={set('estimatedHours')}
              placeholder="8"
              min={0.01}
              max={500}
              step={0.5}
              aria-required="true"
              aria-describedby={errors.estimatedHours ? 'new-scope-hours-err' : undefined}
            />
            <InlineError id="new-scope-hours-err" message={errors.estimatedHours} />
          </div>

          {/* Description (full width) */}
          <div className="form-group scope-add-field--desc">
            <label htmlFor="new-scope-desc" className="form-label">
              Description <span className="form-label-optional">(optional)</span>
            </label>
            <textarea
              id="new-scope-desc"
              className="form-input form-textarea"
              value={fields.description}
              onChange={set('description')}
              placeholder="Brief description of what this scope item covers…"
              rows={2}
            />
          </div>
        </div>

        {apiError && (
          <p role="alert" className="form-api-error">{apiError}</p>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => { setOpen(false); setErrors({}); setApiError(''); }}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            id="submit-scope-item"
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Adding…' : 'Add Item'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddScopeItemForm;
