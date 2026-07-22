import { TaskStatus } from '@/types/index';

interface StatusBadgeProps {
  status: TaskStatus;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  'backlog': 'Backlog',
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  'waiting-approval': 'Waiting',
  'waiting-john': 'Waiting for John',
  'waiting-customer': 'Waiting Customer',
  'approved-ready': 'Ready',
  'blocked': 'Blocked',
  'complete': 'Complete',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const label = STATUS_LABELS[status];

  return <span className={`badge badge-${status.replace('_', '-')}`}>{label}</span>;
}
