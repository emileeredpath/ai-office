interface CollaborationAreaProps {
  width: number;
  height: number;
}

export function CollaborationArea({ width, height }: CollaborationAreaProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '2px solid var(--border-color)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* Table surface */}
      <div
        style={{
          width: '90%',
          height: '60%',
          backgroundColor: '#8B6F47',
          backgroundImage: `linear-gradient(135deg, #A0826D 0%, #8B6F47 50%, #6B5435 100%)`,
          borderRadius: '8px',
          border: '1px solid rgba(0,0,0,0.2)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Whiteboard on table */}
        <div
          style={{
            width: '80%',
            height: '80%',
            backgroundColor: '#F5F1E8',
            borderRadius: '4px',
            border: '2px solid #999',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: '600', color: '#333' }}>
            Team Goals
          </div>
          <div
            style={{
              width: '70%',
              height: '1px',
              backgroundColor: '#D84C45',
            }}
          />
          <div
            style={{
              width: '70%',
              height: '1px',
              backgroundColor: '#2BA876',
            }}
          />
          <div
            style={{
              width: '70%',
              height: '1px',
              backgroundColor: '#1E5A9F',
            }}
          />
        </div>
      </div>

      {/* Label */}
      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '500' }}>
        Collaboration Area
      </div>
    </div>
  );
}
