<<<<<<< HEAD
import { useState } from 'react';
import { RealisticOfficeView } from '@/components/officeview/RealisticOfficeView';
import { RoomDetailDrawer } from '@/components/office3d/RoomDetailDrawer';
import { BoardRoomPanel } from '@/components/BoardRoomPanel';
import { RightPanel } from '@/components/RightPanel';
import { BottomPanel } from '@/components/BottomPanel';
import { AskSandyBar } from '@/components/AskSandyBar';
import { SettingsPanel } from '@/components/SettingsPanel';
import { CampaignsView } from '@/components/CampaignsView';
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

      // Unknown command - check API key
      const apiKey = localStorage.getItem('anthropic_api_key');

      if (!apiKey?.trim()) {
        // No API key - show fallback message
        const fallback =
          "I don't have an API key configured yet — add it in Settings so I can process new briefs. For task queries, try asking: what are my tasks, what's outstanding on [campaign], or what's waiting.";
        setSandyMessage(fallback);
        setShowResponse(true);
        setTaskInput('');
        logActivity(`Sandy: ${fallback}`);

        setTimeout(() => {
          setShowResponse(false);
          setSandyMessage(undefined);
        }, 6000);

        setIsProcessing(false);
        return;
      }

      // API key exists - treat as new brief
      let totalTasks = 0;

      try {
        setSandyMessage('Generating campaign with Claude...');
        const generator = new ClaudeWorkflowGenerator(apiKey);
        const workflow = await generator.generateWorkflow(taskInput);
        const workflowTasks = generator.createTasksFromWorkflow(workflow, employees);

        for (const { employeeId, task } of workflowTasks) {
          assignTask(employeeId, task);
          totalTasks++;
        }

        setTaskCount(totalTasks);
        setShowResponse(true);
        setTaskInput('');
        setSandyMessage(`Campaign created: ${workflow.campaignName}`);
        logActivity(`Sandy created campaign: "${workflow.campaignName}" with ${totalTasks} tasks using Claude API`);

        setTimeout(() => {
          setShowResponse(false);
          setSandyMessage(undefined);
        }, 6000);

        setIsProcessing(false);
        return;
      } catch (claudeError) {
        console.error('Claude API error, falling back to routing engine:', claudeError);
        // Fall through to routing engine
      }

      // Fallback: Use routing engine
      setSandyMessage('Routing request...');
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
              {topTab === 'tasks' && <TasksBoard />}
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
=======
import { useState, useEffect } from 'react';
import { TodaysWork } from '@/components/TodaysWork';
import { TasksList } from '@/components/TasksList';
import { AllTasksList } from '@/components/AllTasksList';
import { ProjectsList } from '@/components/ProjectsList';
import { CampaignsList } from '@/components/CampaignsList';
import { CampaignBuilder } from '@/components/CampaignBuilder';
import { BoardRoom } from '@/components/BoardRoom';
import { KnowledgeHub } from '@/components/KnowledgeHub';
import { SettingsPanel } from '@/components/SettingsPanel';
import { ActivityFeed } from '@/components/ActivityFeed';
import { EmployeeChat } from '@/components/EmployeeChat';
import { CalendarScheduling } from '@/components/CalendarScheduling';
import { VisualOutputs } from '@/components/VisualOutputs';
import { LeftSidebar, type NavKey } from '@/components/layout/LeftSidebar';
import { TopBar, type TopTab } from '@/components/layout/TopBar';
import { CompletedTasksProvider } from '@/contexts/CompletedTasksContext';

export function SandyInterface() {
  const [topTab, setTopTab] = useState<TopTab>('home');
  const [companyId, setCompanyId] = useState<string>('default');
  const [currentUserId, setCurrentUserId] = useState<string>('emilee');

  // Initialize company and user
  useEffect(() => {
    setCompanyId('mtech-group');
  }, []);

  const handleNavSelect = (key: NavKey) => {
    // Map left sidebar navigation to top tabs
    const tabMap: Record<NavKey, TopTab> = {
      home: 'home',
      team: 'chat',
      messages: 'chat',
      tasks: 'tasks',
      calendar: 'home',
      files: 'campaign-builder',
      campaigns: 'campaign-builder',
      analytics: 'home',
      help: 'chat',
    };
    setTopTab(tabMap[key] || 'home');
  };

  return (
    <CompletedTasksProvider>
      <div className="flex h-screen w-screen overflow-hidden" style={{ backgroundColor: '#070A0F' }}>
        <LeftSidebar active="home" onSelect={handleNavSelect} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar active={topTab} onSelect={setTopTab} />

          <div className="flex-1 overflow-hidden">
            {topTab === 'home' && <TodaysWork companyId={companyId} currentUserId={currentUserId} />}
            {topTab === 'tasks' && <TasksList companyId={companyId} currentUserId={currentUserId} />}
            {topTab === 'campaign-builder' && <CampaignBuilder />}
            {topTab === 'chat' && <EmployeeChat />}
          </div>
      </div>
    </div>
    </CompletedTasksProvider>
>>>>>>> claude/new-session-f2d46t
  );
}
