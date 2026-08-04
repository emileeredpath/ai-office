// Campaign Monitor API Integration — see the Campaign Monitor API
// Integration brief. Pulls sent campaigns from the last N days, maps each
// to an MTech brand entity by its naming convention, and upserts it as an
// email-send Task so it shows up everywhere task-based data already does
// (Calendar, Campaigns, Dashboard) without a parallel data model.
//
// IMPORTANT — two things this file cannot verify from this environment:
// 1. No CAMPAIGN_MONITOR_API_KEY is available here, and this sandbox can't
//    reach the API host, so the HTTP layer is written strictly to CM's
//    documented v3.1 REST contract but has not been exercised against a
//    live account. Test against a real key before trusting it.
// 2. Campaign Monitor's public API does not have a documented, universal
//    "cost" field on a sent campaign (spend is normally an account/invoice
//    concept, not a per-campaign one). `extractCost` below defensively
//    checks a few plausible field names some CM plans expose, but if none
//    are present, cost is stored as null — per the brief's own fallback
//    ("mark as cost TBD") rather than guessed at.
import { nanoid } from 'nanoid';
import db from '../db/connection.js';
import { findTaskByExternalId, insertTask, updateTaskRow } from '../db/taskRepository.js';
import type { Brand, TaskRecord } from '../types.js';

// Campaign Monitor's API has always lived on api.createsend.com — a holdover
// from "CreateSend", the product's name before the Campaign Monitor rebrand.
// api.campaignmonitor.com (what the brief specified) does not serve the API.
const API_BASE = 'https://api.createsend.com/api/v3.1';
const SOURCE = 'campaign-monitor';

interface CmClient {
  ClientID: string;
  Name: string;
}

interface CmCampaignListItem {
  CampaignID: string;
  Name: string;
  Subject?: string;
  SentDate: string; // "2026-07-29 18:00:00"
  TotalRecipients?: number;
}

interface CmCampaignSummary {
  Recipients?: number;
  // Plausible cost-bearing fields on pay-as-you-go accounts — none of these
  // are guaranteed by CM's documented schema; see the file header note.
  Cost?: number;
  TotalCost?: number;
  Spend?: number;
}

interface CmCampaignMetrics {
  UniqueOpens?: number;
  TotalOpens?: number;
  UniqueClickCount?: number;
  TotalClickCount?: number;
  Bounces?: number;
  Unsubscribes?: number;
  Recipients?: number;
}

