// Client for the AI Office backend (backend/). This is the ONLY place in the
// frontend that talks to the backend for task writes — the dashboard and
// Claude both go through the same validated, audited action service, just
// via different callers (source.type: 'dashboard' vs 'claude').
import { apiFetch, ApiError } from './apiConfig';

export { checkHealth } from './apiConfig';
export { ApiError as ActionsApiError };

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

async function callAction<T = unknown>(
  action: string,
  payload: Record<string, unknown>,
  options: ActionRequestOptions = {}
): Promise<ActionResponse<T>> {
  const response = await apiFetch('/api/actions', {
    method: 'POST',
    body: JSON.stringify({
      action,
      payload,
      source: { type: 'dashboard' },
      request_id: options.requestId,
      confirmed: options.confirmed,
    }),
  });

  let body: ActionResponse<T>;
  try {
    body = await response.json();
  } catch {
    throw new ApiError('Unexpected response from the backend.', response.status);
  }

  if (response.status === 401) {
    throw new ApiError('Your session has expired. Please sign in again.', 401);
  }
  if (response.status === 429) {
    throw new ApiError('Too many requests — try again in a moment.', 429);
  }

  return body;
}

export async function fetchTasksFromApi(filters?: { campaignId?: string; brand?: string }): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.campaignId) params.set('campaign_id', filters.campaignId);
  if (filters?.brand) params.set('brand', filters.brand);
  const qs = params.toString();

  const response = await apiFetch(`/api/tasks${qs ? `?${qs}` : ''}`);
  if (response.status === 401) {
    throw new ApiError('Your session has expired. Please sign in again.', 401);
  }
  if (!response.ok) {
    throw new ApiError('Failed to load tasks from the backend.', response.status);
  }

  const body = await response.json();
  return body.result ?? [];
}

export async function deleteTaskFromApi(taskId: string): Promise<void> {
  const response = await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new ApiError('Failed to delete the task.', response.status);
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
