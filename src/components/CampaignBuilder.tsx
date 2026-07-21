import { useState, useMemo } from 'react';
import { getEmailManagerHelp, type CampaignBrief, type EmailVariant } from '@/services/emailManagerService';

interface Campaign {
  id: string;
  brief: CampaignBrief;
  emailVariants: EmailVariant[];
  selectedVariant: string | null;
  status: 'draft' | 'ready' | 'launched';
  createdAt: Date;
}

export function CampaignBuilder() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state for new campaign
  const [formData, setFormData] = useState({
    name: '',
    objective: '',
    targetAudience: '',
    timeline: '',
    successMetric: '',
    keyMessages: '',
  });

  const [emailRequest, setEmailRequest] = useState('');

  const selectedCampaign = useMemo(() => campaigns.find((c) => c.id === selectedCampaignId), [campaigns, selectedCampaignId]);

  const handleCreateCampaign = () => {
    if (!formData.name.trim() || !formData.objective.trim()) return;

    const newCampaign: Campaign = {
      id: `campaign-${Date.now()}`,
      brief: {
        name: formData.name,
        objective: formData.objective,
        targetAudience: formData.targetAudience,
        timeline: formData.timeline,
        successMetric: formData.successMetric,
        keyMessages: formData.keyMessages
          .split('\n')
          .map((m) => m.trim())
          .filter((m) => m),
      },
      emailVariants: [],
      selectedVariant: null,
      status: 'draft',
      createdAt: new Date(),
    };

    setCampaigns((prev) => [...prev, newCampaign]);
    setSelectedCampaignId(newCampaign.id);
    setFormData({ name: '', objective: '', targetAudience: '', timeline: '', successMetric: '', keyMessages: '' });
    setShowNewCampaign(false);
  };

  const handleGetEmailHelp = async () => {
    if (!selectedCampaign || !emailRequest.trim()) return;

    setLoading(true);
    try {
      const response = await getEmailManagerHelp(selectedCampaign.brief, emailRequest);

      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === selectedCampaignId
            ? {
                ...c,
                emailVariants: response.variants,
                selectedVariant: response.variants[0]?.id || null,
              }
            : c
        )
      );

      setEmailRequest('');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVariant = (variantId: string) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === selectedCampaignId
          ? {
              ...c,
              selectedVariant: variantId,
            }
          : c
      )
    );
  };

  const handleLaunchCampaign = () => {
    if (!selectedCampaign) return;

    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === selectedCampaignId
          ? {
              ...c,
              status: 'launched',
            }
          : c
      )
    );
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Campaign Builder
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Build full email campaigns with expert guidance
            </p>
          </div>
          <button
            onClick={() => setShowNewCampaign(!showNewCampaign)}
            className="px-4 py-2 rounded-lg font-medium text-sm"
            style={{
              backgroundColor: 'var(--accent-orange)',
              color: 'white',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {showNewCampaign ? '✕ Cancel' : '+ New Campaign'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Campaign List */}
          <div className="col-span-1">
            <h2 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Campaigns ({campaigns.length})
            </h2>

            {showNewCampaign && (
              <div className="p-4 mb-4 rounded-lg space-y-3" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
                <input
                  type="text"
                  placeholder="Campaign name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded text-sm"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-color)',
                    border: '1px solid',
                    color: 'var(--text-primary)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Objective"
                  value={formData.objective}
                  onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                  className="w-full px-3 py-2 rounded text-sm"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-color)',
                    border: '1px solid',
                    color: 'var(--text-primary)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Target audience"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  className="w-full px-3 py-2 rounded text-sm"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-color)',
                    border: '1px solid',
                    color: 'var(--text-primary)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Timeline (e.g., 30 days)"
                  value={formData.timeline}
                  onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                  className="w-full px-3 py-2 rounded text-sm"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-color)',
                    border: '1px solid',
                    color: 'var(--text-primary)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Success metric (e.g., 100 leads)"
                  value={formData.successMetric}
                  onChange={(e) => setFormData({ ...formData, successMetric: e.target.value })}
                  className="w-full px-3 py-2 rounded text-sm"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-color)',
                    border: '1px solid',
                    color: 'var(--text-primary)',
                  }}
                />
                <textarea
                  placeholder="Key messages (one per line)"
                  value={formData.keyMessages}
                  onChange={(e) => setFormData({ ...formData, keyMessages: e.target.value })}
                  className="w-full px-3 py-2 rounded text-sm"
                  rows={3}
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-color)',
                    border: '1px solid',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  onClick={handleCreateCampaign}
                  className="w-full px-3 py-2 rounded text-sm font-medium"
                  style={{
                    backgroundColor: 'var(--accent-orange)',
                    color: 'white',
                  }}
                >
                  Create Campaign
                </button>
              </div>
            )}

            <div className="space-y-2">
              {campaigns.map((campaign) => (
                <button
                  key={campaign.id}
                  onClick={() => setSelectedCampaignId(campaign.id)}
                  className="w-full text-left p-3 rounded-lg transition-all"
                  style={{
                    backgroundColor: selectedCampaignId === campaign.id ? 'var(--accent-orange)' : 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    border: '1px solid',
                    color: selectedCampaignId === campaign.id ? 'white' : 'var(--text-primary)',
                  }}
                >
                  <p className="font-medium text-sm">{campaign.brief.name}</p>
                  <p style={{ fontSize: '11px', opacity: 0.7 }}>
                    {campaign.emailVariants.length > 0 ? `${campaign.emailVariants.length} emails` : 'No emails yet'}
                  </p>
                  <p
                    style={{
                      fontSize: '10px',
                      marginTop: '4px',
                      opacity: 0.6,
                      textTransform: 'uppercase',
                    }}
                  >
                    {campaign.status}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Campaign Detail */}
          <div className="col-span-2">
            {selectedCampaign ? (
              <div className="space-y-6">
                {/* Campaign Brief */}
                <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
                  <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                    {selectedCampaign.brief.name}
                  </h2>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Objective</p>
                      <p style={{ color: 'var(--text-primary)' }}>{selectedCampaign.brief.objective}</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Target Audience</p>
                      <p style={{ color: 'var(--text-primary)' }}>{selectedCampaign.brief.targetAudience}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Timeline</p>
                        <p style={{ color: 'var(--text-primary)' }}>{selectedCampaign.brief.timeline}</p>
                      </div>
                      <div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Success Metric</p>
                        <p style={{ color: 'var(--text-primary)' }}>{selectedCampaign.brief.successMetric}</p>
                      </div>
                    </div>
                    {selectedCampaign.brief.keyMessages.length > 0 && (
                      <div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Key Messages</p>
                        <ul style={{ color: 'var(--text-primary)' }} className="list-disc list-inside space-y-1">
                          {selectedCampaign.brief.keyMessages.map((msg, i) => (
                            <li key={i}>{msg}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Manager Section */}
                <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
                  <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                    📧 Email Manager
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                        What would you like for your emails?
                      </label>
                      <textarea
                        value={emailRequest}
                        onChange={(e) => setEmailRequest(e.target.value)}
                        placeholder="e.g., 'Create 5 email variants for cold outreach to CFOs. Make them punchy and benefit-focused.'"
                        disabled={loading}
                        className="w-full px-3 py-2 rounded text-sm"
                        rows={3}
                        style={{
                          backgroundColor: 'var(--bg-tertiary)',
                          borderColor: 'var(--border-color)',
                          border: '1px solid',
                          color: 'var(--text-primary)',
                          opacity: loading ? 0.6 : 1,
                        }}
                      />
                    </div>

                    <button
                      onClick={handleGetEmailHelp}
                      disabled={loading || !emailRequest.trim()}
                      className="w-full px-4 py-2 rounded-lg font-medium text-sm"
                      style={{
                        backgroundColor: 'var(--accent-orange)',
                        color: 'white',
                        opacity: loading || !emailRequest.trim() ? 0.6 : 1,
                        cursor: loading || !emailRequest.trim() ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {loading ? '⏳ Email Manager is working...' : '✨ Get Email Variants'}
                    </button>
                  </div>

                  {/* Email Variants */}
                  {selectedCampaign.emailVariants.length > 0 && (
                    <div className="mt-6 space-y-4 border-t pt-6" style={{ borderColor: 'var(--border-color)' }}>
                      <h3 style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                        Email Variants ({selectedCampaign.emailVariants.length})
                      </h3>

                      <div className="space-y-3">
                        {selectedCampaign.emailVariants.map((variant) => (
                          <div
                            key={variant.id}
                            onClick={() => handleSelectVariant(variant.id)}
                            className="p-4 rounded-lg cursor-pointer transition-all"
                            style={{
                              backgroundColor: selectedCampaign.selectedVariant === variant.id ? 'rgba(249, 112, 31, 0.1)' : 'var(--bg-tertiary)',
                              borderColor: selectedCampaign.selectedVariant === variant.id ? 'var(--accent-orange)' : 'var(--border-color)',
                              border: '1px solid',
                            }}
                          >
                            <p style={{ color: 'var(--text-primary)', fontWeight: '500', marginBottom: '4px' }}>
                              {variant.subjectLine}
                            </p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>
                              {variant.preview}
                            </p>
                            <div className="p-3 rounded text-xs" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                              {variant.bodyContent}
                            </div>
                            <div className="mt-2 flex gap-2 text-xs">
                              <span
                                style={{
                                  backgroundColor: 'rgba(249, 112, 31, 0.2)',
                                  color: 'var(--accent-orange)',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                }}
                              >
                                CTA: {variant.cta}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {selectedCampaign.status === 'draft' && selectedCampaign.selectedVariant && (
                        <button
                          onClick={handleLaunchCampaign}
                          className="w-full px-4 py-3 rounded-lg font-medium"
                          style={{
                            backgroundColor: '#1D9E75',
                            color: 'white',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                        >
                          🚀 Campaign Ready - Mark as Ready
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Select a campaign or create a new one</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
