import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/contexts/AuthContext';
import { useEntity, ENTITY_OPTIONS } from '@/contexts/EntityContext';
import { KpiCard } from '@/components/common/KpiCard';
import { BRAND_LABEL } from '@/utils/brandColors';
import { FundingClaimStatus, FundingRecord } from '@/types/index';
import { formatDateShort } from '@/utils/dateUtils';
import { FundingRecordModal } from '@/components/funding/FundingRecordModal';

type StatusFilter = FundingClaimStatus | 'all';

const CLAIM_STATUS_STYLE: Record<FundingClaimStatus, { background: string; color: string }> = {
  eligible: { background: '#3b82f6', color: 'white' },
  submitted: { background: '#f59e0b', color: 'white' },
  approved: { background: '#8b5cf6', color: 'white' },
  paid: { background: '#10b981', color: 'white' },
  rejected: { background: '#ef4444', color: 'white' },
};

const CLAIM_STATUS_LABEL: Record<FundingClaimStatus, string> = {
  eligible: 'Eligible',
  submitted: 'Submitted',
  approved: 'Approved',
  paid: 'Paid',
  rejected: 'Rejected',
};

export function FundingScreen() {
  const fundingRecords = useAppStore((s) => s.fundingRecords);
  const syncFundingRecordsFromApi = useAppStore((s) => s.syncFundingRecordsFromApi);
  const { isEditor } = useAuth();
  const { isGroupView, selectedEntity, matchesSelectedEntity } = useEntity();

  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [modalRecord, setModalRecord] = useState<FundingRecord | null | 'new'>(null);

  useEffect(() => {
    syncFundingRecordsFromApi();
  }, [syncFundingRecordsFromApi]);

  const entityLabel = ENTITY_OPTIONS.find((o) => o.value === selectedEntity)?.label ?? selectedEntity;

  const filteredRecords = useMemo(() => {
    return fundingRecords.filter((r) => {
      if (!matchesSelectedEntity(r.brand)) return false;
      if (filterStatus !== 'all' && r.claimStatus !== filterStatus) return false;
      return true;
    });
  }, [fundingRecords, selectedEntity, filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const summary = useMemo(() => {
    const totalEarned = filteredRecords.reduce((sum, r) => sum + r.amountEarned, 0);
    const totalClaimed = filteredRecords.reduce((sum, r) => sum + r.amountClaimed, 0);
    const totalBalance = filteredRecords.reduce((sum, r) => sum + r.balanceToClaim, 0);
    const pendingClaims = filteredRecords.filter((r) => r.claimStatus === 'eligible' || r.claimStatus === 'submitted').length;
    return { totalEarned, totalClaimed, totalBalance, pendingClaims };
  }, [filteredRecords]);

  const currency = (n: number) => `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="v2-page funding-page">
      <div className="max-w-7xl mx-auto funding-page-inner">
        <div className="v2-page-header">
          <div>
            <p className="funding-page-eyebrow">Supplier funding</p>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Funding</h1>
            <p className="text-text-secondary">
              {isGroupView ? 'Supplier funding, rebates & rewards across MTech Group' : `Showing ${entityLabel}`}
            </p>
          </div>
          {isEditor && (
            <button onClick={() => setModalRecord('new')} className="btn btn-primary flex items-center gap-2">
              <Plus size={18} />
              Add record
            </button>
          )}
        </div>

        <div className="mb-8">
          <h2 className="v2-section-title">Funding position</h2>
          <p className="text-sm text-text-secondary mb-4">
            Manually logged supplier funding records for the selected entity and claim status.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard title="Total Earned" value={currency(summary.totalEarned)} subtitle="Manually logged funding records" />
            <KpiCard title="Total Claimed" value={currency(summary.totalClaimed)} subtitle="Manually logged funding records" />
            <KpiCard title="Balance to Claim" value={currency(summary.totalBalance)} subtitle="Manually logged funding records" />
            <KpiCard
              title="Pending Claims"
              value={summary.pendingClaims}
              subtitle="Eligible or submitted"
              accent={summary.pendingClaims > 0 ? 'var(--v2-orange)' : 'var(--v2-purple)'}
            />
          </div>
        </div>

        <div className="card funding-toolbar mb-6">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Funding records</h2>
            <p className="text-xs text-text-secondary">Open a record to see rebate mechanics, purchases and target progress.</p>
          </div>
          <div className="funding-filter">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as StatusFilter)} className="input flex-1 min-w-[150px]">
              <option value="all">All claim statuses</option>
              <option value="eligible">Eligible</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="card funding-register" style={{ overflow: 'auto' }}>
          {filteredRecords.length > 0 ? (
            <table className="table" style={{ width: '100%', minWidth: '760px' }}>
              <thead>
                <tr>
                  <th>Vendor / Scheme</th>
                  <th>Entity</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Earned</th>
                  <th style={{ textAlign: 'right' }}>Claimed</th>
                  <th style={{ textAlign: 'right' }}>Balance</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r) => (
                  <tr key={r.id} onClick={() => setModalRecord(r)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="font-medium text-text-primary">{r.vendor}</div>
                      <div className="text-xs text-text-secondary">{r.schemeName}</div>
                    </td>
                    <td className="text-sm text-text-secondary">{BRAND_LABEL[r.brand] || r.brand}</td>
                    <td>
                      <span className="badge" style={{ ...CLAIM_STATUS_STYLE[r.claimStatus], fontSize: '11px' }}>
                        {CLAIM_STATUS_LABEL[r.claimStatus]}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>{currency(r.amountEarned)}</td>
                    <td style={{ textAlign: 'right' }}>{currency(r.amountClaimed)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{currency(r.balanceToClaim)}</td>
                    <td className="text-sm">{r.claimDeadline ? formatDateShort(r.claimDeadline) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-text-secondary p-4">
              No funding records{isGroupView ? '' : ` for ${entityLabel}`}{filterStatus !== 'all' ? ' matching this status' : ''}.
            </p>
          )}
        </div>
      </div>

      {modalRecord !== null && (
        <FundingRecordModal record={modalRecord === 'new' ? null : modalRecord} onClose={() => setModalRecord(null)} />
      )}
    </div>
  );
}
