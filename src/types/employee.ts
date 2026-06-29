export type EmployeeStatus = 'available' | 'busy' | 'in-review' | 'idle' | 'offline';

export type IdleAnimation = 'typing' | 'thinking' | 'reading' | 'coffee';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  completedAt?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  emoji: string;
  deskNumber: number;
  status: EmployeeStatus;
  personality: string[];
  currentTask: Task | null;
  taskQueue: Task[];
  completedWork: Task[];
  workloadPercent: number;
  accentColor: string;
  idleAnimation: IdleAnimation;
}
