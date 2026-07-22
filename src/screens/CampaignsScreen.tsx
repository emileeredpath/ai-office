import { Plus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { BrandBadge } from '@/components/common/BrandBadge';
import { formatDateShort } from '@/utils/dateUtils';

export function CampaignsScreen() {
  const campaigns = useAppStore((s) => s.campaigns);
  const tasks = useAppStore((s) => s.tasks);

  const getCampaignProgress = (campaignId: string) => {
    const campaignTasks = tasks.filter((t) => t.campaignId === campaignId);
    if (campaignTasks.length === 0) return 0;
    const completed = campaignTasks.filter((t) => t.status === 'complete').length;
    return Math.round((completed / campaignTasks.length) * 100);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => {
            const progress = getCampaignProgress(campaign.id);
            const campaignTasks = tasks.filter((t) => t.campaignId === campaign.id);

            return (
              <div key={campaign.id} className="card cursor-pointer hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">{campaign.name}</h3>
                    <BrandBadge brand={campaign.brand} />
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

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 bg-surface rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-accent h-full transition-all"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-text-primary">{progress}%</span>
                </div>

                <div className="text-sm text-text-secondary">
                  {campaignTasks.filter((t) => t.status === 'complete').length} of{' '}
                  {campaignTasks.length} tasks complete
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
