import { useState } from 'react';
import { X } from 'lucide-react';
import { Campaign, CampaignResults } from '@/types/index';

interface LogResultsModalProps {
  campaign: Campaign;
  onSave: (campaignId: string, results: CampaignResults) => void;
  onClose: () => void;
}

// Same "Log results" fields/behaviour the old campaign cards had inline —
// moved into a modal (opened from the row overflow menu) so the table stays
// scannable. Pre-fills from campaign.results, same as before.
export function LogResultsModal({ campaign, onSave, onClose }: LogResultsModalProps) {
  const existing = campaign.results;
  const [form, setForm] = useState({
    emailOpenRate: existing?.emailOpenRate != null ? String(existing.emailOpenRate) : '',
    emailClickRate: existing?.emailClickRate != null ? String(existing.emailClickRate) : '',
    unsubscribes: existing?.unsubscribes != null ? String(existing.unsubscribes) : '',
    landingPageVisits: existing?.landingPageVisits != null ? String(existing.landingPageVisits) : '',
    enquiriesReceived: existing?.enquiriesReceived != null ? String(existing.enquiriesReceived) : '',
    costToSend: existing?.costToSend != null ? String(existing.costToSend) : '',
    notes: existing?.notes || '',
  });

  const handleSave = () => {
    const toNumberOrNull = (v: string) => (v.trim() === '' ? null : Number(v));
    onSave(campaign.id, {
      emailOpenRate: toNumberOrNull(form.emailOpenRate),
      emailClickRate: toNumberOrNull(form.emailClickRate),
      unsubscribes: toNumberOrNull(form.unsubscribes),
      landingPageVisits: toNumberOrNull(form.landingPageVisits),
      enquiriesReceived: toNumberOrNull(form.enquiriesReceived),
      costToSend: toNumberOrNull(form.costToSend),
      notes: form.notes,
      loggedAt: new Date(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ zIndex: 200 }} onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{existing ? 'Edit Results' : 'Log Results'} — {campaign.name}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary" type="button">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Email open rate (%)</label>
              <input type="number" value={form.emailOpenRate} onChange={(e) => setForm({ ...form, emailOpenRate: e.target.value })} className="input text-sm" />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Email click rate (%)</label>
              <input type="number" value={form.emailClickRate} onChange={(e) => setForm({ ...form, emailClickRate: e.target.value })} className="input text-sm" />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Unsubscribes</label>
              <input type="number" value={form.unsubscribes} onChange={(e) => setForm({ ...form, unsubscribes: e.target.value })} className="input text-sm" />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Landing page visits</label>
              <input type="number" value={form.landingPageVisits} onChange={(e) => setForm({ ...form, landingPageVisits: e.target.value })} className="input text-sm" />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Enquiries received</label>
              <input type="number" value={form.enquiriesReceived} onChange={(e) => setForm({ ...form, enquiriesReceived: e.target.value })} className="input text-sm" />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Cost to send (£)</label>
              <input type="number" value={form.costToSend} onChange={(e) => setForm({ ...form, costToSend: e.target.value })} className="input text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">Notes / what worked</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input text-sm" rows={3} />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} className="btn btn-primary flex-1">
              Save results
            </button>
            <button onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
