import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

// Same Web Client ID the mobile app passes to GoogleSignin.configure() — Google requires
// verifying an ID token against the exact client id it was issued for.
const googleClient = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);

// Issues a JWT carrying only the user id — the token is the client's proof of identity
// on every subsequent request (see middleware/auth.ts), so it must never embed the password.
function signToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
}

// POST /api/auth/register — creates the account and immediately logs the user in
// (returns a token) so the mobile app can skip a separate login step after sign-up.
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  // Checked explicitly (rather than relying on the unique index error) so we can
  // return a clear 409 instead of a generic Mongo duplicate-key error.
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: 'Email is already registered' });
  }

  // Password hashing happens in User's pre('save') hook — this file never sees the hash.
  const user = await User.create({ email, password, name });
  const token = signToken(user.id);

  res.status(201).json({ token, user });
});

// POST /api/auth/login — verifies credentials and issues a fresh token.
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  // A Google-only account has no password to check — tell the user to use the Google
  // button instead of a generic failure, since this isn't an enumeration risk (they
  // already have to know the email to hit this branch).
  if (user && user.authProvider === 'google' && !user.password) {
    return res.status(401).json({ message: 'This email uses Google sign-in — tap "Continue with Google" instead' });
  }
  // Same error message whether the email is unknown or the password is wrong,
  // so a failed login can't be used to enumerate registered emails.
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = signToken(user.id);
  res.json({ token, user });
});

// POST /api/auth/google — exchanges a Google ID token (obtained on-device via the
// native Google Sign-In SDK) for our own JWT. Verifying the token server-side means we
// never trust the client's claim of who signed in — Google's library checks the
// signature, audience (our Web Client ID) and expiry.
export const googleAuth = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ message: 'idToken is required' });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_WEB_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ message: 'Invalid Google token' });
  }

  if (!payload?.email || !payload.email_verified) {
    return res.status(401).json({ message: 'Google account has no verified email' });
  }

  let user = await User.findOne({ googleId: payload.sub });
  if (!user) {
    // Falls back to matching by email so someone who registered with a password first
    // and later taps "Continue with Google" gets linked to their existing account
    // instead of ending up with two separate accounts for the same email.
    user = await User.findOne({ email: payload.email.toLowerCase() });
    if (user) {
      user.googleId = payload.sub;
      await user.save();
    } else {
      user = await User.create({
        email: payload.email,
        name: payload.name,
        authProvider: 'google',
        googleId: payload.sub,
      });
    }
  }

  const token = signToken(user.id);
  res.json({ token, user });
});

// GET /api/auth/me — lets the app re-fetch the current user's profile using only the
// stored token, e.g. to refresh their name/email after a session was restored from disk.
export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
});

// PUT /api/auth/me — a partial update of the current user's profile. Used by onboarding:
// the "what's your name?" step sends { name }, and the final step sends { onboarded: true }
// once the user finishes or skips the flow, so RootNavigator stops routing them there.
export const updateMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, onboarded } = req.body;
  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (onboarded !== undefined) update.onboarded = onboarded;

  const user = await User.findByIdAndUpdate(req.userId, update, {
    new: true,
    runValidators: true,
  });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
});
