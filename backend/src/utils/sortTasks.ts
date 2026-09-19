import { Priority } from '../types';

export interface Sortable {
  dateTime: Date | string;
  deadline: Date | string;
  priority: Priority;
  completed: boolean;
}

// How many hours "earlier" each priority level makes a deadline feel — the core of the
// mixed sort: a high-priority task competes with a low-priority one that's genuinely
// closer to its deadline, instead of priority or deadline alone deciding the order.
const PRIORITY_BOOST_HOURS: Record<Priority, number> = {
  high: 30,
  medium: 10,
  low: 0,
};

const HOUR_MS = 1000 * 60 * 60;

/**
 * Computes a single "urgency score" (lower = more urgent) for a task by blending:
 *  - hours remaining until the deadline (weighted 70%)
 *  - hours remaining until the scheduled start dateTime (weighted 30%)
 *  - a priority boost that shifts the effective deadline earlier
 * Overdue tasks naturally sort first since their hours-remaining is negative.
 */
export function urgencyScore(task: Sortable, now: Date = new Date()): number {
  const hoursToDeadline = (new Date(task.deadline).getTime() - now.getTime()) / HOUR_MS;
  const hoursToStart = (new Date(task.dateTime).getTime() - now.getTime()) / HOUR_MS;
  const blendedHours = hoursToDeadline * 0.7 + hoursToStart * 0.3;
  return blendedHours - PRIORITY_BOOST_HOURS[task.priority];
}

/** Sorts tasks by urgency (smart mix of deadline, scheduled time, and priority). Incomplete tasks always precede completed ones. */
export function sortTasksSmart<T extends Sortable>(tasks: T[]): T[] {
  const now = new Date();
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return urgencyScore(a, now) - urgencyScore(b, now);
  });
}
