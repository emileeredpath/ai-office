import { Plus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { BrandBadge } from '@/components/common/BrandBadge';
import { formatDateShort } from '@/utils/dateUtils';

export function CampaignsScreen() {
  const campaigns = useAppStore((s) => s.campaigns);
  const tasks = useAppStore((s) => s.tasks);
  const selectCampaign = useAppStore((s) => s.selectCampaign);

  const getCampaignProgress = (campaignId: string) => {
    const campaignTasks = tasks.filter((t) => t.campaignId === campaignId);
    if (campaignTasks.length === 0) return 0;
    const completed = campaignTasks.filter((t) => t.status === 'complete').length;
    return Math.round((completed / campaignTasks.length) * 100);
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'active':
        return { backgroundColor: '#E8F7F3', color: '#0F6E56' };
      case 'planning':
        return { backgroundColor: '#EFF6FF', color: '#0369A1' };
      case 'on-hold':
        return { backgroundColor: '#FEF3C7', color: '#92400E' };
      case 'completed':
        return { backgroundColor: '#F0FDF4', color: '#166534' };
      default:
        return { backgroundColor: '#F3F4F6', color: '#6B7280' };
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Campaigns</h1>
          <button className="btn btn-primary flex items-center gap-2">
            <Plus size={18} />
            New campaign
          </button>
        </div>

        {/* Campaign Grid */}
        {campaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => {
              const progress = getCampaignProgress(campaign.id);
              const campaignTasks = tasks.filter((t) => t.campaignId === campaign.id);

              return (
                <button
                  key={campaign.id}
                  className="card cursor-pointer hover:shadow-lg transition-shadow text-left"
                  style={{ background: 'inherit', border: 'inherit', padding: 'inherit', width: '100%', cursor: 'pointer' }}
                  onClick={() => selectCampaign(campaign.id)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">{campaign.name}</h3>
                      <div className="flex gap-2 mt-2">
                        <BrandBadge brand={campaign.brand} />
                        <span
                          className="badge text-xs font-medium"
                          style={{
                            ...getStatusBadgeStyle(campaign.status),
                            padding: '3px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          {getStatusLabel(campaign.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div>
                      <p className="text-sm text-text-secondary">{campaign.primaryIndustry}</p>
                      {campaign.secondaryIndustry && (
                        <p className="text-sm text-text-secondary">{campaign.secondaryIndustry}</p>
                      )}
                    </div>

                    <div className="text-sm text-text-secondary">
                      {formatDateShort(campaign.startDate)} - {formatDateShort(campaign.endDate)}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-text-secondary">Progress</span>
                      <span className="text-sm font-medium text-text-primary">{progress}%</span>
                    </div>
                    <div className="flex-1 bg-surface rounded h-2 overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{ width: `${progress}%`, backgroundColor: '#3B82F6' }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-sm text-text-secondary">
                    {campaignTasks.filter((t) => t.status === 'complete').length} of{' '}
                    {campaignTasks.length} tasks complete
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-text-secondary text-center py-12">No campaigns yet. Create one to get started.</p>
        )}
      </div>
    </div>
  );
}
