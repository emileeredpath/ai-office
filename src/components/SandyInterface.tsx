import { useState } from 'react';
import { OfficeFloorCards } from '@/components/office/OfficeFloorCards';
import { BoardRoomPanel } from '@/components/BoardRoomPanel';
import { SandyAgent } from '@/components/SandyAgent';
import { SandySyncPanel } from '@/components/SandySyncPanel';
import { SandyTodoPanel } from '@/components/SandyTodoPanel';
import { WorkflowTrail } from '@/components/WorkflowTrail';
import { SandyResponse } from '@/components/SandyResponse';
import { MainLayout } from '@/components/layout/MainLayout';
import { Send } from 'lucide-react';
import { useOfficeStore } from '@/store/officeStore';
import { RoutingEngine } from '@/systems/RoutingEngine';
import { WorkflowEngine } from '@/systems/WorkflowEngine';
import type { RoutingResult } from '@/systems/RoutingEngine';

export function SandyInterface() {
  const [taskInput, setTaskInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [assigningEmployeeId, setAssigningEmployeeId] = useState<string | undefined>();
  const [currentRouting, setCurrentRouting] = useState<RoutingResult | undefined>();
  const [currentRequest, setCurrentRequest] = useState<string>('');
  const [taskCount, setTaskCount] = useState(0);
  const [showResponse, setShowResponse] = useState(false);

  const employees = useOfficeStore((state) => state.employees);
  const assignTask = useOfficeStore((state) => state.assignTask);

  const handleAskSandy = async () => {
    if (!taskInput.trim() || isProcessing) return;

    setIsProcessing(true);
    setShowResponse(false);
    setCurrentRequest(taskInput);

    try {
      // Route the request
      const routingEngine = new RoutingEngine(employees);
      const routing = routingEngine.route(taskInput, employees);
      setCurrentRouting(routing);

      // Show primary assignee highlight
      setAssigningEmployeeId(routing.primaryAssignee.id);

      // Create workflow
      const workflowEngine = new WorkflowEngine();
      const campaign = workflowEngine.createCampaign(taskInput, routing, employees);

      // Simulate task assignment with delay for visual effect
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Assign tasks
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

      // Auto-hide response after 6 seconds
      setTimeout(() => {
        setShowResponse(false);
        setAssigningEmployeeId(undefined);
        setCurrentRouting(undefined);
      }, 6000);

      setIsProcessing(false);
    } catch (error) {
      console.error('Error creating workflow:', error);
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskSandy();
    }
  };

  return (
    <MainLayout rightPanel={<BoardRoomPanel />}>
      {/* Workflow Trail */}
      {currentRouting && <WorkflowTrail routing={currentRouting} isActive={!showResponse} />}

      {/* Office Floor with Employee Desks */}
      <div className="w-full h-full flex flex-col relative">
        <div className="flex-1 relative overflow-hidden">
          <OfficeFloorCards assigningEmployeeId={assigningEmployeeId} />
        </div>

        {/* Sandy Response Display */}
        {showResponse && currentRouting && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-2xl px-6 pointer-events-none">
            <SandyResponse routing={currentRouting} taskCount={taskCount} originalRequest={currentRequest} />
          </div>
        )}

        {/* Sandy Interaction Panel - Bottom Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            {/* Sandy Prompt Label */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                style={{ backgroundColor: '#F9701F' }}
              >
                🧠
              </div>
              <label htmlFor="sandy-input" className="text-sm font-medium text-[#F0F4F8]">
                Ask Sandy
              </label>
            </div>

            {/* Input Box */}
            <div className="flex gap-2 items-end">
              <textarea
                id="sandy-input"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tell Sandy what needs to happen..."
                className="flex-1 px-4 py-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#F9701F] transition-all"
                style={{
                  backgroundColor: '#1D2A3A',
                  color: '#F0F4F8',
                  borderColor: '#3a4f6a',
                  border: '1px solid #3a4f6a',
                }}
                rows={2}
                disabled={isProcessing}
              />
              <button
                onClick={handleAskSandy}
                disabled={isProcessing || !taskInput.trim()}
                className="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap"
                style={{
                  backgroundColor: taskInput.trim() && !isProcessing ? '#F9701F' : '#F9701F80',
                  color: '#FFFFFF',
                  cursor: taskInput.trim() && !isProcessing ? 'pointer' : 'not-allowed',
                }}
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={16} />
                    <span>Ask</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Gradient Fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(17, 27, 38, 0.95), transparent)',
          }}
        />
      </div>

      {/* Sandy Agent */}
      <SandyAgent activeMessage={isProcessing ? '🧠 Analyzing your request...' : undefined} />

      {/* Sandy Sync Panel */}
      <SandySyncPanel />

      {/* Sandy's To-Do List */}
      <SandyTodoPanel />
    </MainLayout>
  );
}
