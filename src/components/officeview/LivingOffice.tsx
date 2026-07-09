import { useOfficeStore } from '@/store/officeStore';
import type { Employee } from '@/types/employee';
import { EMPLOYEE_STATUS_COLORS, EMPLOYEE_STATUS_LABELS } from '@/types/employee';
import { SandyDock } from './SandyDock';
import { ROLE_DISPLAY_NAMES } from './OfficeProps';
import { EmployeeCharacter } from './EmployeeCharacter';

interface LivingOfficeProps {
  sandyThinking: boolean;
  sandyMessage?: string;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string | null) => void;
  onAskSandy?: () => void;
}

// Premium office workstation positions using CSS Grid + percentage offsets
const WORKSTATION_GRID = {
  'marketing-director': { column: 1, row: 1 },
  'seo-ppc-manager': { column: 2, row: 1 },
  'website-auditor': { column: 3, row: 1 },
  'proposal-writer': { column: 4, row: 1 },
  'social-media-manager': { column: 1, row: 2 },
  'email-marketing-manager': { column: 2, row: 2 },
  'case-study-writer': { column: 3, row: 2 },
  'funding-rewards-manager': { column: 4, row: 2 },
};

const COLLABORATION_MESSAGES = [
  'Great work on the social campaign! 🎯',
  'Found 15 issues - checking now ✅',
  'Keyword research complete 📊',
  'Shall we align on the new campaign? 💬',
  'Interview with client at 2pm 📅',
  'Building our new nurture sequence 🚀',
];

