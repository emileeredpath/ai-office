import { REAL_TASKS, EMPLOYEES, BRANDS } from '@/data/mtechEmployees';

interface SandyRequest {
  message: string;
  context?: {
    userId?: string;
    currentRole?: string;
    recentTasks?: string[];
  };
}

interface SandyResponse {
  response: string;
  action?: 'status' | 'task_suggestion' | 'team_update' | 'deadline_alert' | 'help' | 'none';
  actionData?: Record<string, unknown>;
}

export async function askSandy(request: SandyRequest): Promise<SandyResponse> {
  const apiKey = localStorage.getItem('anthropic_api_key');

  if (!apiKey) {
    return {
      response:
        'I need your Anthropic API key to help you. Go to Settings → Anthropic API Configuration to add it.',
      action: 'none',
    };
  }

  try {
    const systemPrompt = buildSystemPrompt();
    const userMessage = buildUserMessage(request);

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
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Sandy API error:', error);
      return {
        response:
          error.error?.message || 'I encountered an error. Please check your API key in Settings.',
        action: 'none',
      };
    }

    const data = await response.json();
    const responseText = data.content[0].text;

    // Parse Sandy's response for actions
    const action = detectAction(responseText);

    return {
      response: responseText,
      action,
      actionData: extractActionData(responseText, action),
    };
  } catch (error) {
    console.error('Sandy error:', error);
    return {
      response: 'I had trouble connecting. Please check your internet and API key.',
      action: 'none',
    };
  }
}

function buildSystemPrompt(): string {
  const taskSummary = getTaskSummary();
  const teamSummary = getTeamSummary();

  return `You are Sandy, the Chief of Staff AI for MTech's marketing team. You help Emilee (Marketing Director) manage her team and workflow.

## Current Status
${taskSummary}

## Team
${teamSummary}

## Your Role
- Provide helpful, concise advice about tasks and team management
- Summarize team status and workload
- Suggest task prioritization
- Help with decision-making
- Answer questions about ongoing projects
- Be proactive about potential issues

## Communication Style
- Be conversational but professional
- Keep responses brief and actionable
- Use emojis occasionally for clarity
- When suggesting tasks, be specific about WHO should do WHAT
- Always consider team capacity and deadlines

## Important Context
- Deadlines are critical - flag anything at risk
- "Waiting for John" tasks are blockers - treat as high priority
- High workload (>80%) indicates team stress
- Always suggest concrete next steps`;
}

function buildUserMessage(request: SandyRequest): string {
  let message = request.message;

  if (request.context?.userId) {
    message += `\n\n[Context: User is ${request.context.userId}]`;
  }

  if (request.context?.recentTasks?.length) {
    message += `\n[Recent work: ${request.context.recentTasks.join(', ')}]`;
  }

  return message;
}

function getTaskSummary(): string {
  const total = REAL_TASKS.length;
  const complete = REAL_TASKS.filter((t) => t.status === 'complete').length;
  const inProgress = REAL_TASKS.filter((t) => t.status === 'in-progress').length;
  const waitingJohn = REAL_TASKS.filter((t) => t.status === 'waiting-john').length;
  const highPriority = REAL_TASKS.filter((t) => t.priority === 'high').length;

  return `- ${complete}/${total} tasks complete (${Math.round((complete / total) * 100)}%)
- ${inProgress} in progress
- ${waitingJohn} waiting for John (BLOCKERS)
- ${highPriority} high priority`;
}

function getTeamSummary(): string {
  const employees = Object.values(EMPLOYEES);
  const busy = employees.filter((e) => e.status === 'busy').length;
  const avgWorkload = Math.round(employees.reduce((sum, e) => sum + e.workload, 0) / employees.length);

  return `- ${busy}/${employees.length} currently busy
- Average workload: ${avgWorkload}%
- Team members: ${employees.map((e) => `${e.emoji} ${e.name}`).join(', ')}`;
}

function detectAction(response: string): SandyResponse['action'] {
  const text = response.toLowerCase();

  if (text.includes('should focus') || text.includes('prioritize')) {
    return 'task_suggestion';
  }
  if (text.includes('team') || text.includes('busy') || text.includes('workload')) {
    return 'team_update';
  }
  if (text.includes('deadline') || text.includes('due')) {
    return 'deadline_alert';
  }
  if (text.includes('here') || text.includes('help')) {
    return 'help';
  }

  return 'none';
}

function extractActionData(
  response: string,
  action: SandyResponse['action']
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  if (action === 'deadline_alert') {
    const deadlineTasks = REAL_TASKS.filter((t) => t.deadline).sort(
      (a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()
    );
    data.urgentTasks = deadlineTasks.slice(0, 3);
  }

  if (action === 'team_update') {
    data.teamStatus = Object.values(EMPLOYEES).map((e) => ({
      name: e.name,
      status: e.status,
      workload: e.workload,
    }));
  }

  return data;
}
