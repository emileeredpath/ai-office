import { ThemeToggle } from '@/components/ThemeToggle';

export type TopTab = 'home' | 'projects' | 'tasks' | 'campaigns' | 'board-room' | 'knowledge' | 'activity' | 'chat' | 'calendar' | 'outputs' | 'settings';

interface TopBarProps {
  active: TopTab;
  onSelect: (tab: TopTab) => void;
}

const TABS: { key: TopTab; label: string }[] = [
  { key: 'home', label: "Today's Work" },
  { key: 'projects', label: 'Projects' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'campaigns', label: 'Campaigns' },
  { key: 'activity', label: 'Activity' },
  { key: 'chat', label: 'Chat' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'outputs', label: 'Outputs' },
  { key: 'board-room', label: 'Board Room' },
  { key: 'knowledge', label: 'Knowledge' },
  { key: 'settings', label: 'Settings' },
];

export function TopBar({ active, onSelect }: TopBarProps) {
  return (
    <div
      className="h-14 flex items-center justify-between px-6 flex-shrink-0 border-b transition-colors duration-300"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div>
        <h1 className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
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
                color: isActive ? 'var(--accent-orange)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'rgba(249, 112, 31, 0.12)' : 'transparent',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="text-right hidden sm:block">
          <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
            Emilee
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Marketing Director
          </p>
        </div>
      </div>
    </div>
  );
}
