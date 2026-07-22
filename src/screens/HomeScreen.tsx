import { useAppStore } from '@/store/useAppStore';
import { TaskRow } from '@/components/tasks/TaskRow';
import { StatCard } from '@/components/common/StatCard';
import { formatDate } from '@/utils/dateUtils';

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

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Good morning, Emilee</h1>
            <p className="text-text-secondary">{dayName + ' ' + dateStr}</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <StatCard title="Due today" value={tasksToday.length} />
          <StatCard title="Overdue" value={overdueTasks.length} />
          <StatCard title="Waiting for approval" value={waitingForJohn.length} />
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
              <span className="text-warning">⚠️</span> WAITING FOR JOHN
            </h2>
            <div className="card bg-orange-50 border-orange-100">
              <table className="table">
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
                    <TaskRow key={task.id} task={task} completed={true} />
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
