import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { Employee } from '@/types/employee';
import { DeskAvatar } from './DeskAvatar';
import { StatusBadge } from './StatusBadge';
import { WorkloadBar } from './WorkloadBar';
import { Badge } from '@/components/ui/Badge';

interface DeskCardProps {
  employee: Employee;
  index: number;
}

export function DeskCard({ employee, index }: DeskCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      className="rounded-xl p-5 cursor-pointer relative overflow-hidden"
      style={{
        backgroundColor: '#1D2A3A',
        border: '1px solid #3a4f6a',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: 'easeOut' }}
      whileHover={{
        y: -4,
        boxShadow: `0 12px 36px rgba(0,0,0,0.5), 0 0 0 1px ${employee.accentColor}44`,
        transition: { duration: 0.2 },
      }}
      onClick={() => navigate(`/employee/${employee.id}`)}
    >
      {/* Desk number */}
      <span
        className="absolute top-3 right-3 text-xs font-mono opacity-30"
        style={{ color: '#B4B6B9' }}
      >
        #{employee.deskNumber.toString().padStart(2, '0')}
      </span>

      {/* Accent top bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
        style={{ backgroundColor: employee.accentColor }}
      />

      {/* Avatar */}
      <div className="flex justify-center mb-4 pt-1">
        <DeskAvatar
          emoji={employee.emoji}
          idleAnimation={employee.idleAnimation}
          accentColor={employee.accentColor}
        />
      </div>

      {/* Name */}
      <h3 className="text-sm font-semibold text-center mb-1" style={{ color: '#F0F4F8' }}>
        {employee.name}
      </h3>

      {/* Status */}
      <div className="flex justify-center mb-3">
        <StatusBadge status={employee.status} />
      </div>

      {/* Current task */}
      <div
        className="rounded-lg p-2.5 mb-3 text-xs min-h-[42px]"
        style={{ backgroundColor: '#243347' }}
      >
        {employee.currentTask ? (
          <p className="line-clamp-2 leading-relaxed" style={{ color: '#B4B6B9' }}>
            {employee.currentTask.title}
          </p>
        ) : (
          <p className="italic" style={{ color: '#8F9194' }}>No active task</p>
        )}
      </div>

      {/* Workload */}
      <WorkloadBar percent={employee.workloadPercent} accentColor={employee.accentColor} />

      {/* Queue count */}
      <div className="flex justify-between items-center mt-3">
        <span className="text-xs" style={{ color: '#8F9194' }}>
          {employee.taskQueue.length} queued
        </span>
        <Badge
          label={`${employee.completedWork.length} done`}
          color={employee.accentColor}
          small
        />
      </div>
    </motion.div>
  );
}
