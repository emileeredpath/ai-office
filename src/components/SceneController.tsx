import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { OfficeScene } from '@/components/3d/OfficeScene';
import { BoardRoomScene } from '@/components/3d/BoardRoomScene';
import { Sandy } from '@/components/Sandy';
import { MessageCircle, Users } from 'lucide-react';

export function SceneController() {
  const location = useLocation();
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const is3DOffice = location.pathname === '/3d-office';

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* 3D Scene */}
      <div className="flex-1 relative">
        {is3DOffice ? <OfficeScene /> : <BoardRoomScene />}
      </div>

      {/* Sandy Briefing Button (floating) */}
      <button
        onClick={() => setIsBriefingOpen(true)}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-[#F9701F] text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center group"
        title="Sandy's Briefing"
      >
        <MessageCircle size={24} />
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-[#1D2A3A] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Sandy's Briefing
        </div>
      </button>

      {/* Scene indicator */}
      <div className="absolute top-6 right-6 flex items-center gap-2 bg-[#1D2A3A]/80 backdrop-blur px-3 py-2 rounded-lg text-xs text-[#F0F4F8]">
        <Users size={16} />
        <span>{is3DOffice ? 'Office Floor' : 'Board Room'}</span>
      </div>

      {/* Sandy Panel */}
      <Sandy isOpen={isBriefingOpen} onClose={() => setIsBriefingOpen(false)} />
    </div>
  );
}
