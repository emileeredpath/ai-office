import { useState, useEffect } from 'react';
import * as api from '@/services/api';

export interface Employee {
  id: string;
  name: string;
  role: string;
  type: 'human' | 'ai';
  is_ai: boolean;
  emoji: string;
  status: string;
  accent_color: string;
  authority_level: string;
  created_at: string;
  tasks?: any[];
}

export function useEmployees(companyId: string) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const data = await api.getEmployees(companyId);
        setEmployees(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch employees');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [companyId]);

  return { employees, loading, error };
}

export function useEmployee(id: string) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const data = await api.getEmployee(id);
        setEmployee(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch employee');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  return { employee, loading, error };
}
