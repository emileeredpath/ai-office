import { useOfficeStore } from '@/store/officeStore';

export function useEmployee(id: string) {
  const employee = useOfficeStore((s) => s.employees.find((e) => e.id === id));
  const updateStatus = useOfficeStore((s) => s.updateStatus);
  const setWorkload = useOfficeStore((s) => s.setWorkload);
  const completeCurrentTask = useOfficeStore((s) => s.completeCurrentTask);

  return { employee, updateStatus, setWorkload, completeCurrentTask };
}
