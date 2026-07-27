import { ExternalLink } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { TaskRow } from '@/components/tasks/TaskRow';
import { StatCard } from '@/components/common/StatCard';
import { formatDate } from '@/utils/dateUtils';

const MTECH_AI_PROJECT_URL = 'https://claude.ai/project/019ef9de-64f0-75c3-8a1e-67749db5192e';

export function HomeScreen() {
  const { getTasksForToday, getOverdueTasks, getWaitingForJohnTasks, getCompletedToday } =
    useAppStore();

  const tasksToday = getTasksForToday();
  const overdueTasks = getOverdueTasks();
  const waitingForJohn = getWaitingForJohnTasks();
  const completedToday = getCompletedToday();

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = formatDate(today);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">{getGreeting()}, Emilee</h1>
            <p className="text-text-secondary">{dayName + ' ' + dateStr}</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <StatCard title="Due today" value={tasksToday.length} accent="#3B82F6" />
          <StatCard title="Overdue" value={overdueTasks.length} accent="#EF4444" />
          <StatCard title="Waiting for approval" value={waitingForJohn.length} accent="#F59E0B" />
        </div>

        {/* MTech AI Quick Access */}
        <div className="mb-8">
          <div className="rounded-lg p-6 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #0D1B2A, #1A3A5C)' }}>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Get AI Help</h3>
              <p className="text-sm text-white opacity-75">Generate prompts for any marketing task using MTech AI</p>
            </div>
            <button
              onClick={() => window.open(MTECH_AI_PROJECT_URL, '_blank')}
              className="flex items-center gap-2 whitespace-nowrap text-white font-medium px-5 py-3 rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--color-brand-mtech-accent)' }}
            >
              Open MTech AI
              <ExternalLink size={16} />
            </button>
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">TODAY'S TASKS</h2>
          {tasksToday.length > 0 ? (
            <div className="card">
              <table className="table">
                <tbody>
                  {tasksToday.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-text-secondary">No tasks due today</p>
          )}
        </div>

        {/* Waiting for John */}
        {waitingForJohn.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span>⚠️</span> WAITING FOR JOHN
            </h2>
            <div className="rounded-lg p-6" style={{ backgroundColor: '#FAEEDA', borderColor: '#FAC775', border: '1px solid #FAC775' }}>
              <table className="w-full">
                <tbody>
                  {waitingForJohn.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recently Completed */}
        {completedToday.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-text-primary mb-4">RECENTLY COMPLETED</h2>
            <div className="card">
              <table className="table">
                <tbody>
                  {completedToday.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
