import { useState, useEffect } from 'react';
import { MessageCircle, Zap } from 'lucide-react';

interface SandyMessage {
  id: string;
  type: 'greeting' | 'routing' | 'insight' | 'celebration';
  text: string;
  timestamp: Date;
}

interface SandyAgentProps {
  activeMessage?: string;
}

export function SandyAgent({ activeMessage }: SandyAgentProps) {
  const [messages, setMessages] = useState<SandyMessage[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (activeMessage) {
      const newMessage: SandyMessage = {
        id: Date.now().toString(),
        type: 'routing',
        text: activeMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [newMessage, ...prev].slice(0, 5));
      setIsExpanded(true);

      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [activeMessage]);

  const getMessageColor = (type: SandyMessage['type']) => {
    switch (type) {
      case 'greeting':
        return { bg: '#1D4B3A', border: '#4CAF50', icon: '👋' };
      case 'routing':
        return { bg: '#1D3A4B', border: '#2196F3', icon: '🎯' };
      case 'insight':
        return { bg: '#3A1D4B', border: '#8B5CF6', icon: '💡' };
      case 'celebration':
        return { bg: '#4B3A1D', border: '#F9701F', icon: '🎉' };
      default:
        return { bg: '#1D2A3A', border: '#3a4f6a', icon: '🤖' };
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Messages Stack */}
      {isExpanded && messages.length > 0 && (
        <div className="absolute bottom-24 right-0 w-72 space-y-2 mb-2">
          {messages.slice(0, 3).map((msg, idx) => {
            const colors = getMessageColor(msg.type);
            return (
              <div
                key={msg.id}
                className="p-3 rounded-lg text-sm text-[#F0F4F8] animate-slideUp shadow-lg"
                style={{
                  backgroundColor: colors.bg,
                  borderLeft: `3px solid ${colors.border}`,
                  animation: `slideUp 0.3s ease-out ${idx * 0.1}s both`,
                  opacity: 1,
                }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">{colors.icon}</span>
                  <p className="line-clamp-3 flex-1">{msg.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sandy Avatar Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="group relative w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all"
        style={{
          backgroundColor: '#F9701F',
          cursor: 'pointer',
        }}
      >
        {/* Animated pulse ring */}
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            border: '2px solid rgba(249, 112, 31, 0.3)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />

        {/* Sandy Icon */}
        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white">
          <span>🧠</span>
        </div>

        {/* Active Indicator */}
        {isExpanded && (
          <div
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-pulse"
            style={{ backgroundColor: '#4CAF50' }}
          />
        )}

        {/* Tooltip on Hover */}
        <div
          className="absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 px-3 py-2 rounded-lg text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        >
          Sandy — Chief of Staff
        </div>
      </button>

      {/* Status Indicator */}
      <div
        className="absolute bottom-2 right-2 w-3 h-3 rounded-full animate-pulse"
        style={{ backgroundColor: '#4CAF50' }}
      />
    </div>
  );
}
