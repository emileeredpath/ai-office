import { useOfficeStore } from '@/store/officeStore';
import { LivingOfficeView } from './LivingOfficeView';
import { OfficeRightSidebar } from './OfficeRightSidebar';
import { OfficeBottomBar } from './OfficeBottomBar';

interface RealisticOfficeViewProps {
  activeRoomIds: string[];
  sandyThinking: boolean;
  sandyMessage?: string;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string | null) => void;
  onAskSandy?: () => void;
}

export function RealisticOfficeView({
  activeRoomIds,
  sandyThinking,
  sandyMessage,
  selectedRoomId,
  onSelectRoom,
  onAskSandy,
}: RealisticOfficeViewProps) {
  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Main office area: floor + right sidebar */}
      <div className="flex-1 flex gap-4 p-6 overflow-hidden">
        {/* Living Office View - main center area */}
        <div className="flex-1 overflow-hidden">
          <LivingOfficeView
            sandyThinking={sandyThinking}
            sandyMessage={sandyMessage}
            selectedRoomId={selectedRoomId}
            onSelectRoom={onSelectRoom}
            onAskSandy={onAskSandy}
          />
        </div>

        {/* Right Sidebar */}
        <div className="w-72 flex flex-col gap-4 overflow-y-auto">
          <OfficeRightSidebar selectedRoomId={selectedRoomId} />
        </div>
      </div>

      {/* Bottom Bar - Activity Feed + Collaboration + Ask Sandy */}
      <div style={{ borderTop: '1px solid var(--border-color)' }}>
        <OfficeBottomBar />
      </div>
    </div>
  );
}
