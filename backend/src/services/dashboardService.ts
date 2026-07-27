import * as marketingRepo from '../db/marketingRepository.js';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface DashboardInput {
  objectiveId: string;
  marketAnalysis?: string;
  competitors?: string[];
  assumptions?: Record<string, string>;
}

interface GeneratedDashboard {
  title: string;
  strategy: string;
  tactics: string[];
  metrics: Record<string, string>;
}

export async function generateDashboard(input: DashboardInput): Promise<GeneratedDashboard> {
  const objective = marketingRepo.getObjective(input.objectiveId);
  if (!objective) {
    throw new Error(`Objective ${input.objectiveId} not found`);
  }

  // Save context for future reference
  const context = marketingRepo.saveDashboardContext({
    objectiveId: input.objectiveId,
    marketAnalysis: input.marketAnalysis || '',
    competitors: input.competitors || [],
    assumptions: input.assumptions || {}
  });

  const prompt = buildPrompt(objective, input);

  const response = await callClaude(prompt);

  const dashboard = parseClaudeResponse(response);

  // Save as strategy snapshot
  marketingRepo.saveStrategySnapshot({
    objectiveId: input.objectiveId,
    title: dashboard.title,
    strategy: dashboard.strategy,
    tactics: dashboard.tactics,
    metrics: dashboard.metrics
  });

  return dashboard;
}

function buildPrompt(objective: marketingRepo.MarketingObjective, input: DashboardInput): string {
  const assumptionsText = Object.entries(input.assumptions || {})
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  return `You are a strategic marketing intelligence partner for ${objective.brand}.

BUSINESS OBJECTIVE:
${objective.title}

DESCRIPTION:
${objective.description}

TARGET AUDIENCE:
${objective.targetAudience}

KEY PERFORMANCE INDICATORS:
${objective.kpis.join('\n')}

TIMEFRAME: ${objective.timeframe}
BUDGET: ${objective.budget ? '$' + objective.budget : 'Not specified'}

${input.marketAnalysis ? 'MARKET ANALYSIS:\n' + input.marketAnalysis + '\n' : ''}
${input.competitors && input.competitors.length > 0 ? 'COMPETITORS:\n' + input.competitors.join('\n') + '\n' : ''}
${assumptionsText ? 'KEY ASSUMPTIONS:\n' + assumptionsText + '\n' : ''}

Generate a comprehensive marketing dashboard with:
1. A strategic title for this campaign
2. A concise strategy overview (2-3 paragraphs)
3. 5-7 specific tactics aligned with the objective
4. Key metrics to track success

Format your response as JSON with this structure:
{
  "title": "Campaign Title",
  "strategy": "Strategic overview...",
  "tactics": ["Tactic 1", "Tactic 2", ...],
  "metrics": {
    "metricName": "How to measure",
    ...
  }
}`;
}

async function callClaude(prompt: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  const data = await response.json() as any;
  return data.content[0].text;
}

function parseClaudeResponse(response: string): GeneratedDashboard {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse Claude response as JSON');
  }

  const parsed = JSON.parse(jsonMatch[0]) as GeneratedDashboard;

  if (!parsed.title || !parsed.strategy || !Array.isArray(parsed.tactics) || !parsed.metrics) {
    throw new Error('Invalid dashboard structure from Claude');
  }

  return parsed;
}
