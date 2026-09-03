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
  // The real lookback window (days before "now") this run actually
  // queried Campaign Monitor for — persisted into audit_log alongside the
  // rest of this result so a later coverage check can genuinely determine
  // how far back continuous sync coverage reaches, rather than assuming
  // every historic sync used the current default. See
  // getCampaignMonitorCoverage in emailPerformance.ts.
  sinceDays: number;
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

// Top Links (Send Detail, on demand only — never part of the regular
// sync). Campaign Monitor's /clicks.json returns one record per real
// subscriber click (EmailAddress, IPAddress, Date, URL per CM's
// documented schema — unverified against a live account from this
// sandbox, see this file's header note). This function fetches those
// pages, aggregates them into { url, totalClicks, uniqueClicks } purely
// in local variables, and returns ONLY that aggregate — the raw
// per-subscriber records (every email address, every IP) are never
// logged, never persisted, and go out of scope the moment this function
// returns. uniqueClicks counts distinct EmailAddress values seen for
// that URL — a real, accurate unique-clicker count without the response
// ever naming which address it was.
interface CmClickRecord {
  EmailAddress?: string;
  URL?: string;
}

interface CmPagedResponse<T> {
  Results?: T[];
  NumberOfPages?: number;
}

const TOP_LINKS_PAGE_SIZE = 1000;
// Safety cap on pagination — 20,000 raw click records is far more than
// any single MTech send should realistically see; stops a runaway loop
// against an unexpectedly large or misbehaving response.
const TOP_LINKS_MAX_PAGES = 20;

async function fetchClickRecords(apiKey: string, campaignId: string): Promise<CmClickRecord[]> {
  const all: CmClickRecord[] = [];
  // Campaign Monitor's clicks.json requires a `date` parameter (clicks on
  // or after this date) — an early sentinel returns the send's full click
  // history rather than an arbitrary recent window.
  const earliestDate = '2000-01-01';
  for (let page = 1; page <= TOP_LINKS_MAX_PAGES; page++) {
    const path = `/campaigns/${campaignId}/clicks.json?date=${earliestDate}&page=${page}&pagesize=${TOP_LINKS_PAGE_SIZE}`;
    const json = await cmFetch<CmPagedResponse<CmClickRecord> | CmClickRecord[]>(path, apiKey);
    const pageResults = Array.isArray(json) ? json : (json.Results ?? []);
    all.push(...pageResults);
    const totalPages = Array.isArray(json) ? 1 : (json.NumberOfPages ?? 1);
    if (page >= totalPages || pageResults.length < TOP_LINKS_PAGE_SIZE) break;
  }
  return all;
}

export interface TopLinkRow {
  url: string;
  totalClicks: number;
  uniqueClicks: number;
}

export async function getTopLinksForSend(campaignId: string): Promise<TopLinkRow[]> {
  const apiKey = process.env.CAMPAIGN_MONITOR_API_KEY;
  if (!apiKey) throw new Error('Campaign Monitor is not configured — CAMPAIGN_MONITOR_API_KEY is not set.');

  const records = await fetchClickRecords(apiKey, campaignId);
  if (records.length === 0) return [];

  const byUrl = new Map<string, { total: number; emails: Set<string> }>();
  for (const record of records) {
    if (!record.URL) continue; // no URL on this record — can't attribute it, never guessed
    const entry = byUrl.get(record.URL) ?? { total: 0, emails: new Set<string>() };
    entry.total += 1;
    if (record.EmailAddress) entry.emails.add(record.EmailAddress);
    byUrl.set(record.URL, entry);
  }
  // `records` and every per-subscriber field it carried (EmailAddress,
  // and any other field Campaign Monitor's response includes) are never
  // referenced again after this point — only the aggregate below escapes
  // this function.
  return Array.from(byUrl.entries())
    .map(([url, { total, emails }]) => ({ url, totalClicks: total, uniqueClicks: emails.size }))
    .sort((a, b) => b.totalClicks - a.totalClicks)
    .slice(0, 20);
}

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

// Parse logic per the brief: IDARO is a product line (not a brand entity);
// everything else follows "MTech <CODE> - <name>".
const ENTITY_CODES: Record<string, Brand> = {
  BC: 'brentwood',
  RL: 'radio-links',
  CC: 'capcom',
  IRCL: 'ircl',
};

