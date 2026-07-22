import { REAL_TASKS, BRANDS } from '@/data/mtechEmployees';

export interface GeneratedContent {
  content: string;
  preview: string;
}

export async function generateMarketingContent(
  taskId: string,
  contentType: 'email_campaign' | 'social_post' | 'design_brief' | 'chart' | 'infographic'
): Promise<GeneratedContent> {
  const apiKey = localStorage.getItem('anthropic_api_key');
  if (!apiKey) {
    return generateFallbackContent(taskId, contentType);
  }

  const task = REAL_TASKS.find((t) => t.id === taskId);
  if (!task) {
    return generateFallbackContent(taskId, contentType);
  }

  const brand = BRANDS[task.brand];
  const prompt = buildContentPrompt(task.title, brand, contentType);

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
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      return generateFallbackContent(taskId, contentType);
    }

    const data = await response.json();
    const content = data.content[0].text;

    return {
      content,
      preview: `📝 ${contentType.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Generated`,
    };
  } catch (error) {
    console.error('Error generating content:', error);
    return generateFallbackContent(taskId, contentType);
  }
}

function buildContentPrompt(taskTitle: string, brand: any, contentType: string): string {
  const baseContext = `You are a professional marketing copywriter for ${brand.name}. Create compelling, professional marketing content.`;

  if (contentType === 'email_campaign') {
    return `${baseContext}

Create a professional email campaign for: "${taskTitle}"

Generate an email that:
- Has a subject line
- Opens with a compelling hook
- Includes 2-3 key benefits with checkmarks
- Has a clear call-to-action
- Uses professional tone

Format as:
Subject: [subject]

[email body]`;
  }

  if (contentType === 'social_post') {
    return `${baseContext}

Create an engaging LinkedIn/Twitter post for: "${taskTitle}"

Generate a social post that:
- Opens with an emoji or relevant symbol
- Is 2-3 sentences maximum
- Includes a hook/insight
- Ends with a call-to-action
- Has 2-3 relevant hashtags
- Is professional yet engaging`;
  }

  if (contentType === 'design_brief') {
    return `${baseContext}

Create a design brief for: "${taskTitle}"

Include:
- Clear objective
- Target audience (who we're reaching)
- 3 key messages to convey
- Visual style guidelines
- 3-4 specific deliverables

Format as a concise design brief.`;
  }

  if (contentType === 'chart') {
    return `${baseContext}

Create a performance data summary for: "${taskTitle}"

Generate realistic performance metrics showing:
- Weekly progress over 4 weeks (starting at 20%, ending at 85-95%)
- Clear trend showing acceleration
- Current status
- Timeline to completion

Format as clear data points with analysis.`;
  }

  return `${baseContext}

Create professional infographic copy for: "${taskTitle}"

Generate concise, impactful copy suitable for an infographic:
- 1-2 key statistics or insights
- 3-4 supporting points
- 1 strong headline
- Clear, scannable format`;
}

function generateFallbackContent(taskId: string, contentType: string): GeneratedContent {
  const task = REAL_TASKS.find((t) => t.id === taskId);
  const title = task?.title || 'Content';

  const templates = {
    email_campaign: `Subject: ${title}

Dear [Prospect Name],

I wanted to reach out and share how we can help with ${title.toLowerCase()}.

Our approach delivers measurable results:
✓ Enhanced efficiency and productivity
✓ Improved team coordination
✓ Proven ROI within 90 days

I'd love to discuss how this applies to your organization.

Best regards,
[Your Name]`,

    social_post: `🎯 ${title}

Discover how leading organizations are optimizing their approach to ${title.toLowerCase()}.

The key? Focus on what matters most. Our proven framework helps teams achieve results faster.

Ready to learn more? 🔗

#Marketing #Strategy #Growth`,

    design_brief: `DESIGN BRIEF: ${title}

Objective:
Create visually compelling content for ${title}

Target Audience:
Marketing professionals and decision-makers

Key Messages:
1. Innovation & Efficiency
2. Proven Results
3. Team Success

Deliverables:
- Primary visual asset
- Supporting graphics
- Web-ready formats`,

    chart: `PERFORMANCE CHART: ${title}

Weekly Progress:
• Week 1: 25% complete
• Week 2: 45% complete
• Week 3: 68% complete
• Week 4: 88% complete

Trend: Accelerating progress
Status: On target for completion`,

    infographic: `INFOGRAPHIC: ${title}

📊 Key Insight: Organizations see 35% improvement in outcomes

Three Pillars of Success:
1. Strategic Planning
2. Team Alignment
3. Continuous Optimization

Stat: 90% of teams report better collaboration`,
  };

  const content = templates[contentType] || `Content: ${title}\n\nProfessional marketing asset created for ${title}.`;

  return {
    content,
    preview: `✨ ${contentType.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Ready`,
  };
}
