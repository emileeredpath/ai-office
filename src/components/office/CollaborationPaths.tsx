import { useOfficeStore } from '@/store/officeStore';

interface DeskPosition {
  id: string;
  x: number;
  y: number;
}

export function CollaborationPaths() {
  const employees = useOfficeStore((state) => state.employees);

  // Generate desk positions based on grid layout
  const getDeskPositions = (): DeskPosition[] => {
    const positions: DeskPosition[] = [];
    const itemsPerRow = 3;
    const columnWidth = 350;
    const rowHeight = 480;
    const offsetX = 24;
    const offsetY = 24;

    employees.forEach((emp, index) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      const x = offsetX + col * columnWidth + columnWidth / 2;
      const y = offsetY + row * rowHeight + rowHeight / 2;

      positions.push({
        id: emp.id,
        x,
        y,
      });
    });

    return positions;
  };

  // Find employees that have task dependencies (for now, show connections to those with tasks in queue)
  const getCollaborationEdges = (positions: DeskPosition[]) => {
    const edges: Array<{ from: DeskPosition; to: DeskPosition; label: string }> = [];

    employees.forEach((emp) => {
      if (emp.taskQueue.length > 0) {
        const fromPos = positions.find((p) => p.id === emp.id);
        if (fromPos && employees.length > 0) {
          // Show connection to next available employee for visual flow
          const nextIdx = (employees.indexOf(emp) + 1) % employees.length;
          const nextEmp = employees[nextIdx];
          const toPos = positions.find((p) => p.id === nextEmp.id);

          if (toPos && fromPos.id !== toPos.id) {
            edges.push({
              from: fromPos,
              to: toPos,
              label: `${emp.taskQueue.length} task${emp.taskQueue.length !== 1 ? 's' : ''}`,
            });
          }
        }
      }
    });

    return edges;
  };

  const positions = getDeskPositions();
  const edges = getCollaborationEdges(positions);

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
      preserveAspectRatio="none"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#F9701F" />
        </marker>
        <style>{`
          .collaboration-path {
            stroke: url(#gradientPath);
            stroke-width: 2;
            stroke-dasharray: 5, 5;
            animation: dashFlow 20s linear infinite;
          }
          @keyframes dashFlow {
            to {
              stroke-dashoffset: -10;
            }
          }
        `}</style>
      </defs>

      <defs>
        <linearGradient id="gradientPath" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F9701F" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#F9701F" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Draw collaboration paths */}
      {edges.map((edge, idx) => {
        const dx = edge.to.x - edge.from.x;
        const dy = edge.to.y - edge.from.y;
        const midX = edge.from.x + dx / 2;
        const midY = edge.from.y + dy / 2;

        return (
          <g key={`edge-${idx}`}>
            {/* Curved path using quadratic bezier */}
            <path
              className="collaboration-path"
              d={`M ${edge.from.x} ${edge.from.y} Q ${midX} ${midY - 40} ${edge.to.x} ${edge.to.y}`}
              fill="none"
              markerEnd="url(#arrowhead)"
            />

            {/* Task count label */}
            <text
              x={midX}
              y={midY - 50}
              textAnchor="middle"
              className="text-xs font-medium pointer-events-none select-none"
              fill="#F9701F"
              opacity="0.7"
            >
              {edge.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
