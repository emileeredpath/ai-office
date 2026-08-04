export type Brand = 'mtech' | 'brentwood' | 'radio-links' | 'capcom' | 'ircl' | 'idaro';

export type TaskType = 'task' | 'email-send';

export type TaskStatus =
  | 'backlog'
  | 'not-started'
  | 'in-progress'
  | 'waiting-approval'
  | 'waiting-john'
  | 'waiting-customer'
  | 'approved-ready'
  | 'blocked'
  | 'complete';

export type TaskPriority = 'high' | 'medium' | 'low';

export interface TaskHistoryEntry {
  id: string;
  action: 'completed' | 'reopened';
  timestamp: string;
  previousStatus: TaskStatus;
  newStatus: TaskStatus;
}

export interface TaskRecord {
  id: string;
  title: string;
  notes: string;
  brand: Brand;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  startDate: string | null;
  campaignId: string | null;
  createdAt: string;
  completedAt: string | null;
  previousStatus: TaskStatus | null;
  history: TaskHistoryEntry[];
  approvalRequired: boolean;
  approver: 'john' | 'lydia' | 'customer' | null;
  blockerReason: string | null;
  lastBriefGenerated: string | null;
  source: string | null;
  sourceConversationId: string | null;
  type: TaskType;
  recipients: number | null;
  subject: string | null;
  // Nullable and unused today — reserved for the per-person to-do list phase
  // so adding real user accounts later doesn't require a schema change.
  assignedTo: string | null;
  // Spend for this item. Conventionally stored as the £ figure ready for
  // display/summing — conversion (if the source invoice was in another
  // currency) happens at point of entry, not in the app. `currency` just
  // records what the original invoice was in, for audit purposes.
  cost: number | null;
  currency: string | null;
  // Dedup key for tasks created by an automated external sync (paired with
  // `source`, e.g. source='campaign-monitor' + externalId=CM's campaign ID)
  // so re-running a sync updates the existing row instead of duplicating it.
  externalId: string | null;
  // Email engagement metrics from Campaign Monitor (populated by sync)
  opens: number | null;
  clicks: number | null;
  openRate: number | null;
  clickRate: number | null;
  bounces: number | null;
  unsubscribes: number | null;
}

export interface ActionSource {
  type: string;
  conversationId?: string;
}

export interface ActionRequest {
  action: string;
  payload: Record<string, unknown>;
  source?: ActionSource;
  request_id?: string;
  confirmed?: boolean;
}

export interface ActionResult<T = unknown> {
  success: boolean;
  action: string;
  result?: T;
  message: string;
  requires_confirmation?: boolean;
  preview?: unknown;
  possible_duplicates?: unknown[];
  error?: string;
}
