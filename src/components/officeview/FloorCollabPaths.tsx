import type { Room } from '@/data/rooms';

interface FloorCollabPathsProps {
  rooms: Room[];
  activeRoomIds: string[];
}

const CELL_CENTERS: Record<string, { x: number; y: number }> = {
  r1: { x: 16.7, y: 16.7 },
  r2: { x: 50, y: 16.7 },
  r3: { x: 83.3, y: 16.7 },
  r4: { x: 16.7, y: 50 },
  sandy: { x: 50, y: 50 },
  r5: { x: 83.3, y: 50 },
  r6: { x: 16.7, y: 83.3 },
  r7: { x: 50, y: 83.3 },
  r8: { x: 83.3, y: 83.3 },
};

export function FloorCollabPaths({ rooms, activeRoomIds }: FloorCollabPathsProps) {
  const sandyPoint = CELL_CENTERS.sandy;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 3 }}>
      <defs>
        <style>{`
          .floor-path {
            stroke-dasharray: 8, 10;
            animation: collabFlow 6s linear infinite;
          }
        `}</style>
        <filter id="floorGlow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {rooms.map((room) => {
        const point = CELL_CENTERS[room.gridArea];
        if (!point) return null;
        const isActive = activeRoomIds.includes(room.id);
        return (
          <line
            key={room.id}
            className={isActive ? 'floor-path' : undefined}
            x1={`${sandyPoint.x}%`}
            y1={`${sandyPoint.y}%`}
            x2={`${point.x}%`}
            y2={`${point.y}%`}
            stroke={isActive ? room.color : 'rgba(255,255,255,0.05)'}
            strokeWidth={isActive ? 3 : 1}
            opacity={isActive ? 0.9 : 1}
            filter={isActive ? 'url(#floorGlow)' : undefined}
          />
        );
      })}
    </svg>
  );
}
