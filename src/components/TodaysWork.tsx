import { useState } from 'react';

interface TodaysWorkProps {
  companyId: string;
  currentUserId: string;
}

export function TodaysWork({ companyId, currentUserId }: TodaysWorkProps) {
  const [sandyInput, setSandyInput] = useState('');

  const todayDate = new Date();
  const dayName = todayDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = todayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: '#070A0F' }}>
      <div className="max-w-4xl mx-auto">
        {/* Greeting */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#E8ECF1' }}>
            Good morning, Emilee.
          </h1>
          <div className="text-right">
            <p style={{ color: '#5C6879' }} className="text-sm">
              {dayName}
            </p>
            <p style={{ color: '#7A8997' }} className="text-base font-medium">
              {dateStr}
            </p>
          </div>
        </div>

        {/* Sandy Panel */}
        <div className="mb-8 p-6 rounded-lg border" style={{
          backgroundColor: '#0F1219',
          borderColor: '#1E2430',
        }}>
          <div className="flex items-start gap-4 mb-4">
            <div className="text-3xl">🤖</div>
            <div className="flex-1">
              <h2 className="text-lg font-bold" style={{ color: '#E8ECF1' }}>
                Sandy
              </h2>
              <p className="text-sm" style={{ color: '#5C6879' }}>
                Chief of Staff
              </p>
            </div>
          </div>

          <p className="mb-4" style={{ color: '#E8ECF1', lineHeight: '1.6' }}>
            Morning Emilee. Here's what needs your attention today:
          </p>

          <ul className="space-y-2 mb-6" style={{ color: '#E8ECF1' }}>
            <li className="text-sm">✓ 2 approvals waiting</li>
            <li className="text-sm">✓ 1 deadline today</li>
            <li className="text-sm">✓ 3 tasks in progress across the team</li>
          </ul>

          <div className="flex gap-3">
            <input
              type="text"
              value={sandyInput}
              onChange={(e) => setSandyInput(e.target.value)}
              placeholder="Ask Sandy anything..."
              className="flex-1 px-4 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: '#0A0E14',
                borderColor: '#1E2430',
                border: '1px solid',
                color: '#E8ECF1',
              }}
            />
            <button
              className="px-6 py-2 rounded-lg font-medium transition-all text-sm"
              style={{
                backgroundColor: '#F97031',
                color: 'white',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E85E1F')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F97031')}
            >
              Send
            </button>
          </div>

          <button
            className="mt-3 text-sm font-medium transition-all"
            style={{ color: '#F97031' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Full Briefing →
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Today's Focus */}
          <div>
            <h3 className="text-sm font-bold mb-4" style={{ color: '#E8ECF1' }}>
              TODAY'S FOCUS
            </h3>
            <div className="space-y-3">
              <div className="p-4 rounded-lg" style={{
                backgroundColor: '#0F1219',
                borderColor: '#EF4444',
                borderLeft: '4px solid #EF4444',
              }}>
                <p className="text-sm font-medium" style={{ color: '#E8ECF1' }}>
                  🔴 Sateen Email
                </p>
                <p className="text-xs mt-1" style={{ color: '#5C6879' }}>
                  Waiting for John
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{
                backgroundColor: '#0F1219',
                borderColor: '#F97031',
                borderLeft: '4px solid #F97031',
              }}>
                <p className="text-sm font-medium" style={{ color: '#E8ECF1' }}>
                  🟠 Website Refresh
                </p>
                <p className="text-xs mt-1" style={{ color: '#5C6879' }}>
                  In Progress
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{
                backgroundColor: '#0F1219',
                borderColor: '#F59E0B',
                borderLeft: '4px solid #F59E0B',
              }}>
                <p className="text-sm font-medium" style={{ color: '#E8ECF1' }}>
                  🟡 PPC Campaign
                </p>
                <p className="text-xs mt-1" style={{ color: '#5C6879' }}>
                  Due today
                </p>
              </div>
            </div>
          </div>

          {/* Waiting for Approval */}
          <div>
            <h3 className="text-sm font-bold mb-4" style={{ color: '#E8ECF1' }}>
              WAITING FOR APPROVAL
            </h3>
            <div className="space-y-3">
              <div className="p-4 rounded-lg" style={{
                backgroundColor: '#0F1219',
                borderColor: '#1E2430',
              }}>
                <p className="text-sm font-medium" style={{ color: '#E8ECF1' }}>
                  Sateen email
                </p>
                <p className="text-xs mt-1" style={{ color: '#F59E0B' }}>
                  Waiting for John
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{
                backgroundColor: '#0F1219',
                borderColor: '#1E2430',
              }}>
                <p className="text-sm font-medium" style={{ color: '#E8ECF1' }}>
                  IRCL stickers
                </p>
                <p className="text-xs mt-1" style={{ color: '#F59E0B' }}>
                  Waiting for John
                </p>
              </div>
            </div>
          </div>

          {/* Team Status */}
          <div>
            <h3 className="text-sm font-bold mb-4" style={{ color: '#E8ECF1' }}>
              TEAM STATUS
            </h3>
            <div className="space-y-3">
              <div className="p-4 rounded-lg" style={{
                backgroundColor: '#0F1219',
                borderColor: '#1E2430',
              }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium" style={{ color: '#E8ECF1' }}>
                    📧 Email Manager
                  </p>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#1D9E75' }}></span>
                </div>
                <p className="text-xs" style={{ color: '#5C6879' }}>
                  In Progress
                </p>
                <p className="text-xs mt-1 font-medium" style={{ color: '#E8ECF1' }}>
                  Account Manager emails
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{
                backgroundColor: '#0F1219',
                borderColor: '#1E2430',
              }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium" style={{ color: '#E8ECF1' }}>
                    🌐 Website Manager
                  </p>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#1D9E75' }}></span>
                </div>
                <p className="text-xs" style={{ color: '#5C6879' }}>
                  In Progress
                </p>
                <p className="text-xs mt-1 font-medium" style={{ color: '#E8ECF1' }}>
                  Radio Systems page
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{
                backgroundColor: '#0F1219',
                borderColor: '#1E2430',
              }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium" style={{ color: '#E8ECF1' }}>
                    📊 SEO Manager
                  </p>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5C6879' }}></span>
                </div>
                <p className="text-xs" style={{ color: '#5C6879' }}>
                  Available
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
