import { randomUUID } from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import db from '../db/connection.js';
import { requireEdit } from '../middleware/session.js';

const router = Router();
const now = () => new Date().toISOString();

// These are the five sites in the approved brief, not a fixed limit. Settings
// can add more rows. Only the two audit items with an exact URL get one here.
const initialSites = [
  ['mtech', 'MTech Group', 'https://mtechglobal.co.uk/', 'mtech'],
  ['brentwood', 'MTech Brentwood Communications', 'https://www.brentwoodradios.co.uk/', 'brentwood'],
  ['radio-links', 'MTech Radio Links Communications', 'https://www.radio-links.co.uk/', 'radio-links'],
  ['capcom', 'MTech Capcom Communications', 'https://www.capcom.co.uk/', 'capcom'],
  ['ircl', 'MTech Irish Radio Communications', 'https://ircl.ie/', 'ircl'],
] as const;

const initialBacklog = [
  ['MG-001', 'mtech', 'Homepage proposition', 'Homepage proposition does not clearly communicate the full MTech ecosystem.', 'Rework the homepage proposition around communications, security and audio visual technology.', 'High', 'https://mtechglobal.co.uk/'],
  ['BC-001', 'brentwood', 'Navigation complexity', 'Competing navigation choices may make the right route hard to find.', 'Investigate simpler journeys around customer intent, including buying, hiring, coverage, protection, security, AV and service.', 'High', 'https://www.brentwoodradios.co.uk/'],
  ['BC-002', 'brentwood', 'Case study integration', 'Customer evidence is not consistently positioned within commercial journeys.', 'Connect relevant sector and solution pages to case studies and contextual enquiry actions.', 'High', null],
  ['BC-003', 'brentwood', 'Historic case study content', 'Some historic case studies reference older equipment.', 'Keep useful proof while clearly separating historic delivery from current recommendations.', 'Medium', null],
  ['BC-004', 'brentwood', 'Generic enquiry journeys', 'Generic actions may not match visitor intent.', 'Test specific actions such as radio quotes, hire pricing, trials, site surveys and callbacks.', 'High', null],
  ['CC-001', 'capcom', 'Generic CTA usage', 'Commercial pages rely heavily on generic Contact Us actions.', 'Introduce intent-specific actions for radio sales, hire, body worn cameras, coverage and consultation; track each separately.', 'Critical', null],
  ['CC-002', 'capcom', 'Conversion journey', 'The point of drop-off is not yet established.', 'Review traffic, landing page, action, form, submission and lead stages to identify where visitors leave.', 'Critical', null],
  ['CC-003', 'capcom', 'Content quality', 'Copy quality and currency need checking.', 'Complete a live content quality check for spelling, outdated copy and inconsistent terminology.', 'High', null],
  ['CC-004', 'capcom', 'PPC landing pages', 'Broad pages may not serve high-intent paid traffic well.', 'Create dedicated landing pages where appropriate after checking the campaign intent.', 'Critical', null],
  ['RL-001', 'radio-links', 'Technical website check', 'Website and tracking operation need confirmation.', 'Check accessibility, indexability, redirects, analytics, conversions, forms, call tracking and PPC destinations.', 'Critical', null],
  ['RL-002', 'radio-links', 'Lead journey', 'The source of the reported low lead volume is not yet established.', 'Review traffic through commercial page, action, enquiry and lead; check traffic quality, page, form and tracking friction.', 'Critical', null],
  ['RL-003', 'radio-links', 'Commercial positioning', 'Relevant strengths may not be prominent in commercial journeys.', 'Bring verified heritage, event, radio, AV and support evidence into relevant journeys.', 'High', null],
  ['RL-004', 'radio-links', 'PPC landing pages', 'Priority services need high-intent paid destinations.', 'Create relevant PPC landing pages for priority services.', 'Critical', null],
  ['IRCL-001', 'ircl', 'Wider MTech offering', 'Positioning remains focused on traditional radio services.', 'Improve discovery of relevant wider MTech services.', 'High', null],
  ['IRCL-002', 'ircl', 'Education cross selling', 'The connected education journey needs development.', 'Connect two way radios, body worn cameras, smart sensors, service and repair to a clear enquiry route.', 'High', null],
] as const;

