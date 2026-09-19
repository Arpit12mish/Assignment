export type Priority = 'low' | 'medium' | 'high';

export type AuthProvider = 'local' | 'google';

export interface User {
  id: string;
  email: string;
  name?: string;
  authProvider: AuthProvider;
  onboarded: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dateTime: string;
  deadline: string;
  priority: Priority;
  category?: string;
  completed: boolean;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewTaskInput {
  title: string;
  description?: string;
  dateTime: string;
  deadline: string;
  priority: Priority;
  category?: string;
}

export type TaskFilter = 'all' | 'pending' | 'completed';
export type TaskSort = 'smart' | 'deadline' | 'priority';

export type MissingField = 'title' | 'dateTime' | 'deadline';

// What POST /api/ai/parse-task returns — Gemini's best-effort extraction of task fields
// from a spoken transcript, plus which required fields it couldn't determine at all.
export interface ParsedTask {
  title: string | null;
  description: string | null;
  category: string | null;
  priority: Priority;
  dateTime: string | null;
  deadline: string | null;
  missing: MissingField[];
}
