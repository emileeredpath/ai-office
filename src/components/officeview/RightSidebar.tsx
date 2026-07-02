import { rooms, boardRoom } from '@/data/rooms';

interface RightSidebarProps {
  selectedRoomId: string | null;
}

export function RightSidebar({ selectedRoomId }: RightSidebarProps) {
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <>
      {/* Board Room Preview */}
      <div
        className="rounded-lg p-4 overflow-hidden transition-all duration-300"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          minHeight: '160px',
        }}
      >
        <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {boardRoom.name}
        </h3>
        <div
          className="aspect-video rounded-md mb-2 flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(192,132,252,0.15)',
            border: '1px dashed rgba(192,132,252,0.4)',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
          }}
        >
          <div className="text-center">
            <div>Conference Room</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              View full Board Room tab →
            </div>
          </div>
        </div>
      </div>

      {/* Selected Room Info */}
      {selectedRoom && (
        <div
          className="rounded-lg p-4 transition-all duration-300"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: `2px solid ${selectedRoom.color}`,
          }}
        >
          <h3 className="text-sm font-bold mb-2" style={{ color: selectedRoom.color }}>
            {selectedRoom.name}
          </h3>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            <p style={{ margin: '0 0 4px 0' }}>
              <span style={{ color: 'var(--text-primary)' }}>Role:</span> {selectedRoom.title}
            </p>
            <p style={{ margin: 0 }}>
              <span style={{ color: 'var(--text-primary)' }}>Team Members:</span> {selectedRoom.employeeIds.length}
            </p>
          </div>
        </div>
      )}

      {/* Weekly Report Summary */}
      <div
        className="rounded-lg p-4"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
        }}
      >
        <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          This Week
        </h3>
        <div className="space-y-2 text-xs">
          <div
            className="flex justify-between p-2 rounded transition-all duration-200 hover:shadow-md"
            style={{ backgroundColor: 'rgba(249,112,31,0.15)', border: '1px solid rgba(249,112,31,0.3)' }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>Tasks Completed</span>
            <span style={{ fontWeight: 'bold', color: '#F97021' }}>12</span>
          </div>
          <div
            className="flex justify-between p-2 rounded transition-all duration-200 hover:shadow-md"
            style={{ backgroundColor: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>Active Campaigns</span>
            <span style={{ fontWeight: 'bold', color: '#8B5CF6' }}>5</span>
          </div>
          <div
            className="flex justify-between p-2 rounded transition-all duration-200 hover:shadow-md"
            style={{ backgroundColor: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>Team Online</span>
            <span style={{ fontWeight: 'bold', color: '#10B981' }}>9/9</span>
          </div>
          <div
            className="flex justify-between p-2 rounded transition-all duration-200 hover:shadow-md"
            style={{ backgroundColor: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>Avg Response</span>
            <span style={{ fontWeight: 'bold', color: '#3B82F6' }}>2h 15m</span>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div
        className="rounded-lg p-4 max-h-32 overflow-y-auto"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
        }}
      >
        <h3 className="text-sm font-bold mb-2 sticky top-0" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}>
          Recent Activity
        </h3>
        <div className="space-y-1.5 text-xs">
          <div
            className="flex gap-2 p-1.5 rounded transition-all duration-200 hover:bg-opacity-50"
            style={{ backgroundColor: 'rgba(249,112,31,0.1)', color: 'var(--text-secondary)' }}
          >
            <span>📧</span>
            <span className="truncate">Email campaign ready</span>
          </div>
          <div
            className="flex gap-2 p-1.5 rounded transition-all duration-200 hover:bg-opacity-50"
            style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: 'var(--text-secondary)' }}
          >
            <span>📊</span>
            <span className="truncate">SEO metrics updated</span>
          </div>
          <div
            className="flex gap-2 p-1.5 rounded transition-all duration-200 hover:bg-opacity-50"
            style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: 'var(--text-secondary)' }}
          >
            <span>✅</span>
            <span className="truncate">Website audit done</span>
          </div>
          <div
            className="flex gap-2 p-1.5 rounded transition-all duration-200 hover:bg-opacity-50"
            style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: 'var(--text-secondary)' }}
          >
            <span>🎯</span>
            <span className="truncate">Q4 planning started</span>
          </div>
        </div>
      </div>
    </>
  );
}
