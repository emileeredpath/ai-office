import { useEffect, useState } from 'react';
import { useEmployees } from '@/hooks/useEmployees';
import { useAppContext } from '@/hooks/useAppContext';

interface Employee {
  id: string;
  name: string;
  emoji: string;
  role: string;
  is_ai: boolean;
}

export function UserSelector() {
  const { companyId, currentUserId, setCurrentUser } = useAppContext();
  const { employees } = useEmployees(companyId || '');
  const [isOpen, setIsOpen] = useState(false);

  const currentEmployee = employees.find((e) => e.id === currentUserId);
  const humanEmployees = employees.filter((e) => !e.is_ai);

  if (!companyId || !currentUserId) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 rounded px-3 py-2 text-sm transition"
      >
        <span className="text-xl">{currentEmployee?.emoji}</span>
        <span>{currentEmployee?.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 min-w-48">
          <div className="p-2 border-b border-gray-700">
            <p className="text-xs font-semibold text-gray-400 px-2 py-1">Switch User</p>
          </div>
          {humanEmployees.map((employee) => (
            <button
              key={employee.id}
              onClick={() => {
                setCurrentUser(employee.id, employee.name);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 flex items-center gap-2 transition ${
                employee.id === currentUserId ? 'bg-blue-900' : ''
              }`}
            >
              <span className="text-lg">{employee.emoji}</span>
              <div>
                <div className="font-medium">{employee.name}</div>
                <div className="text-xs text-gray-400">{employee.role}</div>
              </div>
              {employee.id === currentUserId && <span className="ml-auto text-blue-400">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
