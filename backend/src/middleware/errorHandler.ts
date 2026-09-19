import { Request, Response, NextFunction } from 'express';

export function notFound(req: Request, res: Response) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Centralized error handler — keeps controllers free of try/catch boilerplate via asyncHandler.
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Email is already registered' });
  }

  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
}

export function asyncHandler(fn: (...args: any[]) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
