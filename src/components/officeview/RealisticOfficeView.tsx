import { useOfficeStore } from '@/store/officeStore';
import { rooms } from '@/data/rooms';
import type { Employee } from '@/types/employee';
import { SandyControlDock } from './SandyControlDock';
import { OfficeDesk } from './OfficeDesk';
import { RightSidebar } from './RightSidebar';
import { CollaborationControls } from './CollaborationControls';

interface RealisticOfficeViewProps {
  activeRoomIds: string[];
  sandyThinking: boolean;
  sandyMessage?: string;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string | null) => void;
}

export function RealisticOfficeView({
  activeRoomIds,
  sandyThinking,
  sandyMessage,
  selectedRoomId,
  onSelectRoom,
}: RealisticOfficeViewProps) {
  const employees = useOfficeStore((state) => state.employees);

  // Map employees to desks - arranged in realistic office layout
  const deskPositions = [
    { x: 12, y: 30, employeeId: 'marketing-director' },      // Front left
    { x: 30, y: 25, employeeId: 'website-auditor' },          // Front center-left
    { x: 48, y: 30, employeeId: 'proposal-writer' },          // Front center-right
    { x: 66, y: 25, employeeId: 'case-study-writer' },        // Front right
    { x: 12, y: 65, employeeId: 'email-marketing-manager' },  // Back left
    { x: 30, y: 70, employeeId: 'seo-ppc-manager' },          // Back center-left
    { x: 48, y: 65, employeeId: 'social-media-manager' },     // Back center-right
    { x: 66, y: 70, employeeId: 'funding-rewards-manager' },  // Back right
  ];

  const getDeskEmployee = (employeeId: string): Employee | undefined => {
    return employees.find((e) => e.id === employeeId);
  };

  const getRoom = (employeeId: string) => {
    return rooms.find((r) => r.employeeIds.includes(employeeId));
  };

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Main office area with desks + right sidebar */}
      <div className="flex-1 flex gap-4 p-6 overflow-hidden">
        {/* Office Space - center/left */}
        <div className="flex-1 relative rounded-lg overflow-hidden" style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(249,112,31,0.05) 100%)',
        }}>
          {/* Warm office background with lighting */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(circle at 20% 30%, rgba(249,112,31,0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(139,92,246,0.05) 0%, transparent 50%)
              `,
              pointerEvents: 'none',
            }}
          />

          {/* Windows on right side */}
          <div className="absolute top-0 right-0 w-1/4 h-full flex flex-col gap-2 p-4">
            {[1, 2, 3].map((i) => (
              <div
                key={`window-${i}`}
                className="flex-1 rounded-lg"
                style={{
                  backgroundColor: 'rgba(135,206,235,0.3)',
                  border: '2px solid rgba(135,206,235,0.5)',
                  boxShadow: 'inset 0 0 8px rgba(135,206,235,0.2)',
                }}
              />
            ))}
          </div>

          {/* Wall board with team goals on back wall */}
          <div
            className="absolute left-8 top-8 rounded-lg p-4"
            style={{
              width: '200px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '2px solid var(--accent-orange)',
              boxShadow: '0 0 12px var(--accent-orange)44',
            }}
          >
            <div
              className="text-xs font-bold mb-2"
              style={{ color: 'var(--accent-orange)' }}
            >
              Team Goals
            </div>
            <div className="space-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <div>✓ Q4 Campaign Launch</div>
              <div>✓ Website Redesign</div>
              <div>✓ Team Growth</div>
            </div>
          </div>

          {/* Plant decoration - back left corner */}
          <div
            className="absolute bottom-8 left-4"
            style={{
              width: '60px',
              height: '80px',
            }}
          >
            {/* Pot */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '40px',
                height: '30px',
                backgroundColor: '#8B6F47',
                borderRadius: '0 0 4px 4px',
                border: '1px solid #6B5435',
              }}
            />
            {/* Plant leaves */}
            <div
              style={{
                position: 'absolute',
                bottom: '25px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '50px',
                height: '60px',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                borderRadius: '50% 50% 40% 40%',
                opacity: 0.8,
              }}
            />
          </div>

          {/* Plant decoration - back right corner */}
          <div
            className="absolute bottom-8 right-4"
            style={{
              width: '60px',
              height: '80px',
            }}
          >
            {/* Pot */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '40px',
                height: '30px',
                backgroundColor: '#8B6F47',
                borderRadius: '0 0 4px 4px',
                border: '1px solid #6B5435',
              }}
            />
            {/* Plant leaves */}
            <div
              style={{
                position: 'absolute',
                bottom: '25px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '50px',
                height: '60px',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                borderRadius: '50% 50% 40% 40%',
                opacity: 0.8,
              }}
            />
          </div>

          {/* Desks in office space */}
          <div className="relative w-full h-full p-8">
            {deskPositions.map((pos) => {
              const employee = getDeskEmployee(pos.employeeId);
              const room = getRoom(pos.employeeId);
              if (!employee) return null;

              const isSelected = selectedRoomId === room?.id;
              const isActive = room && activeRoomIds.includes(room.id);

              return (
                <div
                  key={pos.employeeId}
                  className="absolute cursor-pointer transition-all duration-300"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onClick={() => onSelectRoom(isSelected ? null : room?.id || null)}
                >
                  <OfficeDesk
                    employee={employee}
                    isSelected={isSelected}
                    isActive={isActive}
                  />
                </div>
              );
            })}

            {/* Sandy Control Dock - top right corner of office space */}
            <div className="absolute top-4 right-4 z-20">
              <SandyControlDock
                isThinking={sandyThinking}
                message={sandyMessage}
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-72 flex flex-col gap-4 overflow-y-auto">
          <RightSidebar selectedRoomId={selectedRoomId} />
        </div>
      </div>

      {/* Collaboration Controls - bottom */}
      <div className="border-t" style={{ borderColor: 'var(--border-color)' }}>
        <CollaborationControls />
      </div>
    </div>
  );
}
