import type { Room } from '@/data/rooms';

interface CollaborationPathsProps {
  rooms: Room[];
  activeRoomIds: string[];
}

// Fixed 3x3 grid center points as percentages, matching the CSS grid in IsometricOffice.
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

export function CollaborationPaths({ rooms, activeRoomIds }: CollaborationPathsProps) {
  const sandyPoint = CELL_CENTERS.sandy;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
      <defs>
        <style>{`
          .collab-path {
            stroke-dasharray: 6, 6;
            animation: collabFlow 18s linear infinite;
          }
        `}</style>
      </defs>
      {rooms.map((room) => {
        const point = CELL_CENTERS[room.gridArea];
        if (!point) return null;
        const isActive = activeRoomIds.includes(room.id);
        return (
          <line
            key={room.id}
            className={isActive ? 'collab-path' : undefined}
            x1={`${sandyPoint.x}%`}
            y1={`${sandyPoint.y}%`}
            x2={`${point.x}%`}
            y2={`${point.y}%`}
            stroke={isActive ? room.color : 'rgba(255,255,255,0.06)'}
            strokeWidth={isActive ? 2 : 1}
            opacity={isActive ? 0.8 : 1}
          />
        );
      })}
    </svg>
  );
}
