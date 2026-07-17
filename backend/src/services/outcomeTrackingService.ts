import { query } from '../db/connection.js';

interface TaskOutcome {
  taskId: string;
  aiEmployeeId: string;
  aiName: string;
  decision: 'approved' | 'rejected' | 'pending_review';
  actualOutcome: 'success' | 'failure' | 'partial' | 'unknown';
  confidence: number; // 0-100
  timeToResolution: number; // minutes
  feedback?: string;
}

interface AIPerformance {
  aiEmployeeId: string;
  aiName: string;
  totalDecisions: number;
  successRate: number;
  averageConfidence: number;
  averageTimeToResolution: number;
  recentTrend: 'improving' | 'stable' | 'declining';
}

interface LearningPattern {
  pattern: string;
  frequency: number;
  successRate: number;
  category: string; // 'mistake', 'best_practice', 'edge_case'
}

export class OutcomeTrackingService {
  async recordOutcome(outcome: TaskOutcome): Promise<void> {
    await query(
      `INSERT INTO task_outcomes (task_id, ai_employee_id, ai_name, decision, actual_outcome, confidence, time_to_resolution, feedback)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        outcome.taskId,
        outcome.aiEmployeeId,
        outcome.aiName,
        outcome.decision,
        outcome.actualOutcome,
        outcome.confidence,
        outcome.timeToResolution,
        outcome.feedback || null,
      ]
    );

    // Record learning if outcome was unexpected
    if (this.isUnexpectedOutcome(outcome)) {
      await this.recordLearning(outcome);
    }
  }

  private isUnexpectedOutcome(outcome: TaskOutcome): boolean {
    // Mark as learning opportunity if:
    // - Decision was approved but outcome is failure
    // - Decision was rejected but outcome is success
    // - Confidence was high but outcome is failure
    return (
      (outcome.decision === 'approved' && outcome.actualOutcome === 'failure') ||
      (outcome.decision === 'rejected' && outcome.actualOutcome === 'success') ||
      (outcome.confidence > 80 && outcome.actualOutcome === 'failure')
    );
  }

  private async recordLearning(outcome: TaskOutcome): Promise<void> {
    const learningCategory =
      outcome.decision === 'approved' && outcome.actualOutcome === 'failure' ? 'false_positive' :
      outcome.decision === 'rejected' && outcome.actualOutcome === 'success' ? 'false_negative' :
      'confidence_mismatch';

    await query(
      `INSERT INTO ai_learnings (ai_employee_id, ai_name, learning_type, description, task_id, confidence_improvement)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        outcome.aiEmployeeId,
        outcome.aiName,
        learningCategory,
        `${outcome.aiName} made a ${learningCategory}: ${outcome.decision} → ${outcome.actualOutcome}. ${outcome.feedback || ''}`,
        outcome.taskId,
        this.calculateConfidenceAdjustment(outcome),
      ]
    );
  }

  private calculateConfidenceAdjustment(outcome: TaskOutcome): number {
    // Reduce confidence if decision was wrong
    if (
      (outcome.decision === 'approved' && outcome.actualOutcome === 'failure') ||
      (outcome.decision === 'rejected' && outcome.actualOutcome === 'success')
    ) {
      return -Math.min(outcome.confidence * 0.25, 20); // Reduce by up to 20 points
    }
    return 0;
  }

  async getAIPerformance(aiEmployeeId: string): Promise<AIPerformance | null> {
    const result = await query(
      `SELECT
        ai_employee_id, ai_name,
        COUNT(*) as total_decisions,
        COUNT(CASE WHEN actual_outcome = 'success' THEN 1 END)::float / COUNT(*) * 100 as success_rate,
        AVG(confidence) as avg_confidence,
        AVG(time_to_resolution) as avg_time,
        CASE
          WHEN AVG(confidence) OVER (ORDER BY created_at DESC ROWS BETWEEN 10 PRECEDING AND CURRENT ROW) >
               AVG(confidence) OVER (ORDER BY created_at DESC ROWS BETWEEN 20 PRECEDING AND 11 PRECEDING) THEN 'improving'
          WHEN AVG(confidence) OVER (ORDER BY created_at DESC ROWS BETWEEN 10 PRECEDING AND CURRENT ROW) <
               AVG(confidence) OVER (ORDER BY created_at DESC ROWS BETWEEN 20 PRECEDING AND 11 PRECEDING) THEN 'declining'
          ELSE 'stable'
        END as trend
       FROM task_outcomes
       WHERE ai_employee_id = $1
       GROUP BY ai_employee_id, ai_name`,
      [aiEmployeeId]
    );

    if (result.rows.length === 0) return null;

    const data = result.rows[0];

    return {
      aiEmployeeId: data.ai_employee_id,
      aiName: data.ai_name,
      totalDecisions: parseInt(data.total_decisions),
      successRate: parseFloat((data.success_rate || 0).toFixed(2)),
      averageConfidence: parseFloat((data.avg_confidence || 0).toFixed(2)),
      averageTimeToResolution: parseInt(data.avg_time || 0),
      recentTrend: data.trend || 'stable',
    };
  }

  async getCompanyAIPerformance(companyId: string): Promise<AIPerformance[]> {
    const result = await query(
      `SELECT
        ae.id as ai_employee_id, ae.name as ai_name,
        COUNT(to.id) as total_decisions,
        COUNT(CASE WHEN to.actual_outcome = 'success' THEN 1 END)::float / NULLIF(COUNT(to.id), 0) * 100 as success_rate,
        AVG(to.confidence) as avg_confidence,
        AVG(to.time_to_resolution) as avg_time
       FROM ai_employees ae
       LEFT JOIN task_outcomes to ON ae.id = to.ai_employee_id
       WHERE ae.company_id = $1 AND ae.is_ai = true
       GROUP BY ae.id, ae.name
       ORDER BY success_rate DESC`,
      [companyId]
    );

    return result.rows.map((row: any) => ({
      aiEmployeeId: row.ai_employee_id,
      aiName: row.ai_name,
      totalDecisions: parseInt(row.total_decisions || 0),
      successRate: parseFloat((row.success_rate || 0).toFixed(2)),
      averageConfidence: parseFloat((row.avg_confidence || 0).toFixed(2)),
      averageTimeToResolution: parseInt(row.avg_time || 0),
      recentTrend: 'stable',
    }));
  }

  async getLearningPatterns(aiEmployeeId: string, limit: number = 10): Promise<LearningPattern[]> {
    const result = await query(
      `SELECT
        learning_type as pattern,
        COUNT(*) as frequency,
        SUM(CASE WHEN confidence_improvement < 0 THEN 1 ELSE 0 END)::float / COUNT(*) * 100 as failure_rate
       FROM ai_learnings
       WHERE ai_employee_id = $1
       GROUP BY learning_type
       ORDER BY frequency DESC
       LIMIT $2`,
      [aiEmployeeId, limit]
    );

    return result.rows.map((row: any) => ({
      pattern: row.pattern,
      frequency: parseInt(row.frequency),
      successRate: 100 - parseFloat(row.failure_rate || 0),
      category: this.categorizeLearning(row.pattern),
    }));
  }

  private categorizeLearning(pattern: string): string {
    if (pattern === 'false_positive' || pattern === 'false_negative') {
      return 'mistake';
    } else if (pattern === 'confidence_mismatch') {
      return 'calibration';
    }
    return 'edge_case';
  }

  async getMostCommonFailures(aiEmployeeId: string, limit: number = 5): Promise<
    Array<{
      decision: string;
      actualOutcome: string;
      frequency: number;
      suggestions: string[];
    }>
  > {
    const result = await query(
      `SELECT
        decision, actual_outcome, COUNT(*) as frequency
       FROM task_outcomes
       WHERE ai_employee_id = $1
       AND actual_outcome = 'failure'
       GROUP BY decision, actual_outcome
       ORDER BY frequency DESC
       LIMIT $2`,
      [aiEmployeeId, limit]
    );

    return result.rows.map((row: any) => ({
      decision: row.decision,
      actualOutcome: row.actual_outcome,
      frequency: parseInt(row.frequency),
      suggestions: this.generateSuggestions(row.decision, row.actual_outcome),
    }));
  }

  private generateSuggestions(decision: string, outcome: string): string[] {
    const suggestions: string[] = [];

    if (decision === 'approved' && outcome === 'failure') {
      suggestions.push('Review approval criteria - may be too permissive');
      suggestions.push('Add additional validation checks');
      suggestions.push('Increase confidence threshold for approval');
      suggestions.push('Require escalation for borderline cases');
    } else if (decision === 'rejected' && outcome === 'success') {
      suggestions.push('Review rejection criteria - may be too strict');
      suggestions.push('Consider allowing more edge cases');
      suggestions.push('Reduce rejection confidence threshold');
      suggestions.push('Add warning level between approve and reject');
    }

    return suggestions;
  }

  async getImprovedPrompt(aiEmployeeId: string): Promise<string> {
    // Generate an improved system prompt based on learnings
    const performance = await this.getAIPerformance(aiEmployeeId);
    const patterns = await this.getLearningPatterns(aiEmployeeId);
    const failures = await this.getMostCommonFailures(aiEmployeeId);

    let improvements = '';

    if (performance && performance.successRate < 85) {
      improvements += `\n## Performance Improvements\n`;
      improvements += `Current success rate: ${performance.successRate.toFixed(1)}%\n`;
      improvements += `Average confidence: ${performance.averageConfidence.toFixed(1)}%\n`;
      improvements += `Trend: ${performance.recentTrend}\n`;
    }

    if (patterns.length > 0) {
      improvements += `\n## Common Patterns\n`;
      patterns.forEach((p) => {
        improvements += `- ${p.pattern}: ${p.frequency} occurrences (${p.successRate.toFixed(1)}% success)\n`;
      });
    }

    if (failures.length > 0) {
      improvements += `\n## Common Failure Modes\n`;
      failures.forEach((f) => {
        improvements += `- ${f.decision} → ${f.actualOutcome}: ${f.frequency} times\n`;
        f.suggestions.forEach((s) => {
          improvements += `  * ${s}\n`;
        });
      });
    }

    return improvements;
  }

  async trackDecisionFeedback(
    taskId: string,
    aiEmployeeId: string,
    feedback: string,
    score: number // 1-5
  ): Promise<void> {
    await query(
      `INSERT INTO decision_feedback (task_id, ai_employee_id, feedback, score)
       VALUES ($1, $2, $3, $4)`,
      [taskId, aiEmployeeId, feedback, score]
    );

    // Update AI learning based on feedback
    if (score <= 2) {
      await query(
        `UPDATE ai_employees SET learning_adjustment = learning_adjustment - 5
         WHERE id = $1`,
        [aiEmployeeId]
      );
    } else if (score >= 4) {
      await query(
        `UPDATE ai_employees SET learning_adjustment = learning_adjustment + 3
         WHERE id = $1`,
        [aiEmployeeId]
      );
    }
  }
}

export const outcomeTrackingService = new OutcomeTrackingService();
