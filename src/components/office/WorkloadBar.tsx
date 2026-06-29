import { motion } from 'framer-motion';

interface WorkloadBarProps {
  percent: number;
  accentColor: string;
}

function getLabel(percent: number) {
  if (percent >= 85) return 'At capacity';
  if (percent >= 60) return 'Busy';
  if (percent >= 30) return 'Active';
  return 'Light';
}

export function WorkloadBar({ percent, accentColor }: WorkloadBarProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs" style={{ color: '#8F9194' }}>Workload</span>
        <span className="text-xs font-medium" style={{ color: accentColor }}>
          {getLabel(percent)}
        </span>
      </div>
      <div className="h-1.5 rounded-full w-full" style={{ backgroundColor: '#3a4f6a' }}>
        <motion.div
          className="h-1.5 rounded-full"
          style={{ backgroundColor: accentColor }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
