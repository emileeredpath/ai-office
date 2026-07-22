export interface SocialMediaStrategy {
  platforms: {
    name: 'LinkedIn' | 'Facebook' | 'Instagram' | 'TikTok';
    postCount: number;
    posts: SocialPost[];
    bestTimes: string;
  }[];
  contentCalendar: string[];
  engagementTips: string[];
  hashtagStrategy: string;
}

export interface SocialPost {
  id: string;
  platform: 'LinkedIn' | 'Facebook' | 'Instagram' | 'TikTok';
  content: string;
  hashtags: string[];
  callToAction: string;
}

const systemPrompt = `You are an expert Social Media Manager specializing in:
- LinkedIn content strategy (professional, thought leadership, B2B)
- Facebook community building and engagement
- Instagram visual storytelling and aesthetics
- TikTok trends, viral content, and Gen Z engagement
- Cross-platform content repurposing
- Hashtag research and trends
- Posting schedules for maximum engagement
- Community management and response strategies
- Analytics-driven content optimization

When asked to create social media content:
1. Suggest 2-3 tailored posts per platform
2. Include platform-specific best practices
3. Provide optimal posting times for each platform
4. Create engaging hashtag strategies
5. Suggest content calendar structure
6. Include engagement metrics targets

Format your response as JSON with platforms array, contentCalendar, engagementTips, and hashtagStrategy.`;

export async function getSocialMediaStrategy(
  campaignName: string,
  targetAudience: string,
  keyMessages: string[],
  userRequest: string
): Promise<SocialMediaStrategy> {
  const apiKey = localStorage.getItem('anthropic_api_key');
  if (!apiKey) {
    return getFallbackSocialStrategy(campaignName, targetAudience);
  }

  const prompt = `Campaign: ${campaignName}
Target Audience: ${targetAudience}
Key Messages: ${keyMessages.join(', ')}

User Request: ${userRequest}

Please create a social media strategy with posts for LinkedIn, Facebook, Instagram, and TikTok in JSON format:
{
  "platforms": [
    {
      "name": "LinkedIn",
      "postCount": 3,
      "posts": [
        {
          "id": "linkedin-1",
          "platform": "LinkedIn",
          "content": "Professional post content...",
          "hashtags": ["#tag1", "#tag2"],
          "callToAction": "Connect with us"
        }
      ],
      "bestTimes": "Tuesday-Thursday, 8am-10am"
    }
  ],
  "contentCalendar": ["Week 1: Launch post", "Week 2: Case study", "Week 3: Customer story"],
  "engagementTips": ["Start conversations", "Tag industry leaders", "Encourage shares"],
  "hashtagStrategy": "Mix 30% trending, 50% industry, 20% branded"
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
      return getFallbackSocialStrategy(campaignName, targetAudience);
    }

    const data = await response.json();
    const responseText = data.content[0].text;

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse social media response:', e);
    }

    return getFallbackSocialStrategy(campaignName, targetAudience);
  } catch (error) {
    console.error('Error getting social media strategy:', error);
    return getFallbackSocialStrategy(campaignName, targetAudience);
  }
}

function getFallbackSocialStrategy(campaignName: string, targetAudience: string): SocialMediaStrategy {
  return {
    platforms: [
      {
        name: 'LinkedIn',
        postCount: 3,
        posts: [
          {
            id: 'linkedin-1',
            platform: 'LinkedIn',
            content: `Excited to announce our latest initiative for ${targetAudience}! We're committed to delivering innovative solutions that drive real business results. Join us as we transform the industry.`,
            hashtags: ['#innovation', '#marketing', '#linkedin'],
            callToAction: 'Connect with us to learn more',
          },
          {
            id: 'linkedin-2',
            platform: 'LinkedIn',
            content: `Industry insight: Leading ${targetAudience} are adopting new strategies for ${campaignName}. Here's what we're seeing and what it means for your business.`,
            hashtags: ['#insight', '#industry', '#strategy'],
            callToAction: 'Read our full analysis',
          },
        ],
        bestTimes: 'Tuesday-Thursday, 8am-10am',
      },
      {
        name: 'Facebook',
        postCount: 2,
        posts: [
          {
            id: 'facebook-1',
            platform: 'Facebook',
            content: `Join our community! We're connecting ${targetAudience} with innovative solutions for ${campaignName}. Be part of something great.`,
            hashtags: ['#community', '#innovation', '#facebook'],
            callToAction: 'Join our group today',
          },
        ],
        bestTimes: 'Wednesday, 1pm-3pm',
      },
      {
        name: 'Instagram',
        postCount: 2,
        posts: [
          {
            id: 'instagram-1',
            platform: 'Instagram',
            content: `Transforming ${campaignName} for ${targetAudience}. Swipe up to see how we're making a difference. 🚀✨`,
            hashtags: ['#transformation', '#innovation', '#instagram'],
            callToAction: 'Link in bio',
          },
        ],
        bestTimes: 'Friday-Saturday, 6pm-8pm',
      },
      {
        name: 'TikTok',
        postCount: 2,
        posts: [
          {
            id: 'tiktok-1',
            platform: 'TikTok',
            content: `POV: You're ${targetAudience} looking for ${campaignName} solutions. Here's the game-changer you've been waiting for. #FYP #Viral #Innovation`,
            hashtags: ['#FYP', '#innovation', '#viral'],
            callToAction: 'Follow for more insights',
          },
        ],
        bestTimes: 'Thursday-Sunday, 7pm-9pm',
      },
    ],
    contentCalendar: [
      'Week 1: Campaign launch announcement (all platforms)',
      'Week 2: Customer success story (LinkedIn + Instagram)',
      'Week 3: Industry insight (LinkedIn + TikTok)',
      'Week 4: Community engagement (Facebook + Instagram)',
    ],
    engagementTips: [
      'Respond to comments within 2 hours',
      'Tag relevant industry leaders and partners',
      'Share user-generated content',
      'Run platform-specific contests',
      'Use native video for better reach',
      'Leverage trending sounds on TikTok',
    ],
    hashtagStrategy: '30% trending hashtags, 50% industry-specific, 20% branded hashtags',
  };
}
