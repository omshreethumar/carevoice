class AppError extends Error {
  constructor(message, statusCode = 400, code = 'BAD_REQUEST') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, code: err.code },
    });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: { message: 'A record with this value already exists.', code: 'DUPLICATE' },
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: { message: 'Record not found.', code: 'NOT_FOUND' },
    });
  }

  if (err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large. Maximum size is 5MB.'
        : 'Invalid file upload.';
    return res.status(400).json({
      success: false,
      error: { message, code: 'INVALID_FILE' },
    });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    error: {
      message: 'Something went wrong. Please try again.',
      code: 'INTERNAL_ERROR',
    },
  });
}

function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: { message: 'Route not found.', code: 'NOT_FOUND' },
  });
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { AppError, errorHandler, notFound, asyncHandler };