const insertSite = db.prepare('INSERT OR IGNORE INTO website_sites (id, name, url, brand, created_at) VALUES (?, ?, ?, ?, ?)');
const insertBacklog = db.prepare(`INSERT OR IGNORE INTO website_improvements
  (id, site_id, page_url, improvement_type, title, reason, priority, status, created_at, updated_at)
  VALUES (?, ?, ?, 'Audit recommendation', ?, ?, ?, 'Suggested', ?, ?)`);
for (const [id, name, url, brand] of initialSites) insertSite.run(id, name, url, brand, now());
for (const [id, site, title, reason, change, priority, pageUrl] of initialBacklog) {
  insertBacklog.run(id, site, pageUrl, title, `${reason} Recommendation: ${change}`, priority, now(), now());
}

const optionalText = z.string().trim().max(4000).nullable();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();
const httpsUrl = z.string().url().refine((value) => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash;
}, 'Use a clean HTTPS page URL without a query string or fragment.');
const improvementFields = z.object({
  siteId: z.string().trim().min(1),
  channel: z.enum(['website', 'ppc']),
  pageUrl: httpsUrl.nullable(),
  pageType: optionalText,
  improvementType: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(500),
  reason: z.string().trim().max(4000),
  priority: z.enum(['Critical', 'High', 'Medium', 'Low']),
  status: z.enum(['Suggested', 'Approved', 'Planned', 'In Progress', 'Live', 'Measuring', 'Successful', 'Inconclusive', 'Reverted']),
  implementedOn: date,
  implementedBy: optionalText,
  baselineStart: date,
  baselineEnd: date,
  measurementStart: date,
  measurementEnd: date,
  confidence: z.enum(['Low', 'Medium', 'High']).nullable(),
  competingActivity: optionalText,
  notes: optionalText,
});

const columns: Record<keyof z.infer<typeof improvementFields>, string> = {
  siteId: 'site_id', channel: 'channel', pageUrl: 'page_url', pageType: 'page_type', improvementType: 'improvement_type',
  title: 'title', reason: 'reason', priority: 'priority', status: 'status', implementedOn: 'implemented_on',
  implementedBy: 'implemented_by', baselineStart: 'baseline_start', baselineEnd: 'baseline_end',
  measurementStart: 'measurement_start', measurementEnd: 'measurement_end', confidence: 'confidence',
  competingActivity: 'competing_activity', notes: 'notes',
};

function validPageSite(siteId: string, pageUrl: string | null): boolean {
  if (!pageUrl) return true;
  const site = db.prepare('SELECT url FROM website_sites WHERE id = ?').get(siteId) as { url: string } | undefined;
  return Boolean(site && new URL(site.url).hostname === new URL(pageUrl).hostname);
}

function validWindows(value: { baselineStart?: string | null; baselineEnd?: string | null; measurementStart?: string | null; measurementEnd?: string | null }): boolean {
  return (!value.baselineStart || !value.baselineEnd || value.baselineStart <= value.baselineEnd)
    && (!value.measurementStart || !value.measurementEnd || value.measurementStart <= value.measurementEnd)
    && (!value.baselineEnd || !value.measurementStart || value.baselineEnd < value.measurementStart);
}

function audit(action: string, id: string, previous: unknown, current: unknown, resourceType = 'website_improvement') {
  db.prepare(`INSERT INTO audit_log (id, action, resource_type, resource_id, previous_value, new_value, source, confirmed, automatic, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'dashboard', 1, 0, ?)`)
    .run(randomUUID(), action, resourceType, id, previous ? JSON.stringify(previous) : null, JSON.stringify(current), now());
}

router.get('/sites', (_req: Request, res: Response) => {
  res.json({ success: true, result: db.prepare('SELECT * FROM website_sites ORDER BY name').all() });
});

router.post('/sites', requireEdit, (req: Request, res: Response) => {
  const parsed = z.object({ name: z.string().trim().min(1).max(200), url: httpsUrl }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ success: false, message: 'Enter a name and valid website URL.' }); return; }
  const id = randomUUID();
  try {
    db.prepare('INSERT INTO website_sites (id, name, url, brand, created_at) VALUES (?, ?, ?, NULL, ?)')
      .run(id, parsed.data.name, parsed.data.url, now());
  } catch { res.status(409).json({ success: false, message: 'This website already exists.' }); return; }
  const row = db.prepare('SELECT * FROM website_sites WHERE id = ?').get(id);
  audit('create', id, null, row, 'website_site');
  res.status(201).json({ success: true, result: row });
});

