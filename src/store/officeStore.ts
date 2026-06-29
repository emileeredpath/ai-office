import { create } from 'zustand';
import type { Employee, EmployeeStatus, Task } from '@/types/employee';
import { employees as seedEmployees } from '@/data/employees';

function getOfficeTime(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

interface OfficeStore {
  employees: Employee[];
  selectedEmployeeId: string | null;
  officeTime: 'morning' | 'afternoon' | 'evening';

  selectEmployee: (id: string | null) => void;
  updateStatus: (id: string, status: EmployeeStatus) => void;
  setWorkload: (id: string, percent: number) => void;
  addTask: (employeeId: string, task: Task) => void;
  completeCurrentTask: (employeeId: string) => void;
}

export const useOfficeStore = create<OfficeStore>((set) => ({
  employees: seedEmployees,
  selectedEmployeeId: null,
  officeTime: getOfficeTime(),

  selectEmployee: (id) => set({ selectedEmployeeId: id }),

  updateStatus: (id, status) =>
    set((state) => ({
      employees: state.employees.map((e) =>
        e.id === id ? { ...e, status } : e
      ),
    })),

  setWorkload: (id, percent) =>
    set((state) => ({
      employees: state.employees.map((e) =>
        e.id === id ? { ...e, workloadPercent: Math.min(100, Math.max(0, percent)) } : e
      ),
    })),

  addTask: (employeeId, task) =>
    set((state) => ({
      employees: state.employees.map((e) =>
        e.id === employeeId
          ? { ...e, taskQueue: [...e.taskQueue, task] }
          : e
      ),
    })),

  completeCurrentTask: (employeeId) =>
    set((state) => ({
      employees: state.employees.map((e) => {
        if (e.id !== employeeId || !e.currentTask) return e;
        const completed: Task = {
          ...e.currentTask,
          completedAt: new Date().toISOString(),
        };
        const [next, ...remaining] = e.taskQueue;
        return {
          ...e,
          currentTask: next ?? null,
          taskQueue: remaining,
          completedWork: [completed, ...e.completedWork],
        };
      }),
    })),
}));
