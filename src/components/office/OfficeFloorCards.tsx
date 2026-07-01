import { EmployeeDeskCard } from './EmployeeDeskCard';
import { useOfficeStore } from '@/store/officeStore';

interface OfficeFloorCardsProps {
  showCollaborationPaths?: boolean;
  onEmployeeAction?: (employeeId: string, action: 'chat' | 'share' | 'help') => void;
}

export function OfficeFloorCards({ showCollaborationPaths = false, onEmployeeAction }: OfficeFloorCardsProps) {
  const employees = useOfficeStore((state) => state.employees);

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{
        backgroundColor: '#0F1419',
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(249, 112, 31, 0.03) 0%, transparent 50%)',
      }}
    >
      {/* Office Header */}
      <div className="px-6 py-4 border-b border-[#2E3B4A] flex-shrink-0">
        <h2 className="text-xl font-bold text-[#F0F4F8]">Marketing Team</h2>
        <p className="text-sm text-[#8F9194] mt-1">Working together, achieving more ❤️</p>
      </div>

      {/* Employees Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
          {employees.map((emp) => (
            <EmployeeDeskCard
              key={emp.id}
              emoji={emp.emoji}
              name={emp.name}
              role={emp.role}
              status={emp.status}
              currentTask={emp.currentTask}
              workload={emp.workloadPercent}
              onChat={() => {
                console.log(`Chat with ${emp.name}`);
                onEmployeeAction?.(emp.id, 'chat');
              }}
              onShare={() => {
                console.log(`Share with ${emp.name}`);
                onEmployeeAction?.(emp.id, 'share');
              }}
              onHelp={() => {
                console.log(`Ask help from ${emp.name}`);
                onEmployeeAction?.(emp.id, 'help');
              }}
            />
          ))}
        </div>
      </div>

      {/* Quick Collaboration Footer */}
      <div
        className="px-6 py-4 border-t border-[#2E3B4A] flex-shrink-0 flex gap-3"
        style={{ backgroundColor: '#111B26' }}
      >
        <div className="flex-1 text-xs text-[#8F9194]">
          <p className="font-medium text-[#F0F4F8] mb-1">Quick Collaboration</p>
          <p className="text-xs">Use buttons above to chat, share updates, or ask for help</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 text-sm font-medium rounded transition-all"
            style={{
              backgroundColor: '#2E3B4A',
              color: '#F0F4F8',
            }}
          >
            Team Chat
          </button>
          <button
            className="px-3 py-2 text-sm font-medium rounded transition-all"
            style={{
              backgroundColor: '#F9701F',
              color: '#FFFFFF',
            }}
          >
            Share Update
          </button>
          <button
            className="px-3 py-2 text-sm font-medium rounded transition-all"
            style={{
              backgroundColor: '#2E3B4A',
              color: '#F0F4F8',
            }}
          >
            Ask for Help
          </button>
        </div>
      </div>
    </div>
  );
}
