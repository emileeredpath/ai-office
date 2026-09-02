// Backend is same-origin in production (Stage 3 serves the frontend from the
// same Railway service as the API), so the default is a relative base and
// requests just work regardless of domain. VITE_API_URL only exists for
// local dev, where the frontend (Vite) and backend run on different ports.
export const API_URL = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// Backend sessions are in-memory only (see backend/src/middleware/
// session.ts) — a redeploy wipes them, so a previously-issued session
// cookie can go from valid to unrecognised with no client-side signal.
// Every protected route uses the same requireSession middleware, so any
// 401 from anywhere except the auth endpoints themselves (login/me/logout
// manage their own state directly) means the session is genuinely gone
// server-side. AuthProvider registers a listener here so it can drop the
// app back to the login screen immediately, instead of the UI silently
// continuing to look "signed in" while every real request 401s.
let sessionExpiredListener: (() => void) | null = null;

export function onSessionExpired(listener: (() => void) | null) {
  sessionExpiredListener = listener;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError('Could not reach the AI Office backend. Check your connection.');
  }
  if (response.status === 401 && !path.startsWith('/api/auth/')) {
    sessionExpiredListener?.();
  }
  return response;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
