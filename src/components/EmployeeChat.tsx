import { useState, useMemo } from 'react';
import { EMPLOYEES } from '@/data/mtechEmployees';

interface ChatMessage {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: Date;
}

export function EmployeeChat() {
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const teamMembers = useMemo(() => {
    return Object.values(EMPLOYEES).filter((e) => e.id !== 'sandy');
  }, []);

  const filteredMessages = useMemo(() => {
    if (!selectedEmployee) return [];
    return messages
      .filter((m) => (m.recipient === selectedEmployee && m.sender === 'emilee') || (m.sender === selectedEmployee && m.recipient === 'emilee'))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [messages, selectedEmployee]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedEmployee) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'emilee',
      recipient: selectedEmployee,
      content: messageInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessageInput('');

    // Simulate employee response after a delay
    setTimeout(() => {
      const employee = Object.values(EMPLOYEES).find((e) => e.id === selectedEmployee);
      if (employee) {
        const response: ChatMessage = {
          id: `msg-${Date.now()}-response`,
          sender: selectedEmployee,
          recipient: 'emilee',
          content: `Thanks for reaching out! I'll check on that. ${employee.emoji}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, response]);
      }
    }, 1500);
  };

  return (
    <div className="flex-1 overflow-hidden flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Team List */}
      <div
        className="w-64 border-r overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Team
          </h2>
        </div>
        <div className="space-y-1 p-2">
          {teamMembers.map((employee) => (
            <button
              key={employee.id}
              onClick={() => setSelectedEmployee(employee.id)}
              className="w-full text-left px-3 py-2 rounded-lg transition-all text-sm"
              style={{
                backgroundColor: selectedEmployee === employee.id ? 'var(--accent-orange)' : 'transparent',
                color: selectedEmployee === employee.id ? 'white' : 'var(--text-primary)',
              }}
              onMouseEnter={(e) => {
                if (selectedEmployee !== employee.id) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedEmployee !== employee.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div className="flex items-center gap-2">
                <span>{employee.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{employee.name}</p>
                  <p style={{ fontSize: '11px', opacity: 0.7 }}>{employee.role}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedEmployee ? (
          <>
            {/* Header */}
            <div
              className="border-b p-4"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
            >
              {(() => {
                const employee = Object.values(EMPLOYEES).find((e) => e.id === selectedEmployee);
                return (
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: '28px' }}>{employee?.emoji}</span>
                    <div>
                      <h3 style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{employee?.name}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{employee?.role}</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {filteredMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p style={{ color: 'var(--text-secondary)' }}>Start a conversation</p>
                </div>
              ) : (
                filteredMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="flex"
                    style={{ justifyContent: msg.sender === 'emilee' ? 'flex-end' : 'flex-start' }}
                  >
                    <div
                      className="px-4 py-2 rounded-lg max-w-xs text-sm"
                      style={{
                        backgroundColor: msg.sender === 'emilee' ? 'var(--accent-orange)' : 'var(--bg-secondary)',
                        color: msg.sender === 'emilee' ? 'white' : 'var(--text-primary)',
                        borderColor: 'var(--border-color)',
                        border: msg.sender === 'emilee' ? 'none' : '1px solid',
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="border-t p-4 space-y-2" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                  placeholder="Message..."
                  className="flex-1 px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-color)',
                    border: '1px solid',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
                  style={{
                    backgroundColor: 'var(--accent-orange)',
                    color: 'white',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p style={{ color: 'var(--text-secondary)' }}>Select a team member to chat</p>
          </div>
        )}
      </div>
    </div>
  );
}
