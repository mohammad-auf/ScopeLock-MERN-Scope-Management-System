import React, { useState } from 'react';
import InlineError from '../shared/InlineError';

/**
 * NewProjectForm — form rendered inside the Dashboard "New Project" modal
 * Props:
 *   onSubmit  (data: {title, clientName, hourlyRate}) => Promise<void>
 *   onCancel  () => void
 *   apiError  string | null
 */
const NewProjectForm = ({ onSubmit, onCancel, apiError }) => {
  const [fields, setFields] = useState({ title: '', clientName: '', hourlyRate: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) =>
    setFields((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!fields.title.trim()) errs.title = 'Project title is required';
    else if (fields.title.trim().length < 3) errs.title = 'Title must be at least 3 characters';
    else if (fields.title.trim().length > 100) errs.title = 'Title must be at most 100 characters';

    if (!fields.clientName.trim()) errs.clientName = 'Client name is required';
    else if (fields.clientName.trim().length < 2) errs.clientName = 'Client name must be at least 2 characters';

    const rate = Number(fields.hourlyRate);
    if (!fields.hourlyRate) errs.hourlyRate = 'Hourly rate is required';
    else if (isNaN(rate) || rate <= 0) errs.hourlyRate = 'Hourly rate must be greater than 0';
    else if (rate > 100000) errs.hourlyRate = 'Hourly rate must be at most 100,000';

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      await onSubmit({
        title: fields.title.trim(),
        clientName: fields.clientName.trim(),
        hourlyRate: Number(fields.hourlyRate),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Project title */}
      <div className="form-group">
        <label htmlFor="new-project-title" className="form-label">
          Project title <span aria-hidden="true">*</span>
        </label>
        <input
          id="new-project-title"
          type="text"
          className={`form-input${errors.title ? ' input-error' : ''}`}
          value={fields.title}
          onChange={set('title')}
          placeholder="e.g. Marketing Site Redesign"
          aria-describedby={errors.title ? 'title-err' : undefined}
          aria-required="true"
          maxLength={100}
        />
        <InlineError id="title-err" message={errors.title} />
      </div>

      {/* Client name */}
      <div className="form-group">
        <label htmlFor="new-project-client" className="form-label">
          Client name <span aria-hidden="true">*</span>
        </label>
        <input
          id="new-project-client"
          type="text"
          className={`form-input${errors.clientName ? ' input-error' : ''}`}
          value={fields.clientName}
          onChange={set('clientName')}
          placeholder="e.g. Acme Corp"
          aria-describedby={errors.clientName ? 'client-err' : undefined}
          aria-required="true"
          maxLength={100}
        />
        <InlineError id="client-err" message={errors.clientName} />
      </div>

      {/* Hourly rate */}
      <div className="form-group">
        <label htmlFor="new-project-rate" className="form-label">
          Hourly rate (USD) <span aria-hidden="true">*</span>
        </label>
        <input
          id="new-project-rate"
          type="number"
          className={`form-input${errors.hourlyRate ? ' input-error' : ''}`}
          value={fields.hourlyRate}
          onChange={set('hourlyRate')}
          placeholder="75"
          min={1}
          max={100000}
          step="0.01"
          aria-describedby={errors.hourlyRate ? 'rate-err' : undefined}
          aria-required="true"
        />
        <InlineError id="rate-err" message={errors.hourlyRate} />
      </div>

      {/* API-level error */}
      {apiError && (
        <p role="alert" className="form-api-error">{apiError}</p>
      )}

      {/* Buttons */}
      <div className="form-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          id="create-project-submit"
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting ? 'Creating…' : 'Create Project'}
        </button>
      </div>
    </form>
  );
};

export default NewProjectForm;
