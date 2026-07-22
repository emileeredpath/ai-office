import { useState, useEffect } from 'react';
import * as api from '@/services/api';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
  employee_id?: string;
  employee_name?: string;
  assigned_by?: string;
  assigned_by_name?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export function useTasks(companyId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const fetchTasks = async () => {
      try {
        setLoading(true);
        const data = await api.getTasks(companyId);
        setTasks(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [companyId]);

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const updated = await api.updateTask(taskId, updates);
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === taskId ? { ...t, ...updated } : t))
      );
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      throw err;
    }
  };

  const createTask = async (task: Partial<Task>) => {
    try {
      const newTask = await api.createTask(companyId, task);
      setTasks((prevTasks) => [...prevTasks, newTask]);
      return newTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      throw err;
    }
  };

  const refetch = async () => {
    if (!companyId) return;
    try {
      const data = await api.getTasks(companyId);
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    }
  };

  return { tasks, loading, error, updateTask, createTask, refetch };
}
