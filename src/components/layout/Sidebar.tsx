import { useEffect, useRef, useState } from 'react';
import { LucideIcon, ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';

export interface NavItem {
  id: string | null;
  icon: LucideIcon;
  label: string;
  comingSoon?: boolean;
  externalUrl?: string;
  children?: NavItem[];
  section?: string;
}

interface SidebarProps {
  primaryItems: NavItem[];
  secondaryItems: NavItem[];
  currentScreen: string;
  onScreenChange: (screen: any) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

// V2 dark navy shell sidebar. Visually reflects the long-term MTech
// Marketing Hub information architecture; items without a built screen yet
// (comingSoon) are shown but disabled rather than removed or faked. Every
// existing screen remains reachable — see NAV item mapping in App.tsx.
export function Sidebar({ primaryItems, secondaryItems, currentScreen, onScreenChange, mobileOpen = false, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    mobileCloseRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onMobileClose?.();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileOpen, onMobileClose]);

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = !item.comingSoon && item.id === currentScreen;
    const branchActive = item.children?.some((child) => child.id === currentScreen) ?? false;

    const content = <>
      <Icon size={17} />
      <span className="v2-nav-item-label">{item.label}</span>
      {item.externalUrl && <ExternalLink className="v2-nav-item-label" size={13} aria-hidden="true" />}
      {item.comingSoon && <span className="v2-nav-item-soon">Soon</span>}
    </>;

    return (
      <div key={item.label} className="v2-nav-group">
        {item.externalUrl ? <a
          href={item.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="v2-nav-item"
          title={`${item.label} — opens in a new tab`}
          onClick={onMobileClose}
        >{content}</a> : <button
          onClick={() => {
            if (item.comingSoon || item.id === null) return;
            onScreenChange(item.id);
            onMobileClose?.();
          }}
          className="v2-nav-item"
          data-active={isActive}
          data-branch-active={branchActive}
          data-disabled={item.comingSoon}
          aria-current={isActive ? 'page' : undefined}
          title={item.comingSoon ? `${item.label} — coming soon` : item.label}
        >
          {content}
        </button>}
        {(isActive || branchActive) && item.children && !collapsed && <div className="v2-nav-children">
          {item.children.map((child) => {
            const ChildIcon = child.icon;
            return <button key={child.id} className="v2-nav-item v2-nav-child" data-active={child.id === currentScreen} aria-current={child.id === currentScreen ? 'page' : undefined} onClick={() => { if (child.id) onScreenChange(child.id); onMobileClose?.(); }} title={child.label}>
              <ChildIcon size={15} /><span className="v2-nav-item-label">{child.label}</span>
            </button>;
          })}
        </div>}
      </div>
    );
  };

  let previousSection = '';

  return (
    <aside id="main-navigation" className="v2-sidebar" data-collapsed={collapsed} data-mobile-open={mobileOpen} aria-label="Main navigation">
      <div className="v2-sidebar-brand">
        <div className="v2-sidebar-brand-mark">MT</div>
        <div className="v2-sidebar-brand-text">
          <div className="v2-sidebar-brand-title">MTech</div>
          <div className="v2-sidebar-brand-subtitle">Marketing Hub</div>
        </div>
        <button ref={mobileCloseRef} type="button" className="v2-mobile-nav-close" onClick={onMobileClose} aria-label="Close navigation">
          <X size={20} />
        </button>
      </div>

      <nav className="v2-sidebar-nav">
        {primaryItems.map(renderItem)}
        {secondaryItems.map((item) => {
          const heading = item.section && item.section !== previousSection ? item.section : null;
          previousSection = item.section ?? previousSection;
          return <div key={item.label} className="v2-sidebar-section">
            {heading && <div className="v2-sidebar-section-label">{heading}</div>}
            {renderItem(item)}
          </div>;
        })}
      </nav>

      <div className="v2-sidebar-collapse">
        <button className="v2-nav-item" onClick={() => setCollapsed((c) => !c)} title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          <span className="v2-nav-item-label">Collapse</span>
        </button>
      </div>
    </aside>
  );
}
