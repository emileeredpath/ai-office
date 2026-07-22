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
    <div className="w-20 bg-white border-r border-border flex flex-col items-center py-6 gap-8">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentScreen === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onScreenChange(item.id)}
            className={`p-3 rounded-lg transition-colors ${
              isActive
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:bg-surface hover:text-text-primary'
            }`}
            title={item.label}
          >
            <Icon size={24} />
          </button>
        );
      })}
    </div>
  );
}
