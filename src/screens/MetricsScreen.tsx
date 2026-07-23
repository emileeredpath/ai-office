import React from 'react';
import { useAppStore } from '@/store/useAppStore';

export function MetricsScreen() {
  const campaigns = useAppStore((s) => s.campaigns);

  const activeCampaigns = campaigns.filter((c) => c.status === 'active');
  const completedCampaigns = campaigns.filter((c) => c.status === 'completed');

  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);

  const budgetUtilization = ((totalSpend / totalBudget) * 100).toFixed(1);
  const avgEngagementRate = (
    campaigns.reduce((sum, c) => sum + c.engagement, 0) / campaigns.length
  ).toFixed(1);

  const costPerLead = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : '0';
  const costPerConversion = totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : '0';

  return (
    <div className="h-full bg-slate-50 overflow-auto">
      <div className="p-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Campaign Metrics</h1>
        <p className="text-slate-600 mb-8">Performance overview and KPIs</p>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-600 mb-2">Total Budget</p>
            <p className="text-2xl font-bold text-slate-900">
              ${totalBudget.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-2">Across all campaigns</p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-600 mb-2">Total Spend</p>
            <p className="text-2xl font-bold text-slate-900">
              ${totalSpend.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {budgetUtilization}% of budget
            </p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-600 mb-2">Total Leads</p>
            <p className="text-2xl font-bold text-slate-900">{totalLeads.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-2">
              ${costPerLead} cost per lead
            </p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-600 mb-2">Conversions</p>
            <p className="text-2xl font-bold text-slate-900">
              {totalConversions.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              ${costPerConversion} cost per conversion
            </p>
          </div>
        </div>

        {/* Campaign Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Campaign Status</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Active Campaigns</span>
                  <span className="text-sm font-bold text-green-600">
                    {activeCampaigns.length}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${(activeCampaigns.length / campaigns.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">
                    Completed Campaigns
                  </span>
                  <span className="text-sm font-bold text-slate-600">
                    {completedCampaigns.length}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-slate-400 h-2 rounded-full transition-all"
                    style={{
                      width: `${(completedCampaigns.length / campaigns.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Planning</span>
                  <span className="text-sm font-bold text-amber-600">
                    {campaigns.filter((c) => c.status === 'planning').length}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-amber-400 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        (campaigns.filter((c) => c.status === 'planning').length /
                          campaigns.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Engagement Metrics</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Avg Engagement Rate</span>
                  <span className="text-sm font-bold text-blue-600">{avgEngagementRate}%</span>
                </div>
                <p className="text-xs text-slate-500">Across all campaigns</p>
              </div>
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Top Campaigns</h3>
                {campaigns
                  .sort((a, b) => b.engagement - a.engagement)
                  .slice(0, 3)
                  .map((campaign) => (
                    <div key={campaign.id} className="flex justify-between items-center">
                      <span className="text-sm text-slate-700">{campaign.name}</span>
                      <span className="text-sm font-medium text-slate-900">
                        {campaign.engagement.toFixed(1)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Details Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Campaign Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Campaign</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Budget</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Spend</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Leads</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Conversions</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">
                    Engagement
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{campaign.name}</td>
                    <td className="px-6 py-4 text-slate-700">
                      ${campaign.budget?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      ${campaign.spend.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-700">{campaign.leads}</td>
                    <td className="px-6 py-4 text-slate-700">{campaign.conversions}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {campaign.engagement.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
