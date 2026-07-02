import type { Employee } from '@/types/employee';
import { EmployeeAvatar } from './EmployeeAvatar';
import { DeskTaskCard } from './DeskTaskCard';
import { ROLE_DISPLAY_NAMES } from './OfficeProps';

interface OfficeDeskProps {
  employee: Employee;
  isSelected: boolean;
  isActive: boolean;
  onSelect: () => void;
}

export function OfficeDesk({ employee, isSelected, isActive, onSelect }: OfficeDeskProps) {
  const roleLabel = ROLE_DISPLAY_NAMES[employee.id] || employee.role;

  return (
    <div
      onClick={onSelect}
      style={{
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '12px',
        borderRadius: '8px',
        transition: 'all 0.2s ease',
        backgroundColor: isSelected ? 'var(--bg-secondary)' : 'transparent',
        border: isSelected ? '2px solid var(--accent-color)' : '1px solid transparent',
      }}
    >
      {/* Desk surface */}
      <div
        style={{
          width: '100%',
          height: '60px',
          backgroundColor: '#8B6F47',
          backgroundImage: `linear-gradient(135deg, #A0826D 0%, #8B6F47 50%, #6B5435 100%)`,
          borderRadius: '6px',
          border: '1px solid rgba(0,0,0,0.2)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Desk content area */}
        <div
          style={{
            position: 'absolute',
            inset: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '6px',
            paddingRight: '8px',
          }}
        >
          {/* Monitor */}
          <div
            style={{
              width: '28px',
              height: '22px',
              backgroundColor: '#1a1a2e',
              borderRadius: '3px',
              border: `2px solid ${employee.accentColor}`,
              boxShadow: `0 2px 6px rgba(0,0,0,0.3), 0 0 8px ${employee.accentColor}66`,
              flexShrink: 0,
            }}
          />

          {/* Keyboard */}
          <div
            style={{
              width: '18px',
              height: '8px',
              backgroundColor: '#1a1a1a',
              borderRadius: '2px',
              border: '0.5px solid #0a0a0a',
              flexShrink: 0,
            }}
          />

          {/* Small plant or mug */}
          <div
            style={{
              width: '10px',
              height: '12px',
              backgroundColor: '#2ba876',
              borderRadius: '2px 2px 0 0',
              flexShrink: 0,
            }}
          />
        </div>
      </div>

      {/* Employee avatar and name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
        <EmployeeAvatar employee={employee} size="small" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {roleLabel}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
            {employee.name}
          </div>
        </div>
      </div>

      {/* Task card */}
      <DeskTaskCard employee={employee} isActive={isActive} />

      {/* Active indicator */}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#F9701F',
            boxShadow: '0 0 8px rgba(249,112,31,0.6)',
            animation: 'pulse-indicator 2s ease-in-out infinite',
          }}
        />
      )}

      <style>{`
        @keyframes pulse-indicator {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
