import React, { useState } from 'react';
import InlineError from '../shared/InlineError';

/**
 * PortalRequestForm — lets the client submit a request from the portal.
 *
 * Props:
 *   availableTags  string[]          — scope item tags for this project
 *   onSubmit       (data) => Promise<{ classification }>
 */
const PortalRequestForm = ({ availableTags, onSubmit }) => {
  const [requestText, setRequestText] = useState('');
  const [categoryTag, setCategoryTag] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { classification }

  const validate = () => {
    const errs = {};
    if (!requestText.trim()) errs.requestText = 'Please describe your request';
    else if (requestText.trim().length < 10) errs.requestText = 'Please write at least 10 characters';
    else if (requestText.trim().length > 2000) errs.requestText = 'Maximum 2000 characters';
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
      const res = await onSubmit({
        requestText: requestText.trim(),
        categoryTag: categoryTag.trim() || undefined,
      });
      setResult(res);
      setRequestText('');
      setCategoryTag('');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to submit request';
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const classificationMeta = {
    in_scope: {
      icon: '✅',
      title: 'In Scope',
      color: 'success',
      msg: 'This request falls within the agreed project scope — no extra charge.',
    },
    possible_extra: {
      icon: '⚠️',
      title: 'Possible Extra',
      color: 'warning',
      msg: "This looks like it may be out of scope. Your freelancer will review and contact you if a change order is needed.",
    },
    unclear: {
      icon: '🔍',
      title: 'Needs Clarification',
      color: 'info',
      msg: "Your freelancer will review this request and clarify whether it's in scope.",
    },
  };

  if (result) {
    const meta = classificationMeta[result.classification] || classificationMeta.unclear;
    return (
      <div className={`portal-result portal-result--${meta.color}`} role="status" aria-live="polite">
        <span className="portal-result-icon" aria-hidden="true">{meta.icon}</span>
        <div>
          <p className="portal-result-title">{meta.title}</p>
          <p className="portal-result-msg">{meta.msg}</p>
        </div>
        <button
          id="submit-another-btn"
          className="btn btn-ghost btn-sm"
          onClick={() => setResult(null)}
          style={{ marginTop: '0.75rem', alignSelf: 'flex-start' }}
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  const charsLeft = 2000 - requestText.length;

  return (
    <form onSubmit={handleSubmit} noValidate className="portal-request-form">
      {/* Request text */}
      <div className="form-group">
        <label htmlFor="portal-request-text" className="form-label">
          Describe your request <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="portal-request-text"
          className={`form-input form-textarea portal-textarea${errors.requestText ? ' input-error' : ''}`}
          value={requestText}
          onChange={(e) => setRequestText(e.target.value)}
          placeholder="Please be as specific as possible — what do you need? Why? How should it look or work?"
          rows={5}
          maxLength={2000}
          aria-required="true"
          aria-describedby={errors.requestText ? 'req-text-err' : 'req-text-hint'}
        />
        <div className="portal-textarea-footer">
          <span id="req-text-hint" className="form-hint">Be specific so your freelancer can classify this accurately</span>
          <span className={`char-counter${charsLeft < 100 ? ' char-counter--warn' : ''}`} aria-live="polite">
            {charsLeft} left
          </span>
        </div>
        <InlineError id="req-text-err" message={errors.requestText} />
      </div>

      {/* Category tag (optional) */}
      {availableTags.length > 0 && (
        <div className="form-group">
          <label htmlFor="portal-category-tag" className="form-label">
            Category <span className="form-label-optional">(optional — helps with classification)</span>
          </label>
          <select
            id="portal-category-tag"
            className="form-input portal-select"
            value={categoryTag}
            onChange={(e) => setCategoryTag(e.target.value)}
          >
            <option value="">— Not sure / not specified —</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      )}

      {apiError && (
        <p role="alert" className="form-api-error">{apiError}</p>
      )}

      <button
        id="portal-submit-btn"
        type="submit"
        className="btn btn-primary"
        disabled={submitting}
      >
        {submitting ? 'Submitting…' : 'Submit Request'}
      </button>
    </form>
  );
};

export default PortalRequestForm;
