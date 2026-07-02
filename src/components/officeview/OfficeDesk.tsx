import type { Employee } from '@/types/employee';

interface OfficeDeskProps {
  employee: Employee;
  isSelected: boolean;
  isActive: boolean;
}

export function OfficeDesk({ employee, isSelected, isActive }: OfficeDeskProps) {
  return (
    <div className="flex flex-col items-center gap-1 transition-all duration-300 hover:scale-105">
      {/* Wooden Desk */}
      <div
        className="relative rounded-sm overflow-hidden transition-all duration-300 cursor-pointer"
        style={{
          width: '90px',
          height: '60px',
          background: isSelected
            ? 'linear-gradient(135deg, #A0826D 0%, #B8945F 50%, #9A7E52 100%)'
            : 'linear-gradient(135deg, #8B6F47 0%, #A0826D 50%, #8B7355 100%)',
          border: `2px solid ${isSelected ? 'var(--accent-orange)' : 'rgba(0,0,0,0.2)'}`,
          boxShadow: isSelected
            ? `0 0 16px var(--accent-orange), inset 0 0 8px rgba(255,255,255,0.15), 0 4px 12px rgba(0,0,0,0.3)`
            : 'inset 0 0 6px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.2)',
        }}
      >
        {/* Wood grain texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)`,
            opacity: 0.5,
          }}
        />

        {/* Monitor on desk */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '8px',
            width: '28px',
            height: '22px',
            backgroundColor: '#0f0f1e',
            borderRadius: '2px',
            border: `1px solid ${employee.accentColor}`,
            boxShadow: `0 0 8px ${employee.accentColor}88, inset 0 0 4px ${employee.accentColor}44`,
          }}
        />

        {/* Seated figure on chair */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {/* Head */}
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#D2B48C',
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
              marginBottom: '2px',
            }}
          />
          {/* Torso (seated) */}
          <div
            style={{
              width: '10px',
              height: '10px',
              backgroundColor: employee.accentColor,
              borderRadius: '1px',
              opacity: 0.8,
            }}
          />
        </div>
      </div>

      {/* Job Title Label */}
      <div
        className="text-xs font-semibold text-center px-2 py-1 rounded transition-colors duration-300"
        style={{
          backgroundColor: isSelected ? 'var(--accent-orange)' : 'transparent',
          color: isSelected ? '#fff' : 'var(--text-primary)',
        }}
      >
        {employee.role}
      </div>

      {/* Task card indicator */}
      {employee.tasks && employee.tasks.length > 0 && (
        <div
          className="text-xs px-2 py-0.5 rounded"
          style={{
            backgroundColor: 'rgba(249,112,31,0.2)',
            border: '1px solid var(--accent-orange)',
            color: 'var(--text-secondary)',
          }}
        >
          {employee.tasks.length} task{employee.tasks.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Active indicator */}
      {isActive && (
        <div
          className="text-xs font-semibold px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: 'rgba(34,197,94,0.2)',
            border: '1px solid #10B981',
            color: '#10B981',
          }}
        >
          Active
        </div>
      )}
    </div>
  );
}
