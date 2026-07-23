import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { portalAPI } from '../services/api';
import Loader from '../components/shared/Loader';
import PortalRequestForm from '../components/clientPortal/PortalRequestForm';
import PortalChangeOrderCard from '../components/clientPortal/PortalChangeOrderCard';
import PortalTimeline from '../components/clientPortal/PortalTimeline';

const PORTAL_TABS = [
  { id: 'request', label: 'Submit a Request' },
  { id: 'change-orders', label: 'Change Orders' },
  { id: 'timeline', label: 'Scope Timeline' },
];

/**
 * ClientPortal — public page served at /portal/:token
 * No JWT, no login — authenticated via the unique portal token only.
 */
const ClientPortal = () => {
  const { token } = useParams();
  const [activeTab, setActiveTab] = useState('request');

  // Project info
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tags for the request form dropdown
  const [tags, setTags] = useState([]);

  // Change orders + timeline (lazy-loaded per tab)
  const [changeOrders, setChangeOrders] = useState([]);
  const [coLoading, setCoLoading] = useState(false);
  const [coLoaded, setCoLoaded] = useState(false);
  const [coError, setCoError] = useState('');

  const [timeline, setTimeline] = useState([]);
  const [timelineProject, setTimelineProject] = useState(null);
  const [tlLoading, setTlLoading] = useState(false);
  const [tlError, setTlError] = useState('');

  // ─── Fetch project info on mount ────────────────────────────────────────────
  const fetchProject = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [projRes, tagsRes] = await Promise.all([
        portalAPI.getProject(token),
        portalAPI.getTags(token),
      ]);
      setProject(projRes.data.project);
      setTags(tagsRes.data.tags || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('This portal link is invalid or has expired. Please contact your freelancer.');
      } else {
        setError('Failed to load portal. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  // ─── Lazy-load change orders ─────────────────────────────────────────────
  const fetchChangeOrders = useCallback(async () => {
    setCoLoading(true);
    setCoError('');
    try {
      const { data } = await portalAPI.getChangeOrders(token);
      setChangeOrders(data.changeOrders || []);
      setCoLoaded(true);
    } catch (err) {
      setCoError('Failed to load change orders. Please try again.');
    } finally {
      setCoLoading(false);
    }
  }, [token]);

  // ─── Lazy-load timeline ──────────────────────────────────────────────────
  const fetchTimeline = useCallback(async () => {
    setTlLoading(true);
    setTlError('');
    try {
      const { data } = await portalAPI.getTimeline(token);
      setTimeline(data.timeline || []);
      setTimelineProject(data.project);
    } catch (err) {
      setTlError('Failed to load timeline. Please try again.');
    } finally {
      setTlLoading(false);
    }
  }, [token]);

  // Load tab data when switching
  useEffect(() => {
    if (activeTab === 'change-orders' && !coLoaded && !coLoading) {
      fetchChangeOrders();
    }
    if (activeTab === 'timeline' && timeline.length === 0 && !tlLoading) {
      fetchTimeline();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ─── Request submission ──────────────────────────────────────────────────
  const handleSubmitRequest = async (data) => {
    const res = await portalAPI.submitRequest(token, data);
    return res.data.clientRequest;
  };

  // ─── Change order decisions ───────────────────────────────────────────────
  const handleApprove = async (id) => {
    await portalAPI.approveChangeOrder(token, id);
    // Refresh project totals after approval
    const { data } = await portalAPI.getProject(token);
    setProject(data.project);
    fetchChangeOrders();
  };

  const handleDecline = async (id) => {
    await portalAPI.declineChangeOrder(token, id);
    fetchChangeOrders();
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading) return <div className="portal-loading"><Loader /></div>;

  if (error) {
    return (
      <main className="portal-page" aria-label="Client portal error">
        <div className="portal-error">
          <div className="portal-error-icon" aria-hidden="true">🔒</div>
          <h1 className="portal-error-title">Portal Unavailable</h1>
          <p className="portal-error-msg">{error}</p>
        </div>
      </main>
    );
  }

  const pendingCOCount = changeOrders.filter((co) => co.status === 'sent').length;

  return (
    <main className="portal-page" aria-label={`Client portal for ${project?.title}`}>
      {/* ── Portal Header ────────────────────────────────────────────────── */}
      <header className="portal-header">
        <div className="portal-header-inner">
          <div className="portal-logo">
            <span className="logo-icon" aria-hidden="true">🔒</span>
            <span className="portal-logo-text">ScopeLock</span>
          </div>
          <div className="portal-project-info">
            <h1 className="portal-project-title">{project.title}</h1>
            <p className="portal-project-client">for {project.clientName}</p>
          </div>
          <div className={`portal-status-pill badge ${project.status === 'active' ? 'badge-success' : 'badge-warning'}`} role="status">
            {project.status === 'active' ? '🟢 Active' : '⏸ Paused'}
          </div>
        </div>
      </header>

      <div className="portal-body">
        {/* ── Tab bar ─────────────────────────────────────────────────── */}
        <nav
          className="portal-tabs"
          role="tablist"
          aria-label="Portal sections"
        >
          {PORTAL_TABS.map((tab) => (
            <button
              key={tab.id}
              id={`portal-tab-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`portal-panel-${tab.id}`}
              className={`portal-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.id === 'change-orders' && activeTab !== 'change-orders' && pendingCOCount > 0 && (
                <span className="portal-tab-badge" aria-label={`${pendingCOCount} pending`}>
                  {pendingCOCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* ── Tab panels ──────────────────────────────────────────────── */}

        {/* Submit a Request */}
        <div
          id="portal-panel-request"
          role="tabpanel"
          aria-labelledby="portal-tab-request"
          className="portal-panel"
          hidden={activeTab !== 'request'}
        >
          <div className="portal-panel-header">
            <h2 className="portal-panel-title">Submit a Request</h2>
            <p className="portal-panel-subtitle">
              Describe what you'd like — your freelancer will classify it and respond accordingly.
            </p>
          </div>
          <PortalRequestForm
            availableTags={tags}
            onSubmit={handleSubmitRequest}
          />
        </div>

        {/* Change Orders */}
        <div
          id="portal-panel-change-orders"
          role="tabpanel"
          aria-labelledby="portal-tab-change-orders"
          className="portal-panel"
          hidden={activeTab !== 'change-orders'}
        >
          <div className="portal-panel-header">
            <h2 className="portal-panel-title">Change Orders</h2>
            <p className="portal-panel-subtitle">
              Review and respond to change orders from your freelancer.
            </p>
          </div>

          {coLoading ? (
            <Loader />
          ) : coError ? (
            <div className="error-banner" role="alert">
              <p>{coError}</p>
              <button className="btn btn-ghost btn-sm" onClick={fetchChangeOrders}>Retry</button>
            </div>
          ) : changeOrders.length === 0 ? (
            <div className="portal-empty">
              <div className="portal-empty-icon" aria-hidden="true">📋</div>
              <p className="portal-empty-text">No change orders yet.</p>
              <p className="portal-empty-sub">When your freelancer creates a change order, it will appear here for your review.</p>
            </div>
          ) : (
            <div className="portal-co-list">
              {changeOrders.map((co) => (
                <PortalChangeOrderCard
                  key={co._id}
                  co={co}
                  onApprove={handleApprove}
                  onDecline={handleDecline}
                />
              ))}
            </div>
          )}
        </div>

        {/* Scope Timeline */}
        <div
          id="portal-panel-timeline"
          role="tabpanel"
          aria-labelledby="portal-tab-timeline"
          className="portal-panel"
          hidden={activeTab !== 'timeline'}
        >
          <div className="portal-panel-header">
            <h2 className="portal-panel-title">Scope Timeline</h2>
            <p className="portal-panel-subtitle">
              Original scope items and all approved change orders, in chronological order.
            </p>
          </div>

          {tlLoading ? (
            <Loader />
          ) : tlError ? (
            <div className="error-banner" role="alert">
              <p>{tlError}</p>
              <button className="btn btn-ghost btn-sm" onClick={fetchTimeline}>Retry</button>
            </div>
          ) : (
            <PortalTimeline timeline={timeline} project={timelineProject || project} />
          )}
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="portal-footer" aria-label="Portal footer">
        <p>Secured by <strong>ScopeLock</strong> · This link is unique to your project.</p>
      </footer>
    </main>
  );
};

export default ClientPortal;
