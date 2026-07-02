import type { Employee } from '@/types/employee';
import { TASK_STATUS_COLORS, EMPLOYEE_STATUS_COLORS, TASK_STATUS_LABELS, EMPLOYEE_STATUS_LABELS } from '@/types/employee';

interface TaskCardProps {
  employee: Employee;
  isActive: boolean;
}

export function TaskCard({ employee, isActive }: TaskCardProps) {
  const currentTask = employee.tasks?.[0];
  const statusColor = EMPLOYEE_STATUS_COLORS[employee.status];
  const statusLabel = EMPLOYEE_STATUS_LABELS[employee.status];

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '10px',
        border: `1.5px solid var(--border-color)`,
        padding: '12px',
        boxShadow: isActive ? '0 12px 24px rgba(249,112,31,0.25)' : '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: isActive ? 'translateY(-6px) scale(1.04)' : 'translateY(0) scale(1)',
        fontSize: '12px',
        color: 'var(--text-secondary)',
      }}
    >
      {/* Status indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '6px',
        }}
      >
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: statusColor,
            animation: isActive ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
          }}
        />
        <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-primary)' }}>{statusLabel}</span>
      </div>

      {/* Task info */}
      {currentTask ? (
        <div>
          <div
            style={{
              fontSize: '10px',
              fontWeight: '600',
              marginBottom: '4px',
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentTask.title}
          </div>
          <div
            style={{
              fontSize: '9px',
              display: 'flex',
              gap: '4px',
              marginBottom: '4px',
            }}
          >
            <span
              style={{
                padding: '2px 6px',
                borderRadius: '3px',
                backgroundColor: TASK_STATUS_COLORS[currentTask.status] + '22',
                color: TASK_STATUS_COLORS[currentTask.status],
                fontWeight: '600',
              }}
            >
              {TASK_STATUS_LABELS[currentTask.status]}
            </span>
            {currentTask.priority !== 'medium' && (
              <span
                style={{
                  padding: '2px 6px',
                  borderRadius: '3px',
                  backgroundColor: currentTask.priority === 'high' ? '#FF6B6B22' : '#8F919422',
                  color: currentTask.priority === 'high' ? '#FF6B6B' : '#8F9194',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                }}
              >
                {currentTask.priority}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div style={{ color: 'var(--text-tertiary)', fontSize: '10px', fontStyle: 'italic' }}>No active task</div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
