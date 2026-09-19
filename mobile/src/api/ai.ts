import { apiClient } from './client';
import { ParsedTask } from '../types';

export function parseTaskFromTranscript(transcript: string) {
  return apiClient
    .post<{ parsed: ParsedTask }>('/ai/parse-task', { transcript })
    .then(res => res.data.parsed);
}

export function resolveDateTimeFromTranscript(transcript: string) {
  return apiClient
    .post<{ dateTime: string | null }>('/ai/resolve-datetime', { transcript })
    .then(res => res.data.dateTime);
}
