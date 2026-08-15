import {
  UserProfile,
  CheckinSubmission,
  Intervention,
  WeeklyInsights,
  WhatChangedData,
  CampusMetrics
} from './types';

// In production (Vercel), VITE_API_URL = "https://your-backend.onrender.com"
// In local dev, falls back to /api/v1 (proxied by Vite to localhost:8000)
const API_BASE = (import.meta.env.VITE_API_URL ?? '') + '/api/v1';


export function getAuthToken(): string | null {
  return localStorage.getItem('reset_access_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('reset_access_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('reset_access_token');
}

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function loginUser(email: string, password: string): Promise<any> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Login failed');
  }
  const data = await res.json();
  if (data.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
}

export async function registerUser(email: string, password: string, full_name: string, university_name: string): Promise<any> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name, university_name })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Registration failed');
  }
  const data = await res.json();
  if (data.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
}

export async function fetchCurrentUser(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export async function submitDailyCheckin(data: CheckinSubmission): Promise<any> {
  const res = await fetch(`${API_BASE}/checkins/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to submit check-in');
  return res.json();
}

export async function fetchTodayCheckin(): Promise<any> {
  const res = await fetch(`${API_BASE}/checkins/today`, {
    headers: getHeaders()
  });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchTodayIntervention(): Promise<Intervention | null> {
  const res = await fetch(`${API_BASE}/interventions/today`, {
    headers: getHeaders()
  });
  if (!res.ok) return null;
  return res.json();
}

export async function completeIntervention(id: number, reflection_answer: string, time_spent_mins: number = 20): Promise<any> {
  const res = await fetch(`${API_BASE}/interventions/${id}/complete`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ reflection_answer, time_spent_mins })
  });
  if (!res.ok) throw new Error('Failed to complete intervention');
  return res.json();
}

export async function regenerateIntervention(id: number): Promise<Intervention> {
  const res = await fetch(`${API_BASE}/interventions/${id}/regenerate`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to regenerate intervention');
  return res.json();
}

export async function fetchWeeklyInsights(): Promise<WeeklyInsights> {
  const res = await fetch(`${API_BASE}/insights/weekly`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch weekly insights');
  return res.json();
}

export async function fetchWhatChanged(): Promise<WhatChangedData> {
  const res = await fetch(`${API_BASE}/insights/what-changed`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch what changed analysis');
  return res.json();
}

export async function fetchCampusMetrics(): Promise<CampusMetrics> {
  const res = await fetch(`${API_BASE}/campus/metrics`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch campus metrics');
  return res.json();
}

export async function deleteAccount(): Promise<any> {
  const res = await fetch(`${API_BASE}/privacy/delete-account`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete account');
  clearAuthToken();
  return res.json();
}

export function getExportUrl(): string {
  return `${API_BASE}/privacy/export`;
}
