import { Router, type Request, type Response } from 'express';
import { getBrandTraffic, getSocialTraffic, getEnquiries, getEducationCampaignAttribution, getCampaignGa4Attribution, getGa4CampaignNamesInUse } from '../services/ga4.js';
import { syncWave1Ga4, syncWave1Infinity } from '../services/wave1Sync.js';
import { getMetricsByCampaignAndDate } from '../db/wave1PerformanceRepository.js';
import { getEmailPerformance, getCampaignMonitorCoverage } from '../services/emailPerformance.js';
import { fetchInfinityCalls } from '../services/infinity.js';
import { getGoogleAdsPerformance } from '../services/googleAds.js';
import { getSearchConsolePerformance } from '../services/searchConsole.js';
import type { Brand } from '../types.js';

// Wave 1 analytics routes — GA4 and Infinity integration
const router = Router();

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_BRANDS: Brand[] = ['mtech', 'brentwood', 'radio-links', 'capcom', 'ircl', 'idaro'];

// General GA4 website traffic (V2 Overview/Performance/Reports — see
// getBrandTraffic's own doc comment). startDate/endDate represent the
// caller's resolved calendar period (e.g. the frontend's global Period
// selector) — this route never approximates a period with a rolling day
// count. Both are optional and must be provided together; if either is
// missing or malformed, falls back to the service's own month-to-date
// default rather than erroring, since a slightly-wrong default is safer
// than breaking the page. "All time" should be passed explicitly as an
// early fixed date (see GA4_EARLIEST_SUPPORTED_DATE in services/ga4.ts)
// rather than an unbounded range.
router.get('/ga4', async (req: Request, res: Response) => {
  const rawStart = req.query.startDate as string | undefined;
  const rawEnd = req.query.endDate as string | undefined;
  const validRange = rawStart && rawEnd && ISO_DATE_RE.test(rawStart) && ISO_DATE_RE.test(rawEnd);
  const result = await getBrandTraffic(validRange ? rawStart : undefined, validRange ? rawEnd : undefined);
  res.json(result);
});

// GA4 Social Traffic (Phase 1) — website sessions/users GA4 attributes to
// Organic/Paid Social, by network (raw sessionSource) and top landing
// pages. A separate query from /ga4 above — never touches or reuses that
// endpoint's response, so Website Users/Sessions there are unaffected by
// this addition. Same startDate/endDate contract (genuine resolved
// calendar period; falls back to month-to-date if missing/malformed).
router.get('/ga4-social', async (req: Request, res: Response) => {
  const rawStart = req.query.startDate as string | undefined;
  const rawEnd = req.query.endDate as string | undefined;
  const validRange = rawStart && rawEnd && ISO_DATE_RE.test(rawStart) && ISO_DATE_RE.test(rawEnd);
  const result = await getSocialTraffic(validRange ? rawStart : undefined, validRange ? rawEnd : undefined);
  res.json(result);
});

// GA4 Enquiries (Phase 1) — real, verified key events only (see
// getEnquiries's own doc comment for exactly which events, per brand,
// and why). A separate query from /ga4 and /ga4-social above — never
// touches or reuses either endpoint's response. Same startDate/endDate
// contract (genuine resolved calendar period; falls back to
// month-to-date if missing/malformed).
router.get('/ga4-enquiries', async (req: Request, res: Response) => {
  const rawStart = req.query.startDate as string | undefined;
  const rawEnd = req.query.endDate as string | undefined;
  const validRange = rawStart && rawEnd && ISO_DATE_RE.test(rawStart) && ISO_DATE_RE.test(rawEnd);
  const result = await getEnquiries(validRange ? rawStart : undefined, validRange ? rawEnd : undefined);
  res.json(result);
});

