import { useOfficeStore } from '@/store/officeStore';
import { rooms } from '@/data/rooms';
import { OfficeRoom } from './OfficeRoom';
import { SandyPodium } from './SandyPodium';
import { CollaborationPaths } from './CollaborationPaths';

interface IsometricOfficeProps {
  activeRoomIds: string[];
  sandyThinking: boolean;
  sandyMessage?: string;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string | null) => void;
}

const GRID_ORDER = ['r1', 'r2', 'r3', 'r4', 'sandy', 'r5', 'r6', 'r7', 'r8'];

export function IsometricOffice({
  activeRoomIds,
  sandyThinking,
  sandyMessage,
  selectedRoomId,
  onSelectRoom,
}: IsometricOfficeProps) {
  const employees = useOfficeStore((state) => state.employees);

  const roomByGridArea = Object.fromEntries(rooms.map((r) => [r.gridArea, r]));

  return (
    <div
      className="w-full h-full relative p-6"
      style={{
        background:
          'radial-gradient(circle at 50% 20%, rgba(249,112,31,0.05), transparent 60%), #05080D',
      }}
    >
      <div
        className="w-full h-full relative"
        style={{ perspective: '1400px' }}
      >
        <div
          className="w-full h-full grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(3, 1fr)',
            transform: 'rotateX(6deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          <CollaborationPaths rooms={rooms} activeRoomIds={activeRoomIds} />

          {GRID_ORDER.map((cell) => {
            if (cell === 'sandy') {
              return (
                <div key="sandy" style={{ zIndex: 10 }}>
                  <SandyPodium isThinking={sandyThinking} message={sandyMessage} />
                </div>
              );
            }
            const room = roomByGridArea[cell];
            if (!room) return null;
            const roomEmployees = employees.filter((e) => room.employeeIds.includes(e.id));
            return (
              <div key={room.id} style={{ zIndex: 6 }}>
                <OfficeRoom
                  room={room}
                  employees={roomEmployees}
                  isActive={activeRoomIds.includes(room.id) || selectedRoomId === room.id}
                  onSelect={() => onSelectRoom(selectedRoomId === room.id ? null : room.id)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
