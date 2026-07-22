import { useState, useMemo } from 'react';
import { EMPLOYEES } from '@/data/mtechEmployees';

interface ChatMessage {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: Date;
}

async function generateEmployeeResponse(employeeId: string, message: string): Promise<string> {
  const apiKey = localStorage.getItem('anthropic_api_key');
  if (!apiKey) {
    return getDefaultResponse(employeeId);
  }

  const employee = Object.values(EMPLOYEES).find((e) => e.id === employeeId);
  if (!employee) {
    return 'Thanks for reaching out!';
  }

  const systemPrompt = `You are ${employee.name}, a ${employee.role} at MTech AI Office.
You are professional but friendly. Keep responses concise (1-2 sentences).
Stay in character and respond based on your role and responsibilities.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 150,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      return getDefaultResponse(employeeId);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Error generating response:', error);
    return getDefaultResponse(employeeId);
  }
}

function getDefaultResponse(employeeId: string): string {
  const employee = Object.values(EMPLOYEES).find((e) => e.id === employeeId);
  const responses: Record<string, string[]> = {
    email_manager: [
      'I just updated the email campaign settings. Should be good to go!',
      'Let me check on that email list - I\'ll get back to you shortly.',
      'Perfect timing! I was just about to send out the latest campaign.',
    ],
    website_manager: [
      'The website updates are looking great. Want to do a quick review?',
      'I\'ve made those changes to the homepage. Can you take a look?',
      'The new page is live! Let me know what you think.',
    ],
    seo_ppc_manager: [
      'The PPC performance is up 25% this month. Great results!',
      'I\'m optimizing the ad spend right now. Should see improvements soon.',
      'The SEO changes are starting to show in rankings. Positive trend!',
    ],
    social_media_manager: [
      'The social posts are performing really well this week!',
      'I just scheduled the week\'s content. All set!',
      'Engagement is up! Our audience really loved that post.',
    ],
    proposal_writer: [
      'I\'m finalizing the proposal now. Should have it ready tomorrow.',
      'The client feedback has been incorporated. Ready for your review.',
      'Great work on those revisions! The proposal looks solid now.',
    ],
    case_study_writer: [
      'I\'ve gathered the case study data. Starting the write-up now.',
      'The success metrics are impressive! This will be a strong case study.',
      'First draft is ready for your feedback.',
    ],
    funding_manager: [
      'I\'ve reviewed the budget and we\'re tracking well against targets.',
      'Let me pull together those funding projections for you.',
      'The funding pipeline looks solid for next quarter.',
    ],
  };

  if (employee && responses[employee.id]) {
    return responses[employee.id][Math.floor(Math.random() * responses[employee.id].length)];
  }

  return 'Thanks for reaching out! I\'ll help however I can. 😊';
}

export function EmployeeChat() {
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const teamMembers = useMemo(() => {
    return Object.values(EMPLOYEES).filter((e) => e.id !== 'sandy');
  }, []);

  const filteredMessages = useMemo(() => {
    if (!selectedEmployee) return [];
    return messages
      .filter((m) => (m.recipient === selectedEmployee && m.sender === 'emilee') || (m.sender === selectedEmployee && m.recipient === 'emilee'))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [messages, selectedEmployee]);

  const handleSendMessage = async () => {
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
    setLoading(true);

    const responseText = await generateEmployeeResponse(selectedEmployee, messageInput);

    const response: ChatMessage = {
      id: `msg-${Date.now()}-response`,
      sender: selectedEmployee,
      recipient: 'emilee',
      content: responseText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, response]);
    setLoading(false);
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
              {loading && (
                <div className="flex">
                  <div
                    className="px-4 py-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--border-color)',
                      border: '1px solid',
                    }}
                  >
                    Typing...
                  </div>
                </div>
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
                    if (e.key === 'Enter' && !loading) {
                      handleSendMessage();
                    }
                  }}
                  disabled={loading}
                  placeholder={loading ? 'Waiting for response...' : 'Message...'}
                  className="flex-1 px-3 py-2 rounded-lg text-sm"
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
                  className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
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
