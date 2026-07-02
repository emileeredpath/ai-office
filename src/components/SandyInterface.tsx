import { useState } from 'react';
import { IsometricOfficeView } from '@/components/officeview/IsometricOfficeView';
import { RoomDetailDrawer } from '@/components/office3d/RoomDetailDrawer';
import { BoardRoomPanel } from '@/components/BoardRoomPanel';
import { RightPanel } from '@/components/RightPanel';
import { BottomPanel } from '@/components/BottomPanel';
import { AskSandyBar } from '@/components/AskSandyBar';
import { LeftSidebar, type NavKey } from '@/components/layout/LeftSidebar';
import { TopBar, type TopTab } from '@/components/layout/TopBar';
import { PlaceholderModal } from '@/components/PlaceholderModal';
import { TasksBoard } from '@/components/TasksBoard';
import { WorkflowTrail } from '@/components/WorkflowTrail';
import { SandyResponse } from '@/components/SandyResponse';
import { useOfficeStore } from '@/store/officeStore';
import { RoutingEngine } from '@/systems/RoutingEngine';
import { WorkflowEngine } from '@/systems/WorkflowEngine';
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
    setSandyMessage(`Routing: "${taskInput.trim()}"`);
    logActivity(`Sandy received: "${taskInput.trim()}"`);

    try {
      const routingEngine = new RoutingEngine(employees);
      const routing = routingEngine.route(taskInput, employees);
      setCurrentRouting(routing);
      setAssigningEmployeeId(routing.primaryAssignee.id);

      const involvedRoomIds = [routing.primaryAssignee, ...routing.suggestedCollaborators]
        .map((emp) => roomForEmployee(emp.id)?.id)
        .filter((id): id is string => Boolean(id));
      setActiveRoomIds(involvedRoomIds);

      const workflowEngine = new WorkflowEngine();
      const campaign = workflowEngine.createCampaign(taskInput, routing, employees);

      await new Promise((resolve) => setTimeout(resolve, 800));

      let totalTasks = 0;
      routing.taskBreakdown.forEach((item) => {
        item.subtasks.forEach((subtask, idx) => {
          assignTask(item.assignee.id, {
            id: `task-${campaign.id}-${item.assignee.id}-${idx}`,
            title: subtask,
            priority: idx === 0 ? ('high' as const) : ('medium' as const),
            createdAt: new Date().toISOString(),
            assignedBy: 'sandy',
          });
          totalTasks++;
        });
      });

      setTaskCount(totalTasks);
      setShowResponse(true);
      setTaskInput('');
      setSandyMessage(`Assigned to ${routing.primaryAssignee.name}`);
      logActivity(
        `Sandy routed the request to ${routing.primaryAssignee.name}${
          routing.suggestedCollaborators.length
            ? ` with support from ${routing.suggestedCollaborators.map((c) => c.name).join(', ')}`
            : ''
        }`
      );

      setTimeout(() => {
        setShowResponse(false);
        setAssigningEmployeeId(undefined);
        setCurrentRouting(undefined);
        setActiveRoomIds([]);
        setSandyMessage(undefined);
      }, 6000);

      setIsProcessing(false);
    } catch (error) {
      console.error('Error creating workflow:', error);
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
                <IsometricOfficeView
                  activeRoomIds={activeRoomIds}
                  sandyThinking={isProcessing}
                  sandyMessage={sandyMessage}
                  selectedRoomId={selectedRoomId}
                  onSelectRoom={setSelectedRoomId}
                />
              )}
              {topTab === 'board-room' && <BoardRoomPanel />}
              {topTab === 'tasks' && <TasksBoard />}
              {topTab === 'reports' && <PlaceholderPanel title="Reports" />}
              {topTab === 'analytics' && <PlaceholderPanel title="Analytics" />}
              {topTab === 'settings' && <PlaceholderPanel title="Settings" />}

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
