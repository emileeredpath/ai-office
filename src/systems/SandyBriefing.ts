import type { AnalyticsMetrics } from '@/hooks/useAnalytics';

export interface Briefing {
  title: string;
  summary: string;
  highlights: string[];
  blockers: string[];
  recommendations: string[];
}

export function generateBriefing(metrics: AnalyticsMetrics): Briefing {
  const highlights: string[] = [];
  const blockers: string[] = [];
  const recommendations: string[] = [];

  // Analyze completion rate
  if (metrics.completionRate >= 80) {
    highlights.push(`Exceptional completion rate at ${metrics.completionRate}%`);
  } else if (metrics.completionRate >= 60) {
    highlights.push(`Solid completion rate of ${metrics.completionRate}%`);
  } else {
    blockers.push(`Low completion rate: ${metrics.completionRate}% needs attention`);
  }

  // Analyze workload
  if (metrics.averageWorkload >= 85) {
    blockers.push(`Team is overloaded at ${metrics.averageWorkload}% average workload`);
    recommendations.push('Consider redistributing tasks to lighter-loaded team members');
  } else if (metrics.averageWorkload >= 60) {
    highlights.push(`Team workload balanced at ${metrics.averageWorkload}%`);
  } else {
    highlights.push(`Team has available capacity at ${metrics.averageWorkload}%`);
    recommendations.push('Ready to take on additional projects');
  }

  // Analyze overloaded employees
  if (metrics.overloadedEmployees.length > 0) {
    blockers.push(
      `${metrics.overloadedEmployees.length} team member(s) overloaded: ${metrics.overloadedEmployees.map((e) => e.name).join(', ')}`
    );
  }

  // Analyze queue depth
  if (metrics.longQueues.length > 0) {
    blockers.push(
      `${metrics.longQueues.length} team member(s) with long queues: ${metrics.longQueues.map((e) => e.name).join(', ')}`
    );
    recommendations.push('Prioritize queue reduction through task completion and reassignment');
  }

  // Analyze availability
  if (metrics.availableCapacity.length > 0) {
    highlights.push(
      `${metrics.availableCapacity.length} team member(s) available for additional work`
    );
  }

  // Task priority analysis
  const totalHighPriority =
    metrics.tasksByPriority.high.done + metrics.tasksByPriority.high.pending;
  if (totalHighPriority > 0) {
    const highCompletionRate = Math.round(
      (metrics.tasksByPriority.high.done / totalHighPriority) * 100
    );
    if (highCompletionRate >= 75) {
      highlights.push(`High-priority tasks on track at ${highCompletionRate}% completion`);
    } else {
      blockers.push(`High-priority tasks lagging at ${highCompletionRate}% completion`);
    }
  }

  const summary =
    blockers.length === 0
      ? `Team is performing excellently with ${metrics.completionRate}% completion rate and ${metrics.averageWorkload}% average workload. All systems nominal.`
      : blockers.length === 1
        ? `One issue to address: ${blockers[0]}`
        : `Multiple issues detected requiring attention. See blockers below.`;

  return {
    title: 'Team Briefing',
    summary,
    highlights: highlights.length > 0 ? highlights : ['Team continues to operate effectively'],
    blockers,
    recommendations:
      recommendations.length > 0
        ? recommendations
        : ['Maintain current pace and task distribution'],
  };
}
