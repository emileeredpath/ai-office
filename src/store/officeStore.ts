import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Employee, EmployeeStatus, Task, TaskStatus } from '@/types/employee';
import { TASK_STATUS_LABELS } from '@/types/employee';
import { employees as seedEmployees } from '@/data/employees';

function getOfficeTime(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

// Employee status is derived from the state of their tasks, unless
// manually overridden (e.g. someone marks themselves Blocked directly).
// "Working" is only ever set by an explicit start-task action — never
// implied just because Sandy assigned something.
function deriveEmployeeStatus(tasks: Task[]): EmployeeStatus {
  const active = tasks.filter((t) => t.status !== 'complete');
  if (active.length === 0) return 'available';
  if (active.some((t) => t.status === 'in_progress')) return 'working';
  if (active.some((t) => t.status === 'blocked')) return 'blocked';
  if (
    active.some(
      (t) =>
        t.status === 'waiting_john_approval' ||
        t.status === 'waiting_customer' ||
        t.status === 'waiting_review'
    )
  )
    return 'waiting_approval';
  if (active.some((t) => t.status === 'awaiting_brief')) return 'awaiting_brief';
  return 'has_assigned_work';
}

function touch(task: Task, status: TaskStatus): Task {
  return {
    ...task,
    status,
    updatedAt: new Date().toISOString(),
    completedAt: status === 'complete' ? new Date().toISOString() : task.completedAt,
  };
}

function getInitialEmployees(): Employee[] {
  const saved = localStorage.getItem('mtech-office-employees');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Fall back to seed if parse fails
    }
  }
  return seedEmployees;
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  message: string;
}

interface OfficeStore {
  employees: Employee[];
  selectedEmployeeId: string | null;
  officeTime: 'morning' | 'afternoon' | 'evening';
  activityLog: ActivityEntry[];

  selectEmployee: (id: string | null) => void;
  setEmployeeStatus: (id: string, status: EmployeeStatus) => void;

  assignTask: (
    employeeId: string,
    task: Omit<Task, 'status' | 'updatedAt' | 'notes'> & { status?: TaskStatus }
  ) => void;
  startTask: (employeeId: string, taskId: string) => void;
  setTaskStatus: (employeeId: string, taskId: string, status: TaskStatus) => void;
  completeTask: (employeeId: string, taskId: string) => void;
  addTaskNote: (employeeId: string, taskId: string, text: string) => void;
  removeTask: (employeeId: string, taskId: string) => void;
  logActivity: (message: string) => void;
}

export const useOfficeStore = create<OfficeStore>()(
  persist<OfficeStore>(
    (set, get) => ({
      employees: getInitialEmployees(),
      selectedEmployeeId: null,
      officeTime: getOfficeTime(),
      activityLog: [],

      selectEmployee: (id) => set({ selectedEmployeeId: id }),

      logActivity: (message) =>
        set((state) => ({
          activityLog: [
            ...state.activityLog,
            { id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, timestamp: new Date().toISOString(), message },
          ].slice(-100),
        })),

      setEmployeeStatus: (id, status) =>
        set((state) => ({
          employees: state.employees.map((e) => (e.id === id ? { ...e, status } : e)),
        })),

      assignTask: (employeeId, task) => {
        set((state) => ({
          employees: state.employees.map((e) => {
            if (e.id !== employeeId) return e;
            const newTask: Task = {
              ...task,
              status: task.status ?? 'assigned',
              updatedAt: new Date().toISOString(),
              notes: [],
              assignedBy: task.assignedBy ?? 'sandy',
            };
            const tasks = [...e.tasks, newTask];
            return { ...e, tasks, status: deriveEmployeeStatus(tasks) };
          }),
        }));
        const employee = get().employees.find((e) => e.id === employeeId);
        if (employee) get().logActivity(`${employee.name} was assigned "${task.title}"`);
      },

      startTask: (employeeId, taskId) => {
        set((state) => ({
          employees: state.employees.map((e) => {
            if (e.id !== employeeId) return e;
            const tasks = e.tasks.map((t) => (t.id === taskId ? touch(t, 'in_progress') : t));
            return { ...e, tasks, status: deriveEmployeeStatus(tasks) };
          }),
        }));
        const employee = get().employees.find((e) => e.id === employeeId);
        const task = employee?.tasks.find((t) => t.id === taskId);
        if (employee && task) get().logActivity(`${employee.name} started "${task.title}"`);
      },

      setTaskStatus: (employeeId, taskId, status) => {
        set((state) => ({
          employees: state.employees.map((e) => {
            if (e.id !== employeeId) return e;
            const tasks = e.tasks.map((t) => (t.id === taskId ? touch(t, status) : t));
            return { ...e, tasks, status: deriveEmployeeStatus(tasks) };
          }),
        }));
        const employee = get().employees.find((e) => e.id === employeeId);
        const task = employee?.tasks.find((t) => t.id === taskId);
        if (employee && task)
          get().logActivity(`${employee.name} marked "${task.title}" as ${TASK_STATUS_LABELS[status]}`);
      },

      completeTask: (employeeId, taskId) => {
        set((state) => ({
          employees: state.employees.map((e) => {
            if (e.id !== employeeId) return e;
            const tasks = e.tasks.map((t) => (t.id === taskId ? touch(t, 'complete') : t));
            return { ...e, tasks, status: deriveEmployeeStatus(tasks) };
          }),
        }));
        const employee = get().employees.find((e) => e.id === employeeId);
        const task = employee?.tasks.find((t) => t.id === taskId);
        if (employee && task) get().logActivity(`${employee.name} completed "${task.title}"`);
      },

      addTaskNote: (employeeId, taskId, text) =>
        set((state) => ({
          employees: state.employees.map((e) => {
            if (e.id !== employeeId) return e;
            const tasks = e.tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    notes: [
                      ...t.notes,
                      { id: `note-${Date.now()}`, text, createdAt: new Date().toISOString() },
                    ],
                    updatedAt: new Date().toISOString(),
                  }
                : t
            );
            return { ...e, tasks };
          }),
        })),

      removeTask: (employeeId, taskId) =>
        set((state) => ({
          employees: state.employees.map((e) => {
            if (e.id !== employeeId) return e;
            const tasks = e.tasks.filter((t) => t.id !== taskId);
            return { ...e, tasks, status: deriveEmployeeStatus(tasks) };
          }),
        })),
    }),
    {
      name: 'mtech-office-employees',
    }
  )
);
