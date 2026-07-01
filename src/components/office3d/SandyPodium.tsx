import { Brain } from 'lucide-react';

interface SandyPodiumProps {
  isThinking: boolean;
  message?: string;
}

export function SandyPodium({ isThinking, message }: SandyPodiumProps) {
  return (
    <div className="relative w-full h-full rounded-2xl flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 50% 30%, rgba(249,112,31,0.18), rgba(249,112,31,0.02) 70%)',
        border: '1px solid rgba(249,112,31,0.35)',
        boxShadow: isThinking
          ? '0 0 0 1px rgba(249,112,31,0.5), 0 0 32px rgba(249,112,31,0.5)'
          : '0 0 24px rgba(249,112,31,0.18)',
      }}
    >
      {message && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-64 z-20 pointer-events-none">
          <div
            className="px-3 py-2 rounded-lg text-xs text-center shadow-lg"
            style={{ backgroundColor: 'rgba(10,14,20,0.95)', color: '#E8ECF1', border: '1px solid rgba(249,112,31,0.4)' }}
          >
            {message}
          </div>
        </div>
      )}

      <div
        className="w-16 h-16 rounded-full flex items-center justify-center relative"
        style={{
          background: 'linear-gradient(135deg, #F9701F, #FFB067)',
          animation: isThinking ? 'sandyPulse 1.2s ease-in-out infinite' : 'sandyIdle 4s ease-in-out infinite',
        }}
      >
        <Brain size={30} color="#0A0E14" />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: '2px solid rgba(249,112,31,0.5)',
            animation: isThinking ? 'ringPulse 1.2s ease-out infinite' : 'none',
          }}
        />
      </div>

      <p className="mt-3 text-sm font-semibold" style={{ color: '#E8ECF1' }}>
        Sandy
      </p>
      <p className="text-xs" style={{ color: '#8B96A5' }}>
        Chief of Staff
      </p>
    </div>
  );
}
