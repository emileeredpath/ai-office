import { useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/contexts/AuthContext';
import { BRAND_COLOR, BRAND_LABEL } from '@/utils/brandColors';
import { Brand } from '@/types/index';
import { formatDateShort } from '@/utils/dateUtils';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 8px' }}>
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>{value}</p>
    </div>
  );
}

export function DashboardScreen() {
  const campaigns = useAppStore((s) => s.campaigns);
  const { isEditor } = useAuth();

  const now = new Date();
  const greetingHour = now.getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening';
  const userName = isEditor ? 'Emilee' : 'John';
  const formattedDate = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const metrics = useMemo(() => {
    const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
    const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
    const roas = totalSpend > 0 ? (totalConversions / totalSpend).toFixed(2) : '—';

    return { totalSpend, totalConversions, activeCampaigns, roas };
  }, [campaigns]);

  const spendByChannel = useMemo(() => {
    const channelMap: Record<string, number> = {
      'Email': 0,
      'PPC': 0,
      'Social': 0,
      'Website': 0,
    };

    campaigns.forEach((c) => {
      const trackingLinks = c.trackingLinks || [];
      trackingLinks.forEach((link) => {
        const channel = link.channel || 'Email';
        if (channelMap.hasOwnProperty(channel)) {
          channelMap[channel] += c.spend / (trackingLinks.length || 1);
        } else {
          channelMap['Email'] += c.spend / (trackingLinks.length || 1);
        }
      });
      if (trackingLinks.length === 0) {
        channelMap['Email'] += c.spend;
      }
    });

    return Object.entries(channelMap)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [campaigns]);

  const performanceByBrand = useMemo(() => {
    const brandMap: Record<string, { spend: number; conversions: number }> = {};

    campaigns.forEach((c) => {
      const brand = BRAND_LABEL[c.brand] || c.brand;
      if (!brandMap[brand]) {
        brandMap[brand] = { spend: 0, conversions: 0 };
      }
      brandMap[brand].spend += c.spend;
      brandMap[brand].conversions += c.conversions;
    });

    return Object.entries(brandMap)
      .map(([brand, data]) => ({
        brand,
        spend: data.spend,
        conversions: data.conversions,
        roas: data.spend > 0 ? (data.conversions / data.spend).toFixed(2) : '—',
      }))
      .sort((a, b) => b.spend - a.spend);
  }, [campaigns]);

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-1">
            {greeting}, {userName}
          </h1>
          <p className="text-text-secondary">{formattedDate}</p>
        </div>

        {/* Summary Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '2rem' }}>
          <StatCard label="Total Spend" value={`£${metrics.totalSpend.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
          <StatCard label="Total Conversions" value={String(metrics.totalConversions.toLocaleString())} />
          <StatCard label="ROAS" value={`${metrics.roas}x`} />
          <StatCard label="Active Campaigns" value={String(metrics.activeCampaigns)} />
        </div>

        {/* Orange Divider */}
        <div style={{ height: '3px', backgroundColor: '#ff9d3d', marginBottom: '2rem' }} />

        {/* Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '2rem' }}>
          {/* Spend by Channel Chart */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 className="text-base font-semibold text-text-primary mb-4" style={{ margin: 0 }}>
              Spend by Channel
            </h2>
            {spendByChannel.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={spendByChannel} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => `£${v.toLocaleString('en-GB')}`} />
                  <Bar dataKey="value" fill="#3B82F6" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-text-secondary">No spending data yet.</p>
            )}
          </div>

          {/* Performance by Brand Table */}
          <div className="card" style={{ padding: '1.5rem', overflow: 'auto' }}>
            <h2 className="text-base font-semibold text-text-primary mb-4" style={{ margin: 0 }}>
              Performance by Brand
            </h2>
            {performanceByBrand.length > 0 ? (
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Brand</th>
                    <th style={{ textAlign: 'right' }}>Spend</th>
                    <th style={{ textAlign: 'right' }}>Conversions</th>
                    <th style={{ textAlign: 'right' }}>ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceByBrand.map((row) => (
                    <tr key={row.brand}>
                      <td>{row.brand}</td>
                      <td style={{ textAlign: 'right' }}>£{row.spend.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right' }}>{row.conversions.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{row.roas}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-text-secondary">No performance data yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
