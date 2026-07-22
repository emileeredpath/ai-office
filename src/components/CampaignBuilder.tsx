import { useState, useMemo } from 'react';
import { getEmailManagerHelp, type CampaignBrief, type EmailVariant } from '@/services/emailManagerService';
import { getSocialMediaStrategy, type SocialMediaStrategy } from '@/services/socialMediaService';
import { getWebsiteStrategy, type WebsiteStrategy } from '@/services/websiteService';
import { getPPCStrategy, type PPCStrategy } from '@/services/ppcService';
import { getProposalTemplate, type ProposalResponse } from '@/services/proposalService';
import { getCaseStudyTemplate, type CaseStudyStrategy } from '@/services/caseStudyService';
import { getFundingOpportunities, type FundingStrategy } from '@/services/fundingService';

type ExpertType = 'email' | 'social' | 'website' | 'ppc' | 'proposal' | 'case-study' | 'funding';

interface Expert {
  key: ExpertType;
  name: string;
  emoji: string;
  role: string;
  description: string;
}

interface Campaign {
  id: string;
  brief: CampaignBrief;
  selectedExperts: Set<ExpertType>;
  emailVariants: EmailVariant[] | null;
  socialStrategy: SocialMediaStrategy | null;
  websiteStrategy: WebsiteStrategy | null;
  ppcStrategy: PPCStrategy | null;
  proposalResponse: ProposalResponse | null;
  caseStudyStrategy: CaseStudyStrategy | null;
  fundingStrategy: FundingStrategy | null;
  status: 'draft' | 'ready' | 'launched';
  createdAt: Date;
}

const EXPERTS: Expert[] = [
  {
    key: 'email',
    name: 'Email Marketing Manager',
    emoji: '📧',
    role: 'Campaigns & Newsletters',
    description: 'Creates compelling email variants with optimized subject lines and CTAs',
  },
  {
    key: 'social',
    name: 'Social Media Manager',
    emoji: '📱',
    role: 'LinkedIn, Facebook, Instagram, TikTok',
    description: 'Develops platform-specific content strategies and posting calendars',
  },
  {
    key: 'website',
    name: 'Website Manager',
    emoji: '🌐',
    role: 'Page Creation & Updates',
    description: 'Designs landing pages and optimizes for SEO and conversions',
  },
  {
    key: 'ppc',
    name: 'SEO & PPC Manager',
    emoji: '📊',
    role: 'Search & Google Ads',
    description: 'Builds paid advertising campaigns with keyword and budget strategy',
  },
  {
    key: 'proposal',
    name: 'Proposal Writer',
    emoji: '✍️',
    role: 'Tenders & RFP Responses',
    description: 'Writes executive summaries and RFP responses',
  },
  {
    key: 'case-study',
    name: 'Case Study Writer',
    emoji: '📖',
    role: 'Customer Stories & Testimonials',
    description: 'Creates customer success stories with quantifiable results',
  },
  {
    key: 'funding',
    name: 'Funding & Rewards Manager',
    emoji: '💰',
    role: 'Grants & Supplier Co-op',
    description: 'Identifies grants, co-op programs, and funding opportunities',
  },
];

