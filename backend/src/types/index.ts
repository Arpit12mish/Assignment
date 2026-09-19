import { Request } from 'express';

export type Priority = 'low' | 'medium' | 'high';

export interface AuthPayload {
  userId: string;
}

// Extends Express' Request with the authenticated user id, set by the auth middleware.
export interface AuthRequest extends Request {
  userId?: string;
}
