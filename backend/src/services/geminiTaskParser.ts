import { GoogleGenAI, Type } from '@google/genai';
import { Priority } from '../types';

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// The MODEL_NAME can be swapped for a newer/cheaper Gemini model without touching the
// parsing logic below — it's the only place a model id is hardcoded.
const MODEL_NAME = 'gemini-3.6-flash';

export type MissingField = 'title' | 'dateTime' | 'deadline';

export interface ParsedTask {
  title: string | null;
  description: string | null;
  category: string | null;
  priority: Priority;
  dateTime: string | null;
  deadline: string | null;
  missing: MissingField[];
}

// Forces Gemini's response into exactly this shape — no prompt-engineering-and-hope-it's-
// valid-JSON, no markdown fences to strip. See https://ai.google.dev/gemini-api/docs/structured-output.
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, nullable: true },
    description: { type: Type.STRING, nullable: true },
    category: { type: Type.STRING, nullable: true },
    priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
    dateTime: { type: Type.STRING, nullable: true },
    deadline: { type: Type.STRING, nullable: true },
    missing: {
      type: Type.ARRAY,
      items: { type: Type.STRING, enum: ['title', 'dateTime', 'deadline'] },
    },
  },
  required: ['title', 'description', 'category', 'priority', 'dateTime', 'deadline', 'missing'],
};

// Parses a spoken (transcribed) task description into structured fields. `now` and
// `categories` are given as context so Gemini can resolve relative expressions
// ("tomorrow at 5", "in two hours") and reuse the user's existing category names
// instead of inventing near-duplicates.
export async function parseTaskFromTranscript(
  transcript: string,
  now: Date,
  categories: string[],
): Promise<ParsedTask> {
  const prompt = `You extract a to-do task's fields from something a user said out loud.

Current date/time (ISO 8601, use this to resolve relative expressions like "tomorrow" or "in an hour"): ${now.toISOString()}
User's existing task categories (reuse one of these if it fits; otherwise suggest a short new one, or null): ${JSON.stringify(categories)}

What the user said: "${transcript}"

Rules:
- title: a short, clear task title. Required — if the transcript doesn't describe an actual
  actionable task (e.g. it's silence, noise, or unrelated chatter), set title to null and
  include "title" in missing.
- description: any extra detail beyond the title, or null if there isn't any.
- category: best-guess category, or null if unclear.
- priority: infer from words like "urgent"/"asap"/"important" (high), "whenever"/"no rush"/
  "low priority" (low); default to "medium" when not indicated. Never null.
- dateTime: when the task should be worked on/started, as an ISO 8601 datetime, or null if
  not mentioned or not inferable.
- deadline: when the task is due, as an ISO 8601 datetime, or null if not mentioned.
  If the user gives only ONE date/time for the whole task, treat it as the deadline and
  leave dateTime null.
- missing: list which of "title", "dateTime", "deadline" you could NOT determine from the
  transcript at all (not even approximately). Only include a field here if it is truly
  absent from what was said — do not include "title" just because the title is short.`;

  const response = await client.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Gemini returned an empty response');
  return JSON.parse(text) as ParsedTask;
}

// The lighter-weight follow-up call used when the user speaks just the missing piece
// (e.g. "tomorrow at 5pm") rather than re-describing the whole task. Reuses the same
// prompt style scoped to a single date/time expression instead of a full task.
export async function resolveDateTimeFromTranscript(
  transcript: string,
  now: Date,
): Promise<string | null> {
  const prompt = `Resolve the date/time the user is describing into an ISO 8601 datetime.

Current date/time (use this to resolve relative expressions): ${now.toISOString()}
What the user said: "${transcript}"

Respond with only the resolved ISO 8601 datetime, or null if no date/time can be determined.`;

  const response = await client.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: { dateTime: { type: Type.STRING, nullable: true } },
        required: ['dateTime'],
      },
    },
  });

  const text = response.text;
  if (!text) return null;
  const parsed = JSON.parse(text) as { dateTime: string | null };
  return parsed.dateTime;
}
