import React, { useState, useEffect, useCallback } from 'react';
import { changeOrdersAPI } from '../../services/api';
import Loader from '../shared/Loader';

const ChangeOrdersList = ({ projectId, project }) => {
  const [changeOrders, setChangeOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchChangeOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await changeOrdersAPI.getAll(projectId);
      setChangeOrders(data.changeOrders);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch change orders');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchChangeOrders();
  }, [fetchChangeOrders]);

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ description: '', estimatedHours: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const handleEditClick = (co) => {
    setEditingId(co._id);
    setEditData({ description: co.description, estimatedHours: co.estimatedHours });
    setActionError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setActionError('');
  };

  const handleSaveEdit = async (id) => {
    try {
      setActionLoading(true);
      setActionError('');
      await changeOrdersAPI.update(id, {
        description: editData.description,
        estimatedHours: Number(editData.estimatedHours),
      });
      setEditingId(null);
      fetchChangeOrders();
    } catch (err) {
      setActionError(err.response?.data?.error?.message || 'Failed to update change order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSend = async (id) => {
    if (!window.confirm('Send this change order to the client for approval? Once sent, it cannot be edited.')) return;
    try {
      setActionLoading(true);
      setActionError('');
      await changeOrdersAPI.send(id);
      fetchChangeOrders();
    } catch (err) {
      setActionError(err.response?.data?.error?.message || 'Failed to send change order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this draft change order?')) return;
    try {
      setActionLoading(true);
      setActionError('');
      // In api.js, remove is not defined in changeOrdersAPI, let's fix api.js or use axios directly.
      // Wait, api.js might not have remove. I need to add it, but for now I'll use changeOrdersAPI if it exists.
      // Ah, I need to check if changeOrdersAPI has remove. Let's assume I need to add it to api.js.
      // Wait, I can use an inline axios call or just add it to api.js later. I will add it to api.js.
      // Actually, I'll update api.js in a separate step.
      await changeOrdersAPI.remove(id);
      fetchChangeOrders();
    } catch (err) {
      setActionError(err.response?.data?.error?.message || 'Failed to delete change order');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="error-banner">{error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="section-title">Change Orders</h2>
        <button className="btn btn-ghost btn-sm" onClick={fetchChangeOrders}>Refresh</button>
      </div>

      {actionError && <div className="error-banner" style={{ marginBottom: '1rem' }}>{actionError}</div>}

      {changeOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">📋</div>
          <p className="empty-desc">No change orders generated yet.</p>
        </div>
      ) : (
        <div className="card-grid">
          {changeOrders.map((co) => (
            <div key={co._id} className="card" style={{ border: co.isBlocking ? '2px solid var(--warning-color)' : '' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`badge ${
                    co.status === 'draft' ? 'badge-neutral' :
                    co.status === 'sent' ? 'badge-primary' :
                    co.status === 'approved' ? 'badge-success' : 'badge-danger'
                  }`}>
                    {co.status.toUpperCase()}
                  </span>
                  {co.isBlocking && <span className="badge badge-warning">BLOCKING</span>}
                </div>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                  ${co.price?.toLocaleString()}
                </span>
              </div>

              {editingId === co._id ? (
                <div style={{ margin: '1rem 0' }}>
                  <textarea
                    className="form-input"
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows="3"
                    style={{ marginBottom: '0.5rem' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label>Hours:</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editData.estimatedHours}
                      onChange={(e) => setEditData({ ...editData, estimatedHours: e.target.value })}
                      style={{ width: '100px' }}
                      step="0.1"
                      min="0.1"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => handleSaveEdit(co._id)} disabled={actionLoading}>
                      Save
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={handleCancelEdit} disabled={actionLoading}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p style={{ margin: '1rem 0' }}>{co.description}</p>
                  <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                    Estimated Hours: {co.estimatedHours}h
                  </p>
                  
                  {co.status === 'draft' && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '1rem' }}>
                      <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleSend(co._id)} disabled={actionLoading}>
                        Send to Client
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleEditClick(co)} disabled={actionLoading}>
                        Edit
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-color)' }} onClick={() => handleDelete(co._id)} disabled={actionLoading}>
                        Delete
                      </button>
                    </div>
                  )}
                  {co.status === 'declined' && (
                    <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                       <p className="text-muted" style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>
                         This change order was declined by the client.
                       </p>
                    </div>
                  )}
                  {co.status === 'approved' && (
                    <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                       <p className="text-muted" style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>
                         This change order was approved on {new Date(co.resolvedAt || co.updatedAt).toLocaleDateString()}.
                       </p>
                    </div>
                  )}
                  {co.status === 'sent' && (
                    <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                       <p className="text-muted" style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>
                         Waiting for client response...
                       </p>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChangeOrdersList;
