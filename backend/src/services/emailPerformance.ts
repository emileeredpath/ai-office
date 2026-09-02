// Real Campaign Monitor email performance — a read-only aggregation for V2
// (Overview, Performance, Reports). This is deliberately a thin read layer
// over the tasks the existing syncCampaignMonitor() already writes (see
// services/campaignMonitor.ts) — it does not sync anything itself, does not
// change the sync mechanism, and does not add a new table.
//
// The one rule that matters most here: only rows with source ===
// 'campaign-monitor' are ever returned. The database also contains
// email-send tasks with source 'seed' or 'test-seed' (demo/test fixtures —
// see the removed seed-test-data route) which must never contribute to a
// V2-displayed figure. Filtering happens here, once, so every V2 caller
// gets the same honest set with no risk of a screen forgetting to exclude
// them.
import db from '../db/connection.js';
import { getAllTasks } from '../db/taskRepository.js';
import type { Brand, TaskRecord } from '../types.js';

const CM_SOURCE = 'campaign-monitor';

export interface EmailCampaignRecord {
  taskId: string;
  campaignName: string;
  subject: string | null;
  sentDate: string; // ISO datetime
  brand: Brand;
  recipients: number | null;
  // Campaign Monitor's TotalOpened field, explicitly — see the header note
  // in campaignMonitor.ts's extractMetrics() for why this is no longer an
  // ambiguous TotalOpened-or-UniqueOpened value.
  opens: number | null;
  clicks: number | null;
  bounces: number | null;
  unsubscribes: number | null;
  // Unique-subscriber metrics (Email page) — see campaignMonitor.ts's
  // extractMetrics() for exactly how each is derived.
  uniqueOpens: number | null;
  uniqueOpenRate: number | null;
  delivered: number | null;
  deliveryRate: number | null;
  clickRate: number | null;
  clickToOpenRate: number | null;
  // Education 2026 roll-up fields — null unless this send's name matched
  // the documented naming convention (see campaignMonitor.ts's
  // parseEducationSegment doc comment).
  emailCampaignGroup: string | null;
  emailGeography: string | null;
  emailAudienceLevel: string | null;
  emailAudienceType: string | null;
  // A real send only sent to a small test slice of the list — see
  // parseEducationSegment's doc comment.
  isTest: boolean;
  // The real Campaign Monitor campaign ID (task.externalId) — useful for
  // cross-checking a send directly in Campaign Monitor's own UI.
  campaignMonitorId: string | null;
  // The dashboard campaign this send is linked to (task.campaignId), set
  // only by the existing sync's name-based matching — never inferred here.
  // Null means genuinely unlinked; Campaign Detail must never guess a link.
  dashboardCampaignId: string | null;
}

export type CampaignMonitorSyncState = 'live' | 'error' | 'never-synced' | 'not-configured';

export interface EmailPerformanceResult {
  campaigns: EmailCampaignRecord[];
  startDate: string;
  endDate: string;
  configured: boolean;
  syncState: CampaignMonitorSyncState;
  lastSyncAt: string | null;
  lastSyncError: string | null;
}

interface AuditLogSyncRow {
  new_value: string;
  created_at: string;
}

function getLastSyncStatus(): { syncState: 'live' | 'error' | 'never-synced'; lastSyncAt: string | null; lastSyncError: string | null } {
  const row = db
    .prepare(
      `SELECT new_value, created_at FROM audit_log
       WHERE resource_type = 'campaign_monitor' AND action = 'sync'
       ORDER BY created_at DESC LIMIT 1`
    )
    .get() as AuditLogSyncRow | undefined;

  if (!row) {
    return { syncState: 'never-synced', lastSyncAt: null, lastSyncError: null };
  }

  try {
    const parsed = JSON.parse(row.new_value) as { success?: boolean; errors?: string[]; message?: string };
    const failed = parsed.success === false || (parsed.errors && parsed.errors.length > 0);
    return {
      syncState: failed ? 'error' : 'live',
      lastSyncAt: row.created_at,
      lastSyncError: failed ? parsed.errors?.join('; ') || parsed.message || 'Unknown sync error' : null,
    };
  } catch {
    return { syncState: 'error', lastSyncAt: row.created_at, lastSyncError: 'Could not read the last sync result.' };
  }
}

function sentDateOf(task: TaskRecord): string | null {
  return task.completedAt ?? task.startDate ?? task.deadline ?? null;
}

// startDate/endDate are plain "YYYY-MM-DD" calendar-day strings from the
// caller's resolved Period range (see resolveEmailDateRange on the
// frontend) — endDate is inclusive of the whole day.
export function getEmailPerformance(startDate: string, endDate: string): EmailPerformanceResult {
  const configured = !!process.env.CAMPAIGN_MONITOR_API_KEY;
  const last = getLastSyncStatus();
  const syncState: CampaignMonitorSyncState = configured ? last.syncState : 'not-configured';

  const rangeEnd = `${endDate}T23:59:59.999Z`;

  const campaigns: EmailCampaignRecord[] = [];
  for (const task of getAllTasks()) {
    if (task.type !== 'email-send' || task.source !== CM_SOURCE) continue;
    const sentDate = sentDateOf(task);
    if (!sentDate || sentDate < startDate || sentDate > rangeEnd) continue;
    campaigns.push({
      taskId: task.id,
      campaignName: task.title,
      subject: task.subject,
      sentDate,
      brand: task.brand,
      recipients: task.recipients,
      opens: task.opens,
      clicks: task.clicks,
      bounces: task.bounces,
      unsubscribes: task.unsubscribes,
      uniqueOpens: task.uniqueOpens ?? null,
      uniqueOpenRate: task.uniqueOpenRate ?? null,
      delivered: task.delivered ?? null,
      deliveryRate: task.deliveryRate ?? null,
      clickRate: task.clickRate,
      clickToOpenRate: task.clickToOpenRate ?? null,
      emailCampaignGroup: task.emailCampaignGroup ?? null,
      emailGeography: task.emailGeography ?? null,
      emailAudienceLevel: task.emailAudienceLevel ?? null,
      emailAudienceType: task.emailAudienceType ?? null,
      isTest: task.emailIsTest ?? false,
      campaignMonitorId: task.externalId,
      dashboardCampaignId: task.campaignId,
    });
  }

  return {
    campaigns,
    startDate,
    endDate,
    configured,
    syncState,
    lastSyncAt: configured ? last.lastSyncAt : null,
    lastSyncError: configured ? last.lastSyncError : null,
  };
}
