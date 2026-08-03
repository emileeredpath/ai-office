import { Router, type Request, type Response } from 'express';
import { syncCampaignMonitor } from '../services/campaignMonitor.js';
import { requireEdit } from '../middleware/session.js';
import { insertTask } from '../db/taskRepository.js';
import type { TaskRecord } from '../types.js';
import { nanoid } from 'nanoid';

const router = Router();

// Manual trigger — lets Emilee (or Claude, via the MCP tool) run the sync
// on demand instead of waiting for the weekly schedule, e.g. to verify a
// new CAMPAIGN_MONITOR_API_KEY actually works.
router.post('/sync', requireEdit, async (_req: Request, res: Response) => {
  const result = await syncCampaignMonitor();
  res.status(result.success ? 200 : 502).json(result);
});

// Seed test email-send data for Phase 3 calendar demo (development only)
router.post('/seed-test-data', async (_req: Request, res: Response) => {
  // Only allow in development or if explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_TEST_SEED !== 'true') {
    return res.status(403).json({ error: 'Test seeding not allowed in production' });
  }

  const sends = [
    { brand: 'brentwood' as const, date: '2026-08-05', recipients: 6044, cost: 72.73, subject: 'Brentwood Repair Email' },
    { brand: 'radio-links' as const, date: '2026-08-06', recipients: 3300, cost: 43.50, subject: 'Radio Links August Update' },
    { brand: 'capcom' as const, date: '2026-08-08', recipients: 1554, cost: 22.05, subject: 'Capcom Product Launch' },
    { brand: 'ircl' as const, date: '2026-08-10', recipients: 243, cost: 7.26, subject: 'IRCL Newsletter' },
    { brand: 'brentwood' as const, date: '2026-08-15', recipients: 4200, cost: 58.62, subject: 'Brentwood Service Notice' },
    { brand: 'radio-links' as const, date: '2026-08-20', recipients: 2800, cost: 39.50, subject: 'Radio Links Promotion' },
  ];

  const now = new Date().toISOString();
  let created = 0;

  try {
    sends.forEach(send => {
      const sentDate = send.date + 'T14:00:00Z';
      const task: TaskRecord = {
        id: `task-${nanoid(10)}`,
        title: send.subject,
        notes: `Test send for Phase 3 calendar demo — seeded ${now}.`,
        brand: send.brand,
        status: 'complete',
        priority: 'medium',
        deadline: send.date,
        startDate: send.date,
        campaignId: null,
        createdAt: now,
        completedAt: sentDate,
        previousStatus: null,
        history: [],
        approvalRequired: false,
        approver: null,
        blockerReason: null,
        lastBriefGenerated: null,
        source: 'test-seed',
        sourceConversationId: null,
        type: 'email-send',
        recipients: send.recipients,
        subject: send.subject,
        assignedTo: null,
        cost: send.cost,
        currency: 'GBP',
        externalId: null,
      };
      insertTask(task);
      created += 1;
    });

    res.json({ success: true, message: `Created ${created} test email-send tasks for August 2026.`, created });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
