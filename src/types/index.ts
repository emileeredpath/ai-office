export type Brand = 'mtech' | 'brentwood' | 'radio-links' | 'capcom' | 'ircl';

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

export type AISkill =
  | 'Email Marketing Manager'
  | 'Website Manager'
  | 'SEO & PPC Manager'
  | 'Social Media Manager'
  | 'Marketing Director'
  | 'Proposal Writer'
  | 'Case Study Writer'
  | 'Funding & Rewards Manager';

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
  createdAt: Date;
  completedAt: Date | null;
  approvalRequired: boolean;
  approver: 'john' | 'lydia' | 'customer' | null;
  blockerReason: string | null;
  lastBriefGenerated: string | null;
}

export interface Campaign {
  id: string;
  name: string;
  brand: Brand;
  primaryIndustry: string;
  secondaryIndustry: string;
  theme: string;
  status: CampaignStatus;
  startDate: Date;
  endDate: Date;
  budget: number | null;
  spend: number; // actual spend to date
  conversions: number;
  leads: number;
  engagement: number; // percentage or count
  colour: string;
  tasks: string[];
  reactive: boolean;
  notes: string;
}

export interface BriefGeneratorState {
  selectedSkill: AISkill;
  helpDescription: string;
}
