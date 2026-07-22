export interface CampaignBrief {
  name: string;
  objective: string;
  targetAudience: string;
  timeline: string;
  successMetric: string;
  keyMessages: string[];
}

export interface EmailVariant {
  id: string;
  subjectLine: string;
  preview: string;
  bodyContent: string;
  cta: string;
  ctaUrl: string;
}

export interface EmailCampaignResponse {
  variants: EmailVariant[];
  strategy: string;
  recommendations: string[];
}

const systemPrompt = `You are an expert email marketing strategist and copywriter. You specialize in:
- Writing compelling subject lines that drive opens (target 35-45% open rate)
- Creating persuasive email body copy that converts
- Designing clear calls-to-action
- A/B testing strategies
- Email sequencing and cadence
- Segmentation and personalization

When asked to create an email campaign, provide:
1. 3-5 different email variants with different approaches
2. Subject line strategies for each
3. Copy that's personalized, benefit-focused, and action-oriented
4. Strategic recommendations for timing, frequency, and segmentation
5. Tips for maximizing open rates and click-through rates

Format your response as JSON with variants array and recommendations.`;

export async function getEmailManagerHelp(brief: CampaignBrief, userRequest: string): Promise<EmailCampaignResponse> {
  const apiKey = localStorage.getItem('anthropic_api_key');
  if (!apiKey) {
    return getFallbackEmailCampaign(brief, userRequest);
  }

  const prompt = `Campaign Brief:
Name: ${brief.name}
Objective: ${brief.objective}
Target Audience: ${brief.targetAudience}
Timeline: ${brief.timeline}
Success Metric: ${brief.successMetric}
Key Messages: ${brief.keyMessages.join(', ')}

User Request: ${userRequest}

Please create email campaign variants in this JSON format:
{
  "variants": [
    {
      "id": "variant-1",
      "subjectLine": "...",
      "preview": "First 50 chars of email",
      "bodyContent": "Full email body (2-3 paragraphs, personalized, benefit-focused)",
      "cta": "Button text",
      "ctaUrl": "https://example.com"
    }
  ],
  "strategy": "Brief explanation of the overall email strategy",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
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
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      return getFallbackEmailCampaign(brief, userRequest);
    }

    const data = await response.json();
    const responseText = data.content[0].text;

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse email response:', e);
    }

    return getFallbackEmailCampaign(brief, userRequest);
  } catch (error) {
    console.error('Error getting email campaign help:', error);
    return getFallbackEmailCampaign(brief, userRequest);
  }
}

function getFallbackEmailCampaign(brief: CampaignBrief, userRequest: string): EmailCampaignResponse {
  return {
    variants: [
      {
        id: 'variant-1',
        subjectLine: `${brief.name} - Exclusive Opportunity for ${brief.targetAudience}`,
        preview: 'See how leading organizations are...',
        bodyContent: `Hi [Name],

I wanted to reach out about ${brief.objective.toLowerCase()}.

${brief.keyMessages[0] || 'We help organizations like yours achieve their goals.'} The results speak for themselves - our clients see measurable improvements in their key metrics.

I'd love to discuss how we can help you achieve your goals within your ${brief.timeline} timeline.

[Your Name]`,
        cta: 'Schedule Demo',
        ctaUrl: 'https://example.com/demo',
      },
      {
        id: 'variant-2',
        subjectLine: `Quick question about your ${brief.targetAudience} strategy`,
        preview: 'I noticed something about...',
        bodyContent: `Hi [Name],

Quick question - how are you currently approaching ${brief.objective.toLowerCase()}?

I ask because we've found that ${brief.keyMessages[0]?.toLowerCase() || 'many organizations are missing key opportunities'}.

Worth a 15-minute conversation? ${brief.successMetric}

[Your Name]`,
        cta: 'Let\'s Talk',
        ctaUrl: 'https://example.com/calendar',
      },
      {
        id: 'variant-3',
        subjectLine: `${brief.targetAudience}: ${brief.keyMessages[0]?.substring(0, 40)}...`,
        preview: 'Here\'s what we\'re seeing...',
        bodyContent: `Hi [Name],

Thought you'd find this interesting. We're working with leading ${brief.targetAudience} on ${brief.objective.toLowerCase()}, and here's what's working:

${brief.keyMessages.slice(0, 2).map((msg, i) => `${i + 1}. ${msg}`).join('\n')}

Curious if any of this resonates with your team? Happy to share more.

[Your Name]`,
        cta: 'Tell Me More',
        ctaUrl: 'https://example.com/learn',
      },
    ],
    strategy: `Multi-variant approach testing three different angles: benefit-driven, curiosity-driven, and insight-driven. Each targets ${brief.targetAudience} with focus on ${brief.keyMessages[0] || 'value proposition'}.`,
    recommendations: [
      'Send Variant 1 to cold list - highest credibility',
      'Use Variant 2 for existing connections - conversational',
      `Test send times for ${brief.targetAudience} (typically Tuesday-Thursday 10am-2pm)`,
      `Follow-up sequence: send 3-5 days after initial if no response`,
      `Measure success against: ${brief.successMetric}`,
    ],
  };
}
