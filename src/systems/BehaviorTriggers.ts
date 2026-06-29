import { useOfficeStore } from '@/store/officeStore';
import { globalEventBus } from './EventBus';

let previousState: {
  employeeStates: Record<
    string,
    {
      currentTaskId: string | null;
      queueLength: number;
      completedCount: number;
    }
  >;
} = { employeeStates: {} };

export function initializeBehaviorTriggers() {
  const state = useOfficeStore.getState();

  previousState.employeeStates = {};
  state.employees.forEach((emp) => {
    previousState.employeeStates[emp.id] = {
      currentTaskId: emp.currentTask?.id || null,
      queueLength: emp.taskQueue.length,
      completedCount: emp.completedWork.length,
    };
  });
}

export function updateBehaviorTriggers() {
  const state = useOfficeStore.getState();

  state.employees.forEach((emp) => {
    const previous = previousState.employeeStates[emp.id] || {
      currentTaskId: null,
      queueLength: 0,
      completedCount: 0,
    };

    // Detect new task creation
    if (emp.taskQueue.length > previous.queueLength) {
      const newTask = emp.taskQueue[emp.taskQueue.length - 1];
      globalEventBus.emit('taskCreated', {
        employeeId: emp.id,
        taskId: newTask.id,
      });
    }

    // Detect task completion
    if (emp.completedWork.length > previous.completedCount) {
      if (previous.currentTaskId) {
        globalEventBus.emit('taskCompleted', {
          employeeId: emp.id,
          taskId: previous.currentTaskId,
        });
      }
    }

    // Detect task approval (current task changed)
    if (emp.currentTask && emp.currentTask.id !== previous.currentTaskId) {
      if (previous.currentTaskId) {
        globalEventBus.emit('taskApproved', {
          employeeId: emp.id,
          taskId: emp.currentTask.id,
          approverId: emp.id,
        });
      }
    }

    // Update tracked state
    previousState.employeeStates[emp.id] = {
      currentTaskId: emp.currentTask?.id || null,
      queueLength: emp.taskQueue.length,
      completedCount: emp.completedWork.length,
    };
  });
}
