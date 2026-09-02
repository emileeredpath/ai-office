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
  TotalOpened?: number;
  UniqueOpened?: number;
  // Campaign Monitor's summary.json documents Clicks as the count of
  // unique subscribers who clicked at least one link — there is no
  // separate "TotalClicks" field on this endpoint (unlike Opens, which
  // has both Total and Unique variants). Verify this against a live
  // account (Clicks should never exceed UniqueOpened, since a subscriber
  // can't click without first opening) before trusting Click-to-Open Rate.
  Clicks?: number;
  Unsubscribed?: number;
  Bounced?: number;
  // Plausible cost-bearing fields on pay-as-you-go accounts — none of these
  // are guaranteed by CM's documented schema; see the file header note.
  Cost?: number;
  TotalCost?: number;
  Spend?: number;
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

function extractCost(summary: CmCampaignSummary | null): number | null {
  if (!summary) return null;
  const value = summary.Cost ?? summary.TotalCost ?? summary.Spend;
  return typeof value === 'number' ? value : null;
}

// Campaign Monitor's documented v3.x summary schema always returns both
// TotalOpened and UniqueOpened as distinct fields (confirmed against CM's
// published API docs — see the Campaign Monitor V2 audit). "opens" here is
// explicitly TotalOpened, never a silent fallback to UniqueOpened under the
// same label — the two mean different things and must not be blended.
// Clicks has only one documented field (no separate unique-clicks value),
// so it's captured as-is with no ambiguity to resolve.
//
// Email page (Phase 1) additions — uniqueOpens/uniqueOpenRate come from
// CM's UniqueOpened field, kept fully separate from TotalOpened above.
// delivered/deliveryRate are derived (recipients - bounces), since
// Campaign Monitor's summary has no explicit "Delivered" field — this is
// a real total minus a real total, never guessed. clickToOpenRate is
// Clicks ÷ UniqueOpened (unique-basis CTOR), only computed when
// UniqueOpened is a real positive number.
function extractMetrics(summary: CmCampaignSummary | null, recipients: number | null): {
  opens: number | null;
  clicks: number | null;
  openRate: number | null;
  clickRate: number | null;
  bounces: number | null;
  unsubscribes: number | null;
  uniqueOpens: number | null;
  uniqueOpenRate: number | null;
  delivered: number | null;
  deliveryRate: number | null;
  clickToOpenRate: number | null;
} {
  if (!summary) {
    return {
      opens: null, clicks: null, openRate: null, clickRate: null, bounces: null, unsubscribes: null,
      uniqueOpens: null, uniqueOpenRate: null, delivered: null, deliveryRate: null, clickToOpenRate: null,
    };
  }

  const opens = typeof summary.TotalOpened === 'number' ? summary.TotalOpened : null;
  const clicks = typeof summary.Clicks === 'number' ? summary.Clicks : null;
  const bounces = typeof summary.Bounced === 'number' ? summary.Bounced : null;
  const uniqueOpens = typeof summary.UniqueOpened === 'number' ? summary.UniqueOpened : null;
  const finalRecipients = recipients ?? summary.Recipients ?? null;

  const openRate = opens != null && finalRecipients && finalRecipients > 0 ? (opens / finalRecipients) * 100 : null;
  const clickRate = clicks != null && finalRecipients && finalRecipients > 0 ? (clicks / finalRecipients) * 100 : null;
  const uniqueOpenRate = uniqueOpens != null && finalRecipients && finalRecipients > 0 ? (uniqueOpens / finalRecipients) * 100 : null;

  const delivered = finalRecipients != null && bounces != null ? finalRecipients - bounces : null;
  const deliveryRate = delivered != null && finalRecipients && finalRecipients > 0 ? (delivered / finalRecipients) * 100 : null;
  const clickToOpenRate = clicks != null && uniqueOpens != null && uniqueOpens > 0 ? (clicks / uniqueOpens) * 100 : null;

  return {
    opens,
    clicks,
    openRate,
    clickRate,
    bounces,
    unsubscribes: typeof summary.Unsubscribed === 'number' ? summary.Unsubscribed : null,
    uniqueOpens,
    uniqueOpenRate,
    delivered,
    deliveryRate,
    clickToOpenRate,
  };
}

// Education 2026 campaign roll-up — documented, deterministic naming
// convention for Campaign Monitor send names, so segment/geography/
// audience-type membership is parsed exactly, never fuzzy-matched or
// guessed from a subject line. A send belongs to the roll-up ONLY when
// its name matches this exact 4-part pipe-delimited pattern:
//
//   Education 2026 | <Segment> | <Primary|Secondary> | <New|Existing>
//
// <Segment> is either a new-prospect geography (Scotland, Northern
// Ireland, Republic of Ireland) or an existing-customer brand name
// (Brentwood, Radio Links, Capcom, Irish Radio). For an existing-customer
// segment, the brand is taken from this parse and OVERRIDES parseEntity's
// result — Education sends to existing customers aren't expected to also
// follow the unrelated "MTech <CODE> -" naming convention.
//
// A send named "Education 2026 ..." that doesn't match this exact pattern
// still syncs normally as a regular email-send (visible on the Email
// page's individual-send table) but is left out of the Education roll-up
// entirely (all four fields null) — never guessed into a bucket.
const EDUCATION_CAMPAIGN_GROUP = 'education_2026';

