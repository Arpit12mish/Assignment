import { Response } from 'express';
import { Task } from '../models/Task';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { sortTasksSmart } from '../utils/sortTasks';

// GET /api/tasks — every query is scoped to `owner: req.userId` (set by the auth
// middleware from the JWT), so one user can never see or filter another's tasks.
// `sort` picks between the bonus mixed-urgency algorithm (default) and two plain sorts.
export const listTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, priority, category, sort } = req.query as Record<string, string | undefined>;

  const filter: Record<string, unknown> = { owner: req.userId };
  if (status === 'completed') filter.completed = true;
  if (status === 'pending') filter.completed = false;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;

  let tasks = await Task.find(filter);

  if (sort === 'smart' || !sort) {
    // Blends deadline, scheduled time and priority into one score — see utils/sortTasks.ts.
    tasks = sortTasksSmart(tasks as any) as any;
  } else if (sort === 'deadline') {
    tasks = tasks.sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  } else if (sort === 'priority') {
    const weight = { high: 3, medium: 2, low: 1 } as const;
    tasks = tasks.sort((a, b) => weight[b.priority] - weight[a.priority]);
  }

  res.json({ tasks });
});

export const createTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, description, dateTime, deadline, priority, category } = req.body;

  if (!title || !dateTime || !deadline) {
    return res.status(400).json({ message: 'title, dateTime and deadline are required' });
  }

  const task = await Task.create({
    title,
    description,
    dateTime,
    deadline,
    priority,
    category,
    owner: req.userId,
  });

  res.status(201).json({ task });
});

// PUT /api/tasks/:id — the `owner` clause in the filter (not just the `_id`) is what
// stops one user from editing another user's task by guessing/reusing an id.
export const updateTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, owner: req.userId },
    req.body,
    { new: true, runValidators: true },
  );
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json({ task });
});

export const toggleComplete = asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await Task.findOne({ _id: req.params.id, owner: req.userId });
  if (!task) return res.status(404).json({ message: 'Task not found' });

  task.completed = !task.completed;
  await task.save();
  res.json({ task });
});

export const deleteTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.userId });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json({ message: 'Task deleted' });
});
