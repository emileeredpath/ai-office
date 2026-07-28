import { apiFetch } from './apiConfig';

export type SessionRole = 'edit' | 'view' | null;

export async function login(password: string): Promise<{ success: boolean; role?: SessionRole; message?: string }> {
  const response = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) });
  return response.json();
}

export async function logout(): Promise<void> {
  await apiFetch('/api/auth/logout', { method: 'POST' });
}

export async function getSession(): Promise<{ authenticated: boolean; role: SessionRole }> {
  try {
    const response = await apiFetch('/api/auth/me');
    if (!response.ok) return { authenticated: false, role: null };
    return await response.json();
  } catch {
    return { authenticated: false, role: null };
  }
}
