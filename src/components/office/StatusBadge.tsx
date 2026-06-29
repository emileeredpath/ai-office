import { motion } from 'framer-motion';
import type { EmployeeStatus } from '@/types/employee';
import { statusColors, statusLabels } from '@/theme/tokens';

interface StatusBadgeProps {
  status: EmployeeStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const color = statusColors[status];

  return (
    <span className="inline-flex items-center gap-1.5">
      <motion.span
        className="inline-block w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="text-xs font-medium" style={{ color }}>
        {statusLabels[status]}
      </span>
    </span>
  );
}
