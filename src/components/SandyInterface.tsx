import { useState, useEffect } from 'react';
import { OfficeFloorCards } from '@/components/office/OfficeFloorCards';
import { BoardRoomPanel } from '@/components/BoardRoomPanel';
import { SandyAgent } from '@/components/SandyAgent';
import { MainLayout } from '@/components/layout/MainLayout';
import { Send } from 'lucide-react';
import { useOfficeStore } from '@/store/officeStore';
import { RoutingEngine } from '@/systems/RoutingEngine';
import { WorkflowEngine, type WorkflowEvent } from '@/systems/WorkflowEngine';

export function SandyInterface() {
  const [taskInput, setTaskInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sandyMessage, setSandyMessage] = useState<string | undefined>();
  const [workflowEvents, setWorkflowEvents] = useState<WorkflowEvent[]>([]);

  const employees = useOfficeStore((state) => state.employees);
  const addTask = useOfficeStore((state) => state.addTask);

  const handleAskSandy = async () => {
    if (!taskInput.trim() || isProcessing) return;

    setIsProcessing(true);
    setWorkflowEvents([]);

    try {
      // Route the request
      const routingEngine = new RoutingEngine(employees);
      const routing = routingEngine.route(taskInput, employees);

      // Create workflow
      const workflowEngine = new WorkflowEngine();
      const campaign = workflowEngine.createCampaign(taskInput, routing, employees);

      // Listen for workflow events
      workflowEngine.onEvent((event) => {
        setWorkflowEvents((prev) => [...prev, event]);
        setSandyMessage(event.message);
      });

      // Assign tasks
      const tasks = workflowEngine.assignTasks(
        campaign.id,
        campaign.routing.taskBreakdown,
        employees
      );

      // Add tasks to employees in the store
      campaign.routing.taskBreakdown.forEach((item) => {
        item.subtasks.forEach((subtask, idx) => {
          const task = {
            id: `task-${campaign.id}-${item.assignee.id}-${idx}`,
            title: subtask,
            priority: idx === 0 ? ('high' as const) : ('medium' as const),
            createdAt: new Date().toISOString(),
          };
          addTask(item.assignee.id, task);
        });
      });

      // Generate Sandy's response
      const sandyResponse = workflowEngine.generateSandyResponse(campaign);
      setSandyMessage(sandyResponse);

      setTaskInput('');
      setTimeout(() => setIsProcessing(false), 2000);
    } catch (error) {
      console.error('Error creating workflow:', error);
      setSandyMessage('Error processing request. Please try again.');
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

      {/* Office Floor with Employee Desks */}
      <div className="w-full h-full flex flex-col relative">
        <div className="flex-1 relative overflow-hidden">
          <OfficeFloorCards
            onEmployeeAction={(employeeId, action) => {
              console.log(`Employee action: ${employeeId} - ${action}`);
            }}
          />
        </div>

        {/* Sandy Interaction Panel - Bottom Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            {/* Sandy Prompt Label */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                style={{ backgroundColor: '#F9701F' }}
              >
                🎯
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
                placeholder="Tell Sandy what needs to happen... (e.g., 'Create a social media campaign proposal')"
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
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Ask</span>
                  </>
                )}
              </button>
            </div>

            {/* Helper Text */}
            <div className="mt-2 text-xs text-[#8F9194]">
              Sandy will analyze the request, assign the right team members, and manage the workflow
            </div>
          </div>
        </div>

        {/* Gradient Fade for Visual Hierarchy */}
        <div
          className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(17, 27, 38, 0.95), transparent)',
          }}
        />
      </div>

      {/* Sandy Agent - Always visible */}
      <SandyAgent activeMessage={sandyMessage || (workflowEvents[workflowEvents.length - 1]?.message)} />
    </MainLayout>
  );
}
