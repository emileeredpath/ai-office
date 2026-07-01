import type { Employee } from '@/types/employee';
import { EMPLOYEE_STATUS_COLORS } from '@/types/employee';

interface PersonFigureProps {
  employee: Employee;
  size?: 'sm' | 'md' | 'lg';
  highlighted?: boolean;
}

const SIZES = {
  sm: { head: 14, body: 22, gap: 2 },
  md: { head: 18, body: 30, gap: 3 },
  lg: { head: 26, body: 44, gap: 4 },
};

export function PersonFigure({ employee, size = 'md', highlighted }: PersonFigureProps) {
  const s = SIZES[size];
  const statusColor = EMPLOYEE_STATUS_COLORS[employee.status];
  const isWorking = employee.status === 'working';

  return (
    <div className="flex flex-col items-center" title={`${employee.name} — ${employee.role}`}>
      <div
        className="relative flex flex-col items-center"
        style={{
          animation: isWorking ? 'personBob 1.8s ease-in-out infinite' : 'none',
        }}
      >
        {/* Head */}
        <div
          className="rounded-full"
          style={{
            width: s.head,
            height: s.head,
            background: `linear-gradient(150deg, ${employee.accentColor}, ${shade(employee.accentColor)})`,
            boxShadow: highlighted ? `0 0 12px ${employee.accentColor}` : 'none',
          }}
        />
        {/* Body */}
        <div
          style={{
            width: s.body,
            height: s.body,
            marginTop: s.gap,
            background: `linear-gradient(180deg, ${employee.accentColor}CC, ${employee.accentColor}55)`,
            borderRadius: '40% 40% 30% 30%',
          }}
        />
        {/* Status ring */}
        <div
          className="absolute rounded-full"
          style={{
            top: -3,
            width: s.head + 6,
            height: s.head + 6,
            border: `2px solid ${statusColor}`,
            opacity: 0.9,
          }}
        />
      </div>
    </div>
  );
}

function shade(hex: string): string {
  // Cheap darken for a subtle gradient without extra deps
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - 40);
  const g = Math.max(0, ((num >> 8) & 0xff) - 40);
  const b = Math.max(0, (num & 0xff) - 40);
  return `rgb(${r},${g},${b})`;
}
