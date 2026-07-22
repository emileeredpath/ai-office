import { useState, useEffect } from 'react';
import * as api from '@/services/api';

interface AnalyticsDashboardProps {
  companyId: string;
  currentUserId: string;
}

export function AnalyticsDashboard({ companyId, currentUserId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [teamPerformance, setTeamPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'team'>('overview');

  // Get current month for default period
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const periodStart = monthStart.toISOString().split('T')[0];
  const periodEnd = monthEnd.toISOString().split('T')[0];

  useEffect(() => {
    loadAnalytics();
  }, [companyId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsData, teamData] = await Promise.all([
        api.getCompanyAnalytics(companyId),
        api.getTeamPerformance(companyId, periodStart, periodEnd),
      ]);
      setAnalytics(analyticsData);
      setTeamPerformance(teamData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-slate-400">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-50 mb-2">Analytics Dashboard</h1>
        <p className="text-slate-400">Track performance metrics and team insights</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'overview'
              ? 'text-orange-400 border-b-2 border-orange-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'team'
              ? 'text-orange-400 border-b-2 border-orange-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Team Performance
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <p className="text-sm text-slate-400">Total Tasks</p>
              <p className="text-4xl font-bold text-slate-50 mt-2">{analytics.total_tasks || 0}</p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <p className="text-sm text-slate-400">Completed</p>
              <p className="text-4xl font-bold text-green-400 mt-2">{analytics.completed_tasks || 0}</p>
              {analytics.total_tasks > 0 && (
                <p className="text-xs text-slate-500 mt-2">
                  {Math.round((analytics.completed_tasks / analytics.total_tasks) * 100)}% complete
                </p>
              )}
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <p className="text-sm text-slate-400">Avg Satisfaction</p>
              <p className="text-4xl font-bold text-yellow-400 mt-2">
                {analytics.avg_satisfaction ? analytics.avg_satisfaction.toFixed(1) : 'N/A'}
              </p>
              <p className="text-xs text-slate-500 mt-2">out of 5.0</p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <p className="text-sm text-slate-400">Approval Rate</p>
              <p className="text-4xl font-bold text-blue-400 mt-2">
                {analytics.avg_approval_rate ? (analytics.avg_approval_rate * 100).toFixed(0) : 'N/A'}%
              </p>
              <p className="text-xs text-slate-500 mt-2">first-time approvals</p>
            </div>
          </div>

          {/* Efficiency */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-slate-50 mb-4">Efficiency Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400">Avg Time to Complete</p>
                <p className="text-2xl font-bold text-slate-50 mt-2">
                  {analytics.avg_time_to_complete
                    ? (analytics.avg_time_to_complete / 60).toFixed(1)
                    : 'N/A'}{' '}
                  hours
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Avg Satisfaction</p>
                <p className="text-2xl font-bold text-slate-50 mt-2">
                  {analytics.avg_satisfaction ? analytics.avg_satisfaction.toFixed(2) : 'N/A'}/5.0
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Performance Tab */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          {teamPerformance.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No performance data available for this period</p>
            </div>
          ) : (
            teamPerformance.map((specialist) => (
              <div key={specialist.specialist_id} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{specialist.emoji || '👤'}</span>
                      <div>
                        <h3 className="text-lg font-bold text-slate-50">{specialist.name}</h3>
                        <p className="text-xs text-slate-400">{specialist.role}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-yellow-400">
                      {specialist.avg_rating ? specialist.avg_rating.toFixed(1) : 'N/A'}⭐
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-slate-400">Tasks Completed</p>
                    <p className="text-2xl font-bold text-slate-50 mt-1">{specialist.tasks_completed || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Approved</p>
                    <p className="text-2xl font-bold text-green-400 mt-1">{specialist.tasks_approved || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Quality Score</p>
                    <div className="w-full bg-slate-900 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${(specialist.quality_score || 0) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {specialist.quality_score ? (specialist.quality_score * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Consistency</p>
                    <div className="w-full bg-slate-900 rounded-full h-2 mt-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{
                          width: `${(specialist.consistency_score || 0) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {specialist.consistency_score ? (specialist.consistency_score * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
