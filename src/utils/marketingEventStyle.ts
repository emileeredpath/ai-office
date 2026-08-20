import { CheckSquare, Mail, Flag, Landmark, Rocket, FlagOff, type LucideIcon } from 'lucide-react';
import type { MarketingEventKind } from '@/utils/marketingEvents';

// Restrained, consistent visual categories for the calendar — deliberately
// not "everything looks equally prominent" per the approved direction.
export const EVENT_KIND_LABEL: Record<MarketingEventKind, string> = {
  task: 'Task',
  email: 'Email',
  milestone: 'Milestone',
  funding: 'Funding',
  'campaign-start': 'Campaign start',
  'campaign-end': 'Campaign end',
};

export const EVENT_KIND_COLOR: Record<MarketingEventKind, string> = {
  task: 'var(--v2-purple)',
  email: '#3b82f6',
  milestone: 'var(--v2-green)',
  funding: 'var(--v2-orange)',
  'campaign-start': 'var(--v2-grey)',
  'campaign-end': 'var(--v2-grey)',
};

export const EVENT_KIND_ICON: Record<MarketingEventKind, LucideIcon> = {
  task: CheckSquare,
  email: Mail,
  milestone: Flag,
  funding: Landmark,
  'campaign-start': Rocket,
  'campaign-end': FlagOff,
};
