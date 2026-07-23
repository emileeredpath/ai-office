import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { CampaignStatus } from '@/types/index';

const statusLabels: Record<CampaignStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  'on-hold': 'On Hold',
  completed: 'Completed',
};

const statusColors: Record<CampaignStatus, string> = {
  planning: '#F59E0B',
  active: '#10B981',
  'on-hold': '#EF4444',
  completed: '#6B7280',
};

export function PipelineScreen() {
  const campaigns = useAppStore((s) => s.campaigns);
  const selectCampaign = useAppStore((s) => s.selectCampaign);

  const statuses: CampaignStatus[] = ['planning', 'active', 'on-hold', 'completed'];

  const campaignsByStatus = statuses.reduce((acc, status) => {
    acc[status] = campaigns.filter((c) => c.status === status);
    return acc;
  }, {} as Record<CampaignStatus, typeof campaigns>);

  return (
    <div className="h-full bg-slate-50 overflow-auto">
      <div className="p-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Campaign Pipeline</h1>
        <p className="text-slate-600 mb-6">Track campaigns through each stage</p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {statuses.map((status) => (
            <div key={status} className="bg-white rounded-lg border border-slate-200 h-fit">
              <div className="p-4 border-b border-slate-200 flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: statusColors[status] }}
                />
                <h2 className="font-semibold text-slate-900">
                  {statusLabels[status]}
                </h2>
                <span className="ml-auto text-sm text-slate-500 font-medium">
                  {campaignsByStatus[status].length}
                </span>
              </div>
              <div className="p-4 space-y-3">
                {campaignsByStatus[status].map((campaign) => (
                  <button
                    key={campaign.id}
                    onClick={() => selectCampaign(campaign.id)}
                    className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all group cursor-pointer"
                  >
                    <h3 className="font-medium text-slate-900 group-hover:text-slate-700">
                      {campaign.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{campaign.brand}</p>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-600">
                        Budget: ${campaign.budget?.toLocaleString()}
                      </span>
                      <span className="text-slate-500">
                        {campaign.tasks.length} tasks
                      </span>
                    </div>
                  </button>
                ))}
                {campaignsByStatus[status].length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">
                    No campaigns
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
