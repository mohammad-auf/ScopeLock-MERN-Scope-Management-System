import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import Navbar from '../components/shared/Navbar';
import Loader from '../components/shared/Loader';
import ScopeBuilder from './ScopeBuilder';
import RequestsList from '../components/changeOrders/RequestsList';
import ChangeOrdersList from '../components/changeOrders/ChangeOrdersList';
import FreelancerTimeline from '../components/changeOrders/FreelancerTimeline';

const TABS = [
  { id: 'scope', label: 'Scope' },
  { id: 'requests', label: 'Requests' },
  { id: 'change-orders', label: 'Change Orders' },
  { id: 'timeline', label: 'Timeline' },
];

/**
 * ProjectDetail — tabbed project page
 * Route: /projects/:id  (protected)
 */
const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('scope');
  const [coRefreshKey, setCoRefreshKey] = useState(0);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // ─── Fetch project ──────────────────────────────────────────────────────────
  const fetchProject = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await projectsAPI.getOne(id);
      setProject(data.project);
    } catch (err) {
      if (err.response?.status === 404) setError('Project not found');
      else if (err.response?.status === 403) setError('You do not have access to this project');
      else setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const handleCopyPortal = () => {
    const url = `${window.location.origin}/portal/${project.portalToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) return <><Navbar /><Loader fullPage /></>;

  if (error) {
    return (
      <>
        <Navbar />
        <main className="page-container">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>← Dashboard</button>
          <div className="error-banner" role="alert" style={{ marginTop: '1.5rem' }}>
            <p>{error}</p>
            <button className="btn btn-ghost btn-sm" onClick={fetchProject}>Retry</button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="page-container" aria-label="Project detail">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="page-header">
          <div>
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginBottom: '0.5rem' }}
              onClick={() => navigate('/dashboard')}
              aria-label="Back to dashboard"
            >
              ← Dashboard
            </button>
            <h1 className="page-title">{project.title}</h1>
            <p className="page-subtitle">Client: {project.clientName}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            {/* Status badge */}
            <span className={`badge ${project.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
              {project.status}
            </span>

            {/* Portal link copy */}
            <button
              id="copy-portal-link-btn"
              className="btn btn-ghost btn-sm"
              onClick={handleCopyPortal}
              aria-label="Copy client portal link"
            >
              {copied ? '✓ Copied!' : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy Client Portal Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Project summary bar ─────────────────────────────────────── */}
        <div className="project-summary-bar">
          <div className="project-summary-item">
            <span className="summary-label">Hourly Rate</span>
            <span className="summary-value">${project.hourlyRate?.toLocaleString()}/hr</span>
          </div>
          <div className="project-summary-item">
            <span className="summary-label">Extra Hours Approved</span>
            <span className="summary-value">{(project.totalHours || 0).toFixed(1)} h</span>
          </div>
          <div className="project-summary-item">
            <span className="summary-label">Extra Cost Approved</span>
            <span className="summary-value accent">${(project.totalPrice || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <div
          className="project-tabs"
          role="tablist"
          aria-label="Project sections"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              className={`project-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab panels ──────────────────────────────────────────────── */}
        <div className="project-tab-panel" role="tabpanel" id="panel-scope" aria-labelledby="tab-scope" hidden={activeTab !== 'scope'}>
          <ScopeBuilder
            projectId={id}
            project={project}
            onProjectUpdate={(updated) => setProject(updated)}
          />
        </div>

        <div className="project-tab-panel" role="tabpanel" id="panel-requests" aria-labelledby="tab-requests" hidden={activeTab !== 'requests'}>
          <RequestsList 
            projectId={id} 
            project={project} 
            onGenerateChangeOrder={() => {
              setActiveTab('change-orders');
              setCoRefreshKey(prev => prev + 1);
            }} 
          />
        </div>

        <div className="project-tab-panel" role="tabpanel" id="panel-change-orders" aria-labelledby="tab-change-orders" hidden={activeTab !== 'change-orders'}>
          <ChangeOrdersList projectId={id} project={project} refreshKey={coRefreshKey} />
        </div>

        <div className="project-tab-panel" role="tabpanel" id="panel-timeline" aria-labelledby="tab-timeline" hidden={activeTab !== 'timeline'}>
          <FreelancerTimeline projectId={id} />
        </div>

      </main>
    </>
  );
};

export default ProjectDetail;

