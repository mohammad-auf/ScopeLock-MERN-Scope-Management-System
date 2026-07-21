import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationsAPI } from '../../services/api';

/**
 * Navbar — top navigation bar for authenticated freelancer pages
 */
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);

  // Fetch notifications on mount and every 30s
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { data } = await notificationsAPI.getAll();
        setNotifications(data.notifications || []);
      } catch {
        // Non-critical — silently fail
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/dashboard" className="navbar-logo" aria-label="ScopeLock dashboard">
          <span className="logo-icon">🔒</span>
          <span className="logo-text">ScopeLock</span>
        </Link>

        {/* Right side */}
        <div className="navbar-actions">
          {/* Notification Bell */}
          <div className="notif-wrapper" ref={notifRef}>
            <button
              id="notif-bell-btn"
              className="notif-bell"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              aria-expanded={showNotifDropdown}
              aria-haspopup="true"
              onClick={() => setShowNotifDropdown((v) => !v)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="notif-badge" aria-hidden="true">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="notif-dropdown" role="region" aria-label="Notifications">
                <div className="notif-dropdown-header">
                  <span>Notifications</span>
                </div>
                {notifications.length === 0 ? (
                  <p className="notif-empty">No notifications yet</p>
                ) : (
                  <ul className="notif-list">
                    {notifications.slice(0, 10).map((n) => (
                      <li
                        key={n._id}
                        className={`notif-item${n.isRead ? ' read' : ''}`}
                      >
                        <span className="notif-msg">{n.message}</span>
                        {!n.isRead && (
                          <button
                            className="notif-mark-read"
                            onClick={() => handleMarkRead(n._id)}
                            aria-label="Mark as read"
                          >
                            ✓
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* User menu */}
          <span className="navbar-user" aria-label={`Signed in as ${user?.name}`}>
            {user?.name?.charAt(0).toUpperCase()}
          </span>

          <button
            id="logout-btn"
            className="btn btn-ghost btn-sm"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
