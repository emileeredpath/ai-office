// Microsoft To Do via Microsoft Graph — real list/task read and
// write-back. Microsoft To Do remains the source of truth: this module
// never stores a parallel copy of task content, it only ever reads live
// from Graph or writes a specific real change back to it. See
// msGraphAuth.ts for how a valid access token is obtained.
import { getValidAccessToken } from './msGraphAuth.js';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

async function graphFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getValidAccessToken();
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    // Microsoft Graph error responses are JSON ({ error: { code,
    // message } }) — surfaced verbatim (truncated), never swallowed to a
    // generic "failed" message, so a real permission/consent problem is
    // never mistaken for "no data."
    throw new Error(`Microsoft Graph request failed for ${path} (${res.status}): ${body.slice(0, 500)}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface GraphTodoList {
  id: string;
  displayName: string;
  isOwner: boolean;
  wellknownListName?: string;
}

export interface GraphTodoTask {
  id: string;
  title: string;
  // Real Graph enum: notStarted | inProgress | completed | waitingOnOthers | deferred
  status: string;
  importance: string; // low | normal | high
  createdDateTime: string;
  lastModifiedDateTime: string;
  completedDateTime: { dateTime: string; timeZone: string } | null;
  dueDateTime: { dateTime: string; timeZone: string } | null;
  body: { content: string; contentType: string } | null;
}

// Real To Do lists for the connected account — no filtering, no invented
// grouping. wellknownListName distinguishes the built-in "Tasks" list
// from user-created ones, surfaced as-is.
export async function listTodoLists(): Promise<GraphTodoList[]> {
  const json = await graphFetch<{ value: GraphTodoList[] }>('/me/todo/lists?$top=100');
  return json.value;
}

export async function listTasksInList(listId: string): Promise<GraphTodoTask[]> {
  const json = await graphFetch<{ value: GraphTodoTask[] }>(
    `/me/todo/lists/${encodeURIComponent(listId)}/tasks?$top=200`
  );
  return json.value;
}

// Write-back — every call here changes the real Microsoft To Do task,
// never a local copy. No optimistic local state is maintained by this
// module; the caller re-fetches to confirm the real resulting state.
export async function setTaskStatus(listId: string, taskId: string, status: 'completed' | 'notStarted'): Promise<GraphTodoTask> {
  return graphFetch<GraphTodoTask>(`/me/todo/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function updateTaskFields(
  listId: string,
  taskId: string,
  fields: { title?: string; body?: string; importance?: 'low' | 'normal' | 'high'; dueDateTime?: string | null }
): Promise<GraphTodoTask> {
  const patch: Record<string, unknown> = {};
  if (fields.title !== undefined) patch.title = fields.title;
  if (fields.body !== undefined) patch.body = { content: fields.body, contentType: 'text' };
  if (fields.importance !== undefined) patch.importance = fields.importance;
  if (fields.dueDateTime !== undefined) {
    patch.dueDateTime = fields.dueDateTime ? { dateTime: fields.dueDateTime, timeZone: 'UTC' } : null;
  }
  return graphFetch<GraphTodoTask>(`/me/todo/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