export interface SyncResult {
  success: boolean;
  message: string;
  clientsProcessed: number;
  campaignsSeen: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

function authHeader(apiKey: string): string {
  return 'Basic ' + Buffer.from(`${apiKey}:x`).toString('base64');
}

async function cmFetch<T>(path: string, apiKey: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: authHeader(apiKey), 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Campaign Monitor API ${res.status} on ${path}: ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

const listClients = (apiKey: string) => cmFetch<CmClient[]>('/clients.json', apiKey);
const listCampaignsForClient = (apiKey: string, clientId: string) =>
  cmFetch<CmCampaignListItem[]>(`/clients/${clientId}/campaigns.json`, apiKey);
const getCampaignSummary = (apiKey: string, campaignId: string) =>
  cmFetch<CmCampaignSummary>(`/campaigns/${campaignId}/summary.json`, apiKey);
const getCampaignMetrics = (apiKey: string, campaignId: string): Promise<CmCampaignMetrics | null> =>
  cmFetch<CmCampaignMetrics>(`/campaigns/${campaignId}/opens.json`, apiKey)
    .catch(() => null); // graceful fallback if metrics endpoint fails

function extractCost(summary: CmCampaignSummary | null): number | null {
  if (!summary) return null;
  const value = summary.Cost ?? summary.TotalCost ?? summary.Spend;
  return typeof value === 'number' ? value : null;
}

function extractMetrics(metrics: CmCampaignMetrics | null, recipients: number | null): {
  opens: number | null;
  clicks: number | null;
  openRate: number | null;
  clickRate: number | null;
  bounces: number | null;
  unsubscribes: number | null;
} {
  if (!metrics) {
    return { opens: null, clicks: null, openRate: null, clickRate: null, bounces: null, unsubscribes: null };
  }

  const opens = metrics.UniqueOpens ?? metrics.TotalOpens ?? null;
  const clicks = metrics.UniqueClickCount ?? metrics.TotalClickCount ?? null;
  const openRate = opens && recipients && recipients > 0 ? (opens / recipients) * 100 : null;
  const clickRate = clicks && recipients && recipients > 0 ? (clicks / recipients) * 100 : null;

  return {
    opens: typeof opens === 'number' ? opens : null,
    clicks: typeof clicks === 'number' ? clicks : null,
    openRate: typeof openRate === 'number' ? openRate : null,
    clickRate: typeof clickRate === 'number' ? clickRate : null,
    bounces: metrics.Bounces ?? null,
    unsubscribes: metrics.Unsubscribes ?? null,
  };
}

// Parse logic per the brief: IDARO is a product line (not a brand entity);
// everything else follows "MTech <CODE> - <name>".
const ENTITY_CODES: Record<string, Brand> = {
  BC: 'brentwood',
  RL: 'radio-links',
  CC: 'capcom',
  IRCL: 'ircl',
};

// Campaign name matching: maps Campaign Monitor campaign name fragments to AI Office campaign IDs.
// Update this as campaigns are created. Format: "campaign_monitor_fragment" → "ai_office_campaign_id"
function buildCampaignMap(aiCampaigns: Array<{ id: string; name: string }>): Map<string, string> {
  const map = new Map<string, string>();

  // Auto-match by campaign name similarity (lowercase, remove special chars)
  aiCampaigns.forEach((campaign) => {
    const normalized = campaign.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    map.set(normalized, campaign.id);
  });

  // Also try fragment matching for Campaign Monitor names like "Service and Repair"
  aiCampaigns.forEach((campaign) => {
    const words = campaign.name.toLowerCase().split(/[\s&-]+/).filter((w) => w.length > 3);
    words.forEach((word) => {
      if (!map.has(word)) map.set(word, campaign.id);
    });
  });

  return map;
}

export function parseEntity(campaignName: string): { brand: Brand; matched: boolean } {
  const name = campaignName.trim();
  if (/^IDARO\b/i.test(name)) {
    return { brand: 'idaro', matched: true };
  }
  const match = name.match(/^MTech\s+(\w+)\s*-/i);
  const code = match?.[1]?.toUpperCase();
  if (code && ENTITY_CODES[code]) {
    return { brand: ENTITY_CODES[code], matched: true };
  }
  return { brand: 'mtech', matched: false };
}

function parseCmDate(sentDate: string): Date {
  // CM returns "YYYY-MM-DD HH:mm:ss" — not directly ISO-parseable in all
  // engines, so normalize the separator.
  return new Date(sentDate.replace(' ', 'T'));
}

export async function syncCampaignMonitor(options: { sinceDays?: number } = {}): Promise<SyncResult> {
  const apiKey = process.env.CAMPAIGN_MONITOR_API_KEY;
  const errors: string[] = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let campaignsSeen = 0;
  let clientsProcessed = 0;

  if (!apiKey) {
    return {
      success: false,
      message: 'CAMPAIGN_MONITOR_API_KEY is not set — sync skipped.',
      clientsProcessed: 0,
      campaignsSeen: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: ['CAMPAIGN_MONITOR_API_KEY missing'],
    };
  }

  const sinceDays = options.sinceDays ?? 7;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - sinceDays);

  // Build campaign name map for linking sends to AI Office campaigns
  const aiCampaigns = db.prepare('SELECT id, name FROM campaigns').all() as Array<{ id: string; name: string }>;
  const campaignMap = buildCampaignMap(aiCampaigns);

  let clients: CmClient[];
  try {
    clients = await listClients(apiKey);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[campaign-monitor] failed to list clients:', msg);
    return {
      success: false,
      message: `Could not authenticate/list clients: ${msg}`,
      clientsProcessed: 0,
      campaignsSeen: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [msg],
    };
  }

  for (const client of clients) {
    let campaigns: CmCampaignListItem[];
    try {
      campaigns = await listCampaignsForClient(apiKey, client.ClientID);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[campaign-monitor] failed to list campaigns for client ${client.ClientID}:`, msg);
      errors.push(`client ${client.Name}: ${msg}`);
      continue;
    }
    clientsProcessed += 1;

    for (const campaign of campaigns) {
      const sentDate = parseCmDate(campaign.SentDate);
      if (Number.isNaN(sentDate.getTime()) || sentDate < cutoff) continue;
      campaignsSeen += 1;

      try {
        const { brand, matched } = parseEntity(campaign.Name);
        if (!matched) {
          console.warn(`[campaign-monitor] "${campaign.Name}" didn't match a known naming pattern — filed under mtech.`);
        }

        let summary: CmCampaignSummary | null = null;
        let metrics: CmCampaignMetrics | null = null;
        try {
          summary = await getCampaignSummary(apiKey, campaign.CampaignID);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(`[campaign-monitor] failed to get summary for ${campaign.CampaignID} (${campaign.Name}): ${msg}`);
        }
        try {
          metrics = await getCampaignMetrics(apiKey, campaign.CampaignID);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(`[campaign-monitor] failed to get metrics for ${campaign.CampaignID} (${campaign.Name}): ${msg}`);
        }

        const recipients = campaign.TotalRecipients ?? summary?.Recipients ?? null;
        const cost = extractCost(summary);
        const { opens, clicks, openRate, clickRate, bounces, unsubscribes } = extractMetrics(metrics, recipients);
        const sentIso = sentDate.toISOString();

        // Match campaign to AI Office campaign by name
        // Try exact normalized match first, then try individual word matches
        let aiCampaignId: string | null = null;
        const normalizedCmName = campaign.Name.toLowerCase().replace(/[^a-z0-9]/g, '');
        aiCampaignId = campaignMap.get(normalizedCmName) || null;

        if (!aiCampaignId) {
          // Try matching by individual words (for multi-word campaigns)
          const cmWords = campaign.Name.toLowerCase().split(/[\s&-]+/).filter((w) => w.length > 3);
          for (const word of cmWords) {
            if (campaignMap.has(word)) {
              aiCampaignId = campaignMap.get(word) || null;
              break;
            }
          }
        }

        const existing = findTaskByExternalId(SOURCE, campaign.CampaignID);
        if (existing) {
          updateTaskRow(existing.id, {
            title: campaign.Name,
            brand,
            recipients,
            cost,
            currency: cost != null ? existing.currency ?? 'GBP' : existing.currency,
            subject: campaign.Subject ?? existing.subject,
            opens,
            clicks,
            openRate,
            clickRate,
            bounces,
            unsubscribes,
            campaignId: aiCampaignId,
          });
          updated += 1;
        } else {
          const now = new Date().toISOString();
          const task: TaskRecord = {
            id: `task-${nanoid(10)}`,
            title: campaign.Name,
            notes: `Synced from Campaign Monitor on ${now}.${cost == null ? ' Cost not available from the API — TBD.' : ''}`,
            brand,
            status: 'complete',
            priority: 'medium',
            deadline: sentIso,
            startDate: sentIso,
            campaignId: aiCampaignId,
            createdAt: now,
            completedAt: sentIso,
            previousStatus: null,
            history: [],
            approvalRequired: false,
            approver: null,
            blockerReason: null,
            lastBriefGenerated: null,
            source: SOURCE,
            sourceConversationId: null,
            type: 'email-send',
            recipients,
            subject: campaign.Subject ?? null,
            assignedTo: null,
            cost,
            currency: cost != null ? 'GBP' : null,
            externalId: campaign.CampaignID,
            opens,
            clicks,
            openRate,
            clickRate,
            bounces,
            unsubscribes,
          };
          insertTask(task);
          created += 1;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[campaign-monitor] failed to process campaign ${campaign.CampaignID} (${campaign.Name}):`, msg);
        errors.push(`${campaign.Name}: ${msg}`);
        skipped += 1;
      }
    }
  }

  const result: SyncResult = {
    success: errors.length === 0,
    message: `Synced ${created} new and ${updated} updated send(s) from ${clientsProcessed} client(s), ${campaignsSeen} campaign(s) in range.`,
    clientsProcessed,
    campaignsSeen,
    created,
    updated,
    skipped,
    errors,
  };

  db.prepare(
    `INSERT INTO audit_log (
      id, action, resource_type, resource_id, previous_value, new_value,
      source, source_conversation_id, request_id, confirmed, automatic, created_at
    ) VALUES (@id, 'sync', 'campaign_monitor', NULL, NULL, @newValue,
      'campaign-monitor-sync', NULL, NULL, 1, 1, @createdAt)`
  ).run({
    id: nanoid(),
    newValue: JSON.stringify(result),
    createdAt: new Date().toISOString(),
  });

  return result;
}
