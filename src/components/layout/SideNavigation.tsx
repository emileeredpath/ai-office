import { useState } from 'react';
import { Home, Users, MessageCircle, CheckSquare, Calendar, FileText, BarChart3, Settings, ChevronDown } from 'lucide-react';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick?: () => void;
}

export function SideNavigation() {
  const [expanded, setExpanded] = useState(true);

  const mainNav: NavItem[] = [
    { icon: <Home size={20} />, label: 'Home' },
    { icon: <Users size={20} />, label: 'Team', badge: 5 },
    { icon: <MessageCircle size={20} />, label: 'Chat', badge: 2 },
    { icon: <CheckSquare size={20} />, label: 'Tasks', badge: 12 },
    { icon: <Calendar size={20} />, label: 'Calendar' },
    { icon: <FileText size={20} />, label: 'Files' },
  ];

  const bottomNav: NavItem[] = [
    { icon: <BarChart3 size={20} />, label: 'Analytics' },
    { icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div
      className={`flex flex-col h-screen transition-all duration-300 ${
        expanded ? 'w-20' : 'w-20'
      }`}
      style={{
        backgroundColor: '#0F1419',
        borderRight: '1px solid #2E3B4A',
      }}
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-center border-b border-[#2E3B4A] flex-shrink-0">
        <div className="text-2xl">🏢</div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-3 px-2">
        {mainNav.map((item, i) => (
          <button
            key={i}
            className="w-full h-12 rounded-lg flex items-center justify-center relative hover:bg-[#2E3B4A] transition-colors group"
            title={item.label}
          >
            <div className="text-[#8F9194] group-hover:text-[#F9701F] transition-colors">
              {item.icon}
            </div>
            {item.badge && (
              <span
                className="absolute top-0 right-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white"
                style={{ backgroundColor: '#F9701F' }}
              >
                {item.badge}
              </span>
            )}

            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-[#1D2A3A] text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
              {item.label}
            </div>
          </button>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <nav className="border-t border-[#2E3B4A] py-3 px-2 space-y-3 flex-shrink-0">
        {bottomNav.map((item, i) => (
          <button
            key={i}
            className="w-full h-12 rounded-lg flex items-center justify-center hover:bg-[#2E3B4A] transition-colors group relative"
            title={item.label}
          >
            <div className="text-[#8F9194] group-hover:text-[#F9701F] transition-colors">
              {item.icon}
            </div>

            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-[#1D2A3A] text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
              {item.label}
            </div>
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="h-16 border-t border-[#2E3B4A] flex items-center justify-center flex-shrink-0">
        <button className="w-10 h-10 rounded-full bg-[#F9701F] text-white font-bold hover:opacity-80 transition-opacity">
          E
        </button>
      </div>
    </div>
  );
}
