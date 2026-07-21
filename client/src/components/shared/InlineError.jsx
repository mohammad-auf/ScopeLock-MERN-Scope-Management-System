import React from 'react';

/**
 * InlineError — displays a validation error message directly beneath a field
 * Props:
 *   message  string|null  Error text. Renders nothing when falsy.
 *   id       string       Used as the element id so the input can aria-describedby this
 */
const InlineError = ({ message, id }) => {
  if (!message) return null;
  return (
    <span
      id={id}
      role="alert"
      aria-live="polite"
      style={{
        display: 'block',
        color: 'var(--color-danger)',
        fontSize: '0.78rem',
        marginTop: '0.25rem',
      }}
    >
      {message}
    </span>
  );
};

export default InlineError;
