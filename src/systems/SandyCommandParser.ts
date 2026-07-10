import type { Employee, Task } from '@/types/employee';

export interface ParsedCommand {
  type: 'task_list' | 'campaign_query' | 'mark_complete' | 'waiting_tasks' |
         'team_member_tasks' | 'active_campaigns' | 'unknown' | 'new_brief';
  query: string;
  parameter?: string;
}

export interface TaskSummary {
  id: string;
  title: string;
  employeeName: string;
  priority: string;
  status: string;
  campaign?: string;
}

export interface CampaignSummary {
  name: string;
  totalTasks: number;
  completedTasks: number;
  tasks: TaskSummary[];
}

export class SandyCommandParser {
  parseCommand(input: string): ParsedCommand {
    const lowerInput = input.toLowerCase().trim();

    // Task list queries
    if (/what are my tasks|what do i need to do today|show me my tasks/i.test(lowerInput)) {
      return { type: 'task_list', query: input };
    }

    // Campaign-specific queries
    const campaignMatch = /what's outstanding on|status of|tasks for campaign|tell me about campaign\s+(.+?)(\?|$)/i.exec(input);
    if (campaignMatch) {
      return { type: 'campaign_query', query: input, parameter: campaignMatch[1]?.trim() };
    }

    // Mark task as done
    const markMatch = /mark\s+(.+?)\s+(?:as done|complete|finished)|(done with|completed?)\s+(.+)/i.exec(input);
    if (markMatch) {
      const taskName = markMatch[1] || markMatch[3];
      return { type: 'mark_complete', query: input, parameter: taskName?.trim() };
    }

    // Waiting/blocked tasks
    if (/what's waiting|what's blocked|show waiting|show blocked|waiting for approval|blocked tasks/i.test(lowerInput)) {
      return { type: 'waiting_tasks', query: input };
    }

    // Team member tasks
    const memberMatch = /what (?:has|does)\s+(.+?)\s+(?:have|got)\s+on|tasks for\s+(.+?)(\?|$)/i.exec(input);
    if (memberMatch) {
      const memberName = memberMatch[1] || memberMatch[2];
      return { type: 'team_member_tasks', query: input, parameter: memberName?.trim() };
    }

    // Active campaigns
    if (/what campaigns.*active|show.*campaigns|list.*campaigns|active campaigns/i.test(lowerInput)) {
      return { type: 'active_campaigns', query: input };
    }

    return { type: 'unknown', query: input };
  }

  executeCommand(
    command: ParsedCommand,
    employees: Employee[]
  ): string {
    switch (command.type) {
      case 'task_list':
        return this.formatTaskList(employees);

      case 'campaign_query':
        return this.formatCampaignTasks(employees, command.parameter || '');

      case 'mark_complete':
        return this.markTaskComplete(employees, command.parameter || '');

      case 'waiting_tasks':
        return this.formatWaitingTasks(employees);

      case 'team_member_tasks':
        return this.formatTeamMemberTasks(employees, command.parameter || '');

      case 'active_campaigns':
        return this.formatActiveCampaigns(employees);

      default:
        return '';
    }
  }

  private formatTaskList(employees: Employee[]): string {
    const openTasks = this.getOpenTasks(employees);

    if (openTasks.length === 0) {
      return 'No open tasks — the team is clear!';
    }

    // Group by campaign
    const byCampaign: Record<string, TaskSummary[]> = {};
    openTasks.forEach((task) => {
      const campaign = task.campaign || 'Unassigned';
      if (!byCampaign[campaign]) byCampaign[campaign] = [];
      byCampaign[campaign].push(task);
    });

    const sections = Object.entries(byCampaign).map(([campaign, tasks]) => {
      const taskLines = tasks
        .sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) -
                 (priorityOrder[b.priority as keyof typeof priorityOrder] || 3);
        })
        .map(t => `  • ${t.title} (${t.employeeName} — ${t.priority})`)
        .join('\n');

