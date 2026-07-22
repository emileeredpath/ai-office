export interface CaseStudy {
  id: string;
  title: string;
  clientName: string;
  industry: string;
  challenge: string;
  solution: string;
  results: CaseStudyResult[];
  testimonial: string;
  quote: string;
  downloadLink: string;
}

export interface CaseStudyResult {
  metric: string;
  value: string;
  impact: string;
}

export interface CaseStudyStrategy {
  caseStudies: CaseStudy[];
  contentStrategy: string;
  distributionChannels: string[];
}

const systemPrompt = `You are an expert Case Study Writer specializing in:
- Compelling customer success stories
- Quantifiable business results and ROI
- Before/after transformation narratives
- Client testimonials and social proof
- Industry-specific case study templates
- Visual design recommendations
- Distribution and promotion strategies
- Sales enablement materials
- Thought leadership positioning
- Customer journey storytelling

When asked to create case studies:
1. Design 1-2 compelling case study outlines
2. Structure for narrative impact and credibility
3. Include measurable results and metrics
4. Create client testimonials and quotes
5. Suggest content format and design
6. Provide distribution strategy

Format your response as JSON with caseStudies array, contentStrategy, and distributionChannels.`;

export async function getCaseStudyTemplate(
  campaignName: string,
  targetAudience: string,
  keyMessages: string[],
  userRequest: string
): Promise<CaseStudyStrategy> {
  const apiKey = localStorage.getItem('anthropic_api_key');
  if (!apiKey) {
    return getFallbackCaseStudy(campaignName, targetAudience);
  }

  const prompt = `Campaign: ${campaignName}
Target Audience: ${targetAudience}
Key Messages: ${keyMessages.join(', ')}

User Request: ${userRequest}

Please create case study templates in JSON format:
{
  "caseStudies": [
    {
      "id": "cs-1",
      "title": "Case Study Title",
      "clientName": "Client Company Name",
      "industry": "Industry",
      "challenge": "The client's main challenge",
      "solution": "How we solved it",
      "results": [
        {
          "metric": "Metric Name",
          "value": "X%",
          "impact": "What this means"
        }
      ],
      "testimonial": "Direct quote from client",
      "quote": "Impact statement",
      "downloadLink": "PDF link"
    }
  ],
  "contentStrategy": "How to position these case studies",
  "distributionChannels": ["LinkedIn", "Website", "Sales deck"]
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
      return getFallbackCaseStudy(campaignName, targetAudience);
    }

    const data = await response.json();
    const responseText = data.content[0].text;

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse case study response:', e);
    }

    return getFallbackCaseStudy(campaignName, targetAudience);
  } catch (error) {
    console.error('Error getting case study template:', error);
    return getFallbackCaseStudy(campaignName, targetAudience);
  }
}

function getFallbackCaseStudy(campaignName: string, targetAudience: string): CaseStudyStrategy {
  return {
    caseStudies: [
      {
        id: 'cs-1',
        title: `How ${targetAudience} Achieved Success with ${campaignName}`,
        clientName: 'Industry Leader Inc.',
        industry: targetAudience,
        challenge: `The client needed to improve their ${campaignName} results but lacked the expertise and resources to implement a comprehensive solution.`,
        solution: `We implemented a strategic ${campaignName} program with expert guidance, custom strategy, and ongoing optimization. Our team provided hands-on support throughout the transformation.`,
        results: [
          {
            metric: 'Improvement',
            value: '150%',
            impact: 'Exceeded initial targets by 50%',
          },
          {
            metric: 'ROI',
            value: '320%',
            impact: 'Generated significant return on investment',
          },
          {
            metric: 'Time to Success',
            value: '8 weeks',
            impact: 'Results delivered faster than expected',
          },
        ],
        testimonial: `"The team's expertise and support were instrumental in our success. We achieved results we didn't think were possible. Highly recommend."`,
        quote: `"Working with them transformed how we approach ${campaignName}. It's become a core part of our strategy."`,
        downloadLink: '/downloads/case-study-1.pdf',
      },
    ],
    contentStrategy: `Position these case studies as proof of concept. Emphasize measurable results and transformation. Target ${targetAudience} decision-makers with relevant success stories.`,
    distributionChannels: [
      'LinkedIn articles and posts',
      'Website case study section',
      'Sales presentations and pitches',
      'Email marketing campaigns',
      'Industry events and webinars',
      'Downloadable PDF assets',
      'Press releases and media outreach',
    ],
  };
}