const EDUCATION_GEOGRAPHIES = ['Scotland', 'Northern Ireland', 'Republic of Ireland'];
const EDUCATION_EXISTING_BRANDS: Record<string, Brand> = {
  Brentwood: 'brentwood',
  'Radio Links': 'radio-links',
  Capcom: 'capcom',
  'Irish Radio': 'ircl',
};
const EDUCATION_LEVELS = ['Primary', 'Secondary'];
const EDUCATION_AUDIENCE_TYPES = ['New', 'Existing'];

interface EducationSegment {
  campaignGroup: string;
  geography: string | null; // set only for a geography segment
  brandOverride: Brand | null; // set only for an existing-customer segment
  audienceLevel: string;
  audienceType: string;
}

export function parseEducationSegment(campaignName: string): EducationSegment | null {
  const parts = campaignName.split('|').map((p) => p.trim());
  if (parts.length !== 4) return null;
  const [groupLabel, segment, level, audienceType] = parts;
  if (!/^education\s*2026$/i.test(groupLabel)) return null;

  const matchedGeography = EDUCATION_GEOGRAPHIES.find((g) => g.toLowerCase() === segment.toLowerCase()) ?? null;
  const matchedBrandKey = Object.keys(EDUCATION_EXISTING_BRANDS).find((b) => b.toLowerCase() === segment.toLowerCase());
  if (!matchedGeography && !matchedBrandKey) return null;

  const matchedLevel = EDUCATION_LEVELS.find((l) => l.toLowerCase() === level.toLowerCase());
  if (!matchedLevel) return null;

  const matchedAudienceType = EDUCATION_AUDIENCE_TYPES.find((a) => a.toLowerCase() === audienceType.toLowerCase());
  if (!matchedAudienceType) return null;

  // Cross-check: a geography segment should be "New", a brand segment
  // should be "Existing" — a mismatch is still parsed (the explicit token
  // wins) but logged, since it likely means a naming mistake in Campaign
  // Monitor rather than a code bug.
  const expectedAudienceType = matchedGeography ? 'New' : 'Existing';
  if (matchedAudienceType !== expectedAudienceType) {
    console.warn(
      `[campaign-monitor] Education segment "${campaignName}" pairs ${matchedGeography ? matchedGeography : matchedBrandKey} with "${matchedAudienceType}" — expected "${expectedAudienceType}". Using the name as written.`
    );
  }

  return {
    campaignGroup: EDUCATION_CAMPAIGN_GROUP,
    geography: matchedGeography,
    brandOverride: matchedBrandKey ? EDUCATION_EXISTING_BRANDS[matchedBrandKey] : null,
    audienceLevel: matchedLevel,
    audienceType: matchedAudienceType,
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
  console.log('[campaign-monitor] AI Office campaigns:', aiCampaigns.map(c => `"${c.name}" (${c.id})`).join(', '));
  console.log('[campaign-monitor] Campaign map keys:', Array.from(campaignMap.keys()).slice(0, 20).join(', '));

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
        const { brand: parsedBrand, matched } = parseEntity(campaign.Name);
        if (!matched) {
          console.warn(`[campaign-monitor] "${campaign.Name}" didn't match a known naming pattern — filed under mtech.`);
        }

        const education = parseEducationSegment(campaign.Name);
        if (!education && /^education\s*2026/i.test(campaign.Name)) {
          console.warn(
            `[campaign-monitor] "${campaign.Name}" looks like an Education 2026 send but doesn't match the "Education 2026 | <Segment> | <Primary|Secondary> | <New|Existing>" naming convention — synced as a regular send, excluded from the Education roll-up.`
          );
        }
        // An Education existing-customer segment (Brentwood/Radio Links/
        // Capcom/Irish Radio) overrides the brand parsed from the
        // unrelated "MTech <CODE> -" convention above.
        const brand = education?.brandOverride ?? parsedBrand;

        let summary: CmCampaignSummary | null = null;
        try {
          summary = await getCampaignSummary(apiKey, campaign.CampaignID);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(`[campaign-monitor] failed to get summary for ${campaign.CampaignID} (${campaign.Name}): ${msg}`);
        }

        const recipients = campaign.TotalRecipients ?? summary?.Recipients ?? null;
        const cost = extractCost(summary);
        const {
          opens, clicks, openRate, clickRate, bounces, unsubscribes,
          uniqueOpens, uniqueOpenRate, delivered, deliveryRate, clickToOpenRate,
        } = extractMetrics(summary, recipients);
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
              console.log(`[campaign-monitor] Matched "${campaign.Name}" to campaign ${aiCampaignId} via word "${word}"`);
              break;
            }
          }
          if (!aiCampaignId) {
            console.log(`[campaign-monitor] No match for "${campaign.Name}" — words: ${cmWords.join(', ')}`);
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
            uniqueOpens,
            uniqueOpenRate,
            delivered,
            deliveryRate,
            clickToOpenRate,
            emailCampaignGroup: education?.campaignGroup ?? null,
            // Geography applies only to new-prospect segments — for an
            // existing-customer segment, the (already brand-overridden)
            // `brand` field above is itself the segment identity, so
            // geography stays null there rather than duplicating it.
            emailGeography: education?.geography ?? null,
            emailAudienceLevel: education?.audienceLevel ?? null,
            emailAudienceType: education?.audienceType ?? null,
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
            scheduleId: null,
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
            uniqueOpens,
            uniqueOpenRate,
            delivered,
            deliveryRate,
            clickToOpenRate,
            emailCampaignGroup: education?.campaignGroup ?? null,
            emailGeography: education?.geography ?? null,
            emailAudienceLevel: education?.audienceLevel ?? null,
            emailAudienceType: education?.audienceType ?? null,
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
