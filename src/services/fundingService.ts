export interface FundingOpportunity {
  id: string;
  name: string;
  type: 'grant' | 'co-op' | 'rebate' | 'subsidy' | 'sponsorship';
  amount: string;
  description: string;
  requirements: string[];
  deadline: string;
  applicationUrl: string;
}

export interface FundingRecommendation {
  opportunity: FundingOpportunity;
  relevanceScore: string;
  estimatedValue: string;
  effortRequired: string;
}

export interface FundingStrategy {
  opportunities: FundingRecommendation[];
  totalPotentialFunding: string;
  applicationStrategy: string;
  timeline: string;
}

const systemPrompt = `You are an expert Funding & Rewards Manager specializing in:
- Grant opportunities (government, private, non-profit)
- Supplier co-op programs and vendor funding
- Marketing rebates and co-marketing funds
- Industry-specific subsidy programs
- Event sponsorship opportunities
- Training and certification grants
- Innovation and R&D funding
- Diversity and inclusion programs
- Application strategy and compliance
- Budget optimization through funding

When asked to identify funding opportunities:
1. Research relevant grants and programs
2. Assess fit and application effort
3. Estimate potential funding value
4. Provide application timeline and requirements
5. Suggest strategy for maximizing opportunities
6. Outline compliance and reporting needs

Format your response as JSON with opportunities array, totalPotentialFunding, applicationStrategy, and timeline.`;

export async function getFundingOpportunities(
  campaignName: string,
  budget: string,
  industry: string,
  userRequest: string
): Promise<FundingStrategy> {
  const apiKey = localStorage.getItem('anthropic_api_key');
  if (!apiKey) {
    return getFallbackFundingStrategy(campaignName);
  }

  const prompt = `Campaign: ${campaignName}
Budget: ${budget}
Industry: ${industry}

User Request: ${userRequest}

Please identify funding opportunities in JSON format:
{
  "opportunities": [
    {
      "opportunity": {
        "id": "fund-1",
        "name": "Funding Program Name",
        "type": "grant",
        "amount": "$X-Y",
        "description": "What this funding covers",
        "requirements": ["Requirement 1", "Requirement 2"],
        "deadline": "Application deadline",
        "applicationUrl": "https://example.com"
      },
      "relevanceScore": "High/Medium/Low",
      "estimatedValue": "Potential funding amount",
      "effortRequired": "Low/Medium/High effort"
    }
  ],
  "totalPotentialFunding": "Total if all obtained",
  "applicationStrategy": "How to prioritize applications",
  "timeline": "When to apply"
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
      return getFallbackFundingStrategy(campaignName);
    }

    const data = await response.json();
    const responseText = data.content[0].text;

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse funding response:', e);
    }

    return getFallbackFundingStrategy(campaignName);
  } catch (error) {
    console.error('Error getting funding opportunities:', error);
    return getFallbackFundingStrategy(campaignName);
  }
}

function getFallbackFundingStrategy(campaignName: string): FundingStrategy {
  return {
    opportunities: [
      {
        opportunity: {
          id: 'fund-1',
          name: 'Marketing Innovation Grant',
          type: 'grant',
          amount: '$5,000 - $25,000',
          description: 'Supports innovative marketing campaigns and digital transformation initiatives',
          requirements: [
            'Non-profit or eligible business',
            'Clear ROI demonstration',
            'Project plan and budget',
            'Impact metrics defined',
          ],
          deadline: 'Quarterly - Next: Q3 2026',
          applicationUrl: 'https://grants.example.com',
        },
        relevanceScore: 'High',
        estimatedValue: '$15,000',
        effortRequired: 'Medium (4-6 weeks)',
      },
      {
        opportunity: {
          id: 'fund-2',
          name: 'Supplier Co-op Program',
          type: 'co-op',
          amount: '$3,000 - $10,000',
          description: 'Software and service providers offer co-marketing funds for joint campaigns',
          requirements: [
            'Partnership agreement',
            'Co-marketing plan',
            'Lead sharing arrangement',
            'Proof of performance reporting',
          ],
          deadline: 'Rolling - Apply anytime',
          applicationUrl: 'https://coop.example.com',
        },
        relevanceScore: 'High',
        estimatedValue: '$6,000',
        effortRequired: 'Low (2-3 weeks)',
      },
      {
        opportunity: {
          id: 'fund-3',
          name: 'Digital Marketing Rebate Program',
          type: 'rebate',
          amount: '20-30% of qualified spend',
          description: 'Major platforms offer rebates on qualifying advertising spend',
          requirements: [
            'Minimum spend threshold',
            'Pre-approval',
            'Detailed reporting',
            'Performance metrics',
          ],
          deadline: 'Ongoing - Quarterly reviews',
          applicationUrl: 'https://rebate.example.com',
        },
        relevanceScore: 'Medium',
        estimatedValue: '$8,000',
        effortRequired: 'Medium (ongoing)',
      },
    ],
    totalPotentialFunding: '$29,000 - $60,000 (varies by approval)',
    applicationStrategy: `Prioritize high-relevance, low-effort opportunities first (Supplier Co-op). These can fund 50%+ of ${campaignName}. Then pursue grants for incremental funding. Use grant funding for innovation, co-op for partner channels, rebates for scaling.`,
    timeline: `Months 1-2: Apply to co-op and grant programs (parallel track). Months 2-4: Execute campaign with initial funding. Months 3-4: Track performance and apply for rebates. Months 4-6: Collect metrics for grant reporting.`,
  };
}
