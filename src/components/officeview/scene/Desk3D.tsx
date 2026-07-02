import type { Employee } from '@/types/employee';
import { CharacterIllustrated } from './CharacterIllustrated';
import { TaskCard } from '../components/TaskCard';

interface Desk3DProps {
  employee: Employee;
  x: number;
  z: number;
  isSelected: boolean;
  isActive: boolean;
  onClick: () => void;
}

export function Desk3D({ employee, x, z, isSelected, isActive, onClick }: Desk3DProps) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${z}%`,
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        zIndex: 10 - Math.floor(z / 10), // Depth sorting
      }}
    >
      {/* Desk surface - wooden */}
      <div
        style={{
          position: 'relative',
          width: '240px',
          height: '130px',
          backgroundColor: '#9B7E6B',
          background: 'linear-gradient(135deg, #D4B89F 0%, #C4A574 25%, #9B7E6B 55%, #7A6347 100%)',
          borderRadius: '6px',
          border: isSelected ? '3px solid #F97021' : '1px solid rgba(0,0,0,0.25)',
          boxShadow: `
            0 30px 60px rgba(0,0,0,0.4),
            inset 0 1px 3px rgba(255,255,255,0.3),
            inset -2px -2px 8px rgba(0,0,0,0.2)
          `,
          overflow: 'visible',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isSelected ? 'translateY(-18px) scale(1.1)' : 'translateY(0)',
        }}
      >
        {/* Wood grain texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '12px',
            backgroundImage: `
              repeating-linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.03) 1px, transparent 2px, transparent 40px),
              repeating-linear-gradient(0deg, transparent 0%, rgba(0,0,0,0.02) 1px, transparent 2px, transparent 40px)
            `,
            opacity: 0.7,
            pointerEvents: 'none',
          }}
        />

        {/* Monitor */}
        <div
          style={{
            position: 'absolute',
            left: '15px',
            top: '15px',
            width: '85px',
            height: '65px',
            backgroundColor: '#1a1a2e',
            borderRadius: '8px',
            border: `4px solid ${employee.accentColor}`,
            boxShadow: `
              0 10px 25px rgba(0,0,0,0.45),
              0 0 25px ${employee.accentColor}99,
              inset 0 0 15px ${employee.accentColor}44
            `,
            overflow: 'hidden',
          }}
        >
          {/* Screen */}
          <div
            style={{
              position: 'absolute',
              inset: '3px',
              backgroundColor: '#0f0f1e',
              borderRadius: '3px',
              background: `linear-gradient(135deg, rgba(${
                employee.accentColor === '#F97021'
                  ? '249,112,31'
                  : employee.accentColor === '#8B5CF6'
                    ? '139,92,246'
                    : '34,197,153'
              },0.25) 0%, rgba(0,0,0,0.95) 100%)`,
              boxShadow: `inset 0 0 8px ${employee.accentColor}33`,
            }}
          />
        </div>

        {/* Keyboard */}
        <div
          style={{
            position: 'absolute',
            right: '12px',
            bottom: '12px',
            width: '80px',
            height: '24px',
            backgroundColor: '#1a1a1a',
            borderRadius: '6px',
            border: '1px solid #0a0a0a',
            boxShadow: '0 6px 12px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.08)',
            backgroundImage: `
              repeating-linear-gradient(90deg, transparent 0%, transparent 5px, rgba(255,255,255,0.03) 5px, rgba(255,255,255,0.03) 6px),
              repeating-linear-gradient(0deg, transparent 0%, transparent 5px, rgba(255,255,255,0.02) 5px, rgba(255,255,255,0.02) 6px)
            `,
          }}
        />

        {/* Coffee mug */}
        <div
          style={{
            position: 'absolute',
            right: '50%',
            top: '50%',
            transform: 'translate(50%, -50%)',
            width: '28px',
            height: '28px',
          }}
        >
          <svg viewBox="0 0 28 28" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.2))' }}>
            <path d="M 6 8 L 8 18 Q 8 20 10 20 L 16 20 Q 18 20 18 18 L 20 8" fill="#8B4513" stroke="#654321" strokeWidth="0.5" />
            <ellipse cx="12" cy="8" rx="6" ry="2.5" fill="#A0522D" stroke="#654321" strokeWidth="0.5" />
            <ellipse cx="12" cy="7.8" rx="5.5" ry="2" fill="#B8714F" opacity="0.6" />
            <ellipse cx="12" cy="9" rx="5" ry="1.8" fill="#3D2817" />
            <path d="M 18 11 Q 22 11 22 14.5 Q 22 18 18 18" fill="none" stroke="#654321" strokeWidth="1.2" strokeLinecap="round" />
            <ellipse cx="10" cy="13" rx="1.8" ry="3" fill="#fff" opacity="0.12" />
          </svg>
        </div>

        {/* Papers */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '15px',
            transform: 'translateX(-50%)',
            width: '32px',
            height: '28px',
          }}
        >
          <div style={{ position: 'absolute', width: '30px', height: '26px', backgroundColor: '#fff', border: '0.5px solid #d0d0d0', borderRadius: '2px', transform: 'rotate(2deg)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
          <div style={{ position: 'absolute', width: '30px', height: '26px', backgroundColor: '#f8f8f8', border: '0.5px solid #d0d0d0', borderRadius: '2px', transform: 'rotate(-1deg) translateY(2px)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
        </div>

        {/* Small plant on desk */}
        <div style={{ position: 'absolute', right: '28px', bottom: '16px', width: '20px', height: '28px' }}>
          <svg viewBox="0 0 20 28" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>
            <ellipse cx="10" cy="24" rx="5" ry="3" fill="#8B6F47" />
            <ellipse cx="8" cy="16" rx="4" ry="10" fill="#22c55e" opacity="0.7" transform="rotate(-15 8 16)" />
            <ellipse cx="10" cy="12" rx="3.5" ry="11" fill="#22c55e" />
            <ellipse cx="12" cy="16" rx="4" ry="10" fill="#22c55e" opacity="0.7" transform="rotate(15 12 16)" />
          </svg>
        </div>
      </div>

      {/* Character sitting at desk */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '-10%',
          transform: 'translate(-50%, -100%) scale(1.35)',
          zIndex: 15,
          transformOrigin: 'center bottom',
        }}
      >
        <CharacterIllustrated employee={employee} isSelected={isSelected} isTyping={isActive} />
      </div>

      {/* Task card below desk */}
      <div
        style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '20px',
          minWidth: '220px',
          zIndex: 8,
        }}
      >
        <TaskCard employee={employee} isActive={isActive} />
      </div>

      {/* Job title label */}
      <div
        style={{
          position: 'absolute',
          bottom: '-28px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '11px',
          fontWeight: '600',
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
          opacity: 0.8,
        }}
      >
        {employee.role}
      </div>
    </div>
  );
}
