import { Phone, PhoneOff, Database, Users } from 'lucide-react';
import { BrandBadge } from '@/components/common/BrandBadge';
import type { InfinityCallRecord } from '@/services/infinityCallsApi';

const COLUMNS = [
  'Date / Time',
  'Caller',
  'Entity',
  'Campaign',
  'Source',
  'Landing Page',
  'Duration',
  'Status',
  'Qualified',
  'Lead',
  'Opportunity',
  'Pipeline Value',
  'Won Revenue',
];

const NotAvailable = ({ label = 'Not available' }: { label?: string }) => (
  <span className="v2-not-connected-text">{label}</span>
);

function isAnswered(call: InfinityCallRecord): boolean {
  return (call.bridgeDuration ?? 0) > 0;
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '—';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
}

interface CallLogTableProps {
  calls: InfinityCallRecord[];
  infinityConfigured: boolean;
  // True once the current entity/period selection has a real, confirmed
  // set of calls to show (either MTech Group with at least one mapped
  // entity, or a single entity with a confirmed real dgrpName mapping —
  // see src/utils/callPerformance.ts).
  showRealTotals: boolean;
}

// The V2 call log carries the full future column set, but only populates
// what real Infinity data genuinely supports today. Entity is real for
// calls whose dgrpName has a confirmed mapping (Brentwood, Radio Links,
// Irish Radio); Source and Landing Page are real wherever Infinity
// reported them. Campaign, Qualified, Lead, Opportunity, Pipeline Value
// and Won Revenue stay "Not connected" — no defensible Infinity-side
// campaign identifier exists yet, and CRM attribution doesn't exist at all.
export function CallLogTable({ calls, infinityConfigured, showRealTotals }: CallLogTableProps) {
  if (!infinityConfigured) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', minWidth: 1240 }}>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col} style={{ whiteSpace: 'nowrap' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={COLUMNS.length} style={{ padding: 0 }}>
                <div className="v2-crm-empty">
                  <Database size={28} color="var(--v2-grey)" />
                  <p className="v2-crm-empty-title">Call records are not connected yet</p>
                  <p className="v2-crm-empty-subtitle">
                    Infinity will provide real call activity here once connected. Campaign attribution and CRM
                    outcomes from Acumatica will follow once that mapping exists.
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (!showRealTotals) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', minWidth: 1240 }}>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col} style={{ whiteSpace: 'nowrap' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={COLUMNS.length} style={{ padding: 0 }}>
                <div className="v2-crm-empty">
                  <Users size={28} color="var(--v2-grey)" />
                  <p className="v2-crm-empty-title">Entity-level call attribution isn't confirmed yet</p>
                  <p className="v2-crm-empty-subtitle">
                    This entity's Infinity dgrpName hasn't been confirmed and mapped yet. Switch to MTech Group or an
                    entity with confirmed attribution (Brentwood, Radio Links, Irish Radio) to see real call activity.
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (calls.length === 0) {
    return <p className="v2-not-connected-text" style={{ padding: '1.5rem' }}>No calls in the selected period.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', minWidth: 1240 }}>
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th key={col} style={{ whiteSpace: 'nowrap' }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => {
            const answered = isAnswered(call);
            const [date, time] = call.triggerDatetime.split('T');
            return (
              <tr key={call.rowId}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {date} <span className="text-text-secondary">{time?.slice(0, 5)}</span>
                </td>
                <td className="text-xs text-text-secondary">{call.customerPhoneNumber || '—'}</td>
                <td>{call.brand ? <BrandBadge brand={call.brand} /> : <NotAvailable label="Not confirmed" />}</td>
                <td><NotAvailable /></td>
                <td>{call.src || <NotAvailable />}</td>
                <td className="text-xs text-text-secondary" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {call.landingPageUrl || <NotAvailable />}
                </td>
                <td>{formatDuration(call.callDuration)}</td>
                <td>
                  <span
                    className="badge inline-flex items-center gap-1"
                    style={{ background: answered ? 'var(--v2-green)' : 'var(--v2-red)', color: 'white', fontSize: '11px', padding: '4px 8px' }}
                  >
                    {answered ? <Phone size={12} /> : <PhoneOff size={12} />}
                    {answered ? 'Answered' : 'Missed'}
                  </span>
                </td>
                <td><NotAvailable label="Not connected" /></td>
                <td><NotAvailable label="Not connected" /></td>
                <td><NotAvailable label="Not connected" /></td>
                <td><NotAvailable label="Not connected" /></td>
                <td><NotAvailable label="Not connected" /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
