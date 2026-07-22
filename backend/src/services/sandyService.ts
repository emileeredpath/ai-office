import { Anthropic } from 'anthropic';
import { query } from '../db/connection.js';
import { knowledgeService } from './knowledgeService.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ChatContext {
  companyId: string;
  userId: string;
  userName: string;
  conversationHistory: Array<{ role: string; content: string }>;
}

export class SandyService {
  private getSystemPrompt(companyId: string): string {
    return `You are Sandy, the AI Orchestrator for Emilee Media. You help manage the team's work, delegate tasks, and keep everyone organized.

## Your Role & Authority
You have Executive Authority, which means you can:
- Assign tasks to team members
- Create new tasks
- Delegate work to specialist AIs
- Monitor team workload and status
- Recommend process improvements
- Answer questions about operations

You CANNOT:
- Hire or fire humans
- Change company policies or Constitution
- Make spending decisions over $10,000
- Override human decisions (but you can provide recommendations)

## Your Team
You work with:
- **John** (Managing Director) - Constitutional Authority, final decision maker
- **Emilee** (Marketing Director) - Leads marketing domain
- **Sally** (Content Manager) - Creates content
- **Finance AI** - Handles invoice approvals up to $50k
- **Content AI** - Reviews and improves written content
- **Marketing AI** - Analyzes marketing metrics

## How You Operate
1. When asked for task assignments, suggest based on expertise and current workload
2. When creating tasks, set clear titles, descriptions, and priorities
3. Keep track of team capacity - don't overload people
4. Escalate to John for strategic decisions or policy changes
5. Always explain your reasoning when recommending actions
6. Be collaborative - ask for input rather than command

## Example Interactions
- User: "I need a blog post written" → You: "I can assign that to Sally. She has 1 task in progress. Would you like me to create the task?"
- User: "Review invoices totaling $35k" → You: "I'll route this to Finance AI since it's under their $50k threshold"
- User: "Change our hiring process" → You: "That's a policy decision for John. I can set up a meeting to discuss?"

When you suggest actions, be specific and actionable. Always ask before executing changes.`;
  }

  async getConversationContext(conversationId: string): Promise<ChatContext['conversationHistory']> {
    const result = await query(
      `SELECT sender_id, role, content FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversationId]
    );

    return result.rows.map((row: any) => ({
      role: row.role,
      content: row.content,
    }));
  }

  async generateResponse(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    companyId?: string
  ): Promise<string> {
    const messages = [
      ...conversationHistory,
      {
        role: 'user' as const,
        content: userMessage,
      },
    ];

    // Fetch constitution for context (optional, can fail gracefully)
    let constitutionContext = '';
    if (companyId) {
      try {
        constitutionContext = await knowledgeService.getConstitution(companyId);
      } catch (error) {
        console.warn('Could not fetch constitution:', error);
      }
    }

    let systemPrompt = this.getSystemPrompt(companyId || 'default');
    if (constitutionContext) {
      systemPrompt += `\n\n## Organization Constitution\n${constitutionContext}`;
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  async getTeamSummary(companyId: string): Promise<string> {
    const employeesResult = await query(
      `SELECT name, role, status FROM ai_employees
       WHERE company_id = $1 AND is_ai = false
       ORDER BY name`,
      [companyId]
    );

    const tasksResult = await query(
      `SELECT employee_id, COUNT(*) as count, status FROM tasks
       WHERE company_id = $1
       GROUP BY employee_id, status`,
      [companyId]
    );

    let summary = 'Team Status:\n';

    for (const employee of employeesResult.rows) {
      summary += `\n${employee.name} (${employee.role}) - ${employee.status}`;
      const employeeTasks = tasksResult.rows.filter((t: any) => t.employee_id === employee.id);
      if (employeeTasks.length > 0) {
        summary += '\n  Tasks: ';
        summary += employeeTasks
          .map((t: any) => `${t.count} ${t.status}`)
          .join(', ');
      } else {
        summary += '\n  Tasks: None';
      }
    }

    return summary;
  }

  async suggestTaskAssignment(
    taskTitle: string,
    companyId: string
  ): Promise<{ employeeId: string; employeeName: string; reason: string }[]> {
    const employeesResult = await query(
      `SELECT id, name, role FROM ai_employees
       WHERE company_id = $1 AND is_ai = false
       ORDER BY name`,
      [companyId]
    );

    const suggestions = [];

    // Simple heuristic: match role to task keywords
    for (const employee of employeesResult.rows) {
      const role = employee.role.toLowerCase();
      const taskLower = taskTitle.toLowerCase();

      if (role.includes('marketing') && taskLower.includes('marketing')) {
        suggestions.push({
          employeeId: employee.id,
          employeeName: employee.name,
          reason: 'Matches marketing domain',
        });
      } else if (role.includes('content') && (taskLower.includes('write') || taskLower.includes('content'))) {
        suggestions.push({
          employeeId: employee.id,
          employeeName: employee.name,
          reason: 'Matches content creation role',
        });
      }
    }

    return suggestions;
  }

  async suggestSpecialistAI(
    taskTitle: string,
    taskDescription: string,
    companyId: string
  ): Promise<{ aiEmployeeId: string; aiName: string; reason: string; canAutoHandle: boolean } | null> {
    const aiEmployeesResult = await query(
      `SELECT id, name FROM ai_employees
       WHERE company_id = $1 AND is_ai = true
       ORDER BY name`,
      [companyId]
    );

    const taskLower = `${taskTitle} ${taskDescription}`.toLowerCase();

    // Match task to specialist AI based on keywords
    for (const ai of aiEmployeesResult.rows) {
      const aiName = ai.name.toLowerCase();

      if (aiName.includes('finance') && (taskLower.includes('invoice') || taskLower.includes('invoice') || taskLower.includes('expense') || taskLower.includes('payment'))) {
        return {
          aiEmployeeId: ai.id,
          aiName: ai.name,
          reason: 'This is a financial task - Finance AI can handle invoice approvals',
          canAutoHandle: true,
        };
      } else if (aiName.includes('content') && (taskLower.includes('write') || taskLower.includes('edit') || taskLower.includes('review') || taskLower.includes('content'))) {
        return {
          aiEmployeeId: ai.id,
          aiName: ai.name,
          reason: 'This is a content task - Content AI can review and improve writing',
          canAutoHandle: true,
        };
      } else if (aiName.includes('marketing') && (taskLower.includes('campaign') || taskLower.includes('analysis') || taskLower.includes('metric') || taskLower.includes('roi'))) {
        return {
          aiEmployeeId: ai.id,
          aiName: ai.name,
          reason: 'This is a marketing task - Marketing AI can analyze and provide insights',
          canAutoHandle: true,
        };
      }
    }

    return null;
  }
}

export const sandyService = new SandyService();
