import { apiClient } from './client';
import { NewTaskInput, Task, TaskFilter, TaskSort } from '../types';

interface ListParams {
  status?: TaskFilter;
  sort?: TaskSort;
  priority?: string;
}

export function fetchTasks(params: ListParams = {}) {
  const query: Record<string, string> = {};
  if (params.status && params.status !== 'all') query.status = params.status;
  if (params.sort) query.sort = params.sort;
  if (params.priority) query.priority = params.priority;

  return apiClient.get<{ tasks: Task[] }>('/tasks', { params: query }).then(res => res.data.tasks);
}

export function createTaskRequest(input: NewTaskInput) {
  return apiClient.post<{ task: Task }>('/tasks', input).then(res => res.data.task);
}

export function updateTaskRequest(id: string, input: Partial<NewTaskInput>) {
  return apiClient.put<{ task: Task }>(`/tasks/${id}`, input).then(res => res.data.task);
}

export function toggleTaskCompleteRequest(id: string) {
  return apiClient.patch<{ task: Task }>(`/tasks/${id}/complete`).then(res => res.data.task);
}

export function deleteTaskRequest(id: string) {
  return apiClient.delete<{ message: string }>(`/tasks/${id}`).then(res => res.data);
}
