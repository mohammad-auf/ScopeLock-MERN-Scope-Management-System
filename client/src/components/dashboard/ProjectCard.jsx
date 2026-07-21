import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * StatusBadge — small colored pill for project/CO status
 */
const StatusBadge = ({ status }) => {
  const map = {
    active: { label: 'Active', cls: 'badge-success' },
    paused: { label: 'Paused', cls: 'badge-warning' },
    draft: { label: 'Draft', cls: 'badge-neutral' },
    sent: { label: 'Sent', cls: 'badge-info' },
    approved: { label: 'Approved', cls: 'badge-success' },
    declined: { label: 'Declined', cls: 'badge-danger' },
    in_scope: { label: 'In Scope', cls: 'badge-success' },
    possible_extra: { label: 'Extra', cls: 'badge-warning' },
    unclear: { label: 'Unclear', cls: 'badge-info' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'badge-neutral' };
  return <span className={`badge ${cls}`}>{label}</span>;
};

/**
 * ProjectCard — single project summary card shown on the Dashboard
 */
const ProjectCard = ({ project, onDelete }) => {
  const navigate = useNavigate();

  const formatCurrency = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handleCardClick = () => navigate(`/projects/${project._id}`);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(project._id, project.title);
  };

  const portalUrl = `${window.location.origin}/portal/${project.portalToken}`;

  const handleCopyPortal = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(portalUrl).catch(() => {});
  };

  return (
    <article
      className="project-card"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-label={`Open project ${project.title}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
    >
      {/* Header */}
      <div className="project-card-header">
        <div>
          <h3 className="project-card-title">{project.title}</h3>
          <p className="project-card-client">{project.clientName}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Stats */}
      <div className="project-card-stats">
        <div className="stat">
          <span className="stat-label">Total Extras</span>
          <span className="stat-value accent">{formatCurrency(project.totalPrice)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Extra Hours</span>
          <span className="stat-value">{(project.totalHours || 0).toFixed(1)} h</span>
        </div>
        <div className="stat">
          <span className="stat-label">Created</span>
          <span className="stat-value">{formatDate(project.createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="project-card-actions">
        <button
          id={`copy-portal-${project._id}`}
          className="btn btn-ghost btn-sm"
          onClick={handleCopyPortal}
          aria-label={`Copy client portal link for ${project.title}`}
          title="Copy client portal link"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy Portal Link
        </button>
        <button
          id={`delete-project-${project._id}`}
          className="btn btn-danger-ghost btn-sm"
          onClick={handleDeleteClick}
          aria-label={`Delete project ${project.title}`}
        >
          Delete
        </button>
      </div>
    </article>
  );
};

export { StatusBadge, ProjectCard };
export default ProjectCard;
