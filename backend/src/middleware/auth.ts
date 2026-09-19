import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, AuthPayload } from '../types';

// Gatekeeper for every /api/tasks route (mounted via `router.use(requireAuth)` in
// taskRoutes.ts): verifies the JWT the client sends as `Authorization: Bearer <token>`
// and, on success, attaches the decoded user id to the request so downstream
// controllers can scope every query to `owner: req.userId` without re-checking auth.
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as AuthPayload;
    req.userId = payload.userId;
    next();
  } catch {
    // Covers both a tampered/invalid signature and a naturally expired token.
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
