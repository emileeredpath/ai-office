import type { Employee, Task } from '@/types/employee';

export interface CampaignWorkflow {
  campaignName: string;
  tasks: Array<{
    employeeId: string;
    title: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
  }>;
}

const SYSTEM_PROMPT = `You are Sandy, Chief of Staff AI. Your job is to take a marketing campaign brief and break it down into specific, assignable tasks for team members.

When given a brief, respond ONLY with valid JSON in this exact format:
{
  "campaignName": "Brief Campaign Name",
  "tasks": [
    {
      "employeeId": "role-identifier",
      "title": "Specific task title",
      "priority": "high" | "medium" | "low",
      "description": "What needs to be done"
    }
  ]
}

CRITICAL: Respond ONLY with the JSON object. No markdown, no code blocks, no explanation.

Available team member roles:
- marketing-director: Overall strategy and approvals
- website-auditor: Website updates and optimization
- seo-ppc-manager: Search engine marketing
- email-marketing-manager: Email campaigns
- social-media-manager: Social media content
- case-study-writer: Technical content and case studies
- proposal-writer: Sales proposals and documentation
- funding-rewards-manager: Program management and partnerships`;

export class ClaudeWorkflowGenerator {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey?.trim()) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
  }

  async generateWorkflow(campaignBrief: string): Promise<CampaignWorkflow> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: campaignBrief,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as any;
      const content = data.content?.[0]?.text;

      if (!content) {
        throw new Error('No response from Claude API');
      }

      // Extract JSON from the response (handle markdown code blocks if present)
      let jsonText = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      const workflow: CampaignWorkflow = JSON.parse(jsonText);

      // Validate the response structure
      if (!workflow.campaignName || !Array.isArray(workflow.tasks)) {
        throw new Error('Invalid response structure from Claude');
      }

      // Validate each task
      for (const task of workflow.tasks) {
        if (!task.employeeId || !task.title || !task.priority || !task.description) {
          throw new Error('Task missing required fields');
        }
        if (!['high', 'medium', 'low'].includes(task.priority)) {
          throw new Error(`Invalid priority: ${task.priority}`);
        }
      }

      return workflow;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse Claude response as JSON: ${error.message}`);
      }
      throw error;
    }
  }

  createTasksFromWorkflow(
    workflow: CampaignWorkflow,
    employees: Employee[],
    campaignId: string = `campaign-${Date.now()}`
  ): Array<{ employeeId: string; task: Task }> {
    const tasks: Array<{ employeeId: string; task: Task }> = [];

    workflow.tasks.forEach((item, index) => {
      // Find matching employee or use the closest role match
      const employee = employees.find((e) => e.id === item.employeeId) ||
                       employees.find((e) => e.role === item.employeeId);

      if (employee) {
        const now = new Date().toISOString();
        const task: Task = {
          id: `task-${campaignId}-${item.employeeId}-${index}`,
          title: item.title,
          description: item.description,
          priority: item.priority,
          status: 'awaiting_brief',
          createdAt: now,
          updatedAt: now,
          notes: [],
          assignedBy: 'sandy',
          campaign: workflow.campaignName,
        };
        tasks.push({ employeeId: employee.id, task });
      }
    });

    return tasks;
  }
}
