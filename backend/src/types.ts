export type Brand = 'mtech' | 'brentwood' | 'radio-links' | 'capcom' | 'ircl' | 'idaro';

export interface TrackingLink {
  id: string;
  entity: Brand;
  name: string;
  channel: string;
  landingPage: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent?: string | null;
  status?: string;
  clicks?: number;
}

// Supplier funding / rewards tracking (e.g. XEVA Rewards) — deliberately its
// own entity, not modelled as a Campaign. Campaign already has a narrow
// cofundRate/claimStatus pair scoped to that one campaign's co-funding; this
// is a general ledger of rebate/reward schemes independent of any campaign.
export type FundingRebateType = 'marketing-rebate' | 'loyalty-rebate' | 'loyalty-bonus' | 'other';
export type FundingClaimStatus = 'eligible' | 'submitted' | 'approved' | 'paid' | 'rejected';

export interface FundingBonusTier {
  id: string;
  threshold: number;
  bonusRate?: number | null;
  bonusAmount?: number | null;
  description?: string;
}

export interface FundingRecord {
  id: string;
  brand: Brand;
  vendor: string;
  schemeName: string;
  rebateType: FundingRebateType;
  rebatePercent: number | null;
  totalPurchases: number;
  amountEarned: number;
  amountClaimed: number;
  // Derived (amountEarned - amountClaimed), computed on read — never stored,
  // so it can't drift from the two figures it's built from.
  balanceToClaim: number;
  claimStatus: FundingClaimStatus;
  claimDeadline: string | null;
  creditedFrequency: string;
  targetSpend: number | null;
  // Derived (totalPurchases / targetSpend * 100) when targetSpend is set.
  percentOfTarget: number | null;
  bonusTiers: FundingBonusTier[];
  period: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  archivedAt: string | null;
}

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
  scheduleId: string | null;
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
  // Email engagement metrics from Campaign Monitor (populated by sync).
  // opens/openRate are Campaign Monitor's TotalOpened — total open events,
  // including repeats by the same subscriber. Never presented as "unique."
  opens: number | null;
  clicks: number | null;
  openRate: number | null;
  clickRate: number | null;
  bounces: number | null;
  unsubscribes: number | null;
  // Unique-subscriber metrics (Email page) — Campaign Monitor's
  // UniqueOpened, and delivered/deliveryRate/clickToOpenRate derived from
  // real totals (recipients, bounces, uniqueOpens, clicks). See
  // campaignMonitor.ts's extractMetrics() for the exact derivation.
  // Optional, same reasoning as archived/archivedAt below — taskRepository
  // fills these from the DB regardless, where the column default is NULL.
  uniqueOpens?: number | null;
  uniqueOpenRate?: number | null;
  delivered?: number | null;
  deliveryRate?: number | null;
  clickToOpenRate?: number | null;
  // Education 2026 campaign roll-up fields — null unless this send's
  // Campaign Monitor name matched the documented naming convention (see
  // campaignMonitor.ts's parseEducationSegment doc comment).
  emailCampaignGroup?: string | null;
  emailGeography?: string | null;
  emailAudienceLevel?: string | null;
  emailAudienceType?: string | null;
  // Optional (rather than required like the rest of this interface) so the
  // several existing call sites that construct a full TaskRecord literal
  // (seed data, campaign-monitor sync, actions API) don't all need updating
  // — taskRepository fills these from the DB regardless, where the column
  // default is 0/NULL.
  archived?: boolean;
  archivedAt?: string | null;
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
