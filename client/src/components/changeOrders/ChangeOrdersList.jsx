import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { changeOrdersAPI } from '../../services/api';
import Loader from '../shared/Loader';

const ChangeOrdersList = ({ projectId, project, refreshKey }) => {
  const navigate = useNavigate();
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
  }, [fetchChangeOrders, refreshKey]);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Navigate to the dedicated review/edit page for a draft CO
  const handleEditClick = (co) => {
    navigate(`/projects/${projectId}/change-orders/${co._id}/review`);
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

              <p style={{ margin: '1rem 0' }}>{co.description}</p>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                Estimated Hours: {co.estimatedHours}h
              </p>

              {co.status === 'draft' && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '1rem' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => handleEditClick(co)}
                    disabled={actionLoading}
                  >
                    Review / Edit
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--danger-color)' }}
                    onClick={async () => {
                      if (!window.confirm('Are you sure you want to delete this draft change order?')) return;
                      try {
                        setActionLoading(true);
                        setActionError('');
                        await changeOrdersAPI.remove(co._id);
                        fetchChangeOrders();
                      } catch (err) {
                        setActionError(err.response?.data?.error?.message || 'Failed to delete change order');
                      } finally {
                        setActionLoading(false);
                      }
                    }}
                    disabled={actionLoading}
                  >
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChangeOrdersList;
