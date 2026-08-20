import { Phone, PhoneOff, Database, Users } from 'lucide-react';
import type { Wave1CallData } from '@/store/useAppStore';

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

interface CallLogTableProps {
  calls: Wave1CallData[];
  infinityConfigured: boolean;
  isGroupView: boolean;
}

// The V2 call log carries the full future column set, but only populates
// what real Infinity data genuinely supports today (Date/Time, Caller,
// Duration, Status) — Entity, Campaign, Source and Landing Page are
// deliberately never guessed from the raw Infinity campaign string or
// caller number, and Qualified/Lead/Opportunity/Pipeline/Won Revenue stay
// "Not connected" until qualification and CRM attribution exist.
export function CallLogTable({ calls, infinityConfigured, isGroupView }: CallLogTableProps) {
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
                    Infinity will provide real call activity here once connected. Entity, campaign, source and
                    landing-page attribution, and CRM outcomes from Acumatica, will follow once that mapping exists.
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (!isGroupView) {
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
                  <p className="v2-crm-empty-title">Entity-level call attribution isn't available yet</p>
                  <p className="v2-crm-empty-subtitle">
                    Infinity's call data isn't mapped to an MTech entity today. Switch to MTech Group to see combined
                    call activity, or wait for entity mapping to be built during the integrations phase.
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
          {calls.map((call) => (
            <tr key={call.id}>
              <td style={{ whiteSpace: 'nowrap' }}>
                {call.date} <span className="text-text-secondary">{call.time}</span>
              </td>
              <td className="text-xs text-text-secondary">{call.callerNumber}</td>
              <td><NotAvailable /></td>
              <td><NotAvailable /></td>
              <td><NotAvailable /></td>
              <td><NotAvailable /></td>
              <td>{call.duration}</td>
              <td>
                <span
                  className="badge inline-flex items-center gap-1"
                  style={{ background: call.answered ? 'var(--v2-green)' : 'var(--v2-red)', color: 'white', fontSize: '11px', padding: '4px 8px' }}
                >
                  {call.answered ? <Phone size={12} /> : <PhoneOff size={12} />}
                  {call.answered ? 'Answered' : 'Missed'}
                </span>
              </td>
              <td><NotAvailable label="Not connected" /></td>
              <td><NotAvailable label="Not connected" /></td>
              <td><NotAvailable label="Not connected" /></td>
              <td><NotAvailable label="Not connected" /></td>
              <td><NotAvailable label="Not connected" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