      return `**${campaign}**\n${taskLines}`;
    });

    return sections.join('\n\n');
  }

  private formatCampaignTasks(employees: Employee[], campaignParam: string): string {
    const allTasks = this.getAllTasks(employees);

    // Find matching campaign (case insensitive, partial match)
    const matchedCampaign = Object.keys(
      allTasks.reduce((acc: Record<string, TaskSummary[]>, task) => {
        const c = task.campaign || 'Unassigned';
        if (!acc[c]) acc[c] = [];
        acc[c].push(task);
        return acc;
      }, {})
    ).find(c => c.toLowerCase().includes(campaignParam.toLowerCase()));

    if (!matchedCampaign) {
      return `Campaign "${campaignParam}" not found. Try "what campaigns are active?"`;
    }

    const campaignTasks = allTasks.filter(
      t => (t.campaign || 'Unassigned') === matchedCampaign && t.status !== 'complete'
    );

    if (campaignTasks.length === 0) {
      return `No outstanding tasks for "${matchedCampaign}".`;
    }

    const taskLines = campaignTasks.map(
      t => `  • ${t.title} — ${t.employeeName} (${t.status})`
    ).join('\n');

    return `**Outstanding on ${matchedCampaign}**\n${taskLines}`;
  }

  private markTaskComplete(employees: Employee[], taskParam: string): string {
    const allTasks = this.getAllTasks(employees);

    // Find closest matching task (fuzzy match)
    const matched = allTasks.find(t =>
      t.title.toLowerCase().includes(taskParam.toLowerCase()) ||
      taskParam.toLowerCase().includes(t.title.toLowerCase())
    );

    if (!matched) {
      return `Task "${taskParam}" not found.`;
    }

    // Find and update the task
    for (const employee of employees) {
      for (const task of employee.tasks) {
        if (task.id === matched.id) {
          task.status = 'complete' as any;
          task.updatedAt = new Date().toISOString();
          task.completedAt = new Date().toISOString();
          return `Done — "${matched.title}" marked complete.`;
        }
      }
    }

    return `Could not update task "${taskParam}".`;
  }

  private formatWaitingTasks(employees: Employee[]): string {
    const allTasks = this.getAllTasks(employees);
    const waiting = allTasks.filter(t =>
      t.status === 'waiting_approval' || t.status === 'waiting_review' ||
      t.status === 'waiting_john_approval' || t.status === 'blocked'
    );

    if (waiting.length === 0) {
      return 'Nothing blocked or waiting — smooth sailing!';
    }

    const taskLines = waiting.map(t =>
      `  • ${t.title} — ${t.employeeName} (${t.status})`
    ).join('\n');

    return `**Tasks waiting or blocked**\n${taskLines}`;
  }

  private formatTeamMemberTasks(employees: Employee[], memberParam: string): string {
    const employee = employees.find(e =>
      e.name?.toLowerCase().includes(memberParam.toLowerCase()) ||
      e.role?.toLowerCase().includes(memberParam.toLowerCase())
    );

    if (!employee) {
      return `Team member "${memberParam}" not found.`;
    }

    const openTasks = employee.tasks.filter(t => t.status !== 'complete');

    if (openTasks.length === 0) {
      return `${employee.name} has nothing on — available for work.`;
    }

    const taskLines = openTasks.map(t =>
      `  • ${t.title} — ${t.campaign || 'Unassigned'} (${t.priority})`
    ).join('\n');

    return `**${employee.name}'s workload**\n${taskLines}`;
  }

  private formatActiveCampaigns(employees: Employee[]): string {
    const allTasks = this.getAllTasks(employees);
    const byCampaign: Record<string, TaskSummary[]> = {};

    allTasks.forEach(task => {
      const campaign = task.campaign || 'Unassigned';
      if (!byCampaign[campaign]) byCampaign[campaign] = [];
      byCampaign[campaign].push(task);
    });

    const campaigns = Object.entries(byCampaign)
      .filter(([_, tasks]) => tasks.some(t => t.status !== 'complete'))
      .map(([name, tasks]) => {
        const completed = tasks.filter(t => t.status === 'complete').length;
        return `  • ${name} — ${completed} of ${tasks.length} complete`;
      });

    if (campaigns.length === 0) {
      return 'No active campaigns.';
    }

    return `**Active campaigns**\n${campaigns.join('\n')}`;
  }

  private getOpenTasks(employees: Employee[]): TaskSummary[] {
    return this.getAllTasks(employees).filter(t => t.status !== 'complete')
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) -
               (priorityOrder[b.priority as keyof typeof priorityOrder] || 3);
      });
  }

  private getAllTasks(employees: Employee[]): TaskSummary[] {
    const tasks: TaskSummary[] = [];
    employees.forEach(emp => {
      emp.tasks.forEach(task => {
        tasks.push({
          id: task.id,
          title: task.title,
          employeeName: emp.name,
          priority: task.priority,
          status: task.status,
          campaign: task.campaign,
        });
      });
    });
    return tasks;
  }
}
