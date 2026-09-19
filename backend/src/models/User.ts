import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type AuthProvider = 'local' | 'google';

export interface UserDocument extends Document {
  email: string;
  password?: string;
  name?: string;
  authProvider: AuthProvider;
  googleId?: string;
  // True once the user has completed (or skipped) the post-signup onboarding flow.
  // Server-side rather than an on-device flag so it stays correct across reinstalls
  // and a second device, and so RootNavigator can gate purely on the user object.
  onboarded: boolean;
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  // Absent for Google-only accounts — required() below only applies to 'local' users,
  // enforced in the register controller rather than a Mongoose validator so the error
  // message can stay specific to the registration form.
  password: { type: String, minlength: 6 },
  name: { type: String, trim: true },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  // Google's stable per-user subject id ('sub' claim) — used to look up an existing
  // Google-linked account without depending on email matching exactly.
  googleId: { type: String, unique: true, sparse: true },
  onboarded: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Hashes the plaintext password before it's ever written to Mongo. The isModified guard
// matters for updates: without it, saving a user for an unrelated change would re-hash
// the already-hashed password and break their login. Google-only accounts have no
// password to hash, so this is a no-op for them.
userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// bcrypt.compare re-hashes the candidate with the stored hash's salt and does a
// constant-time comparison — this is the only place a plaintext password is checked.
// Google-only accounts have no password hash, so they can never match here (as intended
// — they must sign in via /api/auth/google).
userSchema.methods.comparePassword = function (candidate: string) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

// Never leak the password hash in API responses.
userSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.password;
    delete ret.googleId;
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const User = model<UserDocument>('User', userSchema);