router.get('/', (req: Request, res: Response) => {
  const area = req.query.area;
  const query = area === 'website'
    ? "SELECT * FROM website_improvements WHERE channel = 'website' ORDER BY created_at DESC, id"
    : area === 'ppc'
      ? "SELECT * FROM website_improvements WHERE channel = 'ppc' OR (channel = 'website' AND id IN ('CC-004', 'RL-004')) ORDER BY created_at DESC, id"
      : 'SELECT * FROM website_improvements ORDER BY created_at DESC, id';
  res.json({ success: true, result: db.prepare(query).all() });
});

router.post('/', requireEdit, (req: Request, res: Response) => {
  const parsed = improvementFields.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ success: false, message: 'Invalid improvement details.' }); return; }
  if (!db.prepare('SELECT id FROM website_sites WHERE id = ?').get(parsed.data.siteId)) {
    res.status(400).json({ success: false, message: 'Choose a saved website.' }); return;
  }
  if (!validPageSite(parsed.data.siteId, parsed.data.pageUrl) || !validWindows(parsed.data)) {
    res.status(400).json({ success: false, message: 'Page URL must belong to the website and measurement dates must be in order.' }); return;
  }
  const id = `WI-${randomUUID().slice(0, 8)}`;
  const values = Object.entries(parsed.data) as [keyof typeof columns, string | null][];
  const names = values.map(([key]) => columns[key]);
  const timestamp = now();
  db.prepare(`INSERT INTO website_improvements (id, ${names.join(', ')}, created_at, updated_at) VALUES (${Array(names.length + 3).fill('?').join(', ')})`)
    .run(id, ...values.map(([, value]) => value), timestamp, timestamp);
  const row = db.prepare('SELECT * FROM website_improvements WHERE id = ?').get(id);
  audit('create', id, null, row);
  res.status(201).json({ success: true, result: row });
});

router.patch('/:id', requireEdit, (req: Request, res: Response) => {
  const previous = db.prepare('SELECT * FROM website_improvements WHERE id = ?').get(req.params.id);
  if (!previous) { res.status(404).json({ success: false, message: 'Improvement not found.' }); return; }
  const parsed = improvementFields.partial().safeParse(req.body);
  if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
    res.status(400).json({ success: false, message: 'Invalid improvement details.' }); return;
  }
  if (parsed.data.siteId && !db.prepare('SELECT id FROM website_sites WHERE id = ?').get(parsed.data.siteId)) {
    res.status(400).json({ success: false, message: 'Choose a saved website.' }); return;
  }
  const prior = previous as Record<string, string | null>;
  const siteId = parsed.data.siteId ?? prior.site_id!;
  const pageUrl = parsed.data.pageUrl === undefined ? prior.page_url : parsed.data.pageUrl;
  const dates = {
    baselineStart: parsed.data.baselineStart === undefined ? prior.baseline_start : parsed.data.baselineStart,
    baselineEnd: parsed.data.baselineEnd === undefined ? prior.baseline_end : parsed.data.baselineEnd,
    measurementStart: parsed.data.measurementStart === undefined ? prior.measurement_start : parsed.data.measurementStart,
    measurementEnd: parsed.data.measurementEnd === undefined ? prior.measurement_end : parsed.data.measurementEnd,
  };
  if (!validPageSite(siteId, pageUrl) || !validWindows(dates)) {
    res.status(400).json({ success: false, message: 'Page URL must belong to the website and measurement dates must be in order.' }); return;
  }
  const values = Object.entries(parsed.data) as [keyof typeof columns, string | null][];
  db.prepare(`UPDATE website_improvements SET ${values.map(([key]) => `${columns[key]} = ?`).join(', ')}, updated_at = ? WHERE id = ?`)
    .run(...values.map(([, value]) => value), now(), req.params.id);
  const row = db.prepare('SELECT * FROM website_improvements WHERE id = ?').get(req.params.id);
  audit('update', req.params.id, previous, row);
  res.json({ success: true, result: row });
});

export default router;
