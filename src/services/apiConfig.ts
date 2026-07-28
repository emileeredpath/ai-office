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
