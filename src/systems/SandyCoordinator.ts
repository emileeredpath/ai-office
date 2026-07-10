import type { Employee, Task, TaskStatus } from '@/types/employee';

export interface CampaignWorkflow {
  campaignName: string;
  summary: string;
  tasks: TaskDefinition[];
}

export interface TaskDefinition {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  suggestedAssignee?: string;
}

export type SandyIntent = 'brief' | 'task_query' | 'campaign_query' | 'unknown';

export class SandyCoordinator {
  private employees: Employee[];

  constructor(employees: Employee[]) {
    this.employees = employees;
  }

  /**
   * Detect user intent from input
   */
  detectIntent(input: string): SandyIntent {
    const lower = input.toLowerCase();

    if (lower.includes('what are my tasks') || lower.includes('show my tasks') || lower.includes('my tasks')) {
      return 'task_query';
    }

    if (
      lower.includes('what\'s outstanding') ||
      lower.includes('what is outstanding') ||
      lower.includes('outstanding on') ||
      lower.includes('status of') ||
      lower.includes('update on')
    ) {
      return 'campaign_query';
    }

    if (
      lower.match(/^(create|plan|brief|launch|start|develop|build)\b/) ||
      lower.includes('campaign') ||
      lower.includes('initiative') ||
      lower.length > 20
    ) {
      return 'brief';
    }

    return 'unknown';
  }

  /**
   * Extract campaign name from input
   */
  extractCampaignName(input: string): string {
    const briefMatch = input.match(/(?:campaign|brief|project|initiative)?\s*:?\s*([^.!?]{10,100})/i);
    if (briefMatch) {
      return briefMatch[1].trim().substring(0, 50);
    }
    return `Campaign - ${new Date().toLocaleDateString()}`;
  }

  /**
   * Extract campaign name from query for lookup
   */
  extractCampaignForQuery(input: string): string | null {
    const match = input.match(/on\s+(?:the\s+)?([^?!.]+)/i);
    if (match) {
      return match[1].trim();
    }
    return null;
  }

