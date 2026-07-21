import React, { useState, useEffect, useCallback } from 'react';
import { scopeAPI, projectsAPI } from '../services/api';
import Loader from '../components/shared/Loader';
import Modal from '../components/shared/Modal';
import AddScopeItemForm from '../components/scopeBuilder/AddScopeItemForm';
import ScopeItemRow from '../components/scopeBuilder/ScopeItemRow';

/**
 * ScopeBuilder — manage scope items for a project and set hourly rate.
 *
 * Props (passed from ProjectDetail via embedded usage):
 *   projectId   string
 *   project     object   — current project data
 *   onProjectUpdate (updatedProject) => void   — notifies parent of hourly rate change
 */
const ScopeBuilder = ({ projectId, project, onProjectUpdate }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, title }
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Hourly rate inline edit
  const [editingRate, setEditingRate] = useState(false);
  const [rateValue, setRateValue] = useState(String(project?.hourlyRate || ''));
  const [rateError, setRateError] = useState('');
  const [rateSaving, setRateSaving] = useState(false);

  // ─── Fetch scope items ─────────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await scopeAPI.getAll(projectId);
      setItems(data.scopeItems || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load scope items');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // ─── Add item ──────────────────────────────────────────────────────────────
  const handleAdd = async (formData) => {
    const { data } = await scopeAPI.create(projectId, formData);
    setItems((prev) => [...prev, data.scopeItem]);
  };

  // ─── Update item ───────────────────────────────────────────────────────────
  const handleUpdate = async (id, formData) => {
    const { data } = await scopeAPI.update(id, formData);
    setItems((prev) => prev.map((it) => (it._id === id ? data.scopeItem : it)));
  };

  // ─── Delete item ───────────────────────────────────────────────────────────
  const promptDelete = (id, title) => {
    setDeleteError('');
    setDeleteTarget({ id, title });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await scopeAPI.remove(deleteTarget.id);
      setItems((prev) => prev.filter((it) => it._id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to delete scope item';
      setDeleteError(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Hourly rate update ────────────────────────────────────────────────────
  const handleRateSave = async () => {
    const rate = Number(rateValue);
    if (isNaN(rate) || rate <= 0 || rate > 100000) {
      setRateError('Enter a valid rate (0.01 – 100,000)');
      return;
    }
    setRateError('');
    setRateSaving(true);
    try {
      const { data } = await projectsAPI.update(projectId, { hourlyRate: rate });
      onProjectUpdate(data.project);
      setEditingRate(false);
    } catch (err) {
      setRateError(err.response?.data?.error?.message || 'Failed to update rate');
    } finally {
      setRateSaving(false);
    }
  };

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const totalScopeHours = items.reduce((s, it) => s + it.estimatedHours, 0);
  const uniqueTags = [...new Set(items.map((it) => it.categoryTag))];
  const existingTags = uniqueTags;

  return (
    <div className="scope-builder">
      {/* ── Header bar with hourly rate ─────────────────────────────────── */}
      <div className="scope-builder-header">
        <div className="scope-builder-stats">
          <div className="scope-stat">
            <span className="scope-stat-num">{items.length}</span>
            <span className="scope-stat-label">Items</span>
          </div>
          <div className="scope-stat">
            <span className="scope-stat-num">{totalScopeHours.toFixed(1)}</span>
            <span className="scope-stat-label">Total Hours</span>
          </div>
          <div className="scope-stat">
            <span className="scope-stat-num">{uniqueTags.length}</span>
            <span className="scope-stat-label">Tags</span>
          </div>
        </div>

        {/* Hourly rate */}
        <div className="hourly-rate-block">
          <span className="hourly-rate-label">Hourly Rate</span>
          {editingRate ? (
            <div className="hourly-rate-edit">
              <span className="hourly-rate-prefix">$</span>
              <input
                id="hourly-rate-input"
                type="number"
                className={`form-input hourly-rate-input${rateError ? ' input-error' : ''}`}
                value={rateValue}
                onChange={(e) => setRateValue(e.target.value)}
                min={0.01}
                max={100000}
                step={1}
                aria-label="Hourly rate in USD"
                aria-describedby={rateError ? 'rate-err' : undefined}
                autoFocus
              />
              {rateError && <span id="rate-err" role="alert" className="hourly-rate-err">{rateError}</span>}
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditingRate(false); setRateError(''); setRateValue(String(project?.hourlyRate || '')); }} disabled={rateSaving}>Cancel</button>
              <button id="save-rate-btn" className="btn btn-primary btn-sm" onClick={handleRateSave} disabled={rateSaving}>
                {rateSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          ) : (
            <div className="hourly-rate-display">
              <span className="hourly-rate-value">${project?.hourlyRate?.toLocaleString()}/hr</span>
              <button
                id="edit-rate-btn"
                className="btn btn-ghost btn-sm"
                onClick={() => setEditingRate(true)}
                aria-label="Edit hourly rate"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Tag legend ──────────────────────────────────────────────────── */}
      {uniqueTags.length > 0 && (
        <div className="tag-legend" aria-label="Category tags in use">
          {uniqueTags.map((tag) => (
            <span key={tag} className="scope-tag">{tag}</span>
          ))}
        </div>
      )}

      {/* ── Add form ────────────────────────────────────────────────────── */}
      <AddScopeItemForm onAdd={handleAdd} existingTags={existingTags} />

      {/* ── Scope item list ─────────────────────────────────────────────── */}
      {loading ? (
        <Loader />
      ) : error ? (
        <div className="error-banner" role="alert">
          <p>{error}</p>
          <button className="btn btn-ghost btn-sm" onClick={fetchItems}>Retry</button>
        </div>
      ) : items.length === 0 ? (
        <div className="scope-empty">
          <p className="scope-empty-text">No scope items yet. Add your first item above to start locking this project's scope.</p>
        </div>
      ) : (
        <ul className="scope-item-list" aria-label="Scope items">
          {items.map((item) => (
            <ScopeItemRow
              key={item._id}
              item={item}
              onUpdate={handleUpdate}
              onDelete={promptDelete}
              isDeletable={true} // BR6 enforced server-side; error shown via delete modal
            />
          ))}
        </ul>
      )}

      {/* ── Delete confirmation modal ─────────────────────────────────── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Scope Item"
      >
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          Are you sure you want to delete <strong style={{ color: 'var(--color-text)' }}>"{deleteTarget?.title}"</strong>?
          This cannot be undone.
        </p>
        {deleteError && (
          <p role="alert" className="form-api-error">{deleteError}</p>
        )}
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>Cancel</button>
          <button
            id="confirm-delete-scope-btn"
            className="btn btn-danger"
            onClick={handleDeleteConfirm}
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ScopeBuilder;
