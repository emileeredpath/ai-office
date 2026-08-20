import { EntitySelector } from '@/components/common/EntitySelector';
import { useAuth } from '@/contexts/AuthContext';

// Persistent global top bar — entity selector shows on every screen (shell
// requirement); it currently filters the Overview only, other screens keep
// their own independent brand filters until they're redesigned.
export function TopBar() {
  const { isEditor } = useAuth();
  const userName = isEditor ? 'Emilee' : 'John';
  const userRole = isEditor ? 'Marketing Manager' : 'Viewer';
  const initials = userName.slice(0, 1);

  return (
    <div className="v2-topbar">
      <EntitySelector />
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
