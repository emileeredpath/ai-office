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

export interface CampaignMonitorCoverage {
  lastSuccessfulSyncAt: string | null;
  lastSyncError: string | null;
  // The earliest point AI Office can actually PROVE continuous sync
  // coverage back to — derived only from consecutive successful syncs
  // whose own recorded lookback windows (SyncResult.sinceDays) overlap
  // with no gap. Never a guess: null means coverage before the most
  // recent known-lookback sync genuinely cannot be established (e.g. no
  // sync has recorded its lookback yet, or a real gap was found).
  continuousCoverageSince: string | null;
  // True when a real gap between two successful syncs was detected (a
  // sync's lookback window didn't reach back to the previous sync's
  // timestamp) — i.e. there is a real, provable hole in coverage, not
  // just "we don't know."
  hasKnownGap: boolean;
  // Human-readable explanation of exactly what could/couldn't be proven,
  // for display next to the raw dates.
  explanation: string;
}

interface AuditLogFullSyncRow {
  new_value: string;
  created_at: string;
}

// Walks every real recorded Campaign Monitor sync (oldest to newest) to
// determine, honestly, how far back continuous coverage can be proven —
// never assumed complete just because rows exist in the tasks table. See
// SyncResult.sinceDays (campaignMonitor.ts) — only syncs that recorded
// their own lookback window (i.e. run after this capability was added)
// can be chained into a provable continuous window; older rows are
// acknowledged, not silently treated as gapless.
export function getCampaignMonitorCoverage(): CampaignMonitorCoverage {
  const rows = db
    .prepare(
      `SELECT new_value, created_at FROM audit_log
       WHERE resource_type = 'campaign_monitor' AND action = 'sync'
       ORDER BY created_at ASC`
    )
    .all() as unknown as AuditLogFullSyncRow[];

  if (rows.length === 0) {
    return {
      lastSuccessfulSyncAt: null,
      lastSyncError: null,
      continuousCoverageSince: null,
      hasKnownGap: false,
      explanation: 'Campaign Monitor has never synced on this deployment — no coverage exists yet.',
    };
  }

  interface ParsedSync {
    createdAt: string;
    success: boolean;
    error: string | null;
    sinceDays: number | null;
  }

  const parsed: ParsedSync[] = rows.map((row) => {
    try {
      const v = JSON.parse(row.new_value) as { success?: boolean; errors?: string[]; message?: string; sinceDays?: number };
      const failed = v.success === false || (v.errors && v.errors.length > 0);
      return {
        createdAt: row.created_at,
        success: !failed,
        error: failed ? v.errors?.join('; ') || v.message || 'Unknown sync error' : null,
        sinceDays: typeof v.sinceDays === 'number' ? v.sinceDays : null,
      };
    } catch {
      return { createdAt: row.created_at, success: false, error: 'Could not read this sync result.', sinceDays: null };
    }
  });

  const last = parsed[parsed.length - 1];
  const lastSuccessfulSyncAt = [...parsed].reverse().find((s) => s.success)?.createdAt ?? null;

  // Walk backwards from the most recent successful, lookback-recording
  // sync, chaining each earlier successful sync in as long as its own
  // window reaches back far enough to abut the one after it — the moment
  // that breaks (unknown lookback, a failed sync in between, or a real
  // gap), stop and report exactly what was proven.
  let continuousCoverageSince: string | null = null;
  let hasKnownGap = false;
  let cursor = parsed.length - 1;

  // Find the most recent successful sync with a known lookback to anchor from.
  while (cursor >= 0 && !(parsed[cursor].success && parsed[cursor].sinceDays !== null)) {
    cursor--;
  }

  if (cursor >= 0) {
    let coverageStart = new Date(parsed[cursor].createdAt);
    coverageStart.setDate(coverageStart.getDate() - (parsed[cursor].sinceDays as number));
    continuousCoverageSince = coverageStart.toISOString();

    for (let i = cursor - 1; i >= 0; i--) {
      const candidate = parsed[i];
      if (!candidate.success || candidate.sinceDays === null) {
        // Can't verify further back than this — the chain stops here,
        // honestly, rather than assuming the older row was fine.
        break;
      }
      const candidateTime = new Date(candidate.createdAt);
      if (candidateTime.getTime() < coverageStart.getTime()) {
        // This earlier sync happened before the window the newer sync(s)
        // already cover — a real, provable gap between the two.
        hasKnownGap = true;
        break;
      }
      const candidateStart = new Date(candidateTime);
      candidateStart.setDate(candidateStart.getDate() - (candidate.sinceDays as number));
      coverageStart = candidateStart;
      continuousCoverageSince = coverageStart.toISOString();
    }
  }

  const explanation = !last.success
    ? `The most recent Campaign Monitor sync failed — see the error below. Any previously-synced data before that point may still be reliable, but nothing has confirmed coverage since.`
    : continuousCoverageSince
      ? hasKnownGap
        ? `Continuous coverage is only provable back to ${continuousCoverageSince} — an earlier sync exists but doesn't reach back far enough to close the gap before it, so anything before this date cannot be confirmed complete.`
        : `Continuous coverage is provable back to ${continuousCoverageSince}, based on each sync's own recorded lookback window with no detected gap.`
      : `No sync on record has recorded its own lookback window yet, so continuous coverage cannot be proven for any period — this will resolve itself as future syncs run and record their window.`;

  return {
    lastSuccessfulSyncAt,
    lastSyncError: last.success ? null : last.error,
    continuousCoverageSince,
    hasKnownGap,
    explanation,
  };
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
