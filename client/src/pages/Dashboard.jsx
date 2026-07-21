import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectsAPI } from '../services/api';
import Navbar from '../components/shared/Navbar';
import Loader from '../components/shared/Loader';
import Modal from '../components/shared/Modal';
import ProjectCard from '../components/dashboard/ProjectCard';
import NewProjectForm from '../components/dashboard/NewProjectForm';

/**
 * Dashboard — lists all freelancer projects
 * Route: /dashboard  (protected)
 */
const Dashboard = () => {
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New project modal
  const [modalOpen, setModalOpen] = useState(false);
  const [createError, setCreateError] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, title }
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ─── Fetch projects ───────────────────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await projectsAPI.getAll();
      setProjects(data.projects || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // ─── Create project ───────────────────────────────────────────────────────
  const handleCreate = async (formData) => {
    setCreateError('');
    try {
      const { data } = await projectsAPI.create(formData);
      setProjects((prev) => [data.project, ...prev]);
      setModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to create project';
      setCreateError(msg);
      throw err; // Keep form in submitting=false state via NewProjectForm's finally
    }
  };

  // ─── Delete project ───────────────────────────────────────────────────────
  const promptDelete = (id, title) => setDeleteTarget({ id, title });

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await projectsAPI.remove(deleteTarget.id);
      setProjects((prev) => prev.filter((p) => p._id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete project');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Empty state ─────────────────────────────────────────────────────────
  const EmptyState = () => (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">📁</div>
      <h2 className="empty-title">No projects yet</h2>
      <p className="empty-desc">
        Create your first project to start locking scope and managing change orders.
      </p>
      <button
        id="empty-new-project-btn"
        className="btn btn-primary"
        onClick={() => setModalOpen(true)}
      >
        + New Project
      </button>
    </div>
  );

  return (
    <>
      <Navbar />
      <main className="page-container" aria-label="Dashboard">
        {/* Page header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="page-subtitle">
              {projects.length > 0
                ? `You have ${projects.length} project${projects.length !== 1 ? 's' : ''}`
                : 'Get started by creating your first project'}
            </p>
          </div>
          {projects.length > 0 && (
            <button
              id="new-project-btn"
              className="btn btn-primary"
              onClick={() => { setCreateError(''); setModalOpen(true); }}
            >
              + New Project
            </button>
          )}
        </div>

        {/* Summary stats bar */}
        {projects.length > 0 && (
          <div className="stats-bar" role="region" aria-label="Summary statistics">
            <div className="stats-item">
              <span className="stats-num">{projects.length}</span>
              <span className="stats-label">Projects</span>
            </div>
            <div className="stats-item">
              <span className="stats-num">
                {projects.filter((p) => p.status === 'active').length}
              </span>
              <span className="stats-label">Active</span>
            </div>
            <div className="stats-item">
              <span className="stats-num">
                {projects.filter((p) => p.status === 'paused').length}
              </span>
              <span className="stats-label">Paused</span>
            </div>
            <div className="stats-item">
              <span className="stats-num accent">
                $
                {projects
                  .reduce((sum, p) => sum + (p.totalPrice || 0), 0)
                  .toLocaleString()}
              </span>
              <span className="stats-label">Total Extras Billed</span>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <Loader />
        ) : error ? (
          <div className="error-banner" role="alert">
            <p>{error}</p>
            <button className="btn btn-ghost btn-sm" onClick={fetchProjects}>
              Retry
            </button>
          </div>
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="project-grid" role="list" aria-label="Your projects">
            {projects.map((project) => (
              <div key={project._id} role="listitem">
                <ProjectCard project={project} onDelete={promptDelete} />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── New Project Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Project"
      >
        <NewProjectForm
          onSubmit={handleCreate}
          onCancel={() => setModalOpen(false)}
          apiError={createError}
        />
      </Modal>

      {/* ── Delete Confirmation Modal ──────────────────────────────────────── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Project"
      >
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          Are you sure you want to delete <strong style={{ color: 'var(--color-text)' }}>{deleteTarget?.title}</strong>?
          This will also delete all scope items, requests, and change orders. This action cannot be undone.
        </p>
        <div className="form-actions">
          <button
            className="btn btn-ghost"
            onClick={() => setDeleteTarget(null)}
            disabled={deleteLoading}
          >
            Cancel
          </button>
          <button
            id="confirm-delete-btn"
            className="btn btn-danger"
            onClick={handleDeleteConfirm}
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting…' : 'Delete Project'}
          </button>
        </div>
      </Modal>
    </>
  );
};

export default Dashboard;
