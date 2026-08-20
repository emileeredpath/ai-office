import { Target } from 'lucide-react';

const COLUMNS = [
  'PPC Campaign',
  'Entity',
  'Spend',
  'Clicks',
  'Conversions',
  'Marketing Leads',
  'Cost per Lead',
  'Opportunities',
  'Pipeline',
  'Won Revenue',
  'ROAS',
];

// Integration-ready shell for the future PPC campaign performance table.
// There is no Google Ads campaign data and no CRM attribution today, so
// this shows the genuine future column set with a polished empty state
// instead of any sample/fake rows.
export function PpcCampaignTable() {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', minWidth: 1080 }}>
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
                <Target size={28} color="var(--v2-grey)" />
                <p className="v2-crm-empty-title">Campaign performance will populate once Google Ads is connected</p>
                <p className="v2-crm-empty-subtitle">
                  Spend, Clicks, Conversions and campaign identity will come from Google Ads. Marketing Leads, Cost
                  per Lead, Opportunities, Pipeline, Won Revenue and ROAS additionally require CRM attribution from
                  Acumatica.
                </p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
