import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

/**
 * Modal — accessible dialog overlay
 * Props:
 *   isOpen    boolean
 *   onClose   fn
 *   title     string
 *   children  ReactNode
 *   maxWidth  string  (CSS value, default '480px')
 */
const Modal = ({ isOpen, onClose, title, children, maxWidth = '480px' }) => {
  const dialogRef = useRef(null);

  // Trap focus and close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.activeElement;
    dialogRef.current?.focus();

    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      prev?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          width: '100%',
          maxWidth,
          outline: 'none',
          boxShadow: 'var(--shadow-xl)',
          animation: 'sl-modal-in 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 id="modal-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              fontSize: '1.4rem',
              lineHeight: 1,
              padding: '0.25rem',
              borderRadius: 'var(--radius-sm)',
              transition: 'color 0.15s',
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
