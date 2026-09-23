import { EntitySelector } from '@/components/common/EntitySelector';
import { useAuth } from '@/contexts/AuthContext';
import { Menu } from 'lucide-react';

// Persistent top bar with the shared entity selector and current user's
// role. Screen consumers determine their own supported data scope.
export function TopBar({ onOpenNavigation, navigationOpen }: { onOpenNavigation: () => void; navigationOpen: boolean }) {
  const { isEditor } = useAuth();
  const userName = isEditor ? 'Emilee' : 'John';
  const userRole = isEditor ? 'Marketing Manager' : 'Viewer';
  const initials = userName.slice(0, 1);

  return (
    <div className="v2-topbar">
      <div className="v2-topbar-controls">
        <button
          className="v2-mobile-nav-toggle"
          onClick={onOpenNavigation}
          aria-label="Open navigation"
          aria-expanded={navigationOpen}
          aria-controls="main-navigation"
        >
          <Menu size={20} />
        </button>
        <EntitySelector />
      </div>
      <div className="v2-topbar-user">
        <div className="v2-topbar-avatar">{initials}</div>
        <div>
          <div className="v2-topbar-user-name">{userName}</div>
          <div className="v2-topbar-user-role">{userRole}</div>
        </div>
      </div>
    </div>
  );
}
