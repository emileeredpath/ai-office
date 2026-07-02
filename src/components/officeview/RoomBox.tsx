import type { Employee } from '@/types/employee';
import type { Room } from '@/data/rooms';
import { OfficePerson } from './OfficePerson';
import { Desk, PlantPot, CeilingLight } from './RoomFurniture';
import { SpeechBubble } from '@/components/office/SpeechBubble';

interface RoomBoxProps {
  room: Room;
  employees: Employee[];
  isActive: boolean;
  onSelect: () => void;
}

const DESK_SLOTS: Array<[number, number]> = [
  [22, 46],
  [70, 46],
  [46, 70],
  [22, 94],
];

export function RoomBox({ room, employees, isActive, onSelect }: RoomBoxProps) {
  const speakingEmployee = employees.find((e) => e.tasks.some((t) => t.status === 'in_progress'));
  const speakingTask = speakingEmployee?.tasks.find((t) => t.status === 'in_progress');

  return (
    <button
      onClick={onSelect}
      className="relative w-full h-full text-left"
      style={{ perspective: 500 }}
    >
      {speakingTask && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-52 z-30 pointer-events-none">
          <SpeechBubble message={speakingTask.title} type="task" accentColor={room.color} />
        </div>
      )}

      {/* Back walls (glass, angled) */}
      <div
        className="absolute rounded-t-md transition-all duration-300"
        style={{
          top: 0,
          left: '4%',
          width: '46%',
          height: '38%',
          background: `linear-gradient(160deg, ${room.color}22, rgba(15,20,28,0.4))`,
          borderTop: `2px solid var(--accent-secondary)`,
          borderLeft: `1px solid var(--border-color)`,
          transform: 'skewY(-6deg)',
          transformOrigin: 'bottom left',
        }}
      />
      <div
        className="absolute rounded-t-md transition-all duration-300"
        style={{
          top: 0,
          right: '4%',
          width: '46%',
          height: '38%',
          background: `linear-gradient(200deg, ${room.color}22, rgba(15,20,28,0.4))`,
          borderTop: `2px solid var(--accent-secondary)`,
          borderRight: `1px solid var(--border-color)`,
          transform: 'skewY(6deg)',
          transformOrigin: 'bottom right',
        }}
      />

      <CeilingLight color={room.color} />

      {/* Room floor (isometric hexagon) */}
      <div
        className="absolute transition-all duration-300"
        style={{
          inset: '18% 2% 2% 2%',
          background: isActive
            ? `linear-gradient(165deg, ${room.color}2E, var(--bg-tertiary) 65%)`
            : 'linear-gradient(165deg, var(--bg-tertiary), var(--bg-primary) 65%)',
          clipPath: 'polygon(50% 0%, 96% 22%, 96% 78%, 50% 100%, 4% 78%, 4% 22%)',
          border: `1px solid ${isActive ? room.color : 'var(--border-color)'}`,
          boxShadow: isActive
            ? `0 0 0 1px ${room.color}55, 0 0 26px ${room.color}55, inset 0 0 30px ${room.color}18`
            : 'inset 0 0 20px rgba(0,0,0,0.2)',
        }}
      >
        {/* Floor grid sheen */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(${room.color}33 1px, transparent 1px), linear-gradient(90deg, ${room.color}33 1px, transparent 1px)`,
            backgroundSize: '14px 14px',
            clipPath: 'polygon(50% 0%, 96% 22%, 96% 78%, 50% 100%, 4% 78%, 4% 22%)',
          }}
        />

        {/* Furniture + people */}
        <div className="absolute inset-0">
          {employees.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xs transition-colors duration-300" style={{ color: 'var(--text-tertiary)' }}>
                Meeting space
              </span>
            </div>
          ) : (
            employees.slice(0, 4).map((emp, i) => {
              const [x, y] = DESK_SLOTS[i];
              const hasWork = emp.tasks.some((t) => t.status !== 'complete');
              return (
                <div
                  key={emp.id}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <div className="mb-0.5">
                    <OfficePerson employee={emp} scale={0.85} />
                  </div>
                  <Desk color={room.color} lit={hasWork} />
                </div>
              );
            })
          )}
        </div>

        {/* Decorative plant, bottom corner */}
        <div className="absolute" style={{ left: '6%', bottom: '4%' }}>
          <PlantPot />
        </div>
      </div>

      {/* Room label plaque */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap z-20 transition-all duration-300"
        style={{
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: `1px solid ${room.color}55`,
        }}
      >
        {room.name}
        <span className="ml-1.5 font-normal transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>
          {employees.length} {employees.length === 1 ? 'member' : 'members'}
        </span>
      </div>
    </button>
  );
}