export function CampaignBuilder() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    objective: '',
    targetAudience: '',
    timeline: '',
    successMetric: '',
    keyMessages: '',
  });

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
      selectedExperts: new Set(),
      emailVariants: null,
      socialStrategy: null,
      websiteStrategy: null,
      ppcStrategy: null,
      proposalResponse: null,
      caseStudyStrategy: null,
      fundingStrategy: null,
      status: 'draft',
      createdAt: new Date(),
    };

    setCampaigns((prev) => [...prev, newCampaign]);
    setSelectedCampaignId(newCampaign.id);
    setFormData({ name: '', objective: '', targetAudience: '', timeline: '', successMetric: '', keyMessages: '' });
    setShowNewCampaign(false);
  };

  const handleToggleExpert = (expert: ExpertType) => {
    if (!selectedCampaign) return;

    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === selectedCampaignId) {
          const newExperts = new Set(c.selectedExperts);
          if (newExperts.has(expert)) {
            newExperts.delete(expert);
          } else {
            newExperts.add(expert);
          }
          return { ...c, selectedExperts: newExperts };
        }
        return c;
      })
    );
  };

  const handleGetTeamHelp = async () => {
    if (!selectedCampaign || selectedCampaign.selectedExperts.size === 0) return;

    setLoading(true);
    try {
      const updates: Partial<Campaign> = {};

      // Email Manager
      if (selectedCampaign.selectedExperts.has('email')) {
        const emailResponse = await getEmailManagerHelp(selectedCampaign.brief, 'Create compelling email variants for this campaign');
        updates.emailVariants = emailResponse.variants;
      }

      // Social Media Manager
      if (selectedCampaign.selectedExperts.has('social')) {
        const socialResponse = await getSocialMediaStrategy(
          selectedCampaign.brief.name,
          selectedCampaign.brief.targetAudience,
          selectedCampaign.brief.keyMessages,
          'Create a comprehensive social media strategy'
        );
        updates.socialStrategy = socialResponse;
      }

      // Website Manager
      if (selectedCampaign.selectedExperts.has('website')) {
        const websiteResponse = await getWebsiteStrategy(
          selectedCampaign.brief.name,
          selectedCampaign.brief.objective,
          selectedCampaign.brief.targetAudience,
          'Design optimized landing pages for this campaign'
        );
        updates.websiteStrategy = websiteResponse;
      }

      // PPC Manager
      if (selectedCampaign.selectedExperts.has('ppc')) {
        const ppcResponse = await getPPCStrategy(
          selectedCampaign.brief.name,
          selectedCampaign.brief.targetAudience,
          selectedCampaign.brief.successMetric,
          'Create PPC campaigns for this initiative'
        );
        updates.ppcStrategy = ppcResponse;
      }

      // Proposal Writer
      if (selectedCampaign.selectedExperts.has('proposal')) {
        const proposalResponse = await getProposalTemplate(
          selectedCampaign.brief.name,
          selectedCampaign.brief.objective,
          selectedCampaign.brief.targetAudience,
          'Write a proposal for this campaign'
        );
        updates.proposalResponse = proposalResponse;
      }

      // Case Study Writer
      if (selectedCampaign.selectedExperts.has('case-study')) {
        const caseStudyResponse = await getCaseStudyTemplate(
          selectedCampaign.brief.name,
          selectedCampaign.brief.targetAudience,
          selectedCampaign.brief.keyMessages,
          'Create case study templates for this campaign'
        );
        updates.caseStudyStrategy = caseStudyResponse;
      }

      // Funding Manager
      if (selectedCampaign.selectedExperts.has('funding')) {
        const fundingResponse = await getFundingOpportunities(
          selectedCampaign.brief.name,
          selectedCampaign.brief.successMetric,
          selectedCampaign.brief.targetAudience,
          'Identify funding opportunities for this campaign'
        );
        updates.fundingStrategy = fundingResponse;
      }

      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === selectedCampaignId
            ? {
                ...c,
                ...updates,
              }
            : c
        )
      );
    } finally {
      setLoading(false);
    }
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
              Brief your team once, select who you need, get a complete campaign
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
                  placeholder="Timeline"
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
                  placeholder="Success metric"
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
                    {campaign.selectedExperts.size > 0
                      ? `${campaign.selectedExperts.size} expert${campaign.selectedExperts.size !== 1 ? 's' : ''} selected`
                      : 'No experts selected'}
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

                {/* Team Selection */}
                <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
                  <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                    👥 Select Your Team
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '14px' }}>
                    Check which experts you need help from:
                  </p>

                  <div className="grid grid-cols-1 gap-3 mt-4">
                    {EXPERTS.map((expert) => (
                      <label
                        key={expert.key}
                        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all"
                        style={{
                          backgroundColor: selectedCampaign.selectedExperts.has(expert.key)
                            ? 'rgba(249, 112, 31, 0.1)'
                            : 'var(--bg-tertiary)',
                          borderColor: selectedCampaign.selectedExperts.has(expert.key)
                            ? 'var(--accent-orange)'
                            : 'var(--border-color)',
                          border: '1px solid',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCampaign.selectedExperts.has(expert.key)}
                          onChange={() => handleToggleExpert(expert.key)}
                          style={{
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            accentColor: 'var(--accent-orange)',
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: '20px' }}>{expert.emoji}</span>
                            <div>
                              <p style={{ color: 'var(--text-primary)', fontWeight: '500', fontSize: '14px' }}>
                                {expert.name}
                              </p>
                              <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                                {expert.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={handleGetTeamHelp}
                    disabled={loading || selectedCampaign.selectedExperts.size === 0}
                    className="w-full mt-6 px-4 py-3 rounded-lg font-medium text-sm"
                    style={{
                      backgroundColor: 'var(--accent-orange)',
                      color: 'white',
                      opacity: loading || selectedCampaign.selectedExperts.size === 0 ? 0.6 : 1,
                      cursor: loading || selectedCampaign.selectedExperts.size === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? '⏳ Team is working...' : `✨ Get Help from ${selectedCampaign.selectedExperts.size} Expert${selectedCampaign.selectedExperts.size !== 1 ? 's' : ''}`}
                  </button>
                </div>

                {/* Results */}
                <CampaignResults campaign={selectedCampaign} onLaunch={handleLaunchCampaign} />
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

function CampaignResults({ campaign, onLaunch }: { campaign: Campaign; onLaunch: () => void }) {
  if (campaign.selectedExperts.size === 0) return null;

  const hasResults =
    campaign.emailVariants || campaign.socialStrategy || campaign.websiteStrategy || campaign.ppcStrategy || campaign.proposalResponse || campaign.caseStudyStrategy || campaign.fundingStrategy;

  if (!hasResults) return null;

  return (
    <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
      <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
        📋 Campaign Deliverables
      </h2>

      <div className="space-y-6">
        {/* Email */}
        {campaign.emailVariants && (
          <div className="border-b pb-6" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="flex items-center gap-2 font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              <span style={{ fontSize: '20px' }}>📧</span> Email Variants
            </h3>
            <div className="space-y-2">
              {campaign.emailVariants.slice(0, 2).map((variant, i) => (
                <div key={i} className="p-3 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <p style={{ color: 'var(--text-primary)', fontWeight: '500', fontSize: '13px' }}>
                    {variant.subjectLine}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px' }}>
                    {variant.cta}
                  </p>
                </div>
              ))}
              {campaign.emailVariants.length > 2 && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
                  +{campaign.emailVariants.length - 2} more variants
                </p>
              )}
            </div>
          </div>
        )}

        {/* Social */}
        {campaign.socialStrategy && (
          <div className="border-b pb-6" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="flex items-center gap-2 font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              <span style={{ fontSize: '20px' }}>📱</span> Social Media Strategy
            </h3>
            <div className="space-y-2">
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                {campaign.socialStrategy.platforms.length} platforms • {campaign.socialStrategy.platforms.reduce((sum, p) => sum + p.postCount, 0)} posts planned
              </p>
              <div className="flex gap-2 flex-wrap">
                {campaign.socialStrategy.platforms.map((p) => (
                  <span
                    key={p.name}
                    style={{
                      backgroundColor: 'rgba(249, 112, 31, 0.2)',
                      color: 'var(--accent-orange)',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Website */}
        {campaign.websiteStrategy && (
          <div className="border-b pb-6" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="flex items-center gap-2 font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              <span style={{ fontSize: '20px' }}>🌐</span> Website Pages
            </h3>
            <div className="space-y-2">
              {campaign.websiteStrategy.pages.slice(0, 2).map((page) => (
                <div key={page.id} className="p-3 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <p style={{ color: 'var(--text-primary)', fontWeight: '500', fontSize: '13px' }}>
                    {page.title}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px' }}>
                    {page.headline}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PPC */}
        {campaign.ppcStrategy && (
          <div className="border-b pb-6" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="flex items-center gap-2 font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              <span style={{ fontSize: '20px' }}>📊</span> PPC Campaigns
            </h3>
            <div className="space-y-2">
              {campaign.ppcStrategy.campaigns.map((c) => (
                <div key={c.id} className="p-3 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <p style={{ color: 'var(--text-primary)', fontWeight: '500', fontSize: '13px' }}>
                    {c.platform}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px' }}>
                    Budget: {c.budget} • ROI: {c.expectedROI}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Proposal */}
        {campaign.proposalResponse && (
          <div className="border-b pb-6" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="flex items-center gap-2 font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              <span style={{ fontSize: '20px' }}>✍️</span> Proposal
            </h3>
            <div className="p-3 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <p style={{ color: 'var(--text-primary)', fontWeight: '500', fontSize: '13px' }}>
                {campaign.proposalResponse.proposals[0]?.title}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px' }}>
                {campaign.proposalResponse.proposals[0]?.sections.length} sections
              </p>
            </div>
          </div>
        )}

        {/* Case Study */}
        {campaign.caseStudyStrategy && (
          <div className="border-b pb-6" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="flex items-center gap-2 font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              <span style={{ fontSize: '20px' }}>📖</span> Case Studies
            </h3>
            <div className="space-y-2">
              {campaign.caseStudyStrategy.caseStudies.map((cs) => (
                <div key={cs.id} className="p-3 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <p style={{ color: 'var(--text-primary)', fontWeight: '500', fontSize: '13px' }}>
                    {cs.clientName}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px' }}>
                    {cs.results.length} key metrics
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Funding */}
        {campaign.fundingStrategy && (
          <div className="pb-6">
            <h3 className="flex items-center gap-2 font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              <span style={{ fontSize: '20px' }}>💰</span> Funding Opportunities
            </h3>
            <div className="p-3 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <p style={{ color: 'var(--text-primary)', fontWeight: '500', fontSize: '13px' }}>
                {campaign.fundingStrategy.totalPotentialFunding}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px' }}>
                {campaign.fundingStrategy.opportunities.length} opportunities identified
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Launch Button */}
      {campaign.emailVariants && campaign.status === 'draft' && (
        <button
          onClick={onLaunch}
          className="w-full mt-6 px-4 py-3 rounded-lg font-medium"
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
  );
}
