export type Brand = 'mtech' | 'brentwood' | 'radio-links' | 'capcom' | 'ircl' | 'idaro';

export type TaskType = 'task' | 'email-send';

export type TaskStatus =
  | 'backlog'
  | 'not-started'
  | 'in-progress'
  | 'waiting-approval'
  | 'waiting-john'
  | 'waiting-customer'
  | 'approved-ready'
  | 'blocked'
  | 'complete';

export type TaskPriority = 'high' | 'medium' | 'low';

export type CampaignStatus =
  | 'planning'
  | 'active'
  | 'on-hold'
  | 'completed';

export type CampaignScheduleStatus = 'planning' | 'scheduled' | 'live' | 'complete';

export type Vendor = 'motorola' | 'hytera' | 'airsys' | 'telox';

export type ClaimStatus = 'eligible' | 'pending' | 'approved' | 'rejected';

// Supplier funding / rewards ledger (e.g. XEVA Rewards) — a standalone
// entity, not a Campaign. Campaign's own vendor/scheme/cofundRate/
// claimStatus fields are scoped to that single campaign's co-funding rate;
// this is a general rebate/reward ledger independent of any campaign.
export type FundingRebateType = 'marketing-rebate' | 'loyalty-rebate' | 'loyalty-bonus' | 'other';
export type FundingClaimStatus = 'eligible' | 'submitted' | 'approved' | 'paid' | 'rejected';

export interface FundingBonusTier {
  id: string;
  threshold: number;
  bonusRate?: number | null;
  bonusAmount?: number | null;
  description?: string;
}

export interface FundingRecord {
  id: string;
  brand: Brand;
  vendor: string;
  schemeName: string;
  rebateType: FundingRebateType;
  rebatePercent: number | null;
  totalPurchases: number;
  amountEarned: number;
  amountClaimed: number;
  balanceToClaim: number;
  claimStatus: FundingClaimStatus;
  claimDeadline: string | null;
  creditedFrequency: string;
  targetSpend: number | null;
  percentOfTarget: number | null;
  bonusTiers: FundingBonusTier[];
  period: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  archivedAt: string | null;
}

export type AISkill =
  | 'Email Marketing Manager'
  | 'Website Manager'
  | 'SEO & PPC Manager'
  | 'Social Media Manager'
  | 'Marketing Director'
  | 'Proposal Writer'
  | 'Case Study Writer'
  | 'Funding & Rewards Manager';

export interface TaskHistoryEntry {
  id: string;
  action: 'completed' | 'reopened';
  timestamp: Date;
  previousStatus: TaskStatus;
  newStatus: TaskStatus;
}

export interface Task {
  id: string;
  title: string;
  notes: string;
  brand: Brand;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: Date | null;
  startDate: Date | null;
  campaignId: string | null;
  scheduleId: string | null; // Linked to CampaignSchedule for cascade updates
  createdAt: Date;
  completedAt: Date | null;
  previousStatus: TaskStatus | null;
  history: TaskHistoryEntry[];
  approvalRequired: boolean;
  approver: 'john' | 'lydia' | 'customer' | null;
  blockerReason: string | null;
  lastBriefGenerated: string | null;
  type: TaskType;
  recipients: number | null;
  subject: string | null;
  cost: number | null;
  currency: string | null;
  opens: number | null;
  clicks: number | null;
  openRate: number | null;
  clickRate: number | null;
  bounces: number | null;
  unsubscribes: number | null;
  uniqueOpens?: number | null;
  uniqueOpenRate?: number | null;
  delivered?: number | null;
  deliveryRate?: number | null;
  clickToOpenRate?: number | null;
  emailCampaignGroup?: string | null;
  emailGeography?: string | null;
  emailAudienceLevel?: string | null;
  emailAudienceType?: string | null;
  // The external system's own reference for a synced task (e.g. Campaign
  // Monitor's campaign ID for an email-send) — already transmitted by the
  // backend, just not previously declared on this type.
  externalId: string | null;
  // Where this task came from: 'campaign-monitor' for a genuine synced
  // send, 'seed'/'test-seed' for fixture data, or null for a manually
  // created task. Already transmitted by the backend — see
  // backend/src/db/taskRepository.ts.
  source: string | null;
}

export interface CampaignResults {
  emailOpenRate: number | null;
  emailClickRate: number | null;
  unsubscribes: number | null;
  landingPageVisits: number | null;
  enquiriesReceived: number | null;
  costToSend: number | null;
  notes: string;
  loggedAt: Date;
}

export interface PlanDocument {
  filename: string;
  content: string;
  uploadDate: Date;
  fileType: 'markdown' | 'pdf';
}

export interface ScheduleElement {
  date: string;
  element: string;
  status: CampaignScheduleStatus;
}

export interface CampaignSchedule {
  id: string;
  date: string;
  element: string;
  status: CampaignScheduleStatus;
  taskId?: string | null; // Linked task for cascade updates
}

export interface TrackingLink {
  id: string;
  entity: Brand;
  name: string;
  channel: string;
  landingPage: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent?: string | null;
  status?: string;
  clicks?: number;
}

export interface Campaign {
  id: string;
  name: string;
  brand: Brand;
  entities: Brand[];
  primaryIndustry: string;
  secondaryIndustry: string;
  theme: string;
  status: CampaignStatus;
  startDate: Date;
  endDate: Date;
  budget: number | null;
  spend: number;
  conversions: number;
  leads: number;
  engagement: number;
  colour: string;
  tasks: string[];
  reactive: boolean;
  notes: string;
  results: CampaignResults | null;
  planDocument?: PlanDocument;

  // Phase 1 fields
  industry?: string;
  recipients?: number | null;
  valueGenerated?: number | null;

  // Funding fields
  vendor?: Vendor | null;
  scheme?: string | null;
  cofundRate?: number | null;
  claimStatus?: ClaimStatus | null;

  // Tracking links (per-entity tracking)
  trackingLinks?: TrackingLink[];

  // Schedule milestones (supports both legacy ScheduleElement and new CampaignSchedule with IDs)
  schedule?: (ScheduleElement | CampaignSchedule)[];
}

export interface BriefGeneratorState {
  selectedSkill: AISkill;
  helpDescription: string;
}
