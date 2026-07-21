import React, { useState, useEffect, useCallback } from 'react';
import { timelineAPI } from '../../services/api';
import Loader from '../shared/Loader';

const FreelancerTimeline = ({ projectId }) => {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await timelineAPI.get(projectId);
      setTimeline(data.timeline);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch timeline');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  if (loading) return <Loader />;
  if (error) return <div className="error-banner">{error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 className="section-title">Scope Timeline</h2>
        <button className="btn btn-ghost btn-sm" onClick={fetchTimeline}>Refresh</button>
      </div>

      {timeline.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">📅</div>
          <p className="empty-desc">Timeline is empty.</p>
        </div>
      ) : (
        <div className="timeline-container" style={{ position: 'relative', paddingLeft: '1rem' }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '1.4rem', width: '2px', backgroundColor: 'var(--border-color)', zIndex: 0 }}></div>
          {timeline.map((event, index) => (
            <div key={event._id} style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
              <div style={{ 
                width: '1rem', height: '1rem', borderRadius: '50%', flexShrink: 0, 
                backgroundColor: event.type === 'scope_item' ? 'var(--primary-color)' : 'var(--success-color)',
                marginTop: '0.25rem', border: '3px solid var(--bg-color)'
              }}></div>
              
              <div className="card" style={{ flex: 1, padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`badge ${event.type === 'scope_item' ? 'badge-primary' : 'badge-success'}`}>
                      {event.type === 'scope_item' ? 'ORIGINAL SCOPE' : 'APPROVED CHANGE ORDER'}
                    </span>
                    {event.tag && <span className="badge badge-neutral">Tag: {event.tag}</span>}
                  </div>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                    {new Date(event.date).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{event.title}</h3>
                {event.description && <p style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>{event.description}</p>}
                
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <span>⏱ {event.hours} hours</span>
                  {event.price !== null && <span>💰 ${event.price.toLocaleString()}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FreelancerTimeline;
