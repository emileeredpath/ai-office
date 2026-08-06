import { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { BRAND_LABEL } from '@/utils/brandColors';
import { Campaign, CampaignStatus } from '@/types/index';

type StatusFilter = 'all' | 'active' | 'completed';
type SortKey = 'name' | 'brand' | 'status' | 'clicks' | 'formSubs' | 'calls' | 'ga4Events' | 'spend' | 'roas';
type SortDirection = 'asc' | 'desc';

interface CampaignSummaryRow {
  id: string;
  name: string;
  brandLabel: string;
  status: CampaignStatus;
  clicks: number | null;
  formSubs: number | null;
  calls: number | null;
  ga4Events: number | null;
  spend: number;
  roas: number | null;
}

const STATUS_BADGE_STYLE: Record<CampaignStatus, { background: string; color: string }> = {
  active: { background: '#10b981', color: 'white' },
  completed: { background: '#9ca3af', color: 'white' },
  planning: { background: '#3b82f6', color: 'white' },
  'on-hold': { background: '#f59e0b', color: 'white' },
};

const STATUS_LABEL: Record<CampaignStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  planning: 'Planning',
  'on-hold': 'On Hold',
};

// Wave 1 backend integration only reports metrics for this campaign today —
// every other campaign shows "—" until GA4/Infinity queries are scoped
// per-campaign (see Wave 1 Data Integration brief, Phase 3).
function isWave1Campaign(campaign: Campaign): boolean {
  return campaign.name.trim().toLowerCase() === 'q3 education campaign';
}

export function CampaignSummaryTable() {
  const campaigns = useAppStore((s) => s.campaigns);
  const selectCampaign = useAppStore((s) => s.selectCampaign);
  const wave1Performance = useAppStore((s) => s.wave1Performance);
  const syncWave1Performance = useAppStore((s) => s.syncWave1Performance);
  const syncWave1Calls = useAppStore((s) => s.syncWave1Calls);
  const syncCampaignsFromApi = useAppStore((s) => s.syncCampaignsFromApi);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('spend');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const rows = useMemo<CampaignSummaryRow[]>(() => {
    return campaigns.map((c) => {
      const wave1 = isWave1Campaign(c);
      const ga4 = wave1 ? wave1Performance?.ga4 : null;
      const infinity = wave1 ? wave1Performance?.infinity : null;

      const brandLabel = c.entities && c.entities.length > 1
        ? `Multiple (${c.entities.length})`
        : BRAND_LABEL[c.brand] || c.brand;

      const spend = c.spend || 0;
      const roas = spend > 0 && c.valueGenerated ? (c.valueGenerated - spend) / spend + 1 : null;

      return {
        id: c.id,
        name: c.name,
        brandLabel,
        status: c.status,
        clicks: ga4 ? ga4.clicks : null,
        formSubs: ga4 ? ga4.formSubmissions : null,
        calls: infinity ? infinity.totalCalls : null,
        ga4Events: ga4 ? ga4.pageViews : null,
        spend,
        roas,
      };
    });
  }, [campaigns, wave1Performance]);

  const filteredRows = useMemo(() => {
    if (statusFilter === 'all') return rows;
    if (statusFilter === 'active') return rows.filter((r) => r.status === 'active');
    return rows.filter((r) => r.status === 'completed');
  }, [rows, statusFilter]);

  const sortedRows = useMemo(() => {
    const sorted = [...filteredRows];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'brand':
          cmp = a.brandLabel.localeCompare(b.brandLabel);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'clicks':
          cmp = (a.clicks ?? -1) - (b.clicks ?? -1);
          break;
        case 'formSubs':
          cmp = (a.formSubs ?? -1) - (b.formSubs ?? -1);
          break;
        case 'calls':
          cmp = (a.calls ?? -1) - (b.calls ?? -1);
          break;
        case 'ga4Events':
          cmp = (a.ga4Events ?? -1) - (b.ga4Events ?? -1);
          break;
        case 'spend':
          cmp = a.spend - b.spend;
          break;
        case 'roas':
          cmp = (a.roas ?? -1) - (b.roas ?? -1);
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredRows, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([syncCampaignsFromApi(), syncWave1Performance(), syncWave1Calls()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const SortHeader = ({ label, sortKeyName, align = 'left' }: { label: string; sortKeyName: SortKey; align?: 'left' | 'right' }) => (
    <th
      onClick={() => handleSort(sortKeyName)}
      style={{ cursor: 'pointer', userSelect: 'none', textAlign: align, whiteSpace: 'nowrap' }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexDirection: align === 'right' ? 'row-reverse' : 'row' }}>
        {label}
        {sortKey === sortKeyName ? (
          sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
        ) : (
          <span style={{ width: 12, display: 'inline-block' }} />
        )}
      </span>
    </th>
  );

  return (
    <div className="card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <h2 className="text-base font-semibold text-text-primary" style={{ margin: 0 }}>
          Campaign Summary
        </h2>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1">
            {(['all', 'active', 'completed'] as StatusFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className="text-xs font-medium"
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: statusFilter === filter ? 'var(--color-accent)' : 'transparent',
                  color: statusFilter === filter ? 'white' : 'var(--color-text-secondary)',
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                }}
              >
                {filter}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs font-medium flex items-center gap-1"
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              color: 'var(--color-text-secondary)',
              cursor: isRefreshing ? 'default' : 'pointer',
              opacity: isRefreshing ? 0.6 : 1,
            }}
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing…' : 'Refresh Now'}
          </button>
        </div>
      </div>

      {sortedRows.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', minWidth: '760px' }}>
            <thead>
              <tr>
                <SortHeader label="Campaign Name" sortKeyName="name" />
                <SortHeader label="Brand" sortKeyName="brand" />
                <SortHeader label="Status" sortKeyName="status" />
                <SortHeader label="Clicks" sortKeyName="clicks" align="right" />
                <SortHeader label="Form Subs" sortKeyName="formSubs" align="right" />
                <SortHeader label="Calls" sortKeyName="calls" align="right" />
                <SortHeader label="GA4 Events" sortKeyName="ga4Events" align="right" />
                <SortHeader label="Spend" sortKeyName="spend" align="right" />
                <SortHeader label="ROAS" sortKeyName="roas" align="right" />
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <button
                      onClick={() => selectCampaign(row.id)}
                      className="font-medium text-left"
                      style={{ color: 'var(--color-accent)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    >
                      {row.name}
                    </button>
                  </td>
                  <td className="text-sm text-text-secondary">{row.brandLabel}</td>
                  <td>
                    <span className="badge" style={{ ...STATUS_BADGE_STYLE[row.status], fontSize: '11px' }}>
                      {STATUS_LABEL[row.status]}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>{row.clicks ?? '—'}</td>
                  <td style={{ textAlign: 'right' }}>{row.formSubs ?? '—'}</td>
                  <td style={{ textAlign: 'right' }}>{row.calls ?? '—'}</td>
                  <td style={{ textAlign: 'right' }}>{row.ga4Events ?? '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    £{row.spend.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {row.roas !== null ? `${row.roas.toFixed(1)}x` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-text-secondary">
          No campaigns yet.{' '}
          <button
            onClick={() => selectCampaign(null)}
            style={{ color: 'var(--color-accent)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Create your first campaign
          </button>
        </p>
      )}
    </div>
  );
}
