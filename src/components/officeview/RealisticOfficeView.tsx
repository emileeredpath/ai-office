import { TeamDashboardView } from './TeamDashboardView';

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
    <TeamDashboardView
      sandyThinking={sandyThinking}
      sandyMessage={sandyMessage}
      selectedRoomId={selectedRoomId}
      onSelectRoom={onSelectRoom}
      onAskSandy={onAskSandy}
    />
  );
}