export function LivingOffice({
  sandyThinking,
  sandyMessage,
  selectedRoomId,
  onSelectRoom,
  onAskSandy,
}: LivingOfficeProps) {
  const employees = useOfficeStore((state) => state.employees);
  const selectedEmployeeId = useOfficeStore((state) => state.selectedEmployeeId);
  const selectEmployee = useOfficeStore((state) => state.selectEmployee);

  const isSelected = (id: string) => selectedEmployeeId === id;
  const isActive = (id: string) =>
    selectedRoomId === id || employees.find((e) => e.id === id)?.status === 'working';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#FAF8F5',
      }}
    >
      {/* Top navigation bar */}
      <header
        style={{
          height: '56px',
          backgroundColor: '#2B2B3E',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          zIndex: 100,
        }}
      >
        <h1
          style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#fff',
            margin: 0,
            letterSpacing: '0.5px',
          }}
        >
          Living Office
        </h1>
      </header>

      {/* Main office canvas */}
      <main
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'auto',
          background: `
            linear-gradient(135deg, #FAF8F5 0%, #F5F0EA 40%, #EFE9E1 100%),
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 200px,
              rgba(150,130,110,0.02) 200px,
              rgba(150,130,110,0.02) 400px
            )
          `,
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Premium office workspace grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(280px, 1fr))',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: '32px',
            padding: '40px',
            minHeight: '100vh',
            alignContent: 'start',
          }}
        >
          {/* Workstations */}
          {employees.map((employee) => {
            const gridPos = WORKSTATION_GRID[employee.id as keyof typeof WORKSTATION_GRID];
            if (!gridPos) return null;

            const isEmployeeSelected = isSelected(employee.id);
            const isEmployeeActive = isActive(employee.id);
            const statusColor = EMPLOYEE_STATUS_COLORS[employee.status];
            const statusLabel = EMPLOYEE_STATUS_LABELS[employee.status];
            const taskCount = employee.tasks?.length || 0;
            const currentTask = employee.tasks?.[0];

            return (
              <div
                key={employee.id}
                style={{
                  gridColumn: gridPos.column,
                  gridRow: gridPos.row,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  perspective: '1000px',
                }}
                onClick={() => {
                  selectEmployee(employee.id);
                  onSelectRoom(employee.id);
                }}
              >
                {/* Workstation base - premium desk environment */}
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    position: 'relative',
                    borderRadius: '18px',
                    background: `
                      linear-gradient(135deg,
                        rgba(255,255,255,0.85) 0%,
                        rgba(250,245,238,0.7) 30%,
                        rgba(240,235,225,0.5) 70%,
                        rgba(230,220,205,0.3) 100%),
                      radial-gradient(
                        circle at 25% 25%,
                        rgba(255,255,255,0.5) 0%,
                        transparent 45%
                      ),
                      radial-gradient(
                        circle at 75% 75%,
                        rgba(0,0,0,0.03) 0%,
                        transparent 50%
                      )
                    `,
                    backdropFilter: 'blur(24px)',
                    border: '1.5px solid rgba(255,255,255,0.75)',
                    boxShadow: isEmployeeSelected
                      ? `
                        0 0 50px rgba(249,112,31,0.35),
                        0 25px 70px rgba(0,0,0,0.14),
                        inset 0 1px 3px rgba(255,255,255,0.7),
                        inset 0 -1px 2px rgba(0,0,0,0.02)
                      `
                      : `
                        0 14px 48px rgba(0,0,0,0.1),
                        inset 0 1px 3px rgba(255,255,255,0.7),
                        inset 0 -1px 2px rgba(0,0,0,0.02)
                      `,
                    transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: isEmployeeSelected
                      ? 'translateY(-12px) scale(1.03)'
                      : 'translateY(0) scale(1)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '26px',
                    gap: '16px',
                    willChange: 'transform',
                  }}
                >
                  {/* Employee character - large prominent display */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      filter: isEmployeeActive
                        ? 'drop-shadow(0 10px 25px rgba(249,112,31,0.3))'
                        : 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))',
                      transition: 'filter 0.3s ease',
                    }}
                  >
                    <EmployeeCharacter employee={employee} size="medium" />
                  </div>

                  {/* Employee information card - premium glassmorphism */}
                  <div
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.55)',
                      backdropFilter: 'blur(16px)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      border: '1px solid rgba(255,255,255,0.85)',
                      boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5), 0 4px 12px rgba(0,0,0,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    {/* Role and status line */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          color: '#2B2B3E',
                          textTransform: 'uppercase',
                          letterSpacing: '0.6px',
                          flex: 1,
                        }}
                      >
                        {ROLE_DISPLAY_NAMES[employee.id] || employee.role}
                      </div>
                      <div
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor: statusColor,
                          flexShrink: 0,
                          boxShadow: `0 0 8px ${statusColor}`,
                          animation: isEmployeeActive ? 'pulse-dot 2s ease-in-out infinite' : 'none',
                        }}
                      />
                    </div>

                    {/* Status and task count */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: '600',
                          color: '#888',
                          textTransform: 'capitalize',
                        }}
                      >
                        {statusLabel}
                      </span>
                      {taskCount > 0 && (
                        <span
                          style={{
                            backgroundColor: statusColor,
                            color: '#fff',
                            borderRadius: '3px',
                            padding: '2px 6px',
                            fontSize: '8px',
                            fontWeight: '700',
                            marginLeft: 'auto',
                          }}
                        >
                          {taskCount} task{taskCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Current task or waiting state */}
                    <div
                      style={{
                        fontSize: '10px',
                        color: currentTask ? '#555' : '#aaa',
                        fontStyle: currentTask ? 'normal' : 'italic',
                        lineHeight: '1.4',
                        minHeight: '20px',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {currentTask ? currentTask.title : 'Waiting for Sandy'}
                    </div>
                  </div>

                  {/* Speech bubble - collaborative message */}
                  {taskCount > 0 && (
                    <div
                      style={{
                        backgroundColor: 'rgba(210, 225, 255, 0.75)',
                        backdropFilter: 'blur(12px)',
                        borderRadius: '11px',
                        padding: '9px 13px',
                        border: '1px solid rgba(255,255,255,0.7)',
                        fontSize: '9px',
                        fontWeight: '500',
                        color: '#445',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.08), inset 0 1px 2px rgba(255,255,255,0.5)',
                        position: 'relative',
                        animation: 'float-message 3.5s ease-in-out infinite',
                        lineHeight: '1.3',
                      }}
                    >
                      {COLLABORATION_MESSAGES[Math.abs(employee.id.charCodeAt(0)) % COLLABORATION_MESSAGES.length]}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '-6px',
                          left: '14px',
                          width: '0',
                          height: '0',
                          borderLeft: '6px solid transparent',
                          borderRight: '6px solid transparent',
                          borderTop: '6px solid rgba(210, 225, 255, 0.75)',
                          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.05))',
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Sandy collaboration center - prominent centerpiece */}
        <div
          style={{
            position: 'fixed',
            bottom: '48px',
            left: '50%',
            zIndex: 50,
            animation: 'float-subtle 6s ease-in-out infinite',
            filter: 'drop-shadow(0 24px 60px rgba(0,0,0,0.18))',
            pointerEvents: 'auto',
          }}
        >
          <SandyDock onAskSandy={onAskSandy || (() => {})} />
        </div>
      </main>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
            box-shadow: 0 0 8px currentColor;
          }
          50% {
            opacity: 0.55;
            transform: scale(1.25);
            box-shadow: 0 0 16px currentColor;
          }
        }

        @keyframes float-message {
          0%, 100% {
            opacity: 0.3;
            transform: translateY(2px);
          }
          20%, 80% {
            opacity: 1;
            transform: translateY(-8px);
          }
          50% {
            transform: translateY(-14px);
          }
        }

        @keyframes float-subtle {
          0%, 100% {
            transform: translateX(-50%) translateY(0);
            filter: drop-shadow(0 20px 50px rgba(0,0,0,0.15));
          }
          50% {
            transform: translateX(-50%) translateY(-12px);
            filter: drop-shadow(0 28px 60px rgba(0,0,0,0.18));
          }
        }

        /* Premium scrollbar styling */
        main::-webkit-scrollbar {
          width: 10px;
        }

        main::-webkit-scrollbar-track {
          background: linear-gradient(180deg,
            rgba(150,130,110,0.02) 0%,
            transparent 50%,
            rgba(150,130,110,0.02) 100%);
        }

        main::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg,
            rgba(100,80,60,0.25) 0%,
            rgba(100,80,60,0.35) 50%,
            rgba(100,80,60,0.25) 100%);
          border-radius: 5px;
          border: 2px solid transparent;
          background-clip: padding-box;
          transition: all 0.2s;
        }

        main::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg,
            rgba(80,60,40,0.4) 0%,
            rgba(80,60,40,0.5) 50%,
            rgba(80,60,40,0.4) 100%);
          background-clip: padding-box;
        }

        /* Smooth transitions */
        * {
          transition: color 0.2s ease, background-color 0.2s ease;
        }
      `}</style>
    </div>
  );
}
