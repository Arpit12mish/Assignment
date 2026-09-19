import { apiClient } from './client';
import { User } from '../types';

interface AuthResponse {
  token: string;
  user: User;
}

export function registerRequest(email: string, password: string) {
  return apiClient.post<AuthResponse>('/auth/register', { email, password }).then(res => res.data);
}

export function loginRequest(email: string, password: string) {
  return apiClient.post<AuthResponse>('/auth/login', { email, password }).then(res => res.data);
}

export function googleAuthRequest(idToken: string) {
  return apiClient.post<AuthResponse>('/auth/google', { idToken }).then(res => res.data);
}

export function meRequest() {
  return apiClient.get<{ user: User }>('/auth/me').then(res => res.data.user);
}

export function updateProfileRequest(update: { name?: string; onboarded?: boolean }) {
  return apiClient.put<{ user: User }>('/auth/me', update).then(res => res.data.user);
}
