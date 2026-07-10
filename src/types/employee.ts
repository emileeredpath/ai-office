export type EmployeeStatus =
  | 'available'
  | 'has_assigned_work'
  | 'awaiting_brief'
  | 'working'
  | 'waiting_approval'
  | 'blocked'
  | 'complete';

export type TaskStatus =
  | 'backlog'
  | 'assigned'
  | 'awaiting_brief'
  | 'in_progress'
  | 'waiting_review'
  | 'waiting_john_approval'
  | 'waiting_customer'
  | 'blocked'
  | 'complete';

export type IdleAnimation = 'typing' | 'thinking' | 'reading' | 'coffee';

export interface TaskNote {
  id: string;
  text: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  notes: TaskNote[];
  assignedBy?: 'sandy' | 'user';
  campaign?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  emoji: string;
  deskNumber: number;
  status: EmployeeStatus;
  personality: string[];
  tasks: Task[];
  accentColor: string;
  idleAnimation: IdleAnimation;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  assigned: 'Assigned',
  awaiting_brief: 'Awaiting Brief',
  in_progress: 'In Progress',
  waiting_review: 'Waiting for Review',
  waiting_john_approval: 'Waiting for John Approval',
  waiting_customer: 'Waiting for Customer',
  blocked: 'Blocked',
  complete: 'Complete',
};

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  available: 'Available',
  has_assigned_work: 'Has Assigned Work',
  awaiting_brief: 'Awaiting Brief',
  working: 'Working',
  waiting_approval: 'Waiting on Approval',
  blocked: 'Blocked',
  complete: 'Complete',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: '#8F9194',
  assigned: '#2196F3',
  awaiting_brief: '#9C6ADE',
  in_progress: '#F9701F',
  waiting_review: '#F5C518',
  waiting_john_approval: '#FF6B6B',
  waiting_customer: '#FF6B6B',
  blocked: '#E53935',
  complete: '#4CAF50',
};

export const EMPLOYEE_STATUS_COLORS: Record<EmployeeStatus, string> = {
  available: '#4CAF50',
  has_assigned_work: '#2196F3',
  awaiting_brief: '#9C6ADE',
  working: '#F9701F',
  waiting_approval: '#FF6B6B',
  blocked: '#E53935',
  complete: '#4CAF50',
};
