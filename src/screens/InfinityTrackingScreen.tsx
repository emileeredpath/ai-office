import { useState, useEffect } from 'react';
import { Phone, PhoneOff, Clock, TrendingUp } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatDateShort } from '@/utils/dateUtils';

interface CallMetrics {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  answerRate: number;
  avgDuration: string;
}

export function InfinityTrackingScreen() {
  const wave1Performance = useAppStore((s) => s.wave1Performance);
  const syncWave1Calls = useAppStore((s) => s.syncWave1Calls);
  const [dateRange, setDateRange] = useState<'week' | 'month'>('week');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    syncWave1Calls().then(() => setIsLoading(false));
  }, [syncWave1Calls]);

  const calls = wave1Performance?.infinity?.calls || [];
  const totalCalls = wave1Performance?.infinity?.totalCalls || 0;
  const answeredCalls = wave1Performance?.infinity?.answeredCalls || 0;
  const missedCalls = wave1Performance?.infinity?.missedCalls || 0;
  const answerRate = totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0;
  const avgDuration = wave1Performance?.infinity?.avgDuration || '0s';

  const metrics: CallMetrics = {
    totalCalls,
    answeredCalls,
    missedCalls,
    answerRate,
    avgDuration,
  };

  // Filter calls by date range
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - (dateRange === 'week' ? 7 : 30));

  const filteredCalls = calls.filter((call) => {
    const callDate = new Date(call.date);
    return callDate >= startDate && callDate <= now;
  });

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Infinity Tracking</h1>
          <p className="text-text-secondary">Wave 1 Education Campaign - Call Tracking</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Phone size={18} className="text-accent" />
              <span className="text-sm font-medium text-text-secondary">Total Calls</span>
            </div>
            <div className="text-3xl font-bold text-text-primary">{metrics.totalCalls}</div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Phone size={18} className="text-success" />
              <span className="text-sm font-medium text-text-secondary">Answered</span>
            </div>
            <div className="text-3xl font-bold text-success">{metrics.answeredCalls}</div>
            <div className="text-xs text-text-secondary mt-1">{metrics.answerRate}% answer rate</div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <PhoneOff size={18} className="text-red-500" />
              <span className="text-sm font-medium text-text-secondary">Missed</span>
            </div>
            <div className="text-3xl font-bold text-red-500">{metrics.missedCalls}</div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={18} className="text-accent" />
              <span className="text-sm font-medium text-text-secondary">Avg Duration</span>
            </div>
            <div className="text-3xl font-bold text-text-primary">{metrics.avgDuration}</div>
          </div>
        </div>

        {/* Orange Divider */}
        <div style={{ height: '3px', backgroundColor: '#ff9d3d', marginBottom: '2rem' }} />

        {/* Filters */}
        <div className="card mb-6 p-4">
          <div className="flex gap-3">
            <button
              onClick={() => setDateRange('week')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                dateRange === 'week'
                  ? 'bg-accent text-white'
                  : 'bg-surface text-text-secondary hover:bg-border'
              }`}
            >
              Last 7 days
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                dateRange === 'month'
                  ? 'bg-accent text-white'
                  : 'bg-surface text-text-secondary hover:bg-border'
              }`}
            >
              Last 30 days
            </button>
          </div>
        </div>

        {/* Call Log */}
        <div className="card">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary">Call Log</h2>
            <p className="text-xs text-text-secondary mt-1">{filteredCalls.length} calls in selected period</p>
          </div>

          {filteredCalls.length > 0 ? (
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Duration</th>
                  <th>Caller</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCalls.map((call) => (
                  <tr key={call.id} className={call.answered ? '' : 'opacity-75'}>
                    <td className="text-sm">{call.date}</td>
                    <td className="text-sm">{call.time}</td>
                    <td className="text-sm font-medium">{call.duration}</td>
                    <td className="text-xs text-text-secondary">{call.callerNumber}</td>
                    <td>
                      <span
                        className="badge inline-flex items-center gap-1"
                        style={{
                          background: call.answered ? '#10b981' : '#ef4444',
                          color: 'white',
                          fontSize: '11px',
                          padding: '4px 8px',
                        }}
                      >
                        {call.answered ? (
                          <>
                            <Phone size={12} />
                            Answered
                          </>
                        ) : (
                          <>
                            <PhoneOff size={12} />
                            Missed
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-text-secondary">
              {isLoading ? 'Loading call data...' : 'No calls in this period'}
            </div>
          )}
        </div>

        {/* Footer */}
        {wave1Performance?.lastSynced && (
          <p className="text-xs text-text-secondary mt-4">
            Last synced: {new Date(wave1Performance.lastSynced).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
