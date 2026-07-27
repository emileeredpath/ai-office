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
    <div className="w-[100px] bg-white border-r border-border flex flex-col items-center py-6 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentScreen === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onScreenChange(item.id)}
            className={`w-[84px] flex flex-col items-center gap-1 py-2.5 rounded-lg transition-colors ${
              isActive
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:bg-surface hover:text-text-primary'
            }`}
          >
            <Icon size={22} />
            <span className="text-[11px] font-medium leading-none">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
