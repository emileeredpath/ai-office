import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import type { Campaign, CampaignCost, CampaignCostCategory } from '@/types/index';
import type { CampaignGoogleAdsAttribution } from '@/utils/campaignAttribution';
import { getKnownCampaignSpend } from '@/utils/campaignCosts';
import { CAMPAIGN_COST_CATEGORIES } from '@/utils/campaignCostCategories';
import { formatDateShort } from '@/utils/dateUtils';

interface CampaignCostsSectionProps {
  campaign: Campaign;
  campaignCosts: CampaignCost[];
  googleAds: CampaignGoogleAdsAttribution | null;
  addCampaignCost: (cost: Omit<CampaignCost, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCampaignCost: (id: string, updates: Partial<CampaignCost>) => Promise<void>;
  deleteCampaignCost: (id: string) => Promise<void>;
  showToast: (message: string) => void;
}

const EMPTY_FORM = {
  category: CAMPAIGN_COST_CATEGORIES[0],
  description: '',
  amount: '',
  costDate: new Date().toISOString().slice(0, 10),
  supplierReference: '',
  notes: '',
};

const formatCurrency = (value: number) => `£${value.toLocaleString('en-GB', { maximumFractionDigits: 2 })}`;

// The Campaign Costs CRUD workspace — the one place a marketer manually
// records fixed/offline spend (purchased data, print, postage, creative
// production, agency fees, events, sponsorship). Paid media spend from a
// connected platform is never entered here — see the helper text below and
// getKnownCampaignSpend's own doc comment for why the two are summed
// separately rather than one being folded into the other.
export function CampaignCostsSection({ campaign, campaignCosts, googleAds, addCampaignCost, updateCampaignCost, deleteCampaignCost, showToast }: CampaignCostsSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { fixedCosts, mediaSpend, mediaSpendStatus, knownCampaignSpend } = getKnownCampaignSpend(campaignCosts, campaign.id, googleAds);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (cost: CampaignCost) => {
    setForm({
      category: cost.category,
      description: cost.description,
      amount: String(cost.amount),
      costDate: cost.costDate.slice(0, 10),
      supplierReference: cost.supplierReference ?? '',
      notes: cost.notes ?? '',
    });
    setEditingId(cost.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    const amount = Number(form.amount);
    if (!form.description.trim() || !form.costDate || !Number.isFinite(amount) || amount < 0) {
      showToast('Description, a valid amount, and a date are required');
      return;
    }
    const payload = {
      campaignId: campaign.id,
      category: form.category as CampaignCostCategory,
      description: form.description.trim(),
      amount,
      costDate: form.costDate,
      supplierReference: form.supplierReference.trim() || null,
      notes: form.notes.trim() || null,
    };
    if (editingId) {
      await updateCampaignCost(editingId, payload);
      showToast('✓ Cost updated');
    } else {
      await addCampaignCost(payload);
      showToast('✓ Cost added');
    }
    resetForm();
  };

  const handleDelete = async (cost: CampaignCost) => {
    if (!window.confirm(`Delete "${cost.description}" (${formatCurrency(cost.amount)})? This cannot be undone.`)) return;
    await deleteCampaignCost(cost.id);
    showToast('✓ Cost deleted');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="v2-section-title" style={{ marginBottom: 0 }}>Campaign Costs</h3>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary text-sm flex items-center gap-2">
            <Plus size={14} /> Add cost
          </button>
        )}
      </div>

      <p className="text-xs text-text-secondary mb-4">
        Paid media spend from connected platforms such as Google Ads is added automatically and should not be entered here.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="card p-4">
          <div className="text-xs text-text-secondary mb-1">Fixed Costs</div>
          <div className="text-xl font-bold text-text-primary">{formatCurrency(fixedCosts)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-text-secondary mb-1">Media Spend</div>
          <div className="text-xl font-bold text-text-primary">
            {mediaSpendStatus === 'available' ? formatCurrency(mediaSpend) : <span className="v2-not-connected-text">{mediaSpendStatus === 'unmapped' ? 'Unmapped' : 'Not connected'}</span>}
          </div>
          <div className="text-xs text-text-secondary mt-1">Source: Google Ads</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-text-secondary mb-1">Known Campaign Spend</div>
          <div className="text-xl font-bold text-text-primary">{formatCurrency(knownCampaignSpend)}</div>
          <div className="text-xs text-text-secondary mt-1">Fixed costs + connected media spend</div>
        </div>
      </div>

      {showForm && (
        <div className="border rounded-lg p-6 mb-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <h4 className="text-sm font-semibold text-text-primary mb-4">{editingId ? 'Edit Cost' : 'Add Cost'}</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as CampaignCostCategory })} className="input w-full">
                  {CAMPAIGN_COST_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Date</label>
                <input type="date" value={form.costDate} onChange={(e) => setForm({ ...form, costDate: e.target.value })} className="input w-full" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input w-full"
                placeholder="e.g., Education campaign data purchase"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Amount (£)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="input w-full"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Supplier / Reference (optional)</label>
                <input
                  type="text"
                  value={form.supplierReference}
                  onChange={(e) => setForm({ ...form, supplierReference: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., invoice number, supplier name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Notes (optional)</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input w-full text-sm" rows={2} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} className="btn btn-primary flex-1">{editingId ? 'Update Cost' : 'Add Cost'}</button>
              <button onClick={resetForm} className="btn btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {campaignCosts.length > 0 ? (
        <div className="card p-0 overflow-x-auto">
          <table className="table w-full text-sm">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Supplier / Reference</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {campaignCosts.map((cost) => (
                <tr key={cost.id}>
                  <td className="text-text-secondary">{formatDateShort(cost.costDate)}</td>
                  <td className="text-text-primary">{cost.category}</td>
                  <td className="text-text-primary">{cost.description}</td>
                  <td className="text-text-secondary">{cost.supplierReference || '—'}</td>
                  <td style={{ textAlign: 'right' }} className="text-text-primary font-medium">{formatCurrency(cost.amount)}</td>
                  <td>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => startEdit(cost)} className="text-blue-500 hover:text-blue-700" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(cost)} className="text-red-500 hover:text-red-700" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="v2-empty-state">No campaign costs logged yet.</p>
      )}
    </div>
  );
}