// Education 2026 campaign roll-up — parses the REAL Campaign Monitor
// naming convention already in use (confirmed live examples: "MTech IRCL
// - Education Solutions - High School - Brought Data - Northern
// Ireland", "MTech BC - Education Solutions - Primary Schools - Brought
// Data - Scotland", plus "(first 50)"/"(first 50 test)" test variants).
// Never requires renaming a send, and never fuzzy-matches a subject line
// — only exact, deterministic token matches inside the existing "MTech
// <CODE> - <free text>" prefix every send already carries (the same
// prefix parseEntity() above already parses for brand).
//
// Rules, applied to the free text after "MTech <CODE> - ":
//  1. Brand comes from the existing CODE (BC/RL/CC/IRCL) — same as every
//     other send, never overridden here. A send whose code isn't one of
//     the four known ones can't be safely attributed and is excluded.
//  2. Geography: an exact, case-insensitive match for "Scotland",
//     "Northern Ireland", or "Republic Of Ireland" anywhere in the free
//     text. Geography identifies WHICH region this send targets — it is
//     a separate dimension from audience source and is NEVER used to
//     infer New vs Existing.
//  3. No geography match, but the word "Education" appears anywhere in
//     the free text ⇒ still counts as Education campaign membership.
//  4. Neither a geography nor "Education" ⇒ not an Education send at all
//     ⇒ excluded, never guessed.
//  5. Level: "Primary" (from "Primary Schools") or "High School" (the
//     real token used for secondary-level sends, mapped to "Secondary")
//     — whichever whole-word/phrase token appears first. If geography or
//     "Education" matched but no level token is found, the send is
//     logged and excluded rather than guessed.
//  6. Audience source (New prospect vs Existing data) — resolved in this
//     order, never inferred from geography:
//       a. The whole-word/phrase "Brought Data" anywhere in the free
//          text ⇒ "New" — this is the real, explicit marker MTech uses
//          for purchased/prospected data on these sends.
//       b. An explicit "New" or "Existing" whole-word token (for sends
//          that don't use "Brought Data" wording) ⇒ that value.
//       c. Otherwise: "Unclassified" — never guessed. Surfaced clearly
//          on the Email page so it can be corrected.
//  7. Test sends: a trailing "(first 50)" or "(first 50 test)" (or any
//     "(... test)"/"(first N)" bracketed suffix) marks a real send that
//     was only sent to a small test slice of the list. These still sync
//     and still categorise normally (campaign/geography/level/audience
//     all still apply) but are flagged isTest — the Email page's
//     production Education totals exclude them by default so a partial
//     test batch never skews real campaign numbers, while they remain
//     visible in the individual-send table for anyone checking them.
//
// A send that doesn't match ANY of rules 1-5 still syncs normally as a
// regular email-send (visible on the Email page's individual-send table)
// — it's simply left out of the Education roll-up (all fields null).
const EDUCATION_CAMPAIGN_GROUP = 'education_2026';
// Canonical stored/display casing — matched case-insensitively against
// the source name, so this works regardless of whether Campaign Monitor
// has "Republic Of Ireland" or "Republic of Ireland" in the real name.
const EDUCATION_GEOGRAPHIES = ['Republic of Ireland', 'Northern Ireland', 'Scotland'];
const EDUCATION_TEST_SEND_RE = /\(\s*first\s*\d+\s*(test)?\s*\)/i;

// Shown to the user (via the Email page) as guidance for classifying
// audience source going forward.
export const EDUCATION_NAMING_GUIDANCE =
  'Audience source (New prospect vs Existing data) is never inferred from geography alone — they\'re separate dimensions. "Brought Data" anywhere in the Campaign Monitor send name is read as New prospect (the marker already used on the real Education sends); otherwise include an explicit "New" or "Existing" word. A trailing "(first 50)" / "(first 50 test)" marks a real test send — these still sync and categorise normally but are excluded from production Education totals by default. Any Education send that can\'t be confidently classified for audience source shows as "Unclassified" on the Email page rather than being guessed.';

interface EducationSegment {
  campaignGroup: string;
  geography: string | null; // set only for a recognised-geography segment
  audienceLevel: string;
  audienceType: 'New' | 'Existing' | 'Unclassified';
  isTest: boolean;
}

