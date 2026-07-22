export interface Proposal {
  id: string;
  title: string;
  sections: ProposalSection[];
  summary: string;
  pricing: string;
  timeline: string;
}

export interface ProposalSection {
  title: string;
  content: string;
  subsections?: string[];
}

export interface ProposalResponse {
  proposals: Proposal[];
  responseStrategy: string;
  recommendations: string[];
}

const systemPrompt = `You are an expert Proposal Writer specializing in:
- RFP (Request for Proposal) responses
- Tender submissions and compliance
- Executive summaries that win
- Solution design and architecture
- Value proposition positioning
- Pricing strategy and ROI demonstration
- Timeline and delivery planning
- Team qualifications and case studies
- Risk mitigation strategies
- Competitive differentiation

When asked to write proposals:
1. Create 1-2 compelling proposal outlines
2. Structure for maximum clarity and impact
3. Emphasize value and differentiation
4. Include executive summary, solution, approach, team, pricing
5. Provide RFP compliance checklist
6. Suggest positioning strategy

Format your response as JSON with proposals array, responseStrategy, and recommendations.`;

export async function getProposalTemplate(
  campaignName: string,
  objective: string,
  clientType: string,
  userRequest: string
): Promise<ProposalResponse> {
  const apiKey = localStorage.getItem('anthropic_api_key');
  if (!apiKey) {
    return getFallbackProposal(campaignName, objective);
  }

  const prompt = `Campaign/Project: ${campaignName}
Objective: ${objective}
Client Type: ${clientType}

User Request: ${userRequest}

Please create proposal templates in JSON format:
{
  "proposals": [
    {
      "id": "proposal-1",
      "title": "Proposal Title",
      "summary": "Executive summary (150 words)",
      "sections": [
        {
          "title": "Executive Summary",
          "content": "Brief overview of solution and value..."
        }
      ],
      "pricing": "Investment structure",
      "timeline": "Delivery timeline"
    }
  ],
  "responseStrategy": "How to position this solution",
  "recommendations": ["Recommendation 1", "Recommendation 2"]
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
      return getFallbackProposal(campaignName, objective);
    }

    const data = await response.json();
    const responseText = data.content[0].text;

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse proposal response:', e);
    }

    return getFallbackProposal(campaignName, objective);
  } catch (error) {
    console.error('Error getting proposal template:', error);
    return getFallbackProposal(campaignName, objective);
  }
}

function getFallbackProposal(campaignName: string, objective: string): ProposalResponse {
  return {
    proposals: [
      {
        id: 'proposal-1',
        title: `${campaignName} - Solution Proposal`,
        summary: `This proposal outlines our comprehensive approach to ${objective}. We deliver proven solutions with measurable results, expert team support, and full project management.`,
        sections: [
          {
            title: 'Executive Summary',
            content: `We propose a strategic partnership to achieve ${objective}. Our solution combines industry expertise, proven methodology, and dedicated support to deliver measurable results.`,
            subsections: [
              'Situation analysis',
              'Proposed solution',
              'Expected outcomes',
              'Investment and ROI',
            ],
          },
          {
            title: 'The Opportunity',
            content: `Organizations focusing on ${objective} see significant competitive advantages. Our approach addresses key challenges and positions you for success.`,
          },
          {
            title: 'Our Solution',
            content: 'Our proven three-phase approach: Assessment & Planning, Implementation & Optimization, Measurement & Continuous Improvement',
            subsections: [
              'Phase 1: Assessment (weeks 1-2)',
              'Phase 2: Implementation (weeks 3-8)',
              'Phase 3: Optimization (ongoing)',
            ],
          },
          {
            title: 'Team & Expertise',
            content: 'Our team brings 15+ years of experience in similar projects. We provide dedicated project management and regular communication.',
          },
          {
            title: 'Investment & ROI',
            content: 'Investment: $X based on scope. Expected ROI: 300-400% within 12 months. Flexible payment terms available.',
          },
        ],
        pricing: 'Custom quote based on scope',
        timeline: '8-12 weeks implementation + 6 months optimization',
      },
    ],
    responseStrategy: `Position as trusted partner with proven track record. Emphasize our understanding of ${objective} challenges and our solution-focused approach. Highlight team expertise and client success stories.`,
    recommendations: [
      'Include 2-3 relevant case studies in appendix',
      'Provide detailed ROI calculation and payback timeline',
      'Address specific RFP requirements in proposal body',
      'Include team biographies and credentials',
      'Offer flexible engagement models and terms',
      'Provide executive summary (1-2 pages) upfront',
    ],
  };
}
