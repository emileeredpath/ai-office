export interface PPCCampaign {
  id: string;
  name: string;
  platform: 'Google Ads' | 'Facebook' | 'LinkedIn' | 'Bing';
  adGroups: AdGroup[];
  budget: string;
  expectedROI: string;
}

export interface AdGroup {
  id: string;
  name: string;
  keywords: string[];
  ads: PaidAd[];
}

export interface PaidAd {
  id: string;
  headline: string;
  description: string;
  displayUrl: string;
  landingPage: string;
}

export interface PPCStrategy {
  campaigns: PPCCampaign[];
  keywordStrategy: string;
  biddingRecommendations: string[];
  budgetAllocation: string;
}

const systemPrompt = `You are an expert PPC & SEA Manager specializing in:
- Google Ads (Search, Display, Shopping, YouTube)
- Facebook & Instagram advertising
- LinkedIn advertising for B2B
- Bing Ads optimization
- Keyword research and bidding strategies
- Ad copy optimization and A/B testing
- Landing page optimization for conversions
- Budget allocation across campaigns
- Quality Score and CTR improvement
- Remarketing and audience targeting
- ROAS tracking and optimization

When asked to create PPC campaigns:
1. Design 2-3 targeted PPC campaigns
2. Suggest keyword strategies and negative keywords
3. Create compelling ad copy with high CTR
4. Provide bidding recommendations
5. Outline budget allocation strategy
6. Include conversion optimization tips

Format your response as JSON with campaigns array, keywordStrategy, biddingRecommendations, and budgetAllocation.`;

export async function getPPCStrategy(
  campaignName: string,
  targetAudience: string,
  successMetric: string,
  userRequest: string
): Promise<PPCStrategy> {
  const apiKey = localStorage.getItem('anthropic_api_key');
  if (!apiKey) {
    return getFallbackPPCStrategy(campaignName, targetAudience);
  }

  const prompt = `Campaign: ${campaignName}
Target Audience: ${targetAudience}
Success Metric: ${successMetric}

User Request: ${userRequest}

Please create a PPC strategy with campaigns in JSON format:
{
  "campaigns": [
    {
      "id": "google-search-1",
      "name": "Google Ads - Search Campaign",
      "platform": "Google Ads",
      "budget": "$1000-2000/month",
      "expectedROI": "300-400%",
      "adGroups": [
        {
          "id": "ag-1",
          "name": "High Intent Keywords",
          "keywords": ["keyword1", "keyword2"],
          "ads": [
            {
              "id": "ad-1",
              "headline": "Compelling headline",
              "description": "Supporting description",
              "displayUrl": "example.com",
              "landingPage": "https://example.com/landing"
            }
          ]
        }
      ]
    }
  ],
  "keywordStrategy": "Focus on high-intent keywords with low cost-per-click",
  "biddingRecommendations": ["Use automated bidding", "Monitor quality score"],
  "budgetAllocation": "40% Google Search, 30% Google Display, 30% Social"
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      return getFallbackPPCStrategy(campaignName, targetAudience);
    }

    const data = await response.json();
    const responseText = data.content[0].text;

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse PPC response:', e);
    }

    return getFallbackPPCStrategy(campaignName, targetAudience);
  } catch (error) {
    console.error('Error getting PPC strategy:', error);
    return getFallbackPPCStrategy(campaignName, targetAudience);
  }
}

function getFallbackPPCStrategy(campaignName: string, targetAudience: string): PPCStrategy {
  return {
    campaigns: [
      {
        id: 'google-search-1',
        name: 'Google Ads - Search Campaign',
        platform: 'Google Ads',
        adGroups: [
          {
            id: 'ag-1',
            name: 'High Intent Keywords',
            keywords: [
              `${campaignName}`,
              `${campaignName} solutions`,
              `best ${campaignName}`,
              `${campaignName} for ${targetAudience}`,
            ],
            ads: [
              {
                id: 'ad-1',
                headline: `Professional ${campaignName} Solutions`,
                description: `Trusted by leading ${targetAudience} organizations. Drive measurable results with our proven approach.`,
                displayUrl: 'example.com',
                landingPage: 'https://example.com/demo',
              },
            ],
          },
        ],
        budget: '$1,500/month',
        expectedROI: '300-400%',
      },
      {
        id: 'facebook-ads-1',
        name: 'Facebook & Instagram Ads',
        platform: 'Facebook',
        adGroups: [
          {
            id: 'ag-2',
            name: 'Audience Targeting',
            keywords: [`${targetAudience} interests`, 'Professional development', 'Industry leaders'],
            ads: [
              {
                id: 'ad-2',
                headline: `Transform Your ${campaignName} Strategy`,
                description: 'Join innovative organizations using our solutions. Limited time offer.',
                displayUrl: 'facebook.com/campaigns',
                landingPage: 'https://example.com/fb-offer',
              },
            ],
          },
        ],
        budget: '$1,000/month',
        expectedROI: '250-350%',
      },
    ],
    keywordStrategy: `Focus on high-intent keywords specific to ${targetAudience}. Use long-tail keywords to reduce CPC. Target both branded and competitor keywords. Negative keywords: free, cheap, discount.`,
    biddingRecommendations: [
      'Use Target CPA bidding strategy for conversions',
      'Monitor quality score and improve ad relevance',
      'Adjust bids based on device, time of day, and location',
      'Use bid adjustments for high-performing demographics',
      'Start conservative and scale successful campaigns',
    ],
    budgetAllocation: `50% Google Search Ads, 30% Facebook/Instagram, 20% Display Network - Adjust based on performance data.`,
  };
}
