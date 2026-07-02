import type { Employee } from '@/types/employee';
import { EMPLOYEE_STATUS_COLORS, EMPLOYEE_STATUS_LABELS } from '@/types/employee';

interface DeskTaskCardProps {
  employee: Employee;
  isActive: boolean;
}

export function DeskTaskCard({ employee, isActive }: DeskTaskCardProps) {
  const statusColor = EMPLOYEE_STATUS_COLORS[employee.status];
  const statusLabel = EMPLOYEE_STATUS_LABELS[employee.status];
  const taskCount = employee.tasks?.length || 0;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: `1px solid var(--border-color)`,
        borderRadius: '6px',
        padding: '8px 10px',
        fontSize: '11px',
        transition: 'all 0.2s ease',
        boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 6px rgba(0,0,0,0.08)',
      }}
    >
      {/* Status with dot */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '4px',
        }}
      >
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: statusColor,
            flexShrink: 0,
            animation: isActive ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
          }}
        />
        <span style={{ fontWeight: '600', color: 'var(--text-primary)', flex: 1 }}>
          {statusLabel}
        </span>
        {taskCount > 0 && (
          <span
            style={{
              backgroundColor: 'var(--border-color)',
              borderRadius: '3px',
              padding: '1px 4px',
              fontSize: '10px',
              fontWeight: '600',
            }}
          >
            {taskCount}
          </span>
        )}
      </div>

      {/* Current task if available */}
      {employee.tasks?.[0] ? (
        <div style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {employee.tasks[0].title}
        </div>
      ) : (
        <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Waiting for Sandy</div>
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
