import type { Employee, Task } from '@/types/employee';

export interface RoutingResult {
  primaryAssignee: Employee;
  suggestedCollaborators: Employee[];
  taskBreakdown: Array<{
    assignee: Employee;
    subtasks: string[];
    reasoning: string;
  }>;
  campaignName: string;
}

interface EmployeeCapabilities {
  id: string;
  name: string;
  keywords: string[];
  specialties: string[];
  maxCapacity: number;
  currentLoad: number;
}

export class RoutingEngine {
  private capabilities: EmployeeCapabilities[];

  constructor(employees: Employee[]) {
    this.capabilities = this.buildCapabilityMap(employees);
  }

  private buildCapabilityMap(employees: Employee[]): EmployeeCapabilities[] {
    // Map employees to their capabilities
    const roleToCapabilities: Record<string, EmployeeCapabilities> = {
      'marketing-director': {
        id: 'marketing-director',
        name: 'Marketing Director',
        keywords: ['strategy', 'campaign', 'plan', 'direction', 'overview', 'goals'],
        specialties: ['campaign strategy', 'quarterly planning', 'market analysis', 'team coordination'],
        maxCapacity: 100,
        currentLoad: 0,
      },
      'proposal-writer': {
        id: 'proposal-writer',
        name: 'Proposal Writer',
        keywords: ['proposal', 'pitch', 'client', 'contract', 'agreement', 'document'],
        specialties: ['sales proposals', 'pitch decks', 'client documents', 'formal writing'],
        maxCapacity: 100,
        currentLoad: 0,
      },
      'website-auditor': {
        id: 'website-auditor',
        name: 'Website Auditor',
        keywords: ['website', 'site', 'audit', 'seo', 'technical', 'performance', 'speed'],
        specialties: ['technical seo', 'ux audit', 'performance analysis', 'accessibility'],
        maxCapacity: 100,
        currentLoad: 0,
      },
      'seo-ppc-manager': {
        id: 'seo-ppc-manager',
        name: 'SEO & PPC Manager',
        keywords: ['seo', 'ppc', 'ads', 'keywords', 'ranking', 'paid', 'search'],
        specialties: ['keyword research', 'paid ads', 'organic search', 'campaign optimization'],
        maxCapacity: 100,
        currentLoad: 0,
      },
      'social-media-manager': {
        id: 'social-media-manager',
        name: 'Social Media Manager',
        keywords: ['social', 'instagram', 'facebook', 'twitter', 'linkedin', 'content', 'post', 'viral'],
        specialties: ['social content', 'audience engagement', 'trend awareness', 'brand voice'],
        maxCapacity: 100,
        currentLoad: 0,
      },
      'email-marketing-manager': {
        id: 'email-marketing-manager',
        name: 'Email Marketing Manager',
        keywords: ['email', 'newsletter', 'nurture', 'conversion', 'campaign', 'subscriber'],
        specialties: ['email campaigns', 'nurture sequences', 'conversion optimization', 'segmentation'],
        maxCapacity: 100,
        currentLoad: 0,
      },
      'case-study-writer': {
        id: 'case-study-writer',
        name: 'Case Study Writer',
        keywords: ['case study', 'success story', 'client story', 'testimonial', 'results', 'evidence'],
        specialties: ['case studies', 'client stories', 'narrative writing', 'result documentation'],
        maxCapacity: 100,
        currentLoad: 0,
      },
      'funding-rewards-manager': {
        id: 'funding-rewards-manager',
        name: 'Funding & Rewards Manager',
        keywords: ['funding', 'grant', 'investment', 'reward', 'budget', 'finance', 'resources'],
        specialties: ['grant applications', 'budget planning', 'resource allocation', 'roi analysis'],
        maxCapacity: 100,
        currentLoad: 0,
      },
    };

    return employees.map((emp) => ({
      ...roleToCapabilities[emp.id],
      currentLoad: emp.tasks.filter((t) => t.status !== 'complete').length,
    }));
  }

  route(requestDescription: string, employees: Employee[]): RoutingResult {
    const lowerRequest = requestDescription.toLowerCase();

    // Find primary assignee by matching keywords
    const matchScores = this.capabilities.map((capability) => {
      const keywordMatches = capability.keywords.filter((kw) =>
        lowerRequest.includes(kw)
      ).length;
      const specialtyMatches = capability.specialties.filter((spec) =>
        lowerRequest.includes(spec)
      ).length;
      const score = keywordMatches * 2 + specialtyMatches * 3;
      return { capability, score };
    });

    matchScores.sort((a, b) => b.score - a.score);

    const primaryCapability = matchScores[0]?.capability;
    const primaryAssignee = employees.find((e) => e.id === primaryCapability?.id)!;

    // Find suggested collaborators based on task type
    const suggestedCollaborators = this.findCollaborators(
      lowerRequest,
      primaryAssignee,
      employees
    );

    // Break down the task into subtasks
    const taskBreakdown = this.createTaskBreakdown(
      requestDescription,
      primaryAssignee,
      suggestedCollaborators
    );

    // Generate campaign name
    const campaignName = this.generateCampaignName(requestDescription);

    return {
      primaryAssignee,
      suggestedCollaborators,
      taskBreakdown,
      campaignName,
    };
  }

