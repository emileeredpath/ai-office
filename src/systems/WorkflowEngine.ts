import type { Employee, Task } from '@/types/employee';
import type { RoutingResult } from './RoutingEngine';

export interface WorkflowEvent {
  id: string;
  timestamp: Date;
  type: 'task_assigned' | 'employee_briefed' | 'collaboration_suggested' | 'workflow_complete';
  employeeId: string;
  employeeName: string;
  message: string;
  taskId?: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  routing: RoutingResult;
  events: WorkflowEvent[];
  isActive: boolean;
  createdAt: Date;
}

export class WorkflowEngine {
  private campaigns: Map<string, Campaign> = new Map();
  private eventCallbacks: Array<(event: WorkflowEvent) => void> = [];

  createCampaign(
    description: string,
    routing: RoutingResult,
    employees: Employee[]
  ): Campaign {
    const campaignId = `campaign-${Date.now()}`;
    const campaign: Campaign = {
      id: campaignId,
      name: routing.campaignName,
      description,
      routing,
      events: [],
      isActive: true,
      createdAt: new Date(),
    };

    this.campaigns.set(campaignId, campaign);

    // Emit initial briefing event
    this.emitEvent({
      id: `event-${Date.now()}-1`,
      timestamp: new Date(),
      type: 'employee_briefed',
      employeeId: routing.primaryAssignee.id,
      employeeName: routing.primaryAssignee.name,
      message: `Got briefing: ${description}`,
    });

    return campaign;
  }

  assignTasks(
    campaignId: string,
    taskBreakdown: RoutingResult['taskBreakdown'],
    employees: Employee[]
  ): Task[] {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

    const createdTasks: Task[] = [];
    const now = new Date().toISOString();

    taskBreakdown.forEach((item, index) => {
      item.subtasks.forEach((subtask, subtaskIdx) => {
        const taskId = `task-${campaignId}-${index}-${subtaskIdx}`;
        const task: Task = {
          id: taskId,
          title: subtask,
          description: `Part of ${campaign.name}`,
          priority: index === 0 ? 'high' : 'medium',
          createdAt: now,
        };

        createdTasks.push(task);

        // Emit task assigned event
        this.emitEvent({
          id: `event-${Date.now()}-${subtaskIdx}`,
          timestamp: new Date(),
          type: 'task_assigned',
          employeeId: item.assignee.id,
          employeeName: item.assignee.name,
          message: `Task: "${subtask}"`,
          taskId,
        });

        // Brief delay before next event for staggered effect
        setTimeout(() => {}, 100 * subtaskIdx);
      });
    });

    // Emit collaboration suggestions
    campaign.routing.suggestedCollaborators.forEach((collaborator) => {
      this.emitEvent({
        id: `event-${Date.now()}-collab`,
        timestamp: new Date(Date.now() + 1000),
        type: 'collaboration_suggested',
        employeeId: collaborator.id,
        employeeName: collaborator.name,
        message: `Suggested to collaborate with ${campaign.routing.primaryAssignee.name}`,
      });
    });

    campaign.events = [
      ...campaign.events,
      ...createdTasks.map((task) => ({
        id: `event-${task.id}`,
        timestamp: new Date(),
        type: 'task_assigned' as const,
        employeeId: '',
        employeeName: '',
        message: task.title,
        taskId: task.id,
      })),
    ];

    return createdTasks;
  }

  generateSandyResponse(campaign: Campaign): string {
    const primary = campaign.routing.primaryAssignee;
    const collaborators = campaign.routing.suggestedCollaborators;
    const taskCount = campaign.routing.taskBreakdown.reduce(
      (sum, item) => sum + item.subtasks.length,
      0
    );

    let response = `✅ ${campaign.name} created.\n\n`;
    response += `🎯 Assigned to: ${primary.name}\n`;

    if (collaborators.length > 0) {
      response += `👥 Collaborators: ${collaborators.map((c) => c.name).join(', ')}\n`;
    }

    response += `📋 Total tasks: ${taskCount}\n`;
    response += `⏱️ Starting immediately...`;

    return response;
  }

  onEvent(callback: (event: WorkflowEvent) => void) {
    this.eventCallbacks.push(callback);
  }

  private emitEvent(event: WorkflowEvent) {
    const campaign = Array.from(this.campaigns.values()).find((c) =>
      c.events.some((e) => e.id === event.id)
    );
    if (campaign) {
      campaign.events.push(event);
    }

    this.eventCallbacks.forEach((callback) => callback(event));
  }

  getCampaign(campaignId: string): Campaign | undefined {
    return this.campaigns.get(campaignId);
  }

  getAllCampaigns(): Campaign[] {
    return Array.from(this.campaigns.values());
  }
}
