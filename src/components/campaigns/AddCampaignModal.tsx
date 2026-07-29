import { X } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Campaign, Brand, CampaignStatus } from '@/types/index';
import { BRAND_COLOR as BRAND_COLOURS } from '@/utils/brandColors';

interface AddCampaignModalProps {
  onClose: () => void;
}

export function AddCampaignModal({ onClose }: AddCampaignModalProps) {
  const addCampaign = useAppStore((s) => s.addCampaign);

  const [formData, setFormData] = useState({
    name: '',
    brand: 'brentwood' as Brand,
    primaryIndustry: '',
    secondaryIndustry: '',
    theme: '',
    status: 'planning' as CampaignStatus,
    startDate: '',
    endDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Campaign name is required');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      alert('Start and end dates are required');
      return;
    }

    const newCampaign: Campaign = {
      id: 'campaign-' + Date.now(),
      name: formData.name,
      brand: formData.brand,
      entities: [formData.brand],
      primaryIndustry: formData.primaryIndustry,
      secondaryIndustry: formData.secondaryIndustry,
      theme: formData.theme,
      status: formData.status,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      budget: null,
      spend: 0,
      conversions: 0,
      leads: 0,
      engagement: 0,
      colour: BRAND_COLOURS[formData.brand],
      tasks: [],
      reactive: false,
      notes: '',
      results: null,
    };

    addCampaign(newCampaign);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">New Campaign</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Campaign name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter campaign name"
              className="input"
              autoFocus
            />
          </div>

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
            <label className="block text-sm font-medium text-text-secondary mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as CampaignStatus })}
              className="input"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Start date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">End date *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Primary industry</label>
            <input
              type="text"
              value={formData.primaryIndustry}
              onChange={(e) => setFormData({ ...formData, primaryIndustry: e.target.value })}
              placeholder="e.g. B2B Communications"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Theme</label>
            <input
              type="text"
              value={formData.theme}
              onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
              placeholder="e.g. Performance optimisation"
              className="input"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" className="btn btn-primary flex-1">
              Create Campaign
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
