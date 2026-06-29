import { useOfficeAmbience } from '@/hooks/useOfficeAmbience';
import { Activity } from 'lucide-react';

export function StatusBar() {
  const { greeting, activeCount, totalEmployees } = useOfficeAmbience();
  const now = new Date();
  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <header
      className="flex items-center justify-between px-6 py-3 border-b"
      style={{ backgroundColor: '#1D2A3A', borderColor: '#3a4f6a' }}
    >
      <div className="flex items-center gap-3">
        <span className="font-display font-bold text-lg" style={{ color: '#F0F4F8' }}>
          MTech<span style={{ color: '#F9701F' }}>.</span>
        </span>
        <span className="text-sm" style={{ color: '#8F9194' }}>
          {greeting} — {date}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Activity size={14} style={{ color: '#F9701F' }} />
        <span className="text-sm" style={{ color: '#B4B6B9' }}>
          <span className="font-semibold" style={{ color: '#F9701F' }}>{activeCount}</span>
          /{totalEmployees} active
        </span>
        <span
          className="ml-2 text-sm font-mono tabular-nums"
          style={{ color: '#B4B6B9' }}
        >
          {time}
        </span>
      </div>
    </header>
  );
}
