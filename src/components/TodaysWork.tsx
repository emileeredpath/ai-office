import { useState, useMemo, useRef, useEffect } from 'react';
import { EMPLOYEES, REAL_TASKS, BRANDS } from '@/data/mtechEmployees';
import { askSandy } from '@/services/sandyAI';

interface TodaysWorkProps {
  companyId: string;
  currentUserId: string;
}

interface SandyMessage {
  id: string;
  sender: 'emilee' | 'sandy';
  content: string;
  timestamp: Date;
}

export function TodaysWork({ companyId, currentUserId }: TodaysWorkProps) {
  const [sandyInput, setSandyInput] = useState('');
  const [messages, setMessages] = useState<SandyMessage[]>([]);
  const [expandedChat, setExpandedChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const todayDate = new Date();
  const dayName = todayDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = todayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const briefingStats = useMemo(() => {
    const waitingForJohn = REAL_TASKS.filter((t) => t.status === 'waiting-john');
    const inProgress = REAL_TASKS.filter((t) => t.status === 'in-progress');
    const dueSoon = REAL_TASKS.filter((t) => t.deadline && new Date(t.deadline) <= new Date(Date.now() + 86400000));

    return {
      approvalsWaiting: waitingForJohn.length,
      deadlinesToday: dueSoon.length,
      tasksInProgress: inProgress.length,
    };
  }, []);

  const todaysFocus = useMemo(() => {
    return REAL_TASKS.filter((t) =>
      t.status === 'waiting-john' || (t.status === 'in-progress' && t.priority === 'high')
    ).slice(0, 3);
  }, []);

  const waitingForJohnTasks = useMemo(() => {
    return REAL_TASKS.filter((t) => t.status === 'waiting-john');
  }, []);

  const busyTeam = useMemo(() => {
    return Object.values(EMPLOYEES)
      .filter((e) => e.status === 'busy' && e.id !== 'sandy')
      .slice(0, 3);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting-john':
        return '#F59E0B';
      case 'in-progress':
        return '#1D9E75';
      case 'waiting-approval':
        return 'var(--accent-orange)';
      case 'complete':
        return '#5C6879';
      default:
        return '#5C6879';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'in-progress':
        return '🟢';
      case 'available':
        return '⚫';
      case 'busy':
        return '🟠';
      case 'waiting':
        return '🟡';
      case 'blocked':
        return '🔴';
      default:
        return '⚫';
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateSandyResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('john') || lowerMessage.includes('approval') || lowerMessage.includes('waiting')) {
      const waitingTasks = REAL_TASKS.filter((t) => t.status === 'waiting-john');
      return `I've flagged ${waitingTasks.length} approvals pending John's review. Should I prioritize any of these or follow up with him?`;
    }

    if (lowerMessage.includes('email') || lowerMessage.includes('campaign')) {
      const emailTasks = REAL_TASKS.filter((t) => t.title.includes('Email'));
      return `Our email team has ${emailTasks.filter((t) => t.status === 'in-progress').length} campaigns in progress. Want me to check on status or prioritize one?`;
    }

    if (lowerMessage.includes('website') || lowerMessage.includes('page') || lowerMessage.includes('web')) {
      const websiteTasks = REAL_TASKS.filter((t) => t.title.includes('page') || t.title.includes('Page'));
      return `Website team is working on ${websiteTasks.filter((t) => t.status === 'in-progress').length} pages. I can pull up details or reassign resources if needed.`;
    }

    if (lowerMessage.includes('team') || lowerMessage.includes('workload') || lowerMessage.includes('capacity')) {
      const busyCount = Object.values(EMPLOYEES).filter((e) => e.status === 'busy').length;
      return `${busyCount} team members are currently busy. I can rebalance workloads or pause lower-priority tasks if you need capacity for something urgent.`;
    }

    if (lowerMessage.includes('done') || lowerMessage.includes('complete')) {
      const completedTasks = REAL_TASKS.filter((t) => t.status === 'complete');
      return `We've completed ${completedTasks.length} tasks so far. Good progress. What's next on your priority list?`;
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('what can')) {
      return `I can track task progress, manage approvals, coordinate team workload, and execute on your priorities. What would be most helpful right now?`;
    }

    return `I'm tracking this. I'll monitor the team and flag anything that needs your attention. Anything specific you'd like me to focus on?`;
  };

  const handleSendMessage = async () => {
    if (!sandyInput.trim()) return;

    const userMessage: SandyMessage = {
      id: `msg-${Date.now()}`,
      sender: 'emilee',
      content: sandyInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInputText = sandyInput;
    setSandyInput('');
    setLoading(true);
    setExpandedChat(true);

    try {
      const response = await askSandy({
        message: userInputText,
        context: {
          userId: currentUserId,
          currentRole: 'Marketing Director',
        },
      });

      const sandyResponse: SandyMessage = {
        id: `msg-${Date.now()}-response`,
        sender: 'sandy',
        content: response.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, sandyResponse]);
    } catch (error) {
      console.error('Error getting Sandy response:', error);
      const errorResponse: SandyMessage = {
        id: `msg-${Date.now()}-error`,
        sender: 'sandy',
        content:
          'I encountered an error. Make sure your API key is set in Settings and you have internet connection.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Good morning, Emilee.
          </h1>
          <div className="text-right">
            <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
              {dayName}
            </p>
            <p style={{ color: 'var(--text-tertiary)' }} className="text-base font-medium">
              {dateStr}
            </p>
          </div>
        </div>

        <div className="mb-8 p-6 rounded-lg border" style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
        }}>
          <div className="flex items-start gap-4 mb-4">
            <div className="text-3xl">🤖</div>
            <div className="flex-1">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Sandy
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Chief of Staff
              </p>
            </div>
          </div>

          {messages.length === 0 ? (
            <>
              <p className="mb-4" style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>
                Morning Emilee. Here's what needs your attention today:
              </p>

              <ul className="space-y-2 mb-8" style={{ color: 'var(--text-primary)' }}>
                <li className="text-sm">✓ {briefingStats.approvalsWaiting} approvals waiting</li>
                <li className="text-sm">✓ {briefingStats.deadlinesToday} deadline{briefingStats.deadlinesToday !== 1 ? 's' : ''} today</li>
                <li className="text-sm">✓ {briefingStats.tasksInProgress} tasks in progress across the team</li>
              </ul>
            </>
          ) : (
            <div
              className="mb-6 p-4 rounded-lg space-y-3"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                border: '1px solid',
                maxHeight: '300px',
                overflowY: 'auto',
              }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="flex gap-3"
                  style={{
                    justifyContent: msg.sender === 'emilee' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    className="px-3 py-2 rounded-lg max-w-xs text-sm"
                    style={{
                      backgroundColor: msg.sender === 'emilee' ? 'var(--accent-orange)' : 'var(--bg-tertiary)',
                      color: msg.sender === 'emilee' ? 'white' : 'var(--text-primary)',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div
                    className="px-3 py-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    🤖 Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex gap-3">
              <input
                type="text"
                value={sandyInput}
                onChange={(e) => setSandyInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    handleSendMessage();
                  }
                }}
                disabled={loading}
                placeholder={loading ? 'Sandy is thinking...' : 'Tell Sandy what you need...'}
                className="flex-1 px-4 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-color)',
                  border: '1px solid',
                  color: 'var(--text-primary)',
                  opacity: loading ? 0.6 : 1,
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading}
                className="px-6 py-2 rounded-lg font-medium transition-all text-sm"
                style={{
                  backgroundColor: 'var(--accent-orange)',
                  color: 'white',
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.opacity = '1')}
              >
                {loading ? '⏳' : 'Send'}
              </button>
            </div>

            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-sm font-medium transition-all"
                style={{ color: 'var(--accent-orange)' }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Clear Chat
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              TODAY'S FOCUS
            </h3>
            <div className="space-y-3">
              {todaysFocus.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: getStatusColor(task.status),
                    borderLeft: `4px solid ${getStatusColor(task.status)}`,
                  }}
                >
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {task.status === 'waiting-john' ? '🔴' : task.status === 'in-progress' ? '🟠' : '🟡'} {task.title}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {BRANDS[task.brand].shortName}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              WAITING FOR APPROVAL
            </h3>
            <div className="space-y-3">
              {waitingForJohnTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {task.title}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#F59E0B' }}>
                    Waiting for John
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              TEAM STATUS
            </h3>
            <div className="space-y-3">
              {busyTeam.map((employee) => (
                <div
                  key={employee.id}
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {employee.emoji} {employee.name.split(' ')[0]}
                    </p>
                    <span style={{ color: getStatusColor(employee.status) }}>
                      {getStatusDot(employee.status)}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {employee.currentTask || 'Available'}
                  </p>
                  <div className="mt-2 h-1.5 rounded-full" style={{ backgroundColor: 'var(--border-color)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${employee.workload}%`,
                        background: 'linear-gradient(90deg, var(--accent-orange), #FFB067)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
