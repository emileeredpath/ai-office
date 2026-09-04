// Campaign Source of Truth — Restoration migration (Dashboard Completion
// Phase 1).
//
// dashboard-v2's campaigns table was seeded from an incomplete
// reconstruction of the real app's data (see backend/src/scripts/seed.ts's
// own doc comment) rather than a genuine sync from production. A direct,
// read-only comparison of production's live SQLite database against
// dashboard-v2's preview database (both inspected manually in Railway)
// confirmed:
//   - 5 of the 6 seeded campaigns already carry the correct production id
//     (campaign-1, campaign-2, campaign-3, campaign-4, campaign--P43-q05Nu)
//     and need no id change here.
//   - "campaign-0" is NOT a real production record — it was added by an
//     earlier commit explicitly "for cascade testing". Production's real
//     Q3 Education Campaign is campaign-ggzz19_80Y, with different core
//     fields (budget £2,000, not campaign-0's £30,000) but a Google Ads
//     mapping (24149514165) that was genuinely added live in preview
//     against campaign-0 and must not be lost.
//   - Production also has two campaigns entirely missing from preview:
//     YESSS Electrical Webinar (campaign-xkvvYN9Zx8) and Haven Tender
//     (campaign-E2gh6wExaj).
//   - previewSeed.ts's four fictional preview-* demo campaigns are not
//     genuine data and must never surface in normal reporting.
//
// This migration is preview-ONLY and fully idempotent — every step is
// safe to re-run on every boot/redeploy:
//   - each insert is skipped once its target id already exists
//   - the campaign-0 -> campaign-ggzz19_80Y task repoint only touches rows
//     still pointing at campaign-0, so it becomes a no-op once done
//   - archiving is idempotent (setting archived=1 twice is harmless)
//
// Gated exactly like scripts/previewSeed.ts: DATABASE_PATH must contain
// "/preview/" (the confirmed live preview path is
// /data/preview/ai-office.db, on the ai-office-v2-preview-volume). This
// never runs against production, whose DATABASE_PATH has no such segment.
import { getCampaignById, insertCampaign, archiveCampaign } from '../db/campaignRepository.js';
import db from '../db/connection.js';
import type { Brand } from '../types.js';

const RECONSTRUCTED_EDUCATION_ID = 'campaign-0';
const REAL_EDUCATION_ID = 'campaign-ggzz19_80Y';

// CONFIRMED (2026-09) directly against production's live database via a
// read-only Railway SQLite connection — not estimated or derived. Do not
// adjust these without a fresh production read.
const REAL_EDUCATION_CORE = {
  id: REAL_EDUCATION_ID,
  name: 'Q3 Education Campaign',
  brand: 'mtech' as Brand,
  entities: ['brentwood', 'radio-links', 'capcom', 'ircl'] as Brand[],
  status: 'active' as const,
  startDate: '2026-08-05',
  endDate: '2026-08-31',
  budget: 2000,
  spend: 0,
  conversions: 0,
  leads: 0,
  recipients: null as number | null,
  valueGenerated: null as number | null,
  colour: '#8B5CF6',
};

const REAL_YESSS = {
  id: 'campaign-xkvvYN9Zx8',
  name: 'YESSS Electrical Webinar',
  brand: 'mtech' as Brand,
  entities: ['mtech'] as Brand[],
  status: 'planning' as const,
  startDate: '2026-08-06',
  endDate: '2026-09-18',
  budget: null as number | null,
  spend: 0,
  conversions: 0,
  leads: 0,
  recipients: null as number | null,
  valueGenerated: null as number | null,
  colour: '#2C7A4B',
};

const REAL_HAVEN_TENDER = {
  id: 'campaign-E2gh6wExaj',
  name: 'Haven Tender',
  brand: 'mtech' as Brand,
  entities: ['mtech', 'brentwood', 'idaro'] as Brand[],
  status: 'active' as const,
  startDate: '2026-08-07',
  endDate: '2026-08-17',
  budget: null as number | null,
  spend: 0,
  conversions: 0,
  leads: 0,
  recipients: null as number | null,
  valueGenerated: null as number | null,
  colour: '#B23A48',
};

export function runCampaignRestoration() {
  const dbPath = process.env.DATABASE_PATH || '';
  if (!dbPath.includes('/preview/')) {
    console.log(
      `[campaign-restoration] Skipped — DATABASE_PATH ("${dbPath}") does not contain "/preview/". ` +
        'Refusing to run against what does not look like the preview database.'
    );
    return;
  }

  db.exec('BEGIN');
  try {
    restoreEducationCampaign();
    insertRealCampaignIfMissing(REAL_YESSS);
    insertRealCampaignIfMissing(REAL_HAVEN_TENDER);
    archivePreviewDemoCampaigns();
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('[campaign-restoration] Failed, rolled back:', err);
    throw err;
  }
}

