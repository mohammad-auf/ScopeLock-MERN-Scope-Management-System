import React, { useState, useEffect, useCallback } from 'react';
import { requestsAPI } from '../../services/api';
import Loader from '../shared/Loader';

const RequestsList = ({ projectId, project, onGenerateChangeOrder }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await requestsAPI.getAll(projectId);
      setRequests(data.requests);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [coData, setCoData] = useState({ description: '', estimatedHours: '', isBlocking: false });
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openModal = (req) => {
    setSelectedRequest(req);
    setCoData({ description: req.requestText, estimatedHours: '', isBlocking: false });
    setSubmitError('');
    setModalOpen(true);
  };

  const handleCreateCO = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      const { data } = await requestsAPI.createChangeOrder(selectedRequest._id, {
        description: coData.description,
        estimatedHours: Number(coData.estimatedHours),
        isBlocking: coData.isBlocking,
      });
      setModalOpen(false);
      fetchRequests(); // Refresh list to show CO linked
      if (onGenerateChangeOrder) {
        onGenerateChangeOrder(data.changeOrder);
      }
    } catch (err) {
      setSubmitError(err.response?.data?.error?.message || 'Failed to create Change Order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="error-banner">{error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="section-title">Client Requests</h2>
        <button className="btn btn-ghost btn-sm" onClick={fetchRequests}>Refresh</button>
      </div>

      {requests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">📬</div>
          <p className="empty-desc">No requests from the client yet.</p>
        </div>
      ) : (
        <div className="card-grid">
          {requests.map((req) => (
            <div key={req._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className={`badge ${req.classification === 'in_scope' ? 'badge-success' : req.classification === 'possible_extra' ? 'badge-warning' : 'badge-neutral'}`}>
                  {req.classification}
                </span>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                  {new Date(req.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p style={{ margin: '1rem 0' }}>{req.requestText}</p>
              {req.categoryTag && (
                <div style={{ marginBottom: '1rem' }}>
                  <span className="badge badge-neutral">Tag: {req.categoryTag}</span>
                </div>
              )}
              
              <div style={{ marginTop: 'auto' }}>
                {req.changeOrderId ? (
                  <span className="badge badge-success">Change Order Generated</span>
                ) : (
                  req.classification !== 'in_scope' && (
                    <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => openModal(req)}>
                      Generate Change Order
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && selectedRequest && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h2 className="modal-title">Generate Change Order</h2>
            {submitError && <div className="error-banner">{submitError}</div>}
            
            <form onSubmit={handleCreateCO}>
              <div className="form-group">
                <label className="form-label" htmlFor="co-description">Description</label>
                <textarea
                  id="co-description"
                  className="form-input"
                  required
                  value={coData.description}
                  onChange={(e) => setCoData({ ...coData, description: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="co-hours">Estimated Hours</label>
                <input
                  id="co-hours"
                  className="form-input"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="500"
                  required
                  value={coData.estimatedHours}
                  onChange={(e) => setCoData({ ...coData, estimatedHours: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={coData.isBlocking}
                    onChange={(e) => setCoData({ ...coData, isBlocking: e.target.checked })}
                  />
                  <span className="form-label" style={{ marginBottom: 0 }}>Mark as Blocking Change Order</span>
                </label>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Blocking change orders will pause the project until approved or declined.
                </p>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Generating...' : 'Generate Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsList;
