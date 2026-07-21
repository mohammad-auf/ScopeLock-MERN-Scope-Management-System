import React from 'react';

/**
 * Loader — full-page or inline spinner
 * Props:
 *   fullPage  boolean  wrap in a full viewport overlay (default false)
 *   size      'sm'|'md'|'lg'  (default 'md')
 *   label     string   accessible label (default 'Loading…')
 */
const Loader = ({ fullPage = false, size = 'md', label = 'Loading…' }) => {
  const sizeMap = { sm: 20, md: 40, lg: 64 };
  const px = sizeMap[size] || 40;

  const spinner = (
    <span
      role="status"
      aria-label={label}
      style={{
        display: 'inline-block',
        width: px,
        height: px,
        border: `${Math.max(3, px / 10)}px solid var(--color-border)`,
        borderTopColor: 'var(--color-accent)',
        borderRadius: '50%',
        animation: 'sl-spin 0.75s linear infinite',
      }}
    />
  );

  if (fullPage) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg)',
          zIndex: 9999,
        }}
      >
        {spinner}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
      {spinner}
    </div>
  );
};

export default Loader;
