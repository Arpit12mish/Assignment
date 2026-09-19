import { Response } from 'express';
import { Task } from '../models/Task';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { parseTaskFromTranscript, resolveDateTimeFromTranscript } from '../services/geminiTaskParser';

// POST /api/ai/parse-task — the voice "add task" flow's core: turns a speech transcript
// into structured task fields via Gemini. Category suggestions are grounded in the
// user's own existing categories (fetched fresh here, not passed by the client) so a
// spoken "work" reliably matches an existing "Work" category instead of drifting.
export const parseTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { transcript } = req.body;
  if (!transcript || typeof transcript !== 'string') {
    return res.status(400).json({ message: 'transcript is required' });
  }

  const categories = await Task.distinct('category', { owner: req.userId });
  const parsed = await parseTaskFromTranscript(transcript, new Date(), categories as string[]);
  res.json({ parsed });
});

// POST /api/ai/resolve-datetime — the lighter follow-up used when the user speaks just
// the missing date/time piece (e.g. "tomorrow at 5pm") instead of the whole task again.
export const resolveDateTime = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { transcript } = req.body;
  if (!transcript || typeof transcript !== 'string') {
    return res.status(400).json({ message: 'transcript is required' });
  }

  const dateTime = await resolveDateTimeFromTranscript(transcript, new Date());
  res.json({ dateTime });
});
