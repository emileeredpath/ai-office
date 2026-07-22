import { query } from '../db/connection.js';

export class AdvancedFeaturesService {
  // Task Templates

  async createTemplate(
    companyId: string,
    template: {
      name: string;
      description?: string;
      category?: string;
      defaultPriority?: string;
      estimatedHours?: number;
      steps?: any[];
      requiredSpecialists?: string[];
      createdById?: string;
    }
  ) {
    const result = await query(
      `INSERT INTO task_templates
       (company_id, name, description, category, default_priority, estimated_hours, steps, required_specialists, created_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        companyId,
        template.name,
        template.description,
        template.category,
        template.defaultPriority || 'medium',
        template.estimatedHours,
        JSON.stringify(template.steps || []),
        template.requiredSpecialists || [],
        template.createdById,
      ]
    );
    return result.rows[0];
  }

  async getTemplates(companyId: string) {
    const result = await query(
      `SELECT * FROM task_templates WHERE company_id = $1 ORDER BY category, name`,
      [companyId]
    );
    return result.rows;
  }

  async getTemplate(templateId: string) {
    const result = await query(`SELECT * FROM task_templates WHERE id = $1`, [templateId]);
    return result.rows[0];
  }

  // Task Collaborations

  async addCollaborator(
    taskId: string,
    specialistId: string,
    role: string = 'contributor'
  ) {
    const result = await query(
      `INSERT INTO task_collaborations (task_id, specialist_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (task_id, specialist_id) DO UPDATE
       SET role = $3
       RETURNING *`,
      [taskId, specialistId, role]
    );
    return result.rows[0];
  }

  async getCollaborators(taskId: string) {
    const result = await query(
      `SELECT tc.*, ae.name, ae.emoji, ae.role
       FROM task_collaborations tc
       JOIN ai_employees ae ON tc.specialist_id = ae.id
       WHERE tc.task_id = $1
       ORDER BY tc.assigned_at DESC`,
      [taskId]
    );
    return result.rows;
  }

  async completeCollaboration(collaborationId: string) {
    const result = await query(
      `UPDATE task_collaborations
       SET completed_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [collaborationId]
    );
    return result.rows[0];
  }

  // Specialist Performance

  async getSpecialistPerformance(specialistId: string, periodStart: string, periodEnd: string) {
    const result = await query(
      `SELECT * FROM specialist_performance
       WHERE specialist_id = $1 AND period_start = $2 AND period_end = $3`,
      [specialistId, periodStart, periodEnd]
    );
    return result.rows[0];
  }

  async updateSpecialistPerformance(
    specialistId: string,
    periodStart: string,
    periodEnd: string,
    metrics: {
      tasksCompleted?: number;
      tasksApproved?: number;
      avgRating?: number;
      feedbackCount?: number;
      qualityScore?: number;
      efficiencyScore?: number;
      consistencyScore?: number;
    }
  ) {
    const result = await query(
      `INSERT INTO specialist_performance
       (specialist_id, period_start, period_end, tasks_completed, tasks_approved,
        avg_rating, total_feedback_count, quality_score, efficiency_score, consistency_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (specialist_id, period_start, period_end) DO UPDATE
       SET tasks_completed = $4, tasks_approved = $5, avg_rating = $6,
           total_feedback_count = $7, quality_score = $8, efficiency_score = $9, consistency_score = $10
       RETURNING *`,
      [
        specialistId,
        periodStart,
        periodEnd,
        metrics.tasksCompleted,
        metrics.tasksApproved,
        metrics.avgRating,
        metrics.feedbackCount,
        metrics.qualityScore,
        metrics.efficiencyScore,
        metrics.consistencyScore,
      ]
    );
    return result.rows[0];
  }

  async getTeamPerformance(companyId: string, periodStart: string, periodEnd: string) {
    const result = await query(
      `SELECT sp.*, ae.name, ae.emoji, ae.role
       FROM specialist_performance sp
       JOIN ai_employees ae ON sp.specialist_id = ae.id
       WHERE ae.company_id = $1 AND sp.period_start = $2 AND sp.period_end = $3
       ORDER BY sp.quality_score DESC`,
      [companyId, periodStart, periodEnd]
    );
    return result.rows;
  }

  // Task Dependencies

  async addDependency(
    dependentTaskId: string,
    prerequisiteTaskId: string,
    dependencyType: string = 'blocks'
  ) {
    const result = await query(
      `INSERT INTO task_dependencies (dependent_task_id, prerequisite_task_id, dependency_type)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [dependentTaskId, prerequisiteTaskId, dependencyType]
    );
    return result.rows[0];
  }

  async getDependencies(taskId: string) {
    const result = await query(
      `SELECT td.*, t1.title as dependent_title, t2.title as prerequisite_title
       FROM task_dependencies td
       JOIN tasks t1 ON td.dependent_task_id = t1.id
       JOIN tasks t2 ON td.prerequisite_task_id = t2.id
       WHERE td.dependent_task_id = $1 OR td.prerequisite_task_id = $1`,
      [taskId]
    );
    return result.rows;
  }

  // Task Analytics

  async recordTaskAnalytics(
    taskId: string,
    analytics: {
      timeToComplete?: number;
      revisionCount?: number;
      approvalRate?: number;
      userSatisfaction?: number;
      businessImpact?: string;
    }
  ) {
    const result = await query(
      `INSERT INTO task_analytics
       (task_id, time_to_complete, revision_count, approval_rate, user_satisfaction, business_impact)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (task_id) DO UPDATE
       SET time_to_complete = $2, revision_count = $3, approval_rate = $4,
           user_satisfaction = $5, business_impact = $6
       RETURNING *`,
      [
        taskId,
        analytics.timeToComplete,
        analytics.revisionCount,
        analytics.approvalRate,
        analytics.userSatisfaction,
        analytics.businessImpact,
      ]
    );
    return result.rows[0];
  }

  async getTaskMetrics(taskId: string) {
    const result = await query(`SELECT * FROM task_analytics WHERE task_id = $1`, [taskId]);
    return result.rows[0];
  }

  async getCompanyAnalytics(companyId: string) {
    // Get overall company task metrics
    const result = await query(
      `SELECT
         COUNT(DISTINCT t.id) as total_tasks,
         COUNT(DISTINCT CASE WHEN t.status = 'complete' THEN t.id END) as completed_tasks,
         AVG(CAST(ta.time_to_complete AS FLOAT)) as avg_time_to_complete,
         AVG(CAST(ta.user_satisfaction AS FLOAT)) as avg_satisfaction,
         AVG(CAST(ta.approval_rate AS FLOAT)) as avg_approval_rate
       FROM tasks t
       LEFT JOIN task_analytics ta ON t.id = ta.task_id
       WHERE t.company_id = $1`,
      [companyId]
    );
    return result.rows[0];
  }

  // Scheduled Tasks

  async createScheduledTask(
    companyId: string,
    templateId: string,
    cronExpression: string,
    createdById?: string
  ) {
    const result = await query(
      `INSERT INTO scheduled_tasks (company_id, template_id, cron_expression, next_run_at, created_by_id)
       VALUES ($1, $2, $3, NOW(), $4)
       RETURNING *`,
      [companyId, templateId, cronExpression, createdById]
    );
    return result.rows[0];
  }

  async getScheduledTasks(companyId: string) {
    const result = await query(
      `SELECT st.*, tt.name as template_name
       FROM scheduled_tasks st
       LEFT JOIN task_templates tt ON st.template_id = tt.id
       WHERE st.company_id = $1 AND st.is_active = TRUE
       ORDER BY st.next_run_at ASC`,
      [companyId]
    );
    return result.rows;
  }

  async updateScheduledTaskRun(scheduledTaskId: string) {
    const result = await query(
      `UPDATE scheduled_tasks
       SET last_run_at = CURRENT_TIMESTAMP, next_run_at = NOW() + INTERVAL '1 day'
       WHERE id = $1
       RETURNING *`,
      [scheduledTaskId]
    );
    return result.rows[0];
  }

  // Escalation Rules

  async createEscalationRule(
    companyId: string,
    rule: {
      name: string;
      triggerCondition: any;
      escalateToId: string;
      notificationTemplate?: string;
    }
  ) {
    const result = await query(
      `INSERT INTO escalation_rules
       (company_id, name, trigger_condition, escalate_to_id, notification_template)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        companyId,
        rule.name,
        JSON.stringify(rule.triggerCondition),
        rule.escalateToId,
        rule.notificationTemplate,
      ]
    );
    return result.rows[0];
  }

  async getEscalationRules(companyId: string) {
    const result = await query(
      `SELECT er.*, ae.name as escalate_to_name, ae.emoji
       FROM escalation_rules er
       LEFT JOIN ai_employees ae ON er.escalate_to_id = ae.id
       WHERE er.company_id = $1 AND er.is_active = TRUE`,
      [companyId]
    );
    return result.rows;
  }
}

export const advancedFeaturesService = new AdvancedFeaturesService();
