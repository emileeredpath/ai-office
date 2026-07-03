import { EmployeeAvatar } from './EmployeeAvatar';

interface SandyDockProps {
  onAskSandy: () => void;
  tasksPending?: number;
}

export function SandyDock({ onAskSandy, tasksPending = 0 }: SandyDockProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: 'var(--bg-secondary)',
        border: '2px solid var(--border-color)',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        minWidth: '200px',
      }}
      onClick={onAskSandy}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)';
        el.style.transform = 'translateX(-50%) translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
        el.style.transform = 'translateX(-50%) translateY(0)';
      }}
    >
      {/* Sandy Avatar - placeholder with S initial */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          backgroundColor: '#D4A574',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: '600',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          flexShrink: 0,
        }}
        title="Sandy (AI Assistant)"
      >
        S
      </div>

      {/* Sandy info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
          Sandy
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
          }}
        >
          Ask for tasks
        </div>
      </div>

      {/* Task indicator */}
      {tasksPending > 0 && (
        <div
          style={{
            backgroundColor: '#D84C45',
            color: '#fff',
            borderRadius: '12px',
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: '600',
            minWidth: '20px',
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          {tasksPending}
        </div>
      )}

      <style>{`
        @keyframes pulse-dock {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
