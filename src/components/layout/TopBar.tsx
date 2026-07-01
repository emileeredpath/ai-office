export type TopTab = 'office' | 'board-room' | 'reports' | 'analytics' | 'settings' | 'tasks';

interface TopBarProps {
  active: TopTab;
  onSelect: (tab: TopTab) => void;
}

const TABS: { key: TopTab; label: string }[] = [
  { key: 'office', label: 'Office' },
  { key: 'board-room', label: 'Board Room' },
  { key: 'reports', label: 'Reports' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'settings', label: 'Settings' },
];

export function TopBar({ active, onSelect }: TopBarProps) {
  return (
    <div
      className="h-14 flex items-center justify-between px-6 flex-shrink-0 border-b"
      style={{ backgroundColor: '#0D131C', borderColor: '#1E2733' }}
    >
      <div>
        <h1 className="text-base font-bold tracking-tight" style={{ color: '#E8ECF1' }}>
          AI Office
        </h1>
      </div>

      <div className="flex items-center gap-1">
        {TABS.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onSelect(tab.key)}
              className="px-4 py-2 rounded-md text-sm font-medium transition-all"
              style={{
                color: isActive ? '#F9701F' : '#8B96A5',
                backgroundColor: isActive ? 'rgba(249, 112, 31, 0.12)' : 'transparent',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-medium" style={{ color: '#E8ECF1' }}>
            Emilee
          </p>
          <p className="text-xs" style={{ color: '#5C6879' }}>
            Marketing Director
          </p>
        </div>
      </div>
    </div>
  );
}
