import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { executeAction } from '../services/actionService.js';
import {
  getAllBusinessObjectives,
  getDashboardContextForDate,
  getDailyDashboardSnapshot,
  saveDailyDashboardSnapshot,
} from '../db/marketingOsRepository.js';
import { getAllCampaigns, insertCampaign, getCampaignProgress } from '../db/campaignRepository.js';
import { syncCampaignMonitor } from '../services/campaignMonitor.js';
import { getBrandTraffic } from '../services/ga4.js';
import type { ActionResult } from '../types.js';
import { nanoid } from 'nanoid';

// The MCP tools are thin wrappers around the exact same executeAction() used
// by POST /api/actions — same validation, same duplicate detection, same
// confirmation gate, same audit log. Nothing here talks to the database
// directly.

function toToolResult(result: ActionResult) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    isError: !result.success && !result.requires_confirmation,
  };
}

const BRANDS = ['mtech', 'brentwood', 'radio-links', 'capcom', 'ircl', 'idaro'] as const;
const STATUSES = [
  'backlog',
  'not-started',
  'in-progress',
  'waiting-approval',
  'waiting-john',
  'waiting-customer',
  'approved-ready',
  'blocked',
  'complete',
] as const;
const PRIORITIES = ['high', 'medium', 'low'] as const;
const TASK_TYPES = ['task', 'email-send'] as const;

