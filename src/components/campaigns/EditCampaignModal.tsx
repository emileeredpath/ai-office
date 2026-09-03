import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Campaign, Brand, CampaignStatus, Vendor, ClaimStatus } from '@/types/index';

interface EditCampaignModalProps {
  campaign: Campaign;
  onClose: () => void;
}

const toDateInput = (d: Date) => {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

// Consolidates what used to be three separate editable panel tabs
// (Overview, Funding, and the create-campaign fields) into one explicit
// "Edit Campaign" action, so viewing a campaign no longer defaults to a
// form. Same fields, same updateCampaign() call, same validation —
// relocated, not rebuilt.
export function EditCampaignModal({ campaign, onClose }: EditCampaignModalProps) {
  const updateCampaign = useAppStore((s) => s.updateCampaign);

  const [name, setName] = useState(campaign.name);
  const [brand, setBrand] = useState<Brand>(campaign.brand);
  const [status, setStatus] = useState<CampaignStatus>(campaign.status);
  const [startDate, setStartDate] = useState(toDateInput(campaign.startDate));
  const [endDate, setEndDate] = useState(toDateInput(campaign.endDate));
  const [primaryIndustry, setPrimaryIndustry] = useState(campaign.primaryIndustry || '');
  const [secondaryIndustry, setSecondaryIndustry] = useState(campaign.secondaryIndustry || '');
  const [theme, setTheme] = useState(campaign.theme || '');

  const [budget, setBudget] = useState(campaign.budget?.toString() ?? '');
  const [spend, setSpend] = useState(campaign.spend?.toString() ?? '');
  const [valueGenerated, setValueGenerated] = useState(campaign.valueGenerated?.toString() ?? '');
  const [leads, setLeads] = useState(campaign.leads?.toString() ?? '');

  const [vendor, setVendor] = useState<Vendor | ''>(campaign.vendor || '');
  const [scheme, setScheme] = useState(campaign.scheme || '');
  const [cofundRate, setCofundRate] = useState(campaign.cofundRate?.toString() ?? '');
  const [claimStatus, setClaimStatus] = useState<ClaimStatus | ''>(campaign.claimStatus || '');

  // Central campaign-attribution identifiers — see
  // src/utils/campaignAttribution.ts. campaignCode is a pure reference
  // field today (nothing matches against it yet); googleAdsCampaignIds is
  // entered as a comma-separated list of real Google Ads campaign.id
  // values (visible in the Google Ads UI/API — never guessed) and powers
  // genuine deterministic Google Ads attribution on this campaign's
  // Performance tab.
  const [campaignCode, setCampaignCode] = useState(campaign.campaignCode || '');
  const [googleAdsCampaignIdsText, setGoogleAdsCampaignIdsText] = useState((campaign.googleAdsCampaignIds || []).join(', '));
  // Comma-separated exact GA4 sessionCampaignName value(s) — never
  // auto-filled from the campaign name above, since GA4's real campaign
  // name (however it got tagged) isn't guaranteed to match how this app
  // names the campaign. See getCampaignGa4Attribution's doc comment.
  const [ga4CampaignNamesText, setGa4CampaignNamesText] = useState((campaign.ga4CampaignNames || []).join(', '));

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Campaign name is required');
      return;
    }
    if (!startDate || !endDate) {
      alert('Start and end dates are required');
      return;
    }

    setSaving(true);
    await updateCampaign(campaign.id, {
      name,
      brand,
      status,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      primaryIndustry,
      secondaryIndustry,
      theme,
      budget: budget ? Number(budget) : null,
      spend: spend ? Number(spend) : 0,
      valueGenerated: valueGenerated ? Number(valueGenerated) : null,
      leads: leads ? Number(leads) : 0,
      vendor: (vendor || null) as Vendor | null,
      scheme: scheme || '',
      cofundRate: cofundRate ? Number(cofundRate) : null,
      claimStatus: (claimStatus || null) as ClaimStatus | null,
      campaignCode: campaignCode.trim() || null,
      googleAdsCampaignIds: googleAdsCampaignIdsText
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0),
      ga4CampaignNames: ga4CampaignNamesText
        .split(',')
        .map((n) => n.trim())
        .filter((n) => n.length > 0),
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ zIndex: 200 }}>
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Edit Campaign</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary" type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="v2-section-title" style={{ marginBottom: 4 }}>Details</h3>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Campaign name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Entity</label>
                <select value={brand} onChange={(e) => setBrand(e.target.value as Brand)} className="input">
                  <option value="mtech">MTech</option>
                  <option value="brentwood">Brentwood</option>
                  <option value="radio-links">Radio Links</option>
                  <option value="capcom">Capcom</option>
                  <option value="ircl">IRCL</option>
                  <option value="idaro">IDARO</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as CampaignStatus)} className="input">
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Start date *</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">End date *</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Primary industry</label>
                <input type="text" value={primaryIndustry} onChange={(e) => setPrimaryIndustry(e.target.value)} className="input" placeholder="e.g. B2B Communications" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Secondary industry</label>
                <input type="text" value={secondaryIndustry} onChange={(e) => setSecondaryIndustry(e.target.value)} className="input" placeholder="e.g. Digital Marketing" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Theme</label>
              <input type="text" value={theme} onChange={(e) => setTheme(e.target.value)} className="input" placeholder="e.g. Performance optimisation" />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="v2-section-title" style={{ marginBottom: 4 }}>Attribution</h3>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Campaign code</label>
              <input type="text" value={campaignCode} onChange={(e) => setCampaignCode(e.target.value)} className="input" placeholder="Internal reference only — not yet matched against any integration" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Google Ads campaign ID(s)</label>
              <input
                type="text"
                value={googleAdsCampaignIdsText}
                onChange={(e) => setGoogleAdsCampaignIdsText(e.target.value)}
                className="input"
                placeholder="e.g. 1234567890, 9876543210"
              />
              <p className="text-xs text-text-secondary mt-1">
                Comma-separated real Google Ads campaign IDs (from the Google Ads UI or API). Every Google Ads campaign
                with a matching ID will be attributed to this campaign on the Performance tab below.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">GA4 campaign name(s)</label>
              <input
                type="text"
                value={ga4CampaignNamesText}
                onChange={(e) => setGa4CampaignNamesText(e.target.value)}
                className="input"
                placeholder="e.g. MTech IRCL - Education Solutions - Brought Data - NI"
              />
              <p className="text-xs text-text-secondary mt-1">
                Comma-separated exact GA4 campaign name(s), as they genuinely appear in GA4's own Traffic Acquisition
                report for this entity (never guessed from the campaign name above — check GA4 directly). Matched
                exactly, case-insensitive, never a partial match.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="v2-section-title" style={{ marginBottom: 4 }}>Performance & Value</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Budget (£)</label>
                <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className="input" placeholder="Not set" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Actual spend (£)</label>
                <input type="number" value={spend} onChange={(e) => setSpend(e.target.value)} className="input" placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Value generated (£)</label>
                <input type="number" value={valueGenerated} onChange={(e) => setValueGenerated(e.target.value)} className="input" placeholder="Not logged" />
                <p className="text-xs text-text-secondary mt-1">Used to calculate ROI on the Overview tab. Leave blank until a real value has been logged.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Marketing leads</label>
                <input type="number" value={leads} onChange={(e) => setLeads(e.target.value)} className="input" placeholder="0" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="v2-section-title" style={{ marginBottom: 4 }}>Funding</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Vendor</label>
                <select value={vendor} onChange={(e) => setVendor(e.target.value as Vendor | '')} className="input">
                  <option value="">None</option>
                  <option value="motorola">Motorola</option>
                  <option value="hytera">Hytera</option>
                  <option value="airsys">Airsys</option>
                  <option value="telox">Telox</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Claim status</label>
                <select value={claimStatus} onChange={(e) => setClaimStatus(e.target.value as ClaimStatus | '')} className="input">
                  <option value="">Not set</option>
                  <option value="eligible">Eligible</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Scheme</label>
                <input type="text" value={scheme} onChange={(e) => setScheme(e.target.value)} className="input" placeholder="e.g. XEVA Marketing Funds" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Co-fund % (0–100)</label>
                <input type="number" min="0" max="100" value={cofundRate} onChange={(e) => setCofundRate(e.target.value)} className="input" placeholder="0" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
