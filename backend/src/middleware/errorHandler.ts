import { Request, Response, NextFunction } from 'express';

// Custom error class for API errors
export class APIError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Database error handler
export function handleDatabaseError(error: any): APIError {
  // SQLite error codes
  if (error.code === 'SQLITE_CONSTRAINT') {
    if (error.message.includes('UNIQUE')) {
      return new APIError('Resource already exists', 409);
    }
    if (error.message.includes('FOREIGN KEY')) {
      return new APIError('Referenced resource does not exist', 400);
    }
    return new APIError('Database constraint violation', 400);
  }

  if (error.code === 'SQLITE_BUSY') {
    return new APIError('Database is busy, please try again', 503);
  }

  console.error('Database error:', error);
  return new APIError('Database operation failed', 500);
}

// General error handler middleware
export function errorHandler(
  error: Error | APIError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let isOperational = false;

  if (error instanceof APIError) {
    statusCode = error.statusCode;
    message = error.message;
    isOperational = error.isOperational;
  } else if (error.name === 'ValidationError') {
    // Joi validation error
    statusCode = 400;
    message = 'Validation failed';
    isOperational = true;
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    isOperational = true;
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    isOperational = true;
  }

  // Log error for debugging (only operational errors in production)
  if (!isOperational) {
    console.error('Unexpected error:', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  } else {
    console.warn('Operational error:', {
      error: error.message,
      url: req.url,
      method: req.method,
      statusCode
    });
  }

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const errorResponse: any = {
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path
  };

  if (isDevelopment && !isOperational) {
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
}

// 404 handler for undefined routes
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new APIError(`Route ${req.originalUrl} not found`, 404);
  next(error);
}

// Async error wrapper for route handlers
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}