function insertRealCampaignIfMissing(core: typeof REAL_YESSS | typeof REAL_HAVEN_TENDER) {
  if (getCampaignById(core.id)) return;
  insertCampaign({
    id: core.id,
    name: core.name,
    brand: core.brand,
    entities: core.entities,
    status: core.status,
    startDate: core.startDate,
    endDate: core.endDate,
    budget: core.budget,
    spend: core.spend,
    conversions: core.conversions,
    leads: core.leads,
    recipients: core.recipients,
    valueGenerated: core.valueGenerated,
    colour: core.colour,
  });
  console.log(`[campaign-restoration] Restored ${core.id} (${core.name}) from production.`);
}

function restoreEducationCampaign() {
  const real = getCampaignById(REAL_EDUCATION_ID);
  const reconstructed = getCampaignById(RECONSTRUCTED_EDUCATION_ID);

  if (!real) {
    // Pull forward whatever attribution/schedule data actually exists on
    // the reconstructed record right now, rather than trusting a value
    // reported earlier is still exactly current — see DATA_INTEGRITY.md.
    // The confirmed Google Ads mapping is the fallback only for the
    // (should-never-happen) case where campaign-0 is already gone by the
    // time this runs, so the known real mapping is never lost either way.
    const googleAdsCampaignIds = reconstructed?.googleAdsCampaignIds?.length
      ? reconstructed.googleAdsCampaignIds
      : ['24149514165'];
    const campaignCode = reconstructed?.campaignCode ?? null;
    const ga4CampaignNames = reconstructed?.ga4CampaignNames ?? [];
    const trackingLinks = reconstructed?.trackingLinks ?? [];
    const schedule = reconstructed?.schedule ?? [];

    insertCampaign({
      id: REAL_EDUCATION_ID,
      name: REAL_EDUCATION_CORE.name,
      brand: REAL_EDUCATION_CORE.brand,
      entities: REAL_EDUCATION_CORE.entities,
      status: REAL_EDUCATION_CORE.status,
      startDate: REAL_EDUCATION_CORE.startDate,
      endDate: REAL_EDUCATION_CORE.endDate,
      budget: REAL_EDUCATION_CORE.budget,
      spend: REAL_EDUCATION_CORE.spend,
      conversions: REAL_EDUCATION_CORE.conversions,
      leads: REAL_EDUCATION_CORE.leads,
      recipients: REAL_EDUCATION_CORE.recipients,
      valueGenerated: REAL_EDUCATION_CORE.valueGenerated,
      colour: REAL_EDUCATION_CORE.colour,
      campaignCode,
      googleAdsCampaignIds,
      ga4CampaignNames,
      trackingLinks,
      schedule,
    });
    console.log(
      `[campaign-restoration] Restored ${REAL_EDUCATION_ID} (Q3 Education Campaign) from production, ` +
        `carrying forward Google Ads mapping ${JSON.stringify(googleAdsCampaignIds)} from ${RECONSTRUCTED_EDUCATION_ID}.`
    );
  }

  // Repoint every task still pointing at the reconstructed id — safe to
  // run every time: matches zero rows once already done.
  const repointResult = db
    .prepare('UPDATE tasks SET campaign_id = ? WHERE campaign_id = ?')
    .run(REAL_EDUCATION_ID, RECONSTRUCTED_EDUCATION_ID);
  if (repointResult.changes > 0) {
    console.log(`[campaign-restoration] Repointed ${repointResult.changes} task(s) from ${RECONSTRUCTED_EDUCATION_ID} to ${REAL_EDUCATION_ID}.`);
  }

  // Only archive once nothing references it any more, so there is never a
  // window where a task points at an archived campaign.
  const stillReferenced = db
    .prepare('SELECT COUNT(*) as n FROM tasks WHERE campaign_id = ?')
    .get(RECONSTRUCTED_EDUCATION_ID) as unknown as { n: number };
  if (stillReferenced.n === 0 && reconstructed && !reconstructed.archived) {
    archiveCampaign(RECONSTRUCTED_EDUCATION_ID);
    console.log(`[campaign-restoration] Archived ${RECONSTRUCTED_EDUCATION_ID} (reconstructed test record, superseded by ${REAL_EDUCATION_ID}).`);
  }
}

// Fictional demo data from previewSeed.ts is useful for exercising the
// Overview's Needs Your Attention rules on a preview deployment, but must
// never read as a genuine campaign — see DATA_INTEGRITY.md's rule that
// test/seed data must be clearly identifiable and excluded from real
// reporting. Archiving (not deleting) keeps every repository's default
// getAll(includeArchived=false) call — which is what every normal screen
// uses — excluding them automatically, while leaving the rows themselves
// recoverable/inspectable.
function archivePreviewDemoCampaigns() {
  const rows = db.prepare("SELECT id FROM campaigns WHERE id LIKE 'preview-%' AND archived = 0").all() as unknown as { id: string }[];
  for (const row of rows) {
    archiveCampaign(row.id);
  }
  if (rows.length > 0) {
    console.log(`[campaign-restoration] Archived ${rows.length} preview-* demo campaign(s) — not genuine data.`);
  }
}
