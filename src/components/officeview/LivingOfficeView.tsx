import { useOfficeStore } from '@/store/officeStore';
import type { Employee } from '@/types/employee';
import { OfficeDesk } from './OfficeDesk';
import { CollaborationArea } from './CollaborationArea';
import { SandyDock } from './SandyDock';
import { SpeechBubble } from './SpeechBubble';
import { DESK_POSITIONS, OFFICE_COLORS } from './OfficeProps';

interface LivingOfficeViewProps {
  sandyThinking: boolean;
  sandyMessage?: string;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string | null) => void;
  onAskSandy?: () => void;
}

export function LivingOfficeView({
  sandyThinking,
  sandyMessage,
  selectedRoomId,
  onSelectRoom,
  onAskSandy,
}: LivingOfficeViewProps) {
  const employees = useOfficeStore((state) => state.employees);
  const selectedEmployeeId = useOfficeStore((state) => state.selectedEmployeeId);
  const selectEmployee = useOfficeStore((state) => state.selectEmployee);

  // Map desk positions by employee ID for easy lookup
  const deskPositions = new Map(DESK_POSITIONS.map((pos) => [pos.employeeId, pos]));

  // Get the selected employee
  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  // Find employees in order of DESK_POSITIONS
  const visibleEmployees = DESK_POSITIONS.map((pos) => employees.find((e) => e.id === pos.employeeId)).filter(
    (e): e is Employee => e !== undefined
  );

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: OFFICE_COLORS.floorWood,
        backgroundImage: `linear-gradient(135deg, ${OFFICE_COLORS.floorLight} 0%, ${OFFICE_COLORS.floorWood} 50%, ${OFFICE_COLORS.floorWood} 100%)`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top wall area */}
      <div
        style={{
          height: '40px',
          backgroundColor: OFFICE_COLORS.wallWarm,
          borderBottom: `1px solid ${OFFICE_COLORS.wallMid}`,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '16px',
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#666' }}>
          Living Office — Marketing Team
        </div>
      </div>

      {/* Main office floor */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(to right, ${OFFICE_COLORS.floorWood} 0%, ${OFFICE_COLORS.floorLight} 50%, ${OFFICE_COLORS.floorWood} 100%)`,
        }}
      >
        {/* Right wall/windows area */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: '60px',
            height: '100%',
            backgroundColor: OFFICE_COLORS.wallWarm,
            borderLeft: `2px solid ${OFFICE_COLORS.wallMid}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '12px',
            boxShadow: 'inset -4px 0 12px rgba(0,0,0,0.1)',
          }}
        >
          {/* Windows */}
          {[0, 1, 2].map((i) => (
            <div
              key={`window-${i}`}
              style={{
                width: '100%',
                height: '40px',
                backgroundColor: '#87CEEB',
                borderRadius: '4px',
                border: '1px solid #5a9bd4',
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>

        {/* Bottom wall/plants area */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: '60px',
            height: '50px',
            backgroundColor: OFFICE_COLORS.wallMid,
            borderTop: `2px solid ${OFFICE_COLORS.wallWarm}`,
            display: 'flex',
            alignItems: 'flex-end',
            padding: '8px 16px',
            gap: '12px',
            overflow: 'hidden',
          }}
        >
          {/* Decorative plants */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={`plant-${i}`}
              style={{
                width: '16px',
                height: '24px',
                backgroundColor: '#2ba876',
                borderRadius: '3px 3px 0 0',
                flexShrink: 0,
              }}
            />
          ))}
        </div>

        {/* Water cooler (bottom-right corner) */}
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            right: '70px',
            width: '32px',
            height: '48px',
            backgroundColor: '#b3d9ff',
            borderRadius: '4px',
            border: '2px solid #5a9bd4',
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          }}
        />

        {/* Desks positioned around the office */}
        {visibleEmployees.map((employee) => {
          const pos = deskPositions.get(employee.id);
          if (!pos) return null;

          const isSelected = selectedEmployeeId === employee.id;
          const isActive = selectedRoomId === employee.id || employee.status === 'working';

          return (
            <div
              key={employee.id}
              style={{
                position: 'absolute',
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <OfficeDesk
                employee={employee}
                isSelected={isSelected}
                isActive={isActive}
                onSelect={() => {
                  selectEmployee(employee.id);
                  onSelectRoom(employee.id);
                }}
              />
            </div>
          );
        })}

        {/* Collaboration Area - central table */}
        <CollaborationArea width={240} height={160} />

        {/* Sandy Dock - bottom center */}
        <SandyDock onAskSandy={onAskSandy || (() => {})} />

        {/* Speech bubble when Sandy sends a message */}
        {sandyMessage && <SpeechBubble text={sandyMessage} x={50} y={40} />}

        {/* Sandy thinking indicator */}
        {sandyThinking && (
          <div
            style={{
              position: 'absolute',
              bottom: '100px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 50,
              display: 'flex',
              gap: '4px',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--text-secondary)',
                animation: 'bounce 1.4s infinite',
              }}
            />
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--text-secondary)',
                animation: 'bounce 1.4s infinite 0.2s',
              }}
            />
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--text-secondary)',
                animation: 'bounce 1.4s infinite 0.4s',
              }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 1;
          }
          40% {
            transform: translateY(-8px);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}
