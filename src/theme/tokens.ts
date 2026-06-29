export const colors = {
  navy: '#1D2A3A',
  navySecondary: '#2E425B',
  grey: '#8F9194',
  greyLight: '#B4B6B9',
  orange: '#F9701F',
  orangeHover: '#e05e10',
  surface: '#1D2A3A',
  surface2: '#2E425B',
  surface3: '#243347',
  border: '#3a4f6a',
  textPrimary: '#F0F4F8',
  textMuted: '#8F9194',
  background: '#111B26',
} as const;

export const statusColors: Record<string, string> = {
  available: '#22c55e',
  busy: '#F9701F',
  'in-review': '#f59e0b',
  idle: '#8F9194',
  offline: '#4b5563',
};

export const statusLabels: Record<string, string> = {
  available: 'Available',
  busy: 'Busy',
  'in-review': 'In Review',
  idle: 'Idle',
  offline: 'Offline',
};

export const priorityColors: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#6b7280',
};

export const animations = {
  swayDuration: 3,
  floatDuration: 6,
  thinkDuration: 1.5,
  steamDuration: 2,
} as const;
