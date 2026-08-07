import { X, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { nanoid } from 'nanoid';
import { useAppStore } from '@/store/useAppStore';
import { Brand, FundingRecord, FundingRebateType, FundingClaimStatus, FundingBonusTier } from '@/types/index';

interface FundingRecordModalProps {
  record: FundingRecord | null;
  onClose: () => void;
}

const REBATE_TYPE_LABEL: Record<FundingRebateType, string> = {
  'marketing-rebate': 'Marketing Rebate',
  'loyalty-rebate': 'Loyalty Rebate',
  'loyalty-bonus': 'Loyalty Bonus',
  other: 'Other',
};

const CLAIM_STATUS_LABEL: Record<FundingClaimStatus, string> = {
  eligible: 'Eligible',
  submitted: 'Submitted',
  approved: 'Approved',
  paid: 'Paid',
  rejected: 'Rejected',
};

export function FundingRecordModal({ record, onClose }: FundingRecordModalProps) {
  const addFundingRecord = useAppStore((s) => s.addFundingRecord);
  const updateFundingRecord = useAppStore((s) => s.updateFundingRecord);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    brand: (record?.brand ?? 'mtech') as Brand,
    vendor: record?.vendor ?? '',
    schemeName: record?.schemeName ?? '',
    rebateType: (record?.rebateType ?? 'other') as FundingRebateType,
    rebatePercent: record?.rebatePercent?.toString() ?? '',
    totalPurchases: record?.totalPurchases?.toString() ?? '0',
    amountEarned: record?.amountEarned?.toString() ?? '0',
    amountClaimed: record?.amountClaimed?.toString() ?? '0',
    claimStatus: (record?.claimStatus ?? 'eligible') as FundingClaimStatus,
    claimDeadline: record?.claimDeadline ?? '',
    creditedFrequency: record?.creditedFrequency ?? '',
    targetSpend: record?.targetSpend?.toString() ?? '',
    period: record?.period ?? '',
    notes: record?.notes ?? '',
  });

  const [bonusTiers, setBonusTiers] = useState<FundingBonusTier[]>(record?.bonusTiers ?? []);

  const addTier = () => {
    setBonusTiers((prev) => [...prev, { id: `tier-${nanoid(8)}`, threshold: 0, bonusRate: null, bonusAmount: null, description: '' }]);
  };

  const updateTier = (id: string, updates: Partial<FundingBonusTier>) => {
    setBonusTiers((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const removeTier = (id: string) => {
    setBonusTiers((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vendor.trim() || !formData.schemeName.trim()) {
      alert('Vendor and scheme name are required');
      return;
    }

    const payload = {
      brand: formData.brand,
      vendor: formData.vendor.trim(),
      schemeName: formData.schemeName.trim(),
      rebateType: formData.rebateType,
      rebatePercent: formData.rebatePercent ? Number(formData.rebatePercent) : null,
      totalPurchases: Number(formData.totalPurchases) || 0,
      amountEarned: Number(formData.amountEarned) || 0,
      amountClaimed: Number(formData.amountClaimed) || 0,
      claimStatus: formData.claimStatus,
      claimDeadline: formData.claimDeadline || null,
      creditedFrequency: formData.creditedFrequency.trim(),
      targetSpend: formData.targetSpend ? Number(formData.targetSpend) : null,
      period: formData.period.trim(),
      bonusTiers,
      notes: formData.notes,
    };

    setIsSaving(true);
    try {
      if (record) {
        await updateFundingRecord(record.id, payload);
      } else {
        await addFundingRecord(payload);
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{record ? 'Edit Funding Record' : 'Add Funding Record'}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Brand</label>
              <select
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value as Brand })}
                className="input"
              >
                <option value="mtech">MTech</option>
                <option value="brentwood">Brentwood</option>
                <option value="radio-links">Radio Links</option>
                <option value="capcom">Capcom</option>
                <option value="ircl">IRCL</option>
                <option value="idaro">IDARO</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Vendor *</label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="e.g. XEVA"
                className="input"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Scheme name *</label>
            <input
              type="text"
              value={formData.schemeName}
              onChange={(e) => setFormData({ ...formData, schemeName: e.target.value })}
              placeholder="e.g. XEVA Rewards"
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Rebate type</label>
              <select
                value={formData.rebateType}
                onChange={(e) => setFormData({ ...formData, rebateType: e.target.value as FundingRebateType })}
                className="input"
              >
                {(Object.keys(REBATE_TYPE_LABEL) as FundingRebateType[]).map((t) => (
                  <option key={t} value={t}>{REBATE_TYPE_LABEL[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Rebate %</label>
              <input
                type="number"
                value={formData.rebatePercent}
                onChange={(e) => setFormData({ ...formData, rebatePercent: e.target.value })}
                placeholder="Not set"
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Total purchases (£)</label>
              <input
                type="number"
                value={formData.totalPurchases}
                onChange={(e) => setFormData({ ...formData, totalPurchases: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Amount earned (£)</label>
              <input
                type="number"
                value={formData.amountEarned}
                onChange={(e) => setFormData({ ...formData, amountEarned: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Amount claimed (£)</label>
              <input
                type="number"
                value={formData.amountClaimed}
                onChange={(e) => setFormData({ ...formData, amountClaimed: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Claim status</label>
              <select
                value={formData.claimStatus}
                onChange={(e) => setFormData({ ...formData, claimStatus: e.target.value as FundingClaimStatus })}
                className="input"
              >
                {(Object.keys(CLAIM_STATUS_LABEL) as FundingClaimStatus[]).map((s) => (
                  <option key={s} value={s}>{CLAIM_STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Claim deadline</label>
              <input
                type="date"
                value={formData.claimDeadline}
                onChange={(e) => setFormData({ ...formData, claimDeadline: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Credited frequency</label>
              <input
                type="text"
                value={formData.creditedFrequency}
                onChange={(e) => setFormData({ ...formData, creditedFrequency: e.target.value })}
                placeholder="e.g. Quarterly, Auto"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Target spend (£)</label>
              <input
                type="number"
                value={formData.targetSpend}
                onChange={(e) => setFormData({ ...formData, targetSpend: e.target.value })}
                placeholder="Not set"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Period</label>
            <input
              type="text"
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
              placeholder="e.g. Q3 2026"
              className="input"
            />
          </div>

          {/* Bonus tiers */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-text-secondary">Bonus tiers</label>
              <button type="button" onClick={addTier} className="text-xs flex items-center gap-1 text-accent">
                <Plus size={14} /> Add tier
              </button>
            </div>
            {bonusTiers.length > 0 && (
              <div className="space-y-2">
                {bonusTiers.map((tier) => (
                  <div key={tier.id} className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={tier.threshold}
                      onChange={(e) => updateTier(tier.id, { threshold: Number(e.target.value) })}
                      placeholder="Threshold (£)"
                      className="input flex-1"
                      style={{ minWidth: 0 }}
                    />
                    <input
                      type="number"
                      value={tier.bonusRate ?? ''}
                      onChange={(e) => updateTier(tier.id, { bonusRate: e.target.value ? Number(e.target.value) : null })}
                      placeholder="Bonus %"
                      className="input flex-1"
                      style={{ minWidth: 0 }}
                    />
                    <button type="button" onClick={() => removeTier(tier.id)} className="text-red-500 flex-shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes..."
              className="input"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" disabled={isSaving} className="btn btn-primary flex-1 disabled:opacity-60">
              {isSaving ? 'Saving…' : record ? 'Save Changes' : 'Add Record'}
            </button>
            <button type="button" onClick={onClose} disabled={isSaving} className="btn btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
