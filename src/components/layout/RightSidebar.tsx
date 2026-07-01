import { Clock, Calendar, MessageSquare, TrendingUp, Users } from 'lucide-react';

export function RightSidebar() {
  return (
    <div
      className="w-80 flex flex-col h-screen border-l overflow-y-auto"
      style={{
        backgroundColor: '#0F1419',
        borderColor: '#2E3B4A',
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-[#2E3B4A] flex-shrink-0">
        <h2 className="text-lg font-bold text-[#F0F4F8]">Board Room</h2>
        <p className="text-xs text-[#8F9194] mt-1">Weekly Strategy Review</p>
      </div>

      {/* Board Room Preview */}
      <div className="p-4 flex-shrink-0">
        <div
          className="rounded-lg overflow-hidden mb-4"
          style={{ backgroundColor: '#1D2A3A', height: '140px' }}
        >
          <div className="w-full h-full flex items-center justify-center text-[#8F9194]">
            <div className="text-center">
              <div className="text-3xl mb-2">🏛️</div>
              <p className="text-xs">Board Room</p>
            </div>
          </div>
        </div>

        {/* Upcoming Meeting */}
        <div className="bg-[#1D2A3A] rounded-lg p-3 border border-[#3a4f6a] mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#F0F4F8]">Weekly Strategy Review</h3>
            <span className="text-xs px-2 py-1 bg-[#F9701F] text-white rounded">Next</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#8F9194]">
              <Calendar size={12} />
              <span>Friday 3rd July</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8F9194]">
              <Clock size={12} />
              <span>10:30 AM</span>
            </div>
          </div>
          <button className="w-full mt-3 px-3 py-2 bg-[#F9701F] text-white text-xs rounded font-medium hover:opacity-90 transition-opacity">
            View Agenda
          </button>
        </div>
      </div>

      {/* Weekly Report */}
      <div className="px-4 py-3 border-b border-[#2E3B4A] flex-shrink-0">
        <h3 className="text-sm font-semibold text-[#F0F4F8] mb-3 flex items-center gap-2">
          <TrendingUp size={16} />
          Weekly Report Summary
        </h3>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1D2A3A] rounded p-3 border border-[#3a4f6a]">
            <p className="text-xs text-[#8F9194] mb-1">Campaigns Launched</p>
            <p className="text-xl font-bold text-[#F9701F]">3</p>
          </div>
          <div className="bg-[#1D2A3A] rounded p-3 border border-[#3a4f6a]">
            <p className="text-xs text-[#8F9194] mb-1">Leads Generated</p>
            <p className="text-xl font-bold text-[#4CAF50]">128</p>
          </div>
          <div className="bg-[#1D2A3A] rounded p-3 border border-[#3a4f6a]">
            <p className="text-xs text-[#8F9194] mb-1">Website Traffic</p>
            <p className="text-xl font-bold text-[#2196F3]">5,342</p>
            <p className="text-xs text-[#4CAF50] mt-1">+18%</p>
          </div>
          <div className="bg-[#1D2A3A] rounded p-3 border border-[#3a4f6a]">
            <p className="text-xs text-[#8F9194] mb-1">Tasks Completed</p>
            <p className="text-xl font-bold text-[#F0F4F8]">87%</p>
          </div>
        </div>
      </div>

      {/* Team Message */}
      <div className="px-4 py-3 border-b border-[#2E3B4A] flex-shrink-0">
        <h3 className="text-sm font-semibold text-[#F0F4F8] mb-3 flex items-center gap-2">
          <MessageSquare size={16} />
          Team Message from You
        </h3>

        <div className="bg-[#1D2A3A] rounded-lg p-3 border-l-2 border-[#F9701F]">
          <p className="text-sm text-[#F0F4F8] leading-relaxed">
            "Great progress this week team! 🚀 Let's keep pushing forward and make next week even better! 💪"
          </p>
          <p className="text-xs text-[#8F9194] mt-2">— Emilee</p>
        </div>
      </div>

      {/* Team Activity */}
      <div className="px-4 py-3 flex-1 overflow-y-auto">
        <h3 className="text-sm font-semibold text-[#F0F4F8] mb-3 flex items-center gap-2">
          <Users size={16} />
          Team Activity
        </h3>

        <div className="space-y-2">
          {[
            { name: 'Tisha', action: 'completed Instagram Post', time: '2 min ago' },
            { name: 'Jain', action: 'shared SEO Report', time: '15 min ago' },
            { name: 'Emily', action: 'submitted Campaign Review', time: '45 min ago' },
            { name: 'Sophie', action: 'fixed Technical Issue', time: '1h ago' },
          ].map((activity, i) => (
            <div key={i} className="text-xs text-[#8F9194] pb-2 border-b border-[#2E3B4A]">
              <p>
                <span className="text-[#F0F4F8] font-medium">{activity.name}</span> {activity.action}
              </p>
              <p className="text-[#5A6A7A] mt-1">{activity.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
