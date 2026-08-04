import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { BRAND_COLOR, BRAND_LABEL } from '@/utils/brandColors';
import { Mail } from 'lucide-react';

interface TimelineEvent {
  date: string;
  day: string;
  items: TimelineItem[];
}

interface TimelineItem {
  id: string;
  title: string;
  type: 'milestone' | 'task';
  campaignId?: string;
  campaignName?: string;
  brand?: string;
  isSend?: boolean;
  recipients?: number;
  cost?: number;
}

export function MonthTimeline({ currentDate }: { currentDate: Date }) {
  const tasks = useAppStore((s) => s.tasks);
  const campaigns = useAppStore((s) => s.campaigns);

  const timelineEvents = useMemo(() => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const eventsMap = new Map<string, TimelineItem[]>();

    // Add campaign milestones
    campaigns.forEach((campaign) => {
      if (campaign.schedule && Array.isArray(campaign.schedule)) {
        campaign.schedule.forEach((scheduleItem: any) => {
          const itemDate = new Date(scheduleItem.date);
          if (itemDate >= monthStart && itemDate <= monthEnd) {
            const dateKey = scheduleItem.date;
            if (!eventsMap.has(dateKey)) {
              eventsMap.set(dateKey, []);
            }
            eventsMap.get(dateKey)!.push({
              id: `milestone-${campaign.id}-${scheduleItem.id}`,
              title: scheduleItem.element,
              type: 'milestone',
              campaignId: campaign.id,
              campaignName: campaign.name,
              brand: campaign.brand,
            });
          }
        });
      }
    });

    // Add tasks with deadlines
    tasks.forEach((task) => {
      if (task.deadline) {
        const taskDate = new Date(task.deadline);
        if (taskDate >= monthStart && taskDate <= monthEnd) {
          const dateKey = taskDate.toISOString().split('T')[0];
          if (!eventsMap.has(dateKey)) {
            eventsMap.set(dateKey, []);
          }
          const isSend = task.type === 'email-send';
          eventsMap.get(dateKey)!.push({
            id: task.id,
            title: isSend ? `${BRAND_LABEL[task.brand]} send` : task.title,
            type: 'task',
            campaignId: task.campaignId || undefined,
            campaignName: campaigns.find((c) => c.id === task.campaignId)?.name,
            brand: task.brand,
            isSend,
            recipients: task.recipients || undefined,
            cost: task.cost || undefined,
          });
        }
      }
    });

    // Sort by date and format
    const sortedDates = Array.from(eventsMap.keys()).sort();
    return sortedDates.map((dateStr) => {
      const date = new Date(dateStr);
      const displayDate = date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
      return {
        date: displayDate,
        items: eventsMap.get(dateStr)!,
      };
    });
  }, [tasks, campaigns, currentDate]);

  if (timelineEvents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">No milestones or tasks scheduled for this month.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {timelineEvents.map((event, idx) => {
        return (
          <div key={event.date} className="flex gap-4">
            <div className="flex-shrink-0 w-16">
              <div className="text-sm font-semibold text-text-primary">{event.date}</div>
            </div>
            <div className="flex-1 border-l-2 border-text-secondary/20 pl-4 pb-4">
              <div className="space-y-3">
                {event.items.map((item) => {
                  const color = item.brand ? BRAND_COLOR[item.brand as keyof typeof BRAND_COLOR] : '#94a3b8';
                  const bgColor = `${color}15`;

                  return (
                    <div
                      key={item.id}
                      className="px-3 py-2 rounded text-sm"
                      style={{
                        backgroundColor: bgColor,
                        borderLeft: `3px solid ${color}`,
                      }}
                    >
                      <div className="flex items-start gap-2">
                        {item.isSend && <Mail size={14} style={{ color, flexShrink: 0, marginTop: '2px' }} />}
                        <div className="flex-1 min-w-0">
                          <div style={{ color: 'var(--text-primary)' }} className="font-medium">
                            {item.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {item.campaignName && <span>{item.campaignName}</span>}
                            {item.isSend && item.recipients && <span>· {item.recipients.toLocaleString()} recipients</span>}
                            {item.isSend && item.cost != null && <span>· £{item.cost.toFixed(2)}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