  /**
   * Generate campaign workflow using local pattern-based generation
   * No API calls needed - works offline
   */
  async generateCampaignWorkflow(brief: string): Promise<CampaignWorkflow> {
    // Detect campaign type from keywords
    const lower = brief.toLowerCase();
    const campaignName = this.extractCampaignName(brief);

    let type = 'general';
    if (lower.includes('email') || lower.includes('newsletter')) type = 'email';
    else if (lower.includes('social') || lower.includes('post') || lower.includes('instagram') || lower.includes('twitter')) type = 'social';
    else if (lower.includes('case study') || lower.includes('case-study')) type = 'case_study';
    else if (lower.includes('website') || lower.includes('web') || lower.includes('landing')) type = 'website';
    else if (lower.includes('blog') || lower.includes('article') || lower.includes('content')) type = 'blog';
    else if (lower.includes('seo') || lower.includes('search') || lower.includes('ppc') || lower.includes('ads')) type = 'seo_ppc';
    else if (lower.includes('launch') || lower.includes('product') || lower.includes('release')) type = 'launch';
    else if (lower.includes('promotion') || lower.includes('promo') || lower.includes('sale') || lower.includes('discount')) type = 'promotion';

    const workflows: Record<string, TaskDefinition[]> = {
      email: [
        { title: 'Define email strategy & goals', description: 'Outline campaign objectives', priority: 'high', suggestedAssignee: 'Email Marketing Manager' },
        { title: 'Research competitor emails', description: 'Analyze similar campaigns', priority: 'medium', suggestedAssignee: 'Marketing Director' },
        { title: 'Write email copy', description: 'Draft compelling subject & body', priority: 'high', suggestedAssignee: 'Email Marketing Manager' },
        { title: 'Create email graphics/design', description: 'Design visual elements', priority: 'high', suggestedAssignee: 'Social Media Manager' },
        { title: 'Get approval from John', description: 'Review & approve email', priority: 'high', suggestedAssignee: 'Marketing Director' },
        { title: 'Set up email segments', description: 'Define audience targeting', priority: 'medium', suggestedAssignee: 'Email Marketing Manager' },
        { title: 'Schedule email send', description: 'Set send time & timezone', priority: 'medium', suggestedAssignee: 'Email Marketing Manager' },
        { title: 'Monitor open rates & clicks', description: 'Track engagement metrics', priority: 'low', suggestedAssignee: 'Marketing Director' },
      ],
      social: [
        { title: 'Define social strategy', description: 'Set posting schedule & platforms', priority: 'high', suggestedAssignee: 'Social Media Manager' },
        { title: 'Create social content calendar', description: 'Plan content themes', priority: 'high', suggestedAssignee: 'Social Media Manager' },
        { title: 'Design social graphics', description: 'Create visual assets', priority: 'high', suggestedAssignee: 'Social Media Manager' },
        { title: 'Write social copy', description: 'Craft engaging captions', priority: 'medium', suggestedAssignee: 'Social Media Manager' },
        { title: 'Get approval from John', description: 'Review social content', priority: 'high', suggestedAssignee: 'Marketing Director' },
        { title: 'Schedule posts across platforms', description: 'Set up posting schedule', priority: 'medium', suggestedAssignee: 'Social Media Manager' },
        { title: 'Monitor engagement', description: 'Track likes, comments, shares', priority: 'medium', suggestedAssignee: 'Social Media Manager' },
        { title: 'Respond to comments', description: 'Engage with audience', priority: 'low', suggestedAssignee: 'Social Media Manager' },
      ],
      case_study: [
        { title: 'Define case study scope', description: 'Choose topic & outcomes', priority: 'high', suggestedAssignee: 'Case Study Writer' },
        { title: 'Interview client', description: 'Gather success story details', priority: 'high', suggestedAssignee: 'Case Study Writer' },
        { title: 'Outline case study', description: 'Create structure & flow', priority: 'high', suggestedAssignee: 'Case Study Writer' },
        { title: 'Write case study draft', description: 'Full first draft', priority: 'high', suggestedAssignee: 'Case Study Writer' },
        { title: 'Edit & refine content', description: 'Polish writing & clarity', priority: 'medium', suggestedAssignee: 'Marketing Director' },
        { title: 'Get approval from John', description: 'Final review & approval', priority: 'high', suggestedAssignee: 'Marketing Director' },
        { title: 'Create case study graphics', description: 'Design layout & visuals', priority: 'medium', suggestedAssignee: 'Social Media Manager' },
        { title: 'Publish to website', description: 'Upload & format on site', priority: 'medium', suggestedAssignee: 'Website Manager' },
        { title: 'Create supporting blog post', description: 'Write companion article', priority: 'low', suggestedAssignee: 'Case Study Writer' },
        { title: 'Promote via social & email', description: 'Share case study', priority: 'low', suggestedAssignee: 'Social Media Manager' },
      ],
      website: [
        { title: 'Audit current website', description: 'Review existing pages', priority: 'medium', suggestedAssignee: 'Website Manager' },
        { title: 'Define website goals', description: 'Set conversion targets', priority: 'high', suggestedAssignee: 'Marketing Director' },
        { title: 'Write website copy', description: 'Create page content', priority: 'high', suggestedAssignee: 'Proposal Writer' },
        { title: 'Design website layout', description: 'Create wireframes & mockups', priority: 'high', suggestedAssignee: 'Social Media Manager' },
        { title: 'Get approval from John', description: 'Review website design', priority: 'high', suggestedAssignee: 'Marketing Director' },
        { title: 'Implement website changes', description: 'Build & code pages', priority: 'high', suggestedAssignee: 'Website Manager' },
        { title: 'Test website functionality', description: 'Check all links & forms', priority: 'medium', suggestedAssignee: 'Website Manager' },
        { title: 'Set up analytics tracking', description: 'Install tracking code', priority: 'medium', suggestedAssignee: 'Website Manager' },
        { title: 'Launch website', description: 'Go live with new pages', priority: 'high', suggestedAssignee: 'Website Manager' },
      ],
      blog: [
        { title: 'Choose blog topic', description: 'Research keywords & audience', priority: 'high', suggestedAssignee: 'Case Study Writer' },
        { title: 'Create blog outline', description: 'Structure main points', priority: 'high', suggestedAssignee: 'Case Study Writer' },
        { title: 'Write blog post', description: 'Full first draft (800+ words)', priority: 'high', suggestedAssignee: 'Case Study Writer' },
        { title: 'Edit for SEO', description: 'Optimize keywords & structure', priority: 'medium', suggestedAssignee: 'SEO & PPC Manager' },
        { title: 'Get approval from John', description: 'Final review & edit', priority: 'high', suggestedAssignee: 'Marketing Director' },
        { title: 'Create blog graphics', description: 'Design featured image', priority: 'medium', suggestedAssignee: 'Social Media Manager' },
        { title: 'Publish blog post', description: 'Upload & format on site', priority: 'medium', suggestedAssignee: 'Website Manager' },
        { title: 'Promote blog via social', description: 'Share on social platforms', priority: 'medium', suggestedAssignee: 'Social Media Manager' },
        { title: 'Email list announcement', description: 'Send to email subscribers', priority: 'medium', suggestedAssignee: 'Email Marketing Manager' },
      ],
      seo_ppc: [
        { title: 'Conduct keyword research', description: 'Find target keywords', priority: 'high', suggestedAssignee: 'SEO & PPC Manager' },
        { title: 'Audit current SEO', description: 'Analyze existing rankings', priority: 'medium', suggestedAssignee: 'SEO & PPC Manager' },
        { title: 'Create content strategy', description: 'Plan content for rankings', priority: 'high', suggestedAssignee: 'SEO & PPC Manager' },
        { title: 'Set up PPC campaign', description: 'Create ad groups & keywords', priority: 'high', suggestedAssignee: 'SEO & PPC Manager' },
        { title: 'Write ad copy', description: 'Create compelling ads', priority: 'high', suggestedAssignee: 'Proposal Writer' },
        { title: 'Get approval from John', description: 'Review strategy & ads', priority: 'high', suggestedAssignee: 'Marketing Director' },
        { title: 'Launch PPC campaigns', description: 'Go live with ads', priority: 'high', suggestedAssignee: 'SEO & PPC Manager' },
        { title: 'Monitor PPC performance', description: 'Track clicks & conversions', priority: 'medium', suggestedAssignee: 'SEO & PPC Manager' },
        { title: 'Optimize bids & keywords', description: 'Improve ROI', priority: 'medium', suggestedAssignee: 'SEO & PPC Manager' },
      ],
      launch: [
        { title: 'Define launch strategy', description: 'Plan messaging & timing', priority: 'high', suggestedAssignee: 'Marketing Director' },
        { title: 'Create launch landing page', description: 'Build conversion page', priority: 'high', suggestedAssignee: 'Website Manager' },
        { title: 'Write launch copy', description: 'Create compelling messaging', priority: 'high', suggestedAssignee: 'Proposal Writer' },
        { title: 'Design launch graphics', description: 'Create visual assets', priority: 'high', suggestedAssignee: 'Social Media Manager' },
        { title: 'Create email campaign', description: 'Plan launch email sequence', priority: 'high', suggestedAssignee: 'Email Marketing Manager' },
        { title: 'Get approval from John', description: 'Review all launch materials', priority: 'high', suggestedAssignee: 'Marketing Director' },
        { title: 'Set up tracking', description: 'Track signups & conversions', priority: 'medium', suggestedAssignee: 'Website Manager' },
        { title: 'Launch email campaign', description: 'Send launch emails', priority: 'high', suggestedAssignee: 'Email Marketing Manager' },
        { title: 'Promote on social media', description: 'Launch social campaign', priority: 'high', suggestedAssignee: 'Social Media Manager' },
        { title: 'Monitor launch metrics', description: 'Track performance', priority: 'medium', suggestedAssignee: 'Marketing Director' },
      ],
      promotion: [
        { title: 'Define promotion details', description: 'Set discount & timeframe', priority: 'high', suggestedAssignee: 'Marketing Director' },
        { title: 'Create promotional graphics', description: 'Design banners & assets', priority: 'high', suggestedAssignee: 'Social Media Manager' },
        { title: 'Write promotional copy', description: 'Create persuasive messaging', priority: 'high', suggestedAssignee: 'Proposal Writer' },
        { title: 'Get approval from John', description: 'Review promotion details', priority: 'high', suggestedAssignee: 'Marketing Director' },
        { title: 'Set up email campaign', description: 'Create promotion email', priority: 'high', suggestedAssignee: 'Email Marketing Manager' },
        { title: 'Schedule social posts', description: 'Plan social promotion', priority: 'high', suggestedAssignee: 'Social Media Manager' },
        { title: 'Update website', description: 'Add promotion banner', priority: 'medium', suggestedAssignee: 'Website Manager' },
        { title: 'Launch promotion', description: 'Go live with all channels', priority: 'high', suggestedAssignee: 'Marketing Director' },
        { title: 'Monitor engagement', description: 'Track clicks & conversions', priority: 'medium', suggestedAssignee: 'Marketing Director' },
      ],
      general: [
        { title: 'Define campaign strategy', description: 'Set goals & approach', priority: 'high', suggestedAssignee: 'Marketing Director' },
        { title: 'Research target audience', description: 'Understand customer needs', priority: 'high', suggestedAssignee: 'Marketing Director' },
        { title: 'Create campaign calendar', description: 'Plan timeline & milestones', priority: 'medium', suggestedAssignee: 'Marketing Director' },
        { title: 'Develop messaging', description: 'Create campaign narrative', priority: 'high', suggestedAssignee: 'Proposal Writer' },
        { title: 'Create campaign assets', description: 'Design graphics & content', priority: 'high', suggestedAssignee: 'Social Media Manager' },
        { title: 'Get approval from John', description: 'Review campaign direction', priority: 'high', suggestedAssignee: 'Marketing Director' },
        { title: 'Execute across channels', description: 'Launch on email, social, web', priority: 'high', suggestedAssignee: 'Email Marketing Manager' },
        { title: 'Monitor campaign performance', description: 'Track metrics & engagement', priority: 'medium', suggestedAssignee: 'Marketing Director' },
        { title: 'Optimize underperforming areas', description: 'Adjust strategy if needed', priority: 'medium', suggestedAssignee: 'Marketing Director' },
      ],
    };

    const tasks = workflows[type] || workflows.general;
    const summary = `${campaignName} - ${type.replace(/_/g, ' ')} campaign`;

    // Simulate async processing
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      campaignName,
      summary,
      tasks: tasks.slice(0, 12), // Cap at 12 tasks
    };
  }

  /**
   * Convert workflow tasks to storable Task objects
   */
  createTasksFromWorkflow(
    workflow: CampaignWorkflow,
    employees: Employee[]
  ): Array<{ employeeId: string; task: Omit<Task, 'status' | 'updatedAt' | 'notes'> }> {
    const result: Array<{ employeeId: string; task: Omit<Task, 'status' | 'updatedAt' | 'notes'> }> = [];

    for (const taskDef of workflow.tasks) {
      let assigneeId = 'marketing-director';

      if (taskDef.suggestedAssignee) {
        const lower = taskDef.suggestedAssignee.toLowerCase();
        if (lower.includes('social')) assigneeId = 'social-media-manager';
        else if (lower.includes('email')) assigneeId = 'email-marketing-manager';
        else if (lower.includes('seo') || lower.includes('ppc')) assigneeId = 'seo-ppc-manager';
        else if (lower.includes('website')) assigneeId = 'website-auditor';
        else if (lower.includes('case study')) assigneeId = 'case-study-writer';
        else if (lower.includes('proposal')) assigneeId = 'proposal-writer';
        else if (lower.includes('funding') || lower.includes('rewards')) assigneeId = 'funding-rewards-manager';
      }

      result.push({
        employeeId: assigneeId,
        task: {
          id: `task-${workflow.campaignName}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: taskDef.title,
          description: taskDef.description,
          priority: taskDef.priority,
          createdAt: new Date().toISOString(),
          assignedBy: 'sandy',
          campaign: workflow.campaignName,
        },
      });
    }

    return result;
  }

  /**
   * Generate response message for brief submission
   */
  generateBriefResponse(workflow: CampaignWorkflow, taskCount: number): string {
    const lines = [
      `Campaign: ${workflow.campaignName}`,
      workflow.summary,
      `Created ${taskCount} tasks across the team.`,
    ];

    return lines.join('\n');
  }

  /**
   * Generate response for task queries
   */
  generateTaskQueryResponse(allTasks: Task[], openTasks: Task[]): string {
    if (openTasks.length === 0) {
      return 'No open tasks. Team is caught up!';
    }

    const byCampaign = new Map<string, Task[]>();
    for (const task of openTasks) {
      const campaign = task.campaign || 'Other';
      if (!byCampaign.has(campaign)) {
        byCampaign.set(campaign, []);
      }
      byCampaign.get(campaign)!.push(task);
    }

    const lines: string[] = [];
    for (const [campaign, tasks] of byCampaign.entries()) {
      lines.push(`${campaign} (${tasks.length}):`);
      tasks.slice(0, 3).forEach((t) => {
        lines.push(`  • ${t.title}`);
      });
      if (tasks.length > 3) {
        lines.push(`  ... and ${tasks.length - 3} more`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate response for campaign-specific queries
   */
  generateCampaignQueryResponse(campaignName: string, tasks: Task[]): string {
    if (tasks.length === 0) {
      return `No tasks found for "${campaignName}".`;
    }

    const byStatus = new Map<TaskStatus, Task[]>();
    for (const task of tasks) {
      if (!byStatus.has(task.status)) {
        byStatus.set(task.status, []);
      }
      byStatus.get(task.status)!.push(task);
    }

    const lines: string[] = [`${campaignName} Status:`];

    const statusOrder: TaskStatus[] = [
      'in_progress',
      'waiting_review',
      'waiting_john_approval',
      'assigned',
      'awaiting_brief',
      'blocked',
      'complete',
    ];

    for (const status of statusOrder) {
      const tasksWithStatus = byStatus.get(status);
      if (tasksWithStatus && tasksWithStatus.length > 0) {
        lines.push(`${status.replace(/_/g, ' ')}: ${tasksWithStatus.length}`);
        tasksWithStatus.slice(0, 2).forEach((t) => {
          lines.push(`  • ${t.title}`);
        });
      }
    }

    return lines.join('\n');
  }

  /**
   * Suggest missing tasks for a campaign based on best practices
   */
  suggestMissingTasks(campaignName: string, existingTasks: Task[], workflow?: CampaignWorkflow): Task[] {
    const suggestions: Task[] = [];
    const existingTitles = new Set(existingTasks.map((t) => t.title.toLowerCase()));

    const commonTasks = [
      { title: 'Get approval from John', priority: 'high' as const },
      { title: 'Schedule content distribution', priority: 'medium' as const },
      { title: 'Create analytics dashboard', priority: 'low' as const },
    ];

    for (const task of commonTasks) {
      if (!existingTitles.has(task.title.toLowerCase())) {
        suggestions.push({
          id: `suggestion-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: task.title,
          description: `Recommended for ${campaignName}`,
          priority: task.priority,
          status: 'backlog',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notes: [],
          campaign: campaignName,
          assignedBy: 'sandy',
        });
      }
    }

    return suggestions;
  }
}
