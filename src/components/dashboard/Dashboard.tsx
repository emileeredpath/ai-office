import { useState, useEffect } from 'react';
import { useEmployees } from '@/hooks/useEmployees';
import { useTasks } from '@/hooks/useTasks';
import { useConversation } from '@/hooks/useConversations';
import { useAppStore } from '@/store/appStore';
import { EmployeeCard } from './EmployeeCard';
import { TaskList } from './TaskList';
import { SandyChat } from './SandyChat';
import { Button } from '@/components/ui/Button';
import { UserSelector } from '@/components/UserSelector';
import { CreateTaskModal } from './CreateTaskModal';
import * as api from '@/services/api';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<'team' | 'tasks' | 'sandy'>('team');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  const companyId = useAppStore((s) => s.companyId);
  const setCompanyId = useAppStore((s) => s.setCompanyId);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);

  // Initialize company and user on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const company = await api.getDefaultCompany();
        setCompanyId(company.id);
        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setLoading(false);
      }
    };

    initializeApp();
  }, [setCompanyId, setCurrentUser]);

  const { employees, loading: employeesLoading } = useEmployees(companyId || '');
  const { tasks, loading: tasksLoading, updateTask, refetch: refetchTasks } = useTasks(companyId || '');
  const { conversation, sendMessage } = useConversation(conversationId || '');

  // Set default user to Emilee once employees are loaded
  useEffect(() => {
    if (!currentUserId && employees.length > 0) {
      const emilee = employees.find((e) => e.name === 'Emilee');
      if (emilee) {
        setCurrentUser(emilee.id, emilee.name);
      }
    }
  }, [employees, currentUserId, setCurrentUser]);

  // Find Sandy
  const sandy = employees.find((e) => e.name === 'Sandy');

  // Group tasks by status
  const tasksByStatus = {
    backlog: tasks.filter((t) => t.status === 'backlog'),
    assigned: tasks.filter((t) => t.status === 'assigned'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    waiting_review: tasks.filter((t) => t.status === 'waiting_review'),
    complete: tasks.filter((t) => t.status === 'complete'),
  };

  const handleStartSandyChat = async () => {
    if (sandy && !conversationId && companyId && currentUserId) {
      try {
        const conversation = await api.createConversation(
          companyId,
          sandy.id,
          currentUserId,
          'Chat with Sandy'
        );
        setConversationId(conversation.id);
      } catch (error) {
        console.error('Failed to create conversation:', error);
      }
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await updateTask(taskId, { status: newStatus });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleCreateTask = async (taskData: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    employeeId?: string;
  }) => {
    if (!companyId) return;
    try {
      await api.createTask(companyId, {
        title: taskData.title,
        description: taskData.description || undefined,
        priority: taskData.priority,
        employee_id: taskData.employeeId,
        status: 'backlog',
      });
      // Refetch tasks to update the list
      await refetchTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  };

  if (loading || employeesLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="mb-4 text-2xl text-white">Loading AI Office...</div>
          <div className="text-gray-400">Setting up your workspace</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">AI Office</h1>
            <UserSelector />
          </div>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'team' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('team')}
            >
              👥 Team ({employees.length})
            </Button>
            <Button
              variant={activeTab === 'tasks' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('tasks')}
            >
              ✓ Tasks ({tasks.length})
            </Button>
            <Button
              variant={activeTab === 'sandy' ? 'primary' : 'secondary'}
              onClick={() => {
                setActiveTab('sandy');
                handleStartSandyChat();
              }}
            >
              🤖 Sandy
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Team Tab */}
        {activeTab === 'team' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Team Members</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((employee) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  isSelected={selectedEmployeeId === employee.id}
                  onSelect={() => setSelectedEmployeeId(employee.id)}
                  taskCount={tasks.filter((t) => t.employee_id === employee.id).length}
                />
              ))}
            </div>

            {/* Selected Employee Details */}
            {selectedEmployeeId && (
              <div className="mt-8 bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">
                  {employees.find((e) => e.id === selectedEmployeeId)?.name} Tasks
                </h3>
                <TaskList
                  tasks={tasks.filter((t) => t.employee_id === selectedEmployeeId)}
                  onStatusChange={handleTaskStatusChange}
                />
              </div>
            )}
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Task Board</h2>
              <Button onClick={() => setShowCreateTaskModal(true)}>+ New Task</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(tasksByStatus).map(([status, taskList]) => (
                <div key={status} className="bg-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-4 text-sm uppercase text-gray-400">
                    {status.replace(/_/g, ' ')} ({taskList.length})
                  </h3>
                  <div className="space-y-2">
                    {taskList.map((task) => (
                      <div
                        key={task.id}
                        className="bg-gray-700 rounded p-3 text-sm hover:bg-gray-600 cursor-pointer transition"
                        onClick={() => {
                          if (task.employee_id) setSelectedEmployeeId(task.employee_id);
                        }}
                      >
                        <div className="font-medium truncate">{task.title}</div>
                        <div className="text-gray-400 text-xs mt-1">{task.employee_name || 'Unassigned'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sandy Chat Tab */}
        {activeTab === 'sandy' && sandy && (
          <SandyChat sandyEmployee={sandy} conversation={conversation} onSendMessage={sendMessage} />
        )}
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateTaskModal}
        employees={employees}
        onClose={() => setShowCreateTaskModal(false)}
        onCreate={handleCreateTask}
      />
    </div>
  );
}