export function createAiOfficeMcpServer(): McpServer {
  const server = new McpServer({
    name: 'ai-office',
    version: '1.0.0',
  });

  server.registerTool(
    'ai_office_create_task',
    {
      title: 'Create a task in AI Office',
      description:
        'Create a new task in AI Office. If a similarly-titled task already exists, this returns possible_duplicates instead of creating one — re-call with confirm_duplicate: true if the user wants to proceed anyway.',
      inputSchema: {
        title: z.string().min(1).describe('Short task title'),
        notes: z.string().optional().describe('Free-text notes or brief for the task'),
        brand: z.enum(BRANDS).optional(),
        priority: z.enum(PRIORITIES).optional(),
        status: z.enum(STATUSES).optional(),
        deadline: z.string().optional().describe('ISO date, e.g. 2026-08-01'),
        campaign_id: z.string().optional(),
        confirm_duplicate: z.boolean().optional().describe('Set true to create even if a similar task already exists'),
        source_conversation_id: z.string().optional(),
        type: z.enum(TASK_TYPES).optional().describe('Set to "email-send" to log a sent email rather than a general task — use with recipients so it shows on the send calendar'),
        recipients: z.number().int().min(0).optional().describe('Recipient count, for an email-send'),
        subject: z.string().optional().describe('Email subject line, for an email-send'),
      },
    },
    async (input) => {
      const result = executeAction({
        action: 'create_task',
        payload: input,
        source: { type: 'claude', conversationId: input.source_conversation_id },
      });
      return toToolResult(result);
    }
  );

  server.registerTool(
    'ai_office_update_task',
    {
      title: 'Update a task in AI Office',
      description:
        'Update fields on an existing task. This is a higher-risk action: the first call (without confirmed: true) returns a preview of the change instead of applying it — show that to the user, then re-call with confirmed: true once they agree.',
      inputSchema: {
        task_id: z.string().min(1),
        title: z.string().optional(),
        notes: z.string().optional(),
        brand: z.enum(BRANDS).optional(),
        priority: z.enum(PRIORITIES).optional(),
        status: z.enum(STATUSES).optional(),
        deadline: z.string().optional(),
        campaign_id: z.string().nullable().optional(),
        type: z.enum(TASK_TYPES).optional(),
        recipients: z.number().int().min(0).nullable().optional(),
        subject: z.string().nullable().optional(),
        confirmed: z.boolean().optional().describe('Set true only after the user has approved the previewed change'),
      },
    },
    async ({ confirmed, ...payload }) => {
      const result = executeAction({
        action: 'update_task',
        payload,
        source: { type: 'claude' },
        confirmed,
      });
      return toToolResult(result);
    }
  );

  server.registerTool(
    'ai_office_complete_task',
    {
      title: 'Mark a task complete in AI Office',
      description:
        'Mark a task complete. Higher-risk action: the first call (without confirmed: true) returns a preview instead of applying it — confirm with the user first, then re-call with confirmed: true.',
      inputSchema: {
        task_id: z.string().min(1),
        confirmed: z.boolean().optional().describe('Set true only after the user has approved completing this task'),
      },
    },
    async ({ task_id, confirmed }) => {
      const result = executeAction({
        action: 'complete_task',
        payload: { task_id },
        source: { type: 'claude' },
        confirmed,
      });
      return toToolResult(result);
    }
  );

  server.registerTool(
    'ai_office_search_workspace',
    {
      title: 'Search AI Office tasks',
      description: 'Search tasks by keyword, status, or brand. Read-only.',
      inputSchema: {
        query: z.string().optional().describe('Free-text search across title and notes'),
        status: z.enum(STATUSES).optional(),
        brand: z.enum(BRANDS).optional(),
        type: z.enum(TASK_TYPES).optional().describe('Filter to "email-send" to list logged sends only'),
        limit: z.number().int().min(1).max(50).optional(),
      },
    },
    async (input) => {
      const result = executeAction({
        action: 'search_workspace',
        payload: input,
      });
      return toToolResult(result);
    }
  );

  server.registerTool(
    'ai_office_get_context',
    {
      title: "Get today's AI Office context",
      description:
        'Get a concise summary of what the user is working on: tasks due today, overdue tasks, tasks waiting for approval, and tasks in progress. Read-only — use this before answering questions like "what am I working on today?" or "what is overdue?" instead of guessing.',
      inputSchema: {},
    },
    async () => {
      const result = executeAction({
        action: 'get_workspace_context',
        payload: {},
      });
      return toToolResult(result);
    }
  );

  server.registerTool(
    'ai_office_list_campaigns',
    {
      title: 'List AI Office campaigns',
      description:
        'List all campaigns with their id, name, brand(s), status, and task progress. Read-only — use this to find a campaign_id before creating or tagging a task against it, or before creating a new campaign (to check one doesn\'t already exist).',
      inputSchema: {},
    },
    async () => {
      try {
        const campaigns = getAllCampaigns().map((c) => ({
          id: c.id,
          name: c.name,
          brand: c.brand,
          entities: c.entities,
          status: c.status,
          startDate: c.startDate,
          endDate: c.endDate,
          ...getCampaignProgress(c.id),
        }));
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ success: true, result: campaigns }, null, 2) }],
          isError: false,
        };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: String(err) }) }],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'ai_office_create_campaign',
    {
      title: 'Create a campaign in AI Office',
      description:
        'Create a new campaign in AI Office. Campaigns and tasks share the same database as the dashboard, so this appears immediately on the Campaigns page. Check ai_office_list_campaigns first to avoid creating a duplicate.',
      inputSchema: {
        name: z.string().min(1).describe('Campaign name'),
        brand: z.enum(BRANDS).describe('Primary brand'),
        entities: z.array(z.enum(BRANDS)).optional().describe('All brands this campaign spans — defaults to just the primary brand'),
        primaryIndustry: z.string().optional(),
        secondaryIndustry: z.string().optional(),
        theme: z.string().optional(),
        status: z.enum(['planning', 'active', 'on-hold', 'completed']).optional(),
        startDate: z.string().describe('ISO date, e.g. 2026-08-01'),
        endDate: z.string().describe('ISO date, e.g. 2026-09-30'),
        budget: z.number().optional(),
        colour: z.string().optional().describe('Hex colour for the campaign, e.g. #3B82F6'),
        reactive: z.boolean().optional(),
        notes: z.string().optional(),
      },
    },
    async (input) => {
      try {
        const campaign = insertCampaign(input);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                { success: true, result: { id: campaign.id, name: campaign.name }, message: `Campaign "${campaign.name}" created.` },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: String(err) }) }],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'ai_office_update_campaign',
    {
      title: 'Update a campaign in AI Office',
      description:
        'Update fields on an existing campaign, including its Actual Spend (£). This is a higher-risk action: the first call (without confirmed: true) returns a preview instead of applying it — show that to the user, then re-call with confirmed: true once they agree. Note: actualSpend is overwritten automatically the next time a linked task\'s cost changes (via ai_office_create_task / ai_office_update_task with campaign_id set) — prefer setting task costs over setting actualSpend directly where a task exists for the spend.',
      inputSchema: {
        campaign_id: z.string().min(1),
        name: z.string().optional(),
        status: z.enum(['planning', 'active', 'on-hold', 'completed']).optional(),
        startDate: z.string().optional().describe('ISO date, e.g. 2026-08-01'),
        endDate: z.string().optional().describe('ISO date, e.g. 2026-09-30'),
        budget: z.number().nullable().optional(),
        actualSpend: z.number().optional().describe('Actual spend in £ — the "Actual Spend (£)" field on the campaign card'),
        entities: z.array(z.enum(BRANDS)).optional(),
        colour: z.string().optional().describe('Hex colour for the campaign, e.g. #3B82F6'),
        notes: z.string().optional(),
        confirmed: z.boolean().optional().describe('Set true only after the user has approved the previewed change'),
      },
    },
    async ({ confirmed, ...payload }) => {
      const result = executeAction({
        action: 'update_campaign',
        payload,
        source: { type: 'claude' },
        confirmed,
      });
      return toToolResult(result);
    }
  );

  server.registerTool(
    'ai_office_create_tracking_link',
    {
      title: 'Create a UTM tracking link on a campaign',
      description:
        'Create one UTM tracking link on a campaign\'s Tracking Links tab. Always creates directly (no confirmation step), but skips and reports rather than duplicating if a link with the same landing page URL and full UTM set already exists on that campaign. For loading more than one link at once, use ai_office_import_tracking_links instead.',
      inputSchema: {
        campaign_id: z.string().min(1),
        entity: z.enum(BRANDS).describe('Which brand entity this link is for'),
        link_name: z.string().min(1).describe('Label for the link, e.g. "Wave 1 Repair – Repair Page"'),
        channel: z.string().min(1).describe('e.g. Email, PPC, Social, Website'),
        landing_page_url: z.string().min(1).describe('Destination URL — preserve any #anchor fragment exactly'),
        utm_source: z.string().min(1),
        utm_medium: z.string().min(1),
        utm_campaign: z.string().min(1),
        utm_content: z.string().optional(),
      },
    },
    async (input) => {
      const result = executeAction({
        action: 'create_tracking_link',
        payload: input,
        source: { type: 'claude' },
      });
      return toToolResult(result);
    }
  );

  const trackingLinkItemShape = {
    entity: z.enum(BRANDS).describe('Which brand entity this link is for'),
    link_name: z.string().min(1).describe('Label for the link, e.g. "Wave 1 Repair – Repair Page"'),
    channel: z.string().min(1).describe('e.g. Email, PPC, Social, Website'),
    landing_page_url: z.string().min(1).describe('Destination URL — preserve any #anchor fragment exactly'),
    utm_source: z.string().min(1),
    utm_medium: z.string().min(1),
    utm_campaign: z.string().min(1),
    utm_content: z.string().optional(),
  };

  server.registerTool(
    'ai_office_import_tracking_links',
    {
      title: 'Bulk-import UTM tracking links into a campaign',
      description:
        'Create many UTM tracking links on one campaign in a single call — e.g. loading a full CSV of tracking links. Reuses the same per-link validation and duplicate-skipping as ai_office_create_tracking_link, so re-running the same import is safe and adds nothing the second time. Returns a created/skipped count, not a per-link confirmation.',
      inputSchema: {
        campaign_id: z.string().min(1),
        links: z.array(z.object(trackingLinkItemShape)).min(1).describe('One entry per tracking link — entity is set per-link since a campaign can span multiple brands'),
      },
    },
    async (input) => {
      const result = executeAction({
        action: 'import_tracking_links',
        payload: input,
        source: { type: 'claude' },
      });
      return toToolResult(result);
    }
  );

  // Funding & Rewards Tools — a standalone ledger of supplier funding/rebate
  // schemes (e.g. XEVA Rewards), deliberately not modelled as campaigns.
  const REBATE_TYPES = ['marketing-rebate', 'loyalty-rebate', 'loyalty-bonus', 'other'] as const;
  const FUNDING_CLAIM_STATUSES = ['eligible', 'submitted', 'approved', 'paid', 'rejected'] as const;
  const bonusTierShape = {
    threshold: z.number().describe('Spend/purchase threshold that unlocks this tier'),
    bonusRate: z.number().nullable().optional().describe('% bonus at this tier'),
    bonusAmount: z.number().nullable().optional().describe('Flat bonus amount at this tier'),
    description: z.string().optional(),
  };

  server.registerTool(
    'ai_office_create_funding_record',
    {
      title: 'Create a supplier funding/rewards record',
      description:
        'Create a new funding/rewards record (e.g. an XEVA Rewards scheme) — tracks rebate accrual and claim status for a brand/vendor scheme, independent of any campaign. Creates directly, no confirmation required.',
      inputSchema: {
        brand: z.enum(BRANDS),
        vendor: z.string().min(1).describe('e.g. "XEVA"'),
        scheme_name: z.string().min(1).describe('e.g. "XEVA Rewards"'),
        rebate_type: z.enum(REBATE_TYPES).optional().describe('Defaults to "other" if omitted'),
        rebate_percent: z.number().min(0).max(100).optional(),
        total_purchases: z.number().min(0).optional().describe('Total qualifying purchases in £'),
        amount_earned: z.number().min(0).optional(),
        amount_claimed: z.number().min(0).optional(),
        claim_status: z.enum(FUNDING_CLAIM_STATUSES).optional().describe('Defaults to "eligible" if omitted'),
        claim_deadline: z.string().optional().describe('ISO date'),
        credited_frequency: z.string().optional().describe('e.g. "Quarterly", "Auto"'),
        target_spend: z.number().min(0).optional().describe('Spend target this scheme is measured against'),
        bonus_tiers: z.array(z.object(bonusTierShape)).optional(),
        notes: z.string().optional(),
      },
    },
    async (input) => {
      const result = executeAction({
        action: 'create_funding_record',
        payload: input,
        source: { type: 'claude' },
      });
      return toToolResult(result);
    }
  );

  server.registerTool(
    'ai_office_update_funding_record',
    {
      title: 'Update a supplier funding/rewards record',
      description:
        'Update fields on an existing funding/rewards record. Higher-risk action: the first call (without confirmed: true) returns a preview instead of applying it — show that to the user, then re-call with confirmed: true once they agree.',
      inputSchema: {
        funding_record_id: z.string().min(1),
        brand: z.enum(BRANDS).optional(),
        vendor: z.string().optional(),
        scheme_name: z.string().optional(),
        rebate_type: z.enum(REBATE_TYPES).optional(),
        rebate_percent: z.number().min(0).max(100).optional(),
        total_purchases: z.number().min(0).optional(),
        amount_earned: z.number().min(0).optional(),
        amount_claimed: z.number().min(0).optional(),
        claim_status: z.enum(FUNDING_CLAIM_STATUSES).optional(),
        claim_deadline: z.string().optional(),
        credited_frequency: z.string().optional(),
        target_spend: z.number().min(0).optional(),
        bonus_tiers: z.array(z.object(bonusTierShape)).optional(),
        notes: z.string().optional(),
        confirmed: z.boolean().optional().describe('Set true only after the user has approved the previewed change'),
      },
    },
    async ({ confirmed, ...payload }) => {
      const result = executeAction({
        action: 'update_funding_record',
        payload,
        source: { type: 'claude' },
        confirmed,
      });
      return toToolResult(result);
    }
  );

  server.registerTool(
    'ai_office_list_funding_records',
    {
      title: 'List supplier funding/rewards records',
      description:
        'List all funding/rewards records (e.g. XEVA Rewards) with brand, vendor, scheme, rebate figures, and claim status. Read-only.',
      inputSchema: {},
    },
    async () => {
      const result = executeAction({
        action: 'list_funding_records',
        payload: {},
        source: { type: 'claude' },
      });
      return toToolResult(result);
    }
  );

  // Generic Entity Access — see the Generic MCP Access brief. These reach
  // every registered entity (task, campaign, tracking_link, funding_record,
  // business_objective, quick_capture_item, document; wave1_metric and
  // audit_log read-only) through one small set of tools instead of a
  // bespoke tool per feature. The existing ai_office_create_task /
  // update_campaign / create_tracking_link / etc. tools above are untouched
  // and keep working exactly as before — this is an additional, more
  // general path onto the same data, not a replacement.
  server.registerTool(
    'ai_office_describe_schema',
    {
      title: 'Describe an entity\'s fields (generic access)',
      description:
        'Call with no entity to list every entity type the generic tools can reach (task, campaign, tracking_link, funding_record, business_objective, quick_capture_item, document, plus the read-only wave1_metric and audit_log). Call with an entity name for its full field list — names, types, which are required, valid enum values — so you know what create_record/update_record will accept before calling them. Read-only.',
      inputSchema: {
        entity: z.string().optional().describe('Omit to list all entity types; provide one for its field list'),
      },
    },
    async (input) => {
      const result = executeAction({ action: 'describe_schema', payload: input, source: { type: 'claude' } });
      return toToolResult(result);
    }
  );

  server.registerTool(
    'ai_office_list_records',
    {
      title: 'List records of any entity type (generic access)',
      description:
        'List records for any entity registered with the generic access layer. Call ai_office_describe_schema first if unsure what filters an entity supports (e.g. task takes campaignId/brand/status; funding_record takes brand/claimStatus/vendor). Archived records are excluded unless filters.includeArchived is true. Read-only.',
      inputSchema: {
        entity: z.string().min(1).describe('e.g. "task", "campaign", "funding_record", "tracking_link", "business_objective", "quick_capture_item", "document", "wave1_metric", "audit_log"'),
        filters: z.record(z.any()).optional().describe('Entity-specific filter fields — see ai_office_describe_schema for what each entity accepts'),
      },
    },
    async (input) => {
      const result = executeAction({ action: 'list_records', payload: input, source: { type: 'claude' } });
      return toToolResult(result);
    }
  );

  server.registerTool(
    'ai_office_get_record',
    {
      title: 'Get one record by id (generic access)',
      description: 'Fetch a single record of any entity type by id. Read-only.',
      inputSchema: {
        entity: z.string().min(1),
        id: z.string().min(1),
      },
    },
    async (input) => {
      const result = executeAction({ action: 'get_record', payload: input, source: { type: 'claude' } });
      return toToolResult(result);
    }
  );

  server.registerTool(
    'ai_office_create_record',
    {
      title: 'Create a record of any entity type (generic access)',
      description:
        'Create a new record for any writable entity. Call ai_office_describe_schema first to see required/optional fields and valid enum values for that entity. Higher-risk action: the first call (without confirmed: true) returns a preview instead of creating it — show that to the user, then re-call with confirmed: true once they agree. This applies even to entities whose bespoke tool (e.g. ai_office_create_task) creates directly without a preview — the generic path is deliberately stricter.',
      inputSchema: {
        entity: z.string().min(1),
        fields: z.record(z.any()).describe('Field values for the new record — see ai_office_describe_schema'),
        confirmed: z.boolean().optional().describe('Set true only after the user has approved the previewed record'),
      },
    },
    async ({ confirmed, ...payload }) => {
      const result = executeAction({ action: 'create_record', payload, source: { type: 'claude' }, confirmed });
      return toToolResult(result);
    }
  );

  server.registerTool(
    'ai_office_update_record',
    {
      title: 'Update a record of any entity type (generic access)',
      description:
        'Update fields on an existing record of any writable entity. Higher-risk action: the first call (without confirmed: true) returns a preview of current values vs. changes instead of applying it — show that to the user, then re-call with confirmed: true once they agree.',
      inputSchema: {
        entity: z.string().min(1),
        id: z.string().min(1),
        fields: z.record(z.any()).describe('Only the fields being changed'),
        confirmed: z.boolean().optional().describe('Set true only after the user has approved the previewed change'),
      },
    },
    async ({ confirmed, ...payload }) => {
      const result = executeAction({ action: 'update_record', payload, source: { type: 'claude' }, confirmed });
      return toToolResult(result);
    }
  );

  server.registerTool(
    'ai_office_delete_record',
    {
      title: 'Archive (soft-delete) a record of any entity type (generic access)',
      description:
        'Archive a record — this is a soft delete: the row is never physically removed, it\'s just excluded from normal listings, and can be brought back with ai_office_restore_record. Higher-risk action: the first call (without confirmed: true) returns a preview instead of applying it — show that to the user, then re-call with confirmed: true once they agree.',
      inputSchema: {
        entity: z.string().min(1),
        id: z.string().min(1),
        confirmed: z.boolean().optional().describe('Set true only after the user has approved the archive'),
      },
    },
    async ({ confirmed, ...payload }) => {
      const result = executeAction({ action: 'delete_record', payload, source: { type: 'claude' }, confirmed });
      return toToolResult(result);
    }
  );

  server.registerTool(
    'ai_office_restore_record',
    {
      title: 'Restore an archived record of any entity type (generic access)',
      description:
        'Undo an ai_office_delete_record archive, bringing the record back into normal listings. Higher-risk action: the first call (without confirmed: true) returns a preview instead of applying it — show that to the user, then re-call with confirmed: true once they agree.',
      inputSchema: {
        entity: z.string().min(1),
        id: z.string().min(1),
        confirmed: z.boolean().optional().describe('Set true only after the user has approved the restore'),
      },
    },
    async ({ confirmed, ...payload }) => {
      const result = executeAction({ action: 'restore_record', payload, source: { type: 'claude' }, confirmed });
      return toToolResult(result);
    }
  );

  // MarketingOS Tools
  server.registerTool(
    'marketingos_get_objectives',
    {
      title: 'Get business objectives from MarketingOS',
      description:
        'Retrieve all business objectives for the current year. Use this before generating dashboards or making marketing recommendations. Read-only.',
      inputSchema: {},
    },
    async () => {
      try {
        const objectives = getAllBusinessObjectives();
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ success: true, result: objectives }, null, 2) }],
          isError: false,
        };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: String(err) }) }],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'marketingos_get_context',
    {
      title: 'Get context for generating a dashboard',
      description:
        'Retrieve the user-provided context for a specific date. This includes current tasks, recent activity, sales feedback, performance observations, and decisions awaiting attention. Use this when generating a daily dashboard.',
      inputSchema: {
        date: z.string().describe('ISO date string (YYYY-MM-DD)'),
      },
    },
    async ({ date }) => {
      try {
        const context = getDashboardContextForDate(date);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ success: true, result: context }, null, 2) }],
          isError: false,
        };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: String(err) }) }],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'marketingos_generate_dashboard',
    {
      title: 'Generate today\'s dashboard',
      description:
        'Analyze business objectives, context, and recent activity to generate today\'s priorities, identify risks and opportunities, and provide a strategic recommendation. This saves the dashboard snapshot to MarketingOS. Use only after the user has provided context.',
      inputSchema: {
        date: z.string().describe('ISO date string (YYYY-MM-DD)'),
        analysis: z.object({
          businessObjectiveStatus: z.array(
            z.object({
              objectiveId: z.string(),
              title: z.string(),
              status: z.enum(['on-track', 'at-risk', 'off-track']),
              progress: z.number().min(0).max(100),
              risks: z.array(z.string()),
            })
          ),
          priorities: z.array(
            z.object({
              rank: z.number().int().min(1).max(5),
              action: z.string(),
              why: z.string(),
              objectiveSupported: z.string(),
              deadline: z.string().optional(),
              expectedImpact: z.string(),
              confidence: z.number().min(0).max(1),
              evidence: z.array(z.string()),
            })
          ),
          needsAttention: z.array(z.string()),
          opportunities: z.array(z.string()),
          claudeRecommendation: z.object({
            recommendation: z.string(),
            reasoning: z.string(),
            evidence: z.array(z.string()),
            expectedOutcome: z.string(),
          }),
          confidenceNotes: z.string(),
          sourcesUsed: z.array(z.string()),
        }),
      },
    },
    async ({ date, analysis }) => {
      try {
        saveDailyDashboardSnapshot({
          id: nanoid(),
          date,
          businessObjectiveStatus: analysis.businessObjectiveStatus,
          priorities: analysis.priorities,
          needsAttention: analysis.needsAttention,
          opportunities: analysis.opportunities,
          claudeRecommendation: analysis.claudeRecommendation,
          confidenceNotes: analysis.confidenceNotes,
          generatedAt: new Date().toISOString(),
          sourcesUsed: analysis.sourcesUsed,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ success: true, message: 'Dashboard generated and saved' }, null, 2),
            },
          ],
          isError: false,
        };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: String(err) }) }],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'ai_office_sync_campaign_monitor',
    {
      title: 'Sync Campaign Monitor sends into AI Office',
      description:
        'Pull sent campaigns from the last N days (default 7) out of Campaign Monitor, map each to an MTech brand entity by its naming convention, and upsert them as email-send tasks — same effect as the weekly scheduled sync, run on demand. Safe to re-run: existing sends are updated in place rather than duplicated. Requires CAMPAIGN_MONITOR_API_KEY to be set on the server.',
      inputSchema: {
        since_days: z.number().int().min(1).max(90).optional().describe('How many days back to pull sends from — defaults to 7'),
      },
    },
    async ({ since_days }) => {
      const result = await syncCampaignMonitor({ sinceDays: since_days });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.success,
      };
    }
  );

  server.registerTool(
    'ai_office_get_website_traffic',
    {
      title: 'Get per-brand GA4 website traffic',
      description:
        'Fetch live active users and sessions, month-to-date, from each brand entity\'s GA4 property (Brentwood, Radio Links, Capcom, IRCL). Requires GA4_SERVICE_ACCOUNT_JSON and at least one GA4_PROPERTY_ID_* env var on the server.',
      inputSchema: {},
    },
    async () => {
      const result = await getBrandTraffic();
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        isError: !result.configured || result.errors.length > 0,
      };
    }
  );

  return server;
}
