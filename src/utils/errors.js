/**
 * Custom error classes for the application
 */

export class AppError extends Error {
  constructor(message, code = 'INTERNAL_ERROR', statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

export class AuthError extends AppError {
  constructor(message, code = 'AUTH_ERROR') {
    super(message, code, 401);
  }
}

export class ValidationError extends AppError {
  constructor(message, code = 'VALIDATION_ERROR') {
    super(message, code, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message, code = 'NOT_FOUND') {
    super(message, code, 404);
  }
}

/**
 * Error handler middleware for Express
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code
    });
  }

  // Handle unknown errors
  return res.status(500).json({
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR'
  });
};

/**
 * Async handler wrapper to avoid try/catch blocks in routes
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
}; 