// Education 2026 campaign downstream attribution (Email page) — real GA4
// sessions/enquiries filtered to the campaign's own tagged links (see
// getEducationCampaignAttribution's own doc comment). A fully separate
// query from /ga4-enquiries above — never touches or reuses it. Same
// startDate/endDate contract as every other analytics route.
router.get('/education-campaign', async (req: Request, res: Response) => {
  const rawStart = req.query.startDate as string | undefined;
  const rawEnd = req.query.endDate as string | undefined;
  const validRange = rawStart && rawEnd && ISO_DATE_RE.test(rawStart) && ISO_DATE_RE.test(rawEnd);
  const result = await getEducationCampaignAttribution(validRange ? rawStart : undefined, validRange ? rawEnd : undefined);
  res.json(result);
});

// Generic per-campaign GA4 attribution (Campaign Attribution phase, slice
// 2) — see getCampaignGa4Attribution's own doc comment. brand and at least
// one campaignName are required; campaignNames is comma-separated real
// values a user explicitly entered on the AI Office campaign record
// (never derived from the campaign's display name). Same startDate/endDate
// contract as every other analytics route.
router.get('/campaign-ga4', async (req: Request, res: Response) => {
  const brand = req.query.brand as string | undefined;
  const rawNames = req.query.campaignNames as string | undefined;
  const rawStart = req.query.startDate as string | undefined;
  const rawEnd = req.query.endDate as string | undefined;
  const validRange = rawStart && rawEnd && ISO_DATE_RE.test(rawStart) && ISO_DATE_RE.test(rawEnd);

  if (!brand || !VALID_BRANDS.includes(brand as Brand)) {
    res.status(400).json({ configured: false, result: null, error: 'A valid brand is required.' });
    return;
  }
  const campaignNames = (rawNames ?? '').split(',').map((n) => n.trim()).filter((n) => n.length > 0);
  if (campaignNames.length === 0) {
    res.status(400).json({ configured: false, result: null, error: 'At least one campaignNames value is required.' });
    return;
  }

  const result = await getCampaignGa4Attribution(brand as Brand, campaignNames, validRange ? rawStart : undefined, validRange ? rawEnd : undefined);
  res.json(result);
});

// Real GA4 campaign names with genuine session activity this period, for
// one brand — see getGa4CampaignNamesInUse's own doc comment. Feeds
// Attribution Health's "GA4 campaigns unlinked" gap. Same startDate/
// endDate contract as every other analytics route.
router.get('/ga4-campaign-names', async (req: Request, res: Response) => {
  const brand = req.query.brand as string | undefined;
  const rawStart = req.query.startDate as string | undefined;
  const rawEnd = req.query.endDate as string | undefined;
  const validRange = rawStart && rawEnd && ISO_DATE_RE.test(rawStart) && ISO_DATE_RE.test(rawEnd);

  if (!brand || !VALID_BRANDS.includes(brand as Brand)) {
    res.status(400).json({ configured: false, campaignNames: [], error: 'A valid brand is required.' });
    return;
  }

  const result = await getGa4CampaignNamesInUse(brand as Brand, validRange ? rawStart : undefined, validRange ? rawEnd : undefined);
  res.json(result);
});

// Google Ads (Phase 1) — real campaign performance for Brentwood and Radio
// Links only (see getGoogleAdsPerformance's own doc comment). A fully
// separate integration from GA4/GA4 Enquiries above — Google Ads
// "conversions" is never presented as equivalent to GA4 Enquiries. Same
// startDate/endDate contract as every other analytics route.
router.get('/google-ads', async (req: Request, res: Response) => {
  const rawStart = req.query.startDate as string | undefined;
  const rawEnd = req.query.endDate as string | undefined;
  const validRange = rawStart && rawEnd && ISO_DATE_RE.test(rawStart) && ISO_DATE_RE.test(rawEnd);
  const result = await getGoogleAdsPerformance(validRange ? rawStart : undefined, validRange ? rawEnd : undefined);
  res.json(result);
});