  private findCollaborators(
    request: string,
    primary: Employee,
    allEmployees: Employee[]
  ): Employee[] {
    const collaborators: Employee[] = [];

    // Rule: Social + Email for content campaigns
    if (
      (request.includes('campaign') || request.includes('content')) &&
      !request.includes('proposal')
    ) {
      if (primary.id !== 'social-media-manager') {
        collaborators.push(
          allEmployees.find((e) => e.id === 'social-media-manager')!
        );
      }
      if (primary.id !== 'email-marketing-manager') {
        collaborators.push(
          allEmployees.find((e) => e.id === 'email-marketing-manager')!
        );
      }
    }

    // Rule: Website auditor for site-related tasks
    if (request.includes('website') && primary.id !== 'website-auditor') {
      collaborators.push(allEmployees.find((e) => e.id === 'website-auditor')!);
    }

    // Rule: Marketing Director for strategy/planning
    if (
      (request.includes('strategy') || request.includes('plan')) &&
      primary.id !== 'marketing-director'
    ) {
      collaborators.push(
        allEmployees.find((e) => e.id === 'marketing-director')!
      );
    }

    // Rule: Case study writer for client success stories
    if (request.includes('case study') && primary.id !== 'case-study-writer') {
      collaborators.push(
        allEmployees.find((e) => e.id === 'case-study-writer')!
      );
    }

    return collaborators.filter(Boolean).slice(0, 3); // Max 3 collaborators
  }

  private createTaskBreakdown(
    request: string,
    primary: Employee,
    collaborators: Employee[]
  ): RoutingResult['taskBreakdown'] {
    const breakdown: RoutingResult['taskBreakdown'] = [];

    // Primary task
    breakdown.push({
      assignee: primary,
      subtasks: this.generateSubtasks(request, primary),
      reasoning: `${primary.name} specializes in this area`,
    });

    // Collaborator tasks
    collaborators.forEach((collaborator) => {
      breakdown.push({
        assignee: collaborator,
        subtasks: this.generateCollaboratorSubtasks(request, collaborator),
        reasoning: `${collaborator.name} will support with complementary work`,
      });
    });

    return breakdown;
  }

  private generateSubtasks(request: string, assignee: Employee): string[] {
    const subtasks: string[] = [];

    // Generic subtasks based on role
    if (assignee.id.includes('director') || assignee.id.includes('manager')) {
      subtasks.push('Define objectives and success metrics');
      subtasks.push('Create timeline and milestones');
      subtasks.push('Brief team and gather feedback');
    }

    // Specific based on keywords
    if (
      request.includes('campaign') ||
      request.includes('content') ||
      request.includes('social')
    ) {
      subtasks.push('Brainstorm ideas and creative angles');
      subtasks.push('Draft initial content/messaging');
      subtasks.push('Review and refine with team');
    }

    if (request.includes('proposal') || request.includes('pitch')) {
      subtasks.push('Research client needs');
      subtasks.push('Draft proposal document');
      subtasks.push('Include case studies and examples');
    }

    if (request.includes('website') || request.includes('site')) {
      subtasks.push('Perform technical analysis');
      subtasks.push('Document findings');
      subtasks.push('Create action plan');
    }

    return subtasks.slice(0, 4); // Max 4 subtasks
  }

  private generateCollaboratorSubtasks(
    request: string,
    collaborator: Employee
  ): string[] {
    if (collaborator.id === 'social-media-manager') {
      return [
        'Plan social media distribution',
        'Create platform-specific content',
        'Schedule posts',
      ];
    }
    if (collaborator.id === 'email-marketing-manager') {
      return [
        'Design email template',
        'Write email copy',
        'Segment audience',
      ];
    }
    if (collaborator.id === 'website-auditor') {
      return ['Audit technical SEO', 'Check performance', 'Test UX'];
    }
    if (collaborator.id === 'marketing-director') {
      return ['Review strategy alignment', 'Approve messaging', 'Coordinate timing'];
    }
    return ['Support primary task', 'Provide feedback'];
  }

  private generateCampaignName(request: string): string {
    // Extract key words and create a campaign name
    const keywords = request
      .split(' ')
      .filter((word) => word.length > 4)
      .slice(0, 3);
    return `Campaign: ${keywords.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
  }
}
