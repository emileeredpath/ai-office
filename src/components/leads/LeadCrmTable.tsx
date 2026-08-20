import { Database } from 'lucide-react';

const COLUMNS = [
  'Lead / Company',
  'Entity',
  'Campaign',
  'Campaign Code',
  'Source',
  'Created Date',
  'Status',
  'Opportunity',
  'Pipeline Value',
  'Won Revenue',
];

interface LeadCrmTableProps {
  onViewPerformance?: () => void;
}

// The integration-ready shell for the future CRM lead table. There is no
// lead-level data model in this app today (only a campaign-level leads
// count — see campaignMetrics.ts) so this deliberately shows the real
// future column headers with a polished empty state instead of any rows.
// No sample/fake leads, ever.
export function LeadCrmTable({ onViewPerformance }: LeadCrmTableProps) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', minWidth: 980 }}>
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
                <p className="v2-crm-empty-title">CRM lead records are not connected yet</p>
                <p className="v2-crm-empty-subtitle">
                  Acumatica will provide lead, opportunity, pipeline and won revenue data here once connected.
                </p>
                <p className="v2-crm-empty-note">
                  Marketing Leads are currently logged as campaign-level totals rather than individual CRM records.
                </p>
                {onViewPerformance && (
                  <button className="btn btn-secondary" onClick={onViewPerformance} style={{ marginTop: 4 }}>
                    View campaign performance
                  </button>
                )}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
