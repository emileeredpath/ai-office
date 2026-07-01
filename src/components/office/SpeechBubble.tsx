interface SpeechBubbleProps {
  message: string;
  type?: 'task' | 'status' | 'help' | 'celebration';
  accentColor?: string;
}

export function SpeechBubble({ message, type = 'task', accentColor = '#F9701F' }: SpeechBubbleProps) {
  const bgColorMap = {
    task: 'bg-blue-900/80',
    status: 'bg-purple-900/80',
    help: 'bg-amber-900/80',
    celebration: 'bg-green-900/80',
  };

  return (
    <div
      className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none"
      style={{
        animation: 'fadeIn 0.3s ease-in-out',
      }}
    >
      <div
        className={`${bgColorMap[type]} px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm max-w-xs`}
        style={{
          borderLeft: `3px solid ${accentColor}`,
          backgroundColor: `rgba(15, 20, 25, 0.9)`,
        }}
      >
        <p className="text-xs text-[#F0F4F8] leading-tight line-clamp-2">{message}</p>
      </div>
      {/* Tail */}
      <div
        className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
        style={{
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: `6px solid rgba(15, 20, 25, 0.9)`,
        }}
      />
    </div>
  );
}
