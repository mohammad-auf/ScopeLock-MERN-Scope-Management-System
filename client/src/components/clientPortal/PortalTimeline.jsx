import React from 'react';

/**
 * PortalTimeline — simple visual timeline showing original scope + approved extras.
 * Props:
 *   timeline   array of { type, title, hours, price, tag, date }
 *   project    { title, clientName, status, totalHours, totalPrice }
 */
const PortalTimeline = ({ timeline, project }) => {
  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const formatCurrency = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

  if (!timeline || timeline.length === 0) {
    return (
      <div className="portal-timeline-empty">
        <p>No scope items or approved change orders yet.</p>
      </div>
    );
  }

  return (
    <div className="portal-timeline">
      {/* Summary */}
      <div className="portal-timeline-summary">
        <div className="portal-summary-item">
          <span className="portal-summary-num">{(project.totalHours || 0).toFixed(1)}</span>
          <span className="portal-summary-label">Extra Hours Approved</span>
        </div>
        <div className="portal-summary-item">
          <span className="portal-summary-num accent">{formatCurrency(project.totalPrice)}</span>
          <span className="portal-summary-label">Extra Cost Approved</span>
        </div>
      </div>

      {/* Timeline items */}
      <ol className="portal-timeline-list" aria-label="Project scope timeline">
        {timeline.map((item, idx) => (
          <li
            key={item._id || idx}
            className={`portal-timeline-item portal-timeline-item--${item.type}`}
          >
            <div className="portal-timeline-dot" aria-hidden="true">
              {item.type === 'scope_item' ? '📌' : '➕'}
            </div>
            <div className="portal-timeline-content">
              <div className="portal-timeline-header">
                <span className="portal-timeline-title">{item.title}</span>
                {item.tag && <span className="scope-tag">{item.tag}</span>}
                {item.type === 'change_order' && (
                  <span className="badge badge-success">Approved Extra</span>
                )}
              </div>
              <div className="portal-timeline-meta">
                <span>{item.hours} h</span>
                {item.price && <span className="portal-co-price">{formatCurrency(item.price)}</span>}
                <span className="portal-timeline-date">{formatDate(item.date)}</span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default PortalTimeline;
