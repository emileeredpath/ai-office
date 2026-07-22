import { createContext, useContext, useState, ReactNode } from 'react';

interface CompletedTasksContextType {
  completedTasks: Set<string>;
  toggleTaskComplete: (taskId: string) => void;
  isTaskComplete: (taskId: string) => boolean;
}

const CompletedTasksContext = createContext<CompletedTasksContextType | undefined>(undefined);

export function CompletedTasksProvider({ children }: { children: ReactNode }) {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('completedTasks');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const toggleTaskComplete = (taskId: string) => {
    setCompletedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      localStorage.setItem('completedTasks', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const isTaskComplete = (taskId: string) => completedTasks.has(taskId);

  return (
    <CompletedTasksContext.Provider value={{ completedTasks, toggleTaskComplete, isTaskComplete }}>
      {children}
    </CompletedTasksContext.Provider>
  );
}

export function useCompletedTasks() {
  const context = useContext(CompletedTasksContext);
  if (!context) {
    throw new Error('useCompletedTasks must be used within CompletedTasksProvider');
  }
  return context;
}
