import React, { useState } from 'react';

/**
 * PortalChangeOrderCard — a single pending change order shown to the client.
 *
 * Props:
 *   co          ChangeOrder object
 *   onApprove   (id) => Promise<void>
 *   onDecline   (id) => Promise<void>
 */
const PortalChangeOrderCard = ({ co, onApprove, onDecline }) => {
  const [loading, setLoading] = useState(null); // 'approve' | 'decline' | null
  const [resolved, setResolved] = useState(false);
  const [decision, setDecision] = useState(null); // 'approved' | 'declined'
  const [error, setError] = useState('');

  const handleDecision = async (action) => {
    setLoading(action);
    setError('');
    try {
      if (action === 'approve') {
        await onApprove(co._id);
        setDecision('approved');
      } else {
        await onDecline(co._id);
        setDecision('declined');
      }
      setResolved(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || `Failed to ${action} change order`);
    } finally {
      setLoading(null);
    }
  };

  if (resolved) {
    return (
      <div className={`portal-co-card portal-co-card--${decision}`} role="status" aria-live="polite">
        <span className="portal-co-resolved-icon" aria-hidden="true">
          {decision === 'approved' ? '✅' : '❌'}
        </span>
        <div>
          <p className="portal-co-resolved-title">
            Change order <strong>{decision}</strong>
          </p>
          <p className="portal-co-desc">{co.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`portal-co-card${co.isBlocking ? ' portal-co-card--blocking' : ''}`}>
      {co.isBlocking && (
        <div className="portal-co-blocking-banner" role="alert">
          ⚠️ This change order must be resolved before work can continue
        </div>
      )}

      <div className="portal-co-header">
        <h3 className="portal-co-title">{co.description}</h3>
        <span className="portal-co-meta">
          Submitted {new Date(co.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      <div className="portal-co-details">
        <div className="portal-co-detail">
          <span className="portal-co-detail-label">Additional Hours</span>
          <span className="portal-co-detail-value">{co.estimatedHours} h</span>
        </div>
        <div className="portal-co-detail">
          <span className="portal-co-detail-label">Additional Cost</span>
          <span className="portal-co-detail-value portal-co-price">
            ${Number(co.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {error && <p role="alert" className="form-api-error" style={{ margin: '0.75rem 0 0' }}>{error}</p>}

      <div className="portal-co-actions">
        <button
          id={`decline-co-${co._id}`}
          className="btn btn-ghost"
          onClick={() => handleDecision('decline')}
          disabled={loading !== null}
          aria-label="Decline this change order"
        >
          {loading === 'decline' ? 'Declining…' : 'Decline'}
        </button>
        <button
          id={`approve-co-${co._id}`}
          className="btn btn-primary"
          onClick={() => handleDecision('approve')}
          disabled={loading !== null}
          aria-label="Approve this change order"
        >
          {loading === 'approve' ? 'Approving…' : 'Approve Change Order'}
        </button>
      </div>
    </div>
  );
};

export default PortalChangeOrderCard;
