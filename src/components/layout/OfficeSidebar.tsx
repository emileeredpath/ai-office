import { NavLink } from 'react-router-dom';
import { LayoutGrid, BarChart3, Settings, Box } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutGrid, label: 'Office Floor' },
  { to: '/3d-office', icon: Box, label: '3D Office' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function OfficeSidebar() {
  return (
    <aside
      className="w-16 flex flex-col items-center py-4 gap-2 border-r"
      style={{ backgroundColor: '#111B26', borderColor: '#3a4f6a' }}
    >
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          title={label}
          className={({ isActive }) =>
            `flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
              isActive ? 'text-orange-400' : 'hover:bg-surface-2'
            }`
          }
          style={({ isActive }) => ({
            color: isActive ? '#F9701F' : '#8F9194',
            backgroundColor: isActive ? '#F9701F22' : undefined,
          })}
        >
          <Icon size={18} />
        </NavLink>
      ))}
    </aside>
  );
}
