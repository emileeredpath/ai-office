import { LucideIcon } from 'lucide-react';

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
}

interface SidebarProps {
  items: NavItem[];
  currentScreen: string;
  onScreenChange: (screen: any) => void;
}

export function Sidebar({ items, currentScreen, onScreenChange }: SidebarProps) {
  return (
    <div className="w-[100px] flex flex-col items-center py-6 gap-3" style={{ backgroundColor: 'var(--color-brand-mtech)' }}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentScreen === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onScreenChange(item.id)}
            className="w-[84px] flex flex-col items-center gap-1 py-2.5 rounded-lg transition-colors duration-200"
            style={
              isActive
                ? {
                    backgroundColor: 'var(--color-brand-mtech-accent)',
                    color: 'white',
                  }
                : {
                    color: 'rgba(255, 255, 255, 0.7)',
                  }
            }
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
              }
            }}
          >
            <Icon size={22} />
            <span className="text-[11px] font-medium leading-none">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
