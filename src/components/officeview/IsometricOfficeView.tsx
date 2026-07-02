import { useOfficeStore } from '@/store/officeStore';
import { rooms } from '@/data/rooms';
import { RoomBox } from './RoomBox';
import { SandyDais } from './SandyDais';
import { FloorCollabPaths } from './FloorCollabPaths';

interface IsometricOfficeViewProps {
  activeRoomIds: string[];
  sandyThinking: boolean;
  sandyMessage?: string;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string | null) => void;
}

const GRID_ORDER = ['r1', 'r2', 'r3', 'r4', 'sandy', 'r5', 'r6', 'r7', 'r8'];

export function IsometricOfficeView({
  activeRoomIds,
  sandyThinking,
  sandyMessage,
  selectedRoomId,
  onSelectRoom,
}: IsometricOfficeViewProps) {
  const employees = useOfficeStore((state) => state.employees);
  const roomByGridArea = Object.fromEntries(rooms.map((r) => [r.gridArea, r]));

  return (
    <div
      className="w-full h-full relative p-6 overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 50% 15%, rgba(139,92,246,0.08), transparent 55%), radial-gradient(circle at 50% 85%, rgba(249,112,31,0.06), transparent 55%), #05070C',
      }}
    >
      <div
        className="w-full h-full relative grid gap-3"
        style={{
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          transform: 'rotateX(4deg)',
        }}
      >
        <FloorCollabPaths rooms={rooms} activeRoomIds={activeRoomIds} />

        {GRID_ORDER.map((cell) => {
          if (cell === 'sandy') {
            return (
              <div key="sandy" style={{ zIndex: 10 }}>
                <SandyDais isThinking={sandyThinking} message={sandyMessage} />
              </div>
            );
          }
          const room = roomByGridArea[cell];
          if (!room) return null;
          const roomEmployees = employees.filter((e) => room.employeeIds.includes(e.id));
          return (
            <div key={room.id} style={{ zIndex: 6 }}>
              <RoomBox
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
  );
}
