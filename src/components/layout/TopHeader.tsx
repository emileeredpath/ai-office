import { Menu, Bell } from 'lucide-react';

export function TopHeader() {
  return (
    <div
      className="h-16 flex items-center justify-between px-6 border-b flex-shrink-0"
      style={{
        backgroundColor: '#111B26',
        borderColor: '#2E3B4A',
      }}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-[#1D2A3A] rounded-lg transition-colors">
          <Menu size={20} className="text-[#8F9194]" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-[#F0F4F8]">AI Office</h1>
          <p className="text-xs text-[#8F9194]">Marketing Department</p>
        </div>
      </div>

      {/* Center Section - Navigation Tabs */}
      <div className="hidden md:flex items-center gap-6">
        {[
          { icon: '📊', label: 'Office Floor' },
          { icon: '🏛️', label: 'Board Room' },
          { icon: '📈', label: 'Reports' },
          { icon: '⚙️', label: 'Settings' },
        ].map((tab, i) => (
          <button
            key={i}
            className="px-3 py-2 text-sm text-[#8F9194] hover:text-[#F9701F] transition-colors flex items-center gap-2"
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-[#1D2A3A] rounded-lg transition-colors">
          <Bell size={20} className="text-[#8F9194]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#F9701F] rounded-full" />
        </button>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-[#F0F4F8]">Emilee</p>
            <p className="text-xs text-[#8F9194]">Marketing Director</p>
          </div>
          <button className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F9701F] to-[#FF9E64] text-white font-bold hover:opacity-80 transition-opacity">
            E
          </button>
        </div>
      </div>
    </div>
  );
}
