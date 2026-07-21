/**
 * Global error handler — always returns the standard error envelope:
 * { "error": { "code": "STRING_CODE", "message": "human readable" } }
 *
 * Must be registered LAST with app.use() in server.js.
 */
const errorHandler = (err, req, res, next) => {
  // Log full details server-side (never expose stack to client)
  console.error(`[ERROR] ${err.code || 'SERVER_ERROR'}: ${err.message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors)
      .map((e) => e.message)
      .join('; ');
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: messages },
    });
  }

  // Mongoose duplicate key (e.g. unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: `${field} already exists`,
      },
    });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Resource not found' },
    });
  }

  // Custom application errors (thrown with err.status + err.code)
  if (err.status && err.appCode) {
    return res.status(err.status).json({
      error: { code: err.appCode, message: err.message },
    });
  }

  // Fallback — 500 without stack trace exposure
  return res.status(500).json({
    error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' },
  });
};

module.exports = errorHandler;
