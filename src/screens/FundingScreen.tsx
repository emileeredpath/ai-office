import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/contexts/AuthContext';
import { BRAND_LABEL } from '@/utils/brandColors';
import { Brand, FundingClaimStatus, FundingRecord } from '@/types/index';
import { formatDateShort } from '@/utils/dateUtils';
import { FundingRecordModal } from '@/components/funding/FundingRecordModal';

type BrandFilter = Brand | 'all';
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

  const [filterBrand, setFilterBrand] = useState<BrandFilter>('all');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [modalRecord, setModalRecord] = useState<FundingRecord | null | 'new'>(null);

  useEffect(() => {
    syncFundingRecordsFromApi();
  }, [syncFundingRecordsFromApi]);

  const filteredRecords = useMemo(() => {
    return fundingRecords.filter((r) => {
      if (filterBrand !== 'all' && r.brand !== filterBrand) return false;
      if (filterStatus !== 'all' && r.claimStatus !== filterStatus) return false;
      return true;
    });
  }, [fundingRecords, filterBrand, filterStatus]);

  const summary = useMemo(() => {
    const totalEarned = filteredRecords.reduce((sum, r) => sum + r.amountEarned, 0);
    const totalClaimed = filteredRecords.reduce((sum, r) => sum + r.amountClaimed, 0);
    const totalBalance = filteredRecords.reduce((sum, r) => sum + r.balanceToClaim, 0);
    const pendingClaims = filteredRecords.filter((r) => r.claimStatus === 'eligible' || r.claimStatus === 'submitted').length;
    return { totalEarned, totalClaimed, totalBalance, pendingClaims };
  }, [filteredRecords]);

  const currency = (n: number) => `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-1">Funding</h1>
            <p className="text-text-secondary">Supplier funding, rebates &amp; rewards — e.g. XEVA Rewards</p>
          </div>
          {isEditor && (
            <button onClick={() => setModalRecord('new')} className="btn btn-primary flex items-center gap-2">
              <Plus size={18} />
              Add record
            </button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="card p-4" style={{ textAlign: 'center' }}>
            <div className="text-2xl font-bold text-text-primary">{currency(summary.totalEarned)}</div>
            <div className="text-xs text-text-secondary">Total Earned</div>
          </div>
          <div className="card p-4" style={{ textAlign: 'center' }}>
            <div className="text-2xl font-bold text-text-primary">{currency(summary.totalClaimed)}</div>
            <div className="text-xs text-text-secondary">Total Claimed</div>
          </div>
          <div className="card p-4" style={{ textAlign: 'center' }}>
            <div className="text-2xl font-bold text-text-primary">{currency(summary.totalBalance)}</div>
            <div className="text-xs text-text-secondary">Balance to Claim</div>
          </div>
          <div className="card p-4" style={{ textAlign: 'center' }}>
            <div className="text-2xl font-bold" style={{ color: summary.pendingClaims > 0 ? '#f59e0b' : 'var(--text-primary)' }}>
              {summary.pendingClaims}
            </div>
            <div className="text-xs text-text-secondary">Pending Claims</div>
          </div>
        </div>

        {/* Orange Divider */}
        <div style={{ height: '3px', backgroundColor: '#ff9d3d', marginBottom: '2rem' }} />

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex gap-3 flex-wrap">
            <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value as BrandFilter)} className="input flex-1 min-w-[150px]">
              <option value="all">All brands</option>
              <option value="mtech">MTech</option>
              <option value="brentwood">Brentwood</option>
              <option value="radio-links">Radio Links</option>
              <option value="capcom">Capcom</option>
              <option value="ircl">IRCL</option>
              <option value="idaro">IDARO</option>
            </select>

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

        {/* Table */}
        <div className="card p-4" style={{ overflow: 'auto' }}>
          {filteredRecords.length > 0 ? (
            <table className="table" style={{ width: '100%', minWidth: '980px' }}>
              <thead>
                <tr>
                  <th>Vendor / Scheme</th>
                  <th>Brand</th>
                  <th>Rebate Type</th>
                  <th style={{ textAlign: 'right' }}>Rebate %</th>
                  <th style={{ textAlign: 'right' }}>Total Purchases</th>
                  <th style={{ textAlign: 'right' }}>Earned</th>
                  <th style={{ textAlign: 'right' }}>Claimed</th>
                  <th style={{ textAlign: 'right' }}>Balance</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th style={{ textAlign: 'right' }}>% of Target</th>
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
                    <td className="text-sm text-text-secondary" style={{ textTransform: 'capitalize' }}>{r.rebateType.replace('-', ' ')}</td>
                    <td style={{ textAlign: 'right' }}>{r.rebatePercent !== null ? `${r.rebatePercent}%` : '—'}</td>
                    <td style={{ textAlign: 'right' }}>{currency(r.totalPurchases)}</td>
                    <td style={{ textAlign: 'right' }}>{currency(r.amountEarned)}</td>
                    <td style={{ textAlign: 'right' }}>{currency(r.amountClaimed)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{currency(r.balanceToClaim)}</td>
                    <td>
                      <span className="badge" style={{ ...CLAIM_STATUS_STYLE[r.claimStatus], fontSize: '11px' }}>
                        {CLAIM_STATUS_LABEL[r.claimStatus]}
                      </span>
                    </td>
                    <td className="text-sm">{r.claimDeadline ? formatDateShort(r.claimDeadline) : '—'}</td>
                    <td style={{ textAlign: 'right' }}>{r.percentOfTarget !== null ? `${r.percentOfTarget.toFixed(0)}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-text-secondary p-4">No funding records yet.</p>
          )}
        </div>
      </div>

      {modalRecord !== null && (
        <FundingRecordModal record={modalRecord === 'new' ? null : modalRecord} onClose={() => setModalRecord(null)} />
      )}
    </div>
  );
}
