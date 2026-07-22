import { useMemo } from 'react';
import { REAL_TASKS, BRANDS, BrandId, BRAND_ORDER } from '@/data/mtechEmployees';

interface CampaignsListProps {
  companyId: string;
  currentUserId: string;
}

interface Campaign {
  id: string;
  name: string;
  brand: BrandId;
  taskCount: number;
  completedCount: number;
  inProgressCount: number;
  status: 'backlog' | 'active' | 'complete';
}

export function CampaignsList({ companyId, currentUserId }: CampaignsListProps) {
  const campaigns: Campaign[] = useMemo(() => {
    const campaignMap: Record<string, Campaign> = {};

    REAL_TASKS.forEach((task) => {
      // Group tasks by brand as campaigns
      const brandId = task.brand as BrandId;
      const brandName = BRANDS[brandId].shortName;
      const campaignId = `campaign-${brandId}`;

      if (!campaignMap[campaignId]) {
        campaignMap[campaignId] = {
          id: campaignId,
          name: `${brandName} Marketing Campaign`,
          brand: brandId,
          taskCount: 0,
          completedCount: 0,
          inProgressCount: 0,
          status: 'active',
        };
      }

      campaignMap[campaignId].taskCount++;
      if (task.status === 'complete') {
        campaignMap[campaignId].completedCount++;
      }
      if (task.status === 'in-progress') {
        campaignMap[campaignId].inProgressCount++;
      }

      // Determine campaign status
      if (campaignMap[campaignId].completedCount === campaignMap[campaignId].taskCount && campaignMap[campaignId].taskCount > 0) {
        campaignMap[campaignId].status = 'complete';
      } else if (campaignMap[campaignId].inProgressCount === 0 && campaignMap[campaignId].completedCount === 0) {
        campaignMap[campaignId].status = 'backlog';
      }
    });

    return BRAND_ORDER.map((brandId) => campaignMap[`campaign-${brandId}`]).filter((c) => c);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'backlog':
        return 'var(--text-secondary)';
      case 'active':
        return '#F97031';
      case 'complete':
        return '#1D9E75';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'backlog':
        return 'Backlog';
      case 'active':
        return 'Active';
      case 'complete':
        return 'Complete';
      default:
        return status;
    }
  };

  const totalTasks = campaigns.reduce((sum, c) => sum + c.taskCount, 0);
  const completedTasks = campaigns.reduce((sum, c) => sum + c.completedCount, 0);
  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Campaigns
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {activeCampaigns} active • {completedTasks}/{totalTasks} tasks complete
          </p>
        </div>

        {/* Campaign Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Active Campaigns
            </p>
            <p className="text-2xl font-bold mt-2" style={{ color: '#F97031' }}>
              {activeCampaigns}
            </p>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              In Progress
            </p>
            <p className="text-2xl font-bold mt-2" style={{ color: '#F59E0B' }}>
              {campaigns.reduce((sum, c) => sum + c.inProgressCount, 0)}
            </p>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Completion Rate
            </p>
            <p className="text-2xl font-bold mt-2" style={{ color: '#1D9E75' }}>
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Campaign List */}
        <div className="space-y-4">
          {campaigns.map((campaign) => {
            const progress = campaign.taskCount > 0 ? Math.round((campaign.completedCount / campaign.taskCount) * 100) : 0;
            return (
              <div
                key={campaign.id}
                className="p-6 rounded-lg"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  border: '1px solid',
                }}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {campaign.name}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {campaign.taskCount} tasks • {campaign.inProgressCount} in progress
                    </p>
                  </div>
                  <span
                    className="px-3 py-1 rounded text-xs font-medium flex-shrink-0"
                    style={{
                      backgroundColor: `${getStatusColor(campaign.status)}22`,
                      color: getStatusColor(campaign.status),
                    }}
                  >
                    {getStatusLabel(campaign.status)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs" style={{ color: '#7A8997' }}>
                      Progress
                    </span>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                      {campaign.completedCount}/{campaign.taskCount}
                    </span>
                  </div>
                  <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--border-color)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progress}%`,
                        background: 'linear-gradient(90deg, #F97031, #FFB067)',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
