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
          .floor-path-glow {
            animation: collabFlow 8s linear infinite;
          }
          @keyframes collabFlow {
            to { stroke-dashoffset: -160; }
          }
        `}</style>

        {/* Strong glow filter for active paths */}
        <filter id="pathGlowStrong">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Medium glow filter */}
        <filter id="pathGlowMedium">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Path gradient definition */}
        <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#A78BFA', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 0.6 }} />
        </linearGradient>

        <linearGradient id="inactiveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#94A3B8', stopOpacity: 0.15 }} />
          <stop offset="100%" style={{ stopColor: '#64748B', stopOpacity: 0.1 }} />
        </linearGradient>
      </defs>

      {rooms.map((room) => {
        const point = CELL_CENTERS[room.gridArea];
        if (!point) return null;
        const isActive = activeRoomIds.includes(room.id);

        return (
          <g key={room.id}>
            {isActive ? (
              <>
                {/* Bright outer glow layer */}
                <line
                  x1={`${sandyPoint.x}%`}
                  y1={`${sandyPoint.y}%`}
                  x2={`${point.x}%`}
                  y2={`${point.y}%`}
                  stroke={`url(#purpleGradient)`}
                  strokeWidth="12"
                  opacity="0.3"
                  filter="url(#pathGlowStrong)"
                  strokeLinecap="round"
                />

                {/* Main glow line */}
                <line
                  x1={`${sandyPoint.x}%`}
                  y1={`${sandyPoint.y}%`}
                  x2={`${point.x}%`}
                  y2={`${point.y}%`}
                  stroke={`url(#purpleGradient)`}
                  strokeWidth="8"
                  opacity="0.6"
                  filter="url(#pathGlowMedium)"
                  strokeLinecap="round"
                />

                {/* Core bright line */}
                <line
                  className="floor-path-glow"
                  x1={`${sandyPoint.x}%`}
                  y1={`${sandyPoint.y}%`}
                  x2={`${point.x}%`}
                  y2={`${point.y}%`}
                  stroke="#8B5CF6"
                  strokeWidth="4"
                  opacity="1"
                  strokeDasharray="8, 12"
                  strokeLinecap="round"
                />

                {/* Animated dots flowing along the path */}
                <g>
                  {[0, 0.25, 0.5, 0.75].map((offset, idx) => (
                    <circle
                      key={`dot-${idx}`}
                      r="3"
                      fill="#A78BFA"
                      opacity="0.8"
                      style={{
                        animation: `pathFlow 4s linear ${offset * 4}s infinite`,
                      }}
                    >
                      <animateMotion
                        dur="4s"
                        begin={`${offset * 4}s`}
                        repeatCount="indefinite"
                      >
                        <mpath href={`#path-${room.id}`} />
                      </animateMotion>
                    </circle>
                  ))}
                </g>

                {/* Path reference for dots */}
                <path
                  id={`path-${room.id}`}
                  d={`M ${sandyPoint.x}% ${sandyPoint.y}% L ${point.x}% ${point.y}%`}
                  fill="none"
                />
              </>
            ) : (
              // Inactive path - subtle
              <>
                <line
                  x1={`${sandyPoint.x}%`}
                  y1={`${sandyPoint.y}%`}
                  x2={`${point.x}%`}
                  y2={`${point.y}%`}
                  stroke="url(#inactiveGradient)"
                  strokeWidth="3"
                  opacity="0.3"
                  strokeLinecap="round"
                />
                <line
                  x1={`${sandyPoint.x}%`}
                  y1={`${sandyPoint.y}%`}
                  x2={`${point.x}%`}
                  y2={`${point.y}%`}
                  stroke="rgba(148, 163, 184, 0.2)"
                  strokeWidth="1.5"
                  opacity="0.5"
                  strokeLinecap="round"
                />
              </>
            )}
          </g>
        );
      })}

      <style>{`
        @keyframes pathFlow {
          0% {
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </svg>
  );
}
