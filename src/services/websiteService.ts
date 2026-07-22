export interface WebsitePage {
  id: string;
  title: string;
  headline: string;
  subheadline: string;
  sections: PageSection[];
  cta: string;
  ctaUrl: string;
}

export interface PageSection {
  title: string;
  content: string;
  type: 'hero' | 'value-prop' | 'benefits' | 'social-proof' | 'cta' | 'faq';
}

export interface WebsiteStrategy {
  pages: WebsitePage[];
  seoKeywords: string[];
  navigationStructure: string;
  designRecommendations: string[];
}

const systemPrompt = `You are an expert Website Manager specializing in:
- High-converting landing pages and campaign pages
- SEO optimization and keyword strategy
- Page structure and information hierarchy
- CTA optimization and conversion design
- Mobile responsiveness best practices
- Accessibility (WCAG compliance)
- Page speed optimization
- A/B testing frameworks
- Analytics-driven improvements
- Brand consistency in web design

When asked to create website pages:
1. Design 2-3 optimized pages for the campaign
2. Include compelling headlines and CTAs
3. Structure content for maximum conversion
4. Provide SEO keyword recommendations
5. Suggest site navigation structure
6. Include design and UX recommendations

Format your response as JSON with pages array, seoKeywords, navigationStructure, and designRecommendations.`;

export async function getWebsiteStrategy(
  campaignName: string,
  objective: string,
  targetAudience: string,
  userRequest: string
): Promise<WebsiteStrategy> {
  const apiKey = localStorage.getItem('anthropic_api_key');
  if (!apiKey) {
    return getFallbackWebsiteStrategy(campaignName, objective);
  }

  const prompt = `Campaign: ${campaignName}
Objective: ${objective}
Target Audience: ${targetAudience}

User Request: ${userRequest}

Please create a website strategy with pages in JSON format:
{
  "pages": [
    {
      "id": "landing-page",
      "title": "Campaign Landing Page",
      "headline": "Compelling main headline",
      "subheadline": "Supporting subheadline",
      "sections": [
        {
          "title": "Hero Section",
          "content": "Attention-grabbing opening content",
          "type": "hero"
        }
      ],
      "cta": "Button text",
      "ctaUrl": "https://example.com/signup"
    }
  ],
  "seoKeywords": ["keyword1", "keyword2", "keyword3"],
  "navigationStructure": "Home > Campaign > Pages > Resources > Contact",
  "designRecommendations": ["Recommendation 1", "Recommendation 2"]
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
      return getFallbackWebsiteStrategy(campaignName, objective);
    }

    const data = await response.json();
    const responseText = data.content[0].text;

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse website response:', e);
    }

    return getFallbackWebsiteStrategy(campaignName, objective);
  } catch (error) {
    console.error('Error getting website strategy:', error);
    return getFallbackWebsiteStrategy(campaignName, objective);
  }
}

function getFallbackWebsiteStrategy(campaignName: string, objective: string): WebsiteStrategy {
  return {
    pages: [
      {
        id: 'landing-page',
        title: 'Campaign Landing Page',
        headline: `${campaignName}: Transform Your ${objective}`,
        subheadline: 'Drive measurable results with our proven solution',
        sections: [
          {
            title: 'Hero Section',
            content: `Join leading organizations leveraging ${campaignName} to achieve their ${objective} goals. We help teams like yours succeed.`,
            type: 'hero',
          },
          {
            title: 'Why Choose Us',
            content: 'Our proven methodology delivers results. See how we help organizations transform their approach.',
            type: 'value-prop',
          },
          {
            title: 'Key Benefits',
            content: 'Measurable results • Expert support • Proven methodology • Dedicated team',
            type: 'benefits',
          },
          {
            title: 'Success Stories',
            content: 'Leading organizations trust us to deliver. Read their stories and learn what\'s possible.',
            type: 'social-proof',
          },
        ],
        cta: 'Get Started Today',
        ctaUrl: 'https://example.com/demo',
      },
      {
        id: 'features-page',
        title: 'Features & Benefits',
        headline: `What Makes ${campaignName} Different`,
        subheadline: 'Powerful features designed for your success',
        sections: [
          {
            title: 'Core Features',
            content: 'Expert guidance • AI-powered insights • Real-time analytics • Team collaboration',
            type: 'value-prop',
          },
          {
            title: 'How It Works',
            content: '1. Set your objective 2. Get expert guidance 3. Launch your campaign 4. Measure results',
            type: 'benefits',
          },
        ],
        cta: 'Learn More',
        ctaUrl: 'https://example.com/features',
      },
    ],
    seoKeywords: [
      campaignName.toLowerCase(),
      objective.toLowerCase(),
      `${objective} solution`,
      `${campaignName} benefits`,
      'expert guidance',
    ],
    navigationStructure: 'Home > Campaigns > Landing Page > Features > Pricing > Contact',
    designRecommendations: [
      'Use clear visual hierarchy with large, readable headlines',
      'Include high-quality hero image or video',
      'Place primary CTA above the fold',
      'Use contrasting colors for buttons (#F97031 recommended)',
      'Optimize for mobile-first design',
      'Include customer testimonials and logos',
      'Use white space effectively',
      'Page load time under 3 seconds',
    ],
  };
}
