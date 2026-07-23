// Client for the AI Office Actions API (backend/). This is the ONLY place in
// the frontend that talks to the backend — the dashboard and Claude both go
// through the same validated, audited action service, just via different
// callers (source.type: 'dashboard' vs 'claude').

const API_URL_KEY = 'ai-office-actions-api-url';
const API_KEY_KEY = 'ai-office-actions-api-key';

const DEFAULT_API_URL = 'https://ai-office-production-249c.up.railway.app';

export function getApiUrl(): string {
  return localStorage.getItem(API_URL_KEY) || DEFAULT_API_URL;
}

export function setApiUrl(url: string) {
  localStorage.setItem(API_URL_KEY, url.trim().replace(/\/+$/, ''));
}

export function getApiKey(): string {
  return localStorage.getItem(API_KEY_KEY) || '';
}

export function setApiKey(key: string) {
  localStorage.setItem(API_KEY_KEY, key.trim());
}

export function isActionsApiConfigured(): boolean {
  return Boolean(getApiUrl() && getApiKey());
}

interface ActionRequestOptions {
  requestId?: string;
  confirmed?: boolean;
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  action: string;
  result?: T;
  message: string;
  requires_confirmation?: boolean;
  preview?: unknown;
  possible_duplicates?: unknown[];
  error?: string;
}

export class ActionsApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ActionsApiError';
  }
}

async function callAction<T = unknown>(
  action: string,
  payload: Record<string, unknown>,
  options: ActionRequestOptions = {}
): Promise<ActionResponse<T>> {
  const apiUrl = getApiUrl();
  const apiKey = getApiKey();
  if (!apiUrl || !apiKey) {
    throw new ActionsApiError('Claude Actions integration is not connected. Set it up in Settings.');
  }

  let response: Response;
  try {
    response = await fetch(`${apiUrl}/api/actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        action,
        payload,
        source: { type: 'dashboard' },
        request_id: options.requestId,
        confirmed: options.confirmed,
      }),
    });
  } catch {
    throw new ActionsApiError('Could not reach the AI Office backend. Check your connection.');
  }

  let body: ActionResponse<T>;
  try {
    body = await response.json();
  } catch {
    throw new ActionsApiError('Unexpected response from the backend.', response.status);
  }

  if (response.status === 401) {
    throw new ActionsApiError('The stored API key was rejected. Check it in Settings.', 401);
  }
  if (response.status === 429) {
    throw new ActionsApiError('Too many requests — try again in a moment.', 429);
  }

  return body;
}

export async function fetchTasksFromApi(): Promise<any[]> {
  const apiUrl = getApiUrl();
  const apiKey = getApiKey();
  if (!apiUrl || !apiKey) {
    throw new ActionsApiError('Claude Actions integration is not connected.');
  }

  let response: Response;
  try {
    response = await fetch(`${apiUrl}/api/tasks`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  } catch {
    throw new ActionsApiError('Could not reach the AI Office backend. Check your connection.');
  }

  if (response.status === 401) {
    throw new ActionsApiError('The stored API key was rejected. Check it in Settings.', 401);
  }
  if (!response.ok) {
    throw new ActionsApiError('Failed to load tasks from the backend.', response.status);
  }

  const body = await response.json();
  return body.result ?? [];
}

export async function checkHealth(): Promise<boolean> {
  const apiUrl = getApiUrl();
  if (!apiUrl) return false;
  try {
    const response = await fetch(`${apiUrl}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export function createTaskAction(payload: Record<string, unknown>, requestId?: string) {
  return callAction('create_task', payload, { requestId });
}

export function updateTaskAction(taskId: string, updates: Record<string, unknown>, requestId?: string) {
  return callAction('update_task', { task_id: taskId, ...updates }, { requestId, confirmed: true });
}

export function completeTaskAction(taskId: string, requestId?: string) {
  return callAction('complete_task', { task_id: taskId }, { requestId, confirmed: true });
}