export function parseEducationSegment(campaignName: string): EducationSegment | null {
  const trimmedName = campaignName.trim();
  const match = trimmedName.match(/^MTech\s+(\w+)\s*-\s*(.+)$/i);
  if (!match) return null;
  const code = match[1].toUpperCase();
  if (!ENTITY_CODES[code]) return null; // unknown code — brand can't be safely attributed
  const rest = match[2];

  const geography = EDUCATION_GEOGRAPHIES.find((g) => rest.toLowerCase().includes(g.toLowerCase())) ?? null;
  const hasEducationKeyword = /\beducation\b/i.test(rest);
  if (!geography && !hasEducationKeyword) return null; // not an Education send

  let level: string | null = null;
  if (/\bprimary\b/i.test(rest)) level = 'Primary';
  else if (/\bhigh school\b/i.test(rest)) level = 'Secondary';
  else if (/\bsecondary\b/i.test(rest)) level = 'Secondary';
  if (!level) {
    console.warn(
      `[campaign-monitor] "${campaignName}" looks like an Education send (${geography ?? 'has "Education" in the name'}) but no Primary/High School/Secondary token found — excluded from the roll-up until the name includes one.`
    );
    return null;
  }

  let audienceType: 'New' | 'Existing' | 'Unclassified';
  if (/\bbrought data\b/i.test(rest)) {
    audienceType = 'New';
  } else if (/\bnew\b/i.test(rest)) {
    audienceType = 'New';
  } else if (/\bexisting\b/i.test(rest)) {
    audienceType = 'Existing';
  } else {
    audienceType = 'Unclassified';
    console.warn(
      `[campaign-monitor] "${campaignName}" is an Education send but audience source (New/Existing) can't be determined — shown as Unclassified. See EDUCATION_NAMING_GUIDANCE.`
    );
  }

  const isTest = EDUCATION_TEST_SEND_RE.test(trimmedName);

  return {
    campaignGroup: EDUCATION_CAMPAIGN_GROUP,
    geography,
    audienceLevel: level,
    audienceType,
    isTest,
  };
}

// Campaign name matching: maps a Campaign Monitor campaign's full normalized
// name to an AI Office campaign ID, for deterministic auto-matching only.
//
// This deliberately no longer includes the old word-fragment fallback (e.g.
// matching any Campaign Monitor send containing the word "repair" to
// whichever campaign happened to claim that word first). That fallback
// could silently produce a confident-looking attribution from a single
// >3-character word in common between two otherwise-unrelated campaign
// names — exactly the kind of weak match the data-integrity rules forbid.
// A send that doesn't exactly match a known campaign name now stays
// genuinely Unmatched (campaignId: null) rather than being guessed —
// unless/until a user explicitly maps it (see the manual mapping route in
// routes/analytics.ts and campaignMappingSource on TaskRecord).
function buildCampaignMap(aiCampaigns: Array<{ id: string; name: string }>): Map<string, string> {
  const map = new Map<string, string>();
  aiCampaigns.forEach((campaign) => {
    const normalized = campaign.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    map.set(normalized, campaign.id);
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
  const sinceDays = options.sinceDays ?? 7;
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
      sinceDays,
    };
  }

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
      sinceDays,
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

        // Education membership/geography/level/audience-type — see
        // parseEducationSegment's doc comment for exactly how this reads
        // the real "MTech <CODE> - <free text>" convention already in
        // use. Brand always comes from parseEntity above, never
        // overridden here.
        const education = parseEducationSegment(campaign.Name);

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

        // Match campaign to AI Office campaign by name — deterministic exact
        // match only (see buildCampaignMap's doc comment for why the old
        // word-fragment fallback was removed). No match means genuinely
        // Unmatched (null), not a guess.
        const normalizedCmName = campaign.Name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const aiCampaignId: string | null = campaignMap.get(normalizedCmName) || null;

        const existing = findTaskByExternalId(SOURCE, campaign.CampaignID);
        if (existing) {
          // Explicit mapping wins, always — a user-assigned campaignId (and
          // its 'manual' source) is never overwritten by this sync, whether
          // this run found a deterministic match or not. See
          // TaskRecord.campaignMappingSource's doc comment.
          const isManuallyMapped = existing.campaignMappingSource === 'manual';
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
            emailIsTest: education?.isTest ?? false,
            ...(isManuallyMapped
              ? {}
              : { campaignId: aiCampaignId, campaignMappingSource: aiCampaignId ? 'auto' : null }),
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
            emailIsTest: education?.isTest ?? false,
            campaignMappingSource: aiCampaignId ? 'auto' : null,
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
    sinceDays,
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
