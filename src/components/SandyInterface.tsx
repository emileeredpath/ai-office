import { useState, useEffect } from 'react';
import { RealisticOfficeView } from '@/components/officeview/RealisticOfficeView';
import { RoomDetailDrawer } from '@/components/office3d/RoomDetailDrawer';
import { BoardRoomPanel } from '@/components/BoardRoomPanel';
import { RightPanel } from '@/components/RightPanel';
import { BottomPanel } from '@/components/BottomPanel';
import { AskSandyBar } from '@/components/AskSandyBar';
import { SettingsPanel } from '@/components/SettingsPanel';
import { CampaignsView } from '@/components/CampaignsView';
import { MyTasks } from '@/components/MyTasks';
import { LeftSidebar, type NavKey } from '@/components/layout/LeftSidebar';
import { TopBar, type TopTab } from '@/components/layout/TopBar';
import { PlaceholderModal } from '@/components/PlaceholderModal';
import { TasksBoard } from '@/components/TasksBoard';
import { WorkflowTrail } from '@/components/WorkflowTrail';
import { SandyResponse } from '@/components/SandyResponse';
import { useOfficeStore } from '@/store/officeStore';
import { RoutingEngine } from '@/systems/RoutingEngine';
import { WorkflowEngine } from '@/systems/WorkflowEngine';
import { ClaudeWorkflowGenerator } from '@/systems/ClaudeWorkflowGenerator';
import { SandyCommandParser } from '@/systems/SandyCommandParser';
import type { RoutingResult } from '@/systems/RoutingEngine';
import { rooms, roomForEmployee } from '@/data/rooms';

export function SandyInterface() {
  const [taskInput, setTaskInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [assigningEmployeeId, setAssigningEmployeeId] = useState<string | undefined>();
  const [currentRouting, setCurrentRouting] = useState<RoutingResult | undefined>();
  const [currentRequest, setCurrentRequest] = useState<string>('');
  const [taskCount, setTaskCount] = useState(0);
  const [showResponse, setShowResponse] = useState(false);
  const [navTab, setNavTab] = useState<NavKey>('home');
  const [topTab, setTopTab] = useState<TopTab>('office');
  const [placeholderTitle, setPlaceholderTitle] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [activeRoomIds, setActiveRoomIds] = useState<string[]>([]);
  const [sandyMessage, setSandyMessage] = useState<string | undefined>();
  const [companyId, setCompanyId] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Initialize company and user
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const company = await import('@/services/api').then((api) => api.getDefaultCompany());
        setCompanyId(company.id);
      } catch (error) {
        console.error('Failed to initialize company:', error);
      }
    };
    initializeApp();
  }, []);

  const NAV_LABELS: Record<NavKey, string> = {
    home: 'Home',
    team: 'Team',
    messages: 'Messages',
    tasks: 'Tasks',
    calendar: 'Calendar',
    files: 'Files',
    campaigns: 'Campaigns',
    analytics: 'Analytics',
    help: 'Help',
  };

  const handleNavSelect = (key: NavKey) => {
    setNavTab(key);
    if (key === 'home') {
      setTopTab('office');
      return;
    }
    if (key === 'analytics') {
      setTopTab('analytics');
      return;
    }
    if (key === 'tasks') {
      setTopTab('tasks');
      return;
    }
    setPlaceholderTitle(NAV_LABELS[key]);
  };

  const employees = useOfficeStore((state) => state.employees);
  const assignTask = useOfficeStore((state) => state.assignTask);
  const logActivity = useOfficeStore((state) => state.logActivity);

  const handleAskSandy = async () => {
    if (!taskInput.trim() || isProcessing) return;

    setIsProcessing(true);
    setShowResponse(false);
    setCurrentRequest(taskInput);
    logActivity(`Sandy received: "${taskInput.trim()}"`);

    try {
      // Parse the command
      const parser = new SandyCommandParser();
      const command = parser.parseCommand(taskInput);

      // Handle recognized commands
      if (command.type !== 'unknown') {
        const response = parser.executeCommand(command, employees);
        setTaskInput('');
        setSandyMessage(response);
        setShowResponse(true);
        logActivity(`Sandy: ${response}`);

        setTimeout(() => {
          setShowResponse(false);
          setSandyMessage(undefined);
        }, 8000);

        setIsProcessing(false);
        return;
      }

      // For new requests, guide user to create tasks manually
      // Sandy now recommends but doesn't auto-create
      const suggestion = `I understand you need: "${taskInput.trim()}"

This sounds like a task! Go to the **Tasks** tab and create it there. That way you can:
- Add full details
- Delegate to a specialist
- Track progress in one place`;

      setSandyMessage(suggestion);
      setShowResponse(true);
      setTaskInput('');
      logActivity(`Sandy suggested creating a task for: "${taskInput.trim()}"`);

      setTimeout(() => {
        setShowResponse(false);
        setSandyMessage(undefined);
      }, 8000);

      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing Sandy request:', error);
      setSandyMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowResponse(true);

      setTimeout(() => {
        setShowResponse(false);
        setSandyMessage(undefined);
      }, 4000);

      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ backgroundColor: '#070A0F' }}>
      <LeftSidebar active={navTab} onSelect={handleNavSelect} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar active={topTab} onSelect={setTopTab} />
        <AskSandyBar
          value={taskInput}
          onChange={setTaskInput}
          onSubmit={handleAskSandy}
          isProcessing={isProcessing}
        />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {currentRouting && <WorkflowTrail routing={currentRouting} isActive={!showResponse} />}

            <div className="flex-1 relative overflow-hidden">
              {topTab === 'office' && (
                <RealisticOfficeView
                  activeRoomIds={activeRoomIds}
                  sandyThinking={isProcessing}
                  sandyMessage={sandyMessage}
                  selectedRoomId={selectedRoomId}
                  onSelectRoom={setSelectedRoomId}
                />
              )}
              {topTab === 'board-room' && <BoardRoomPanel />}
              {topTab === 'tasks' && companyId && currentUserId && (
                <MyTasks companyId={companyId} currentUserId={currentUserId} />
              )}
              {topTab === 'campaigns' && <CampaignsView />}
              {topTab === 'reports' && <PlaceholderPanel title="Reports" />}
              {topTab === 'analytics' && <PlaceholderPanel title="Analytics" />}
              {topTab === 'settings' && <SettingsPanel />}

              {topTab === 'office' && selectedRoomId && (
                <RoomDetailDrawer
                  room={rooms.find((r) => r.id === selectedRoomId)!}
                  onClose={() => setSelectedRoomId(null)}
                />
              )}

              {showResponse && currentRouting && (
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-2xl px-6 pointer-events-none">
                  <SandyResponse routing={currentRouting} taskCount={taskCount} originalRequest={currentRequest} />
                </div>
              )}
            </div>

            <BottomPanel />
          </div>

          <RightPanel />
        </div>
      </div>

      {placeholderTitle && (
        <PlaceholderModal title={placeholderTitle} onClose={() => setPlaceholderTitle(null)} />
      )}
    </div>
  );
}

function PlaceholderPanel({ title }: { title: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#0A0E14' }}>
      <div className="text-center">
        <p className="text-lg font-semibold" style={{ color: '#E8ECF1' }}>
          {title}
        </p>
        <p className="text-sm mt-1" style={{ color: '#5C6879' }}>
          Coming soon
        </p>
      </div>
    </div>
  );
}