// Search Console (Phase 1) — real organic search performance (clicks,
// impressions, CTR, average position, top queries, top landing pages) for
// the entities with a verified Search Console property (see
// getSearchConsolePerformance's own doc comment). A fully separate
// integration from GA4/GA4 Enquiries/Google Ads above — never implies a
// Search Console click caused a GA4 Enquiry. Same startDate/endDate
// contract as every other analytics route.
router.get('/search-console', async (req: Request, res: Response) => {
  const rawStart = req.query.startDate as string | undefined;
  const rawEnd = req.query.endDate as string | undefined;
  const validRange = rawStart && rawEnd && ISO_DATE_RE.test(rawStart) && ISO_DATE_RE.test(rawEnd);
  const result = await getSearchConsolePerformance(validRange ? rawStart : undefined, validRange ? rawEnd : undefined);
  res.json(result);
});

// Real Campaign Monitor email performance (V2 Overview/Performance/Reports
// — see getEmailPerformance's own doc comment). Same startDate/endDate
// contract as /ga4 above: a genuine resolved calendar period, never a
// rolling-day approximation. Falls back to month-to-date if the range is
// missing or malformed.
router.get('/campaign-monitor', (req: Request, res: Response) => {
  const rawStart = req.query.startDate as string | undefined;
  const rawEnd = req.query.endDate as string | undefined;
  const validRange = rawStart && rawEnd && ISO_DATE_RE.test(rawStart) && ISO_DATE_RE.test(rawEnd);
  let startDate = rawStart;
  let endDate = rawEnd;
  if (!validRange) {
    const now = new Date();
    endDate = now.toISOString().slice(0, 10);
    startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  }
  const result = getEmailPerformance(startDate as string, endDate as string);
  res.json(result);
});

// Genuine Campaign Monitor sync coverage/freshness — see
// getCampaignMonitorCoverage's doc comment. Not period-scoped (coverage
// is a property of the sync history itself, not of any one report range).
router.get('/campaign-monitor/coverage', (_req: Request, res: Response) => {
  res.json(getCampaignMonitorCoverage());
});

// Real, entity-attributed Infinity call records (V2 Call Tracking page —
// see fetchInfinityCalls's own doc comment). Same startDate/endDate
// contract as /ga4 and /campaign-monitor above: a genuine resolved
// calendar period, never a rolling-day approximation. Falls back to
// month-to-date if the range is missing or malformed. Unlike /wave1/calls
// below, this is never scoped to a specific campaign — Infinity has no
// identifier for one — and each call record carries its real dgrpName-
// derived brand (or null if that dgrpName isn't a confirmed mapping yet).
router.get('/infinity-calls', async (req: Request, res: Response) => {
  const rawStart = req.query.startDate as string | undefined;
  const rawEnd = req.query.endDate as string | undefined;
  const validRange = rawStart && rawEnd && ISO_DATE_RE.test(rawStart) && ISO_DATE_RE.test(rawEnd);
  const result = await fetchInfinityCalls(validRange ? rawStart : undefined, validRange ? rawEnd : undefined);
  res.json(result);
});

// Wave 1 performance metrics from GA4 (clicks, page views, form submissions, conversion rates by brand)
router.get('/wave1/performance', async (req: Request, res: Response) => {
  try {
    const campaignId = (req.query.campaignId as string) || undefined;
    const ga4Result = await syncWave1Ga4(campaignId);

    res.json({
      configured: ga4Result.configured,
      ga4: ga4Result.metrics,
      errors: ga4Result.errors,
      lastSynced: ga4Result.lastSynced,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// Wave 1 call tracking metrics from Infinity
router.get('/wave1/calls', async (_req: Request, res: Response) => {
  try {
    const infinityResult = await syncWave1Infinity();

    res.json({
      configured: infinityResult.configured,
      metrics: infinityResult.metrics,
      errors: infinityResult.errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// Get historical Wave 1 metrics for a campaign
router.get('/wave1/history', (req: Request, res: Response) => {
  try {
    const campaignId = (req.query.campaignId as string) || 'q3_education_wave1_repair';
    const startDate = (req.query.startDate as string) || '2026-08-12';
    const endDate = (req.query.endDate as string) || new Date().toISOString().split('T')[0];

    const metrics = getMetricsByCampaignAndDate(campaignId, startDate, endDate);
    res.json({ metrics });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export default router;
