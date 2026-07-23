import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { changeOrdersAPI } from '../services/api';
import Loader from '../components/shared/Loader';

/**
 * ChangeOrderReview — dedicated page for reviewing and editing a draft change order.
 *
 * Route: /projects/:id/change-orders/:coId/review
 *
 * UX is identical to the inline edit form that previously existed inside
 * ChangeOrdersList.jsx. Extracted here to give the review a dedicated URL.
 */
const ChangeOrderReview = () => {
  const { id: projectId, coId } = useParams();
  const navigate = useNavigate();

  const [co, setCo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editData, setEditData] = useState({ description: '', estimatedHours: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [sending, setSending] = useState(false);

  const fetchChangeOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await changeOrdersAPI.getOne(coId);
      setCo(data.changeOrder);
      setEditData({
        description: data.changeOrder.description,
        estimatedHours: data.changeOrder.estimatedHours,
      });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load change order');
    } finally {
      setLoading(false);
    }
  }, [coId]);

  useEffect(() => {
    fetchChangeOrder();
  }, [fetchChangeOrder]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveError('');
      await changeOrdersAPI.update(coId, {
        description: editData.description,
        estimatedHours: Number(editData.estimatedHours),
      });
      // Refresh to show the updated data
      await fetchChangeOrder();
    } catch (err) {
      setSaveError(err.response?.data?.error?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!window.confirm('Send this change order to the client for approval? Once sent, it cannot be edited.')) return;
    try {
      setSending(true);
      setSaveError('');
      await changeOrdersAPI.send(coId);
      // Navigate back to the project after sending
      navigate(`/projects/${projectId}`);
    } catch (err) {
      setSaveError(err.response?.data?.error?.message || 'Failed to send change order');
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => navigate(`/projects/${projectId}`);

  // ─── Render states ────────────────────────────────────────────────────────
  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="error-banner">{error}</div>
        <button className="btn btn-ghost" onClick={handleBack} style={{ marginTop: '1rem' }}>
          ← Back to Project
        </button>
      </div>
    );
  }

  const isDraft = co?.status === 'draft';

  return (
    <div className="page-wrapper">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          id="back-to-project-btn"
          className="btn btn-ghost btn-sm"
          onClick={handleBack}
        >
          ← Back
        </button>
        <h1 className="section-title" style={{ margin: 0 }}>Change Order Review</h1>
        <span
          className={`badge ${
            co.status === 'draft' ? 'badge-neutral' :
            co.status === 'sent' ? 'badge-primary' :
            co.status === 'approved' ? 'badge-success' : 'badge-danger'
          }`}
        >
          {co.status.toUpperCase()}
        </span>
        {co.isBlocking && <span className="badge badge-warning">BLOCKING</span>}
      </div>

      {/* ── Price summary ────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>Price</p>
        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>${co.price?.toLocaleString()}</p>
      </div>

      {saveError && (
        <div className="error-banner" style={{ marginBottom: '1rem' }}>{saveError}</div>
      )}

      {/* ── Edit form (draft only) ───────────────────────────────────────── */}
      {isDraft ? (
        <div className="card">
          <h2 className="section-title" style={{ marginBottom: '1rem' }}>Edit Details</h2>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label" htmlFor="co-description">Description</label>
              <textarea
                id="co-description"
                className="form-input"
                required
                rows={5}
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="co-hours">Estimated Hours</label>
              <input
                id="co-hours"
                type="number"
                className="form-input"
                step="0.1"
                min="0.1"
                max="500"
                required
                value={editData.estimatedHours}
                onChange={(e) => setEditData({ ...editData, estimatedHours: e.target.value })}
                style={{ maxWidth: '200px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                id="save-co-btn"
                type="submit"
                className="btn btn-ghost"
                disabled={saving || sending}
              >
                {saving ? 'Saving…' : '💾 Save Changes'}
              </button>

              <button
                id="send-co-btn"
                type="button"
                className="btn btn-primary"
                onClick={handleSend}
                disabled={saving || sending}
              >
                {sending ? 'Sending…' : '📤 Send to Client'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ── Read-only view (sent / approved / declined) ────────────────── */
        <div className="card">
          <h2 className="section-title" style={{ marginBottom: '1rem' }}>Details</h2>
          <div className="form-group">
            <label className="form-label">Description</label>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{co.description}</p>
          </div>
          <div className="form-group">
            <label className="form-label">Estimated Hours</label>
            <p>{co.estimatedHours}h</p>
          </div>
          {co.resolvedAt && (
            <div className="form-group">
              <label className="form-label">Resolved</label>
              <p>{new Date(co.resolvedAt).toLocaleDateString()}</p>
            </div>
          )}
          <p className="text-muted" style={{ fontSize: '0.85rem', fontStyle: 'italic', marginTop: '1rem' }}>
            {co.status === 'sent' && 'Waiting for client response — this order cannot be edited.'}
            {co.status === 'approved' && 'This change order was approved by the client.'}
            {co.status === 'declined' && 'This change order was declined by the client.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ChangeOrderReview;
