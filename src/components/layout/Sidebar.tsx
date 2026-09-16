import { useState } from 'react';
import { LucideIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export interface NavItem {
  id: string | null;
  icon: LucideIcon;
  label: string;
  comingSoon?: boolean;
  children?: NavItem[];
}

interface SidebarProps {
  primaryItems: NavItem[];
  secondaryItems: NavItem[];
  currentScreen: string;
  onScreenChange: (screen: any) => void;
}

// V2 dark navy shell sidebar. Visually reflects the long-term MTech
// Marketing Hub information architecture; items without a built screen yet
// (comingSoon) are shown but disabled rather than removed or faked. Every
// existing screen remains reachable — see NAV item mapping in App.tsx.
export function Sidebar({ primaryItems, secondaryItems, currentScreen, onScreenChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = !item.comingSoon && item.id === currentScreen;
    const branchActive = item.children?.some((child) => child.id === currentScreen) ?? false;

    return (
      <div key={item.label} className="v2-nav-group">
        <button
          onClick={() => {
            if (item.comingSoon || item.id === null) return;
            onScreenChange(item.id);
          }}
          className="v2-nav-item"
          data-active={isActive}
          data-branch-active={branchActive}
          data-disabled={item.comingSoon}
          title={item.comingSoon ? `${item.label} — coming soon` : item.label}
        >
          <Icon size={17} />
          <span className="v2-nav-item-label">{item.label}</span>
          {item.comingSoon && <span className="v2-nav-item-soon">Soon</span>}
        </button>
        {(isActive || branchActive) && item.children && !collapsed && <div className="v2-nav-children">
          {item.children.map((child) => {
            const ChildIcon = child.icon;
            return <button key={child.id} className="v2-nav-item v2-nav-child" data-active={child.id === currentScreen} onClick={() => child.id && onScreenChange(child.id)} title={child.label}>
              <ChildIcon size={15} /><span className="v2-nav-item-label">{child.label}</span>
            </button>;
          })}
        </div>}
      </div>
    );
  };

  return (
    <div className="v2-sidebar" data-collapsed={collapsed}>
      <div className="v2-sidebar-brand">
        <div className="v2-sidebar-brand-mark">MT</div>
        <div className="v2-sidebar-brand-text">
          <div className="v2-sidebar-brand-title">MTech</div>
          <div className="v2-sidebar-brand-subtitle">Marketing Hub</div>
        </div>
      </div>

      <nav className="v2-sidebar-nav">
        {primaryItems.map(renderItem)}
        <div className="v2-sidebar-section-label">More</div>
        {secondaryItems.map(renderItem)}
      </nav>

      <div className="v2-sidebar-collapse">
        <button className="v2-nav-item" onClick={() => setCollapsed((c) => !c)} title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          <span className="v2-nav-item-label">Collapse</span>
        </button>
      </div>
    </div>
  );
}
