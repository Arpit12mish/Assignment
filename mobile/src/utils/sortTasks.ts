import { Priority, Task, TaskSort } from '../types';

// Mirrors the backend's mixed urgency algorithm (backend/src/utils/sortTasks.ts) so the
// list can be re-sorted instantly on the client after an optimistic update, without a
// round trip. Lower score = more urgent.
const PRIORITY_BOOST_HOURS: Record<Priority, number> = {
  high: 30,
  medium: 10,
  low: 0,
};

const HOUR_MS = 1000 * 60 * 60;

export function urgencyScore(task: Task, now: Date = new Date()): number {
  const hoursToDeadline = (new Date(task.deadline).getTime() - now.getTime()) / HOUR_MS;
  const hoursToStart = (new Date(task.dateTime).getTime() - now.getTime()) / HOUR_MS;
  const blendedHours = hoursToDeadline * 0.7 + hoursToStart * 0.3;
  return blendedHours - PRIORITY_BOOST_HOURS[task.priority];
}

// All three sort modes keep completed tasks pinned to the bottom — only the
// ordering *within* the pending/completed groups changes.
export function sortTasksSmart(tasks: Task[]): Task[] {
  const now = new Date();
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return urgencyScore(a, now) - urgencyScore(b, now);
  });
}

function sortTasksByDeadline(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
}

const PRIORITY_WEIGHT: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

function sortTasksByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
  });
}

// Single entry point the UI/slice call so switching sort mode (and re-sorting after
// every optimistic update) doesn't need a chain of if/else at every call site.
export function sortTasksBy(mode: TaskSort, tasks: Task[]): Task[] {
  if (mode === 'deadline') return sortTasksByDeadline(tasks);
  if (mode === 'priority') return sortTasksByPriority(tasks);
  return sortTasksSmart(tasks);
}

export function isOverdue(task: Task): boolean {
  return !task.completed && new Date(task.deadline).getTime() < Date.now();
}
