import { Anthropic } from 'anthropic';
import { query } from '../db/connection.js';
import { acumaticaService } from './acumaticaService.js';
import { ga4Service } from './ga4Service.js';
import { campaignMonitorService } from './campaignMonitorService.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface SpecialistAIContext {
  aiName: string;
  domain: string;
  responsibilities: string;
  authority: string;
  examples: string;
}

export class SpecialistAIService {
  private getFinanceAIPrompt(): string {
    return `You are Finance AI, a specialist AI employee for Emilee Media's Finance team.

## Your Role
You handle financial approvals and invoice processing with precision and compliance.

## Your Authority
- CAN approve invoices <$10,000 independently
- CAN flag invoices >$50,000 for human review
- CANNOT create financial records (only approve existing ones)
- CANNOT override human decisions
- MUST escalate >$50,000 to Finance Director

## Your Constraints
- All approvals must have valid cost center
- Invoices must be from approved vendors
- No duplicate payments
- All decisions logged and auditable

## Your Process
1. Check invoice amount and vendor
2. Verify cost center validity
3. Review for duplicates
4. Approve or flag based on rules
5. Log reasoning for audit trail

When reviewing an invoice, be thorough and explain your decision clearly.`;
  }

  private getContentAIPrompt(): string {
    return `You are Content AI, a specialist AI employee for Emilee Media's Content team.

## Your Role
You review, edit, and improve written content with attention to quality and brand voice.

## Your Authority
- CAN review and provide detailed feedback on drafts
- CAN suggest edits and improvements
- CAN approve content quality for publication
- CANNOT make final publication decisions (human decides)
- CANNOT override brand guidelines

## Your Constraints
- Must maintain brand voice and tone
- Quality standards: clarity, conciseness, accuracy
- Must provide actionable feedback
- Cannot reject content without suggestions

## Your Process
1. Read the entire piece
2. Check against brand guidelines
3. Identify areas for improvement
4. Provide specific, actionable feedback
5. Rate overall quality

Focus on being helpful and constructive in your feedback.`;
  }

  private getMarketingAIPrompt(): string {
    return `You are Marketing AI, a specialist AI employee for Emilee Media's Marketing team.

## Your Role
You analyze marketing metrics, campaigns, and performance data to provide strategic insights.

## Your Authority
- CAN analyze campaign performance
- CAN provide data-driven recommendations
- CAN forecast trends based on historical data
- CANNOT make strategic decisions (humans decide)
- CANNOT approve budget spending

## Your Constraints
- Base all recommendations on data
- Provide confidence levels for predictions
- Explain methodology and assumptions
- Flag outliers and anomalies

## Your Process
1. Gather relevant data
2. Perform analysis
3. Calculate key metrics
4. Identify trends and patterns
5. Provide data-driven recommendations

Always be specific with numbers and clearly explain your reasoning.`;
  }

  private getAIPrompt(aiName: string): string {
    switch (aiName.toLowerCase()) {
      case 'finance ai':
        return this.getFinanceAIPrompt();
      case 'content ai':
        return this.getContentAIPrompt();
      case 'marketing ai':
        return this.getMarketingAIPrompt();
      default:
        return 'You are a helpful AI assistant for Emilee Media.';
    }
  }

  async processTaskForAI(
    taskId: string,
    taskTitle: string,
    taskDescription: string,
    aiName: string,
    aiEmployeeId: string
  ): Promise<{
    status: 'approved' | 'rejected' | 'pending_review';
    reason: string;
    recommendation: string;
  }> {
    // Get task details from database
    const taskResult = await query(
      `SELECT priority, description, company_id FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return {
        status: 'pending_review',
        reason: 'Task not found',
        recommendation: 'Please verify task exists',
      };
    }

    const task = taskResult.rows[0];
    let contextData = '';

    // Fetch relevant external data based on AI type
    if (aiName.toLowerCase() === 'finance ai') {
      try {
        // Fetch invoice metrics and vendor info
        const metrics = await acumaticaService.getInvoiceMetrics(task.company_id);
        contextData = `

## Current Financial Context
- Pending invoices: ${metrics.totalPending}
- Approved invoices: ${metrics.totalApproved}
- Average approval time: ${metrics.averageApprovalTime} hours
- Approval rate: ${metrics.approvalRate}%`;
      } catch (error) {
        console.warn('Could not fetch financial context:', error);
      }
    } else if (aiName.toLowerCase() === 'marketing ai') {
      try {
        // Fetch recent campaign data
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        const campaigns = await ga4Service.getCampaignsByPeriod(
          task.company_id,
          thirtyDaysAgo.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        );

        if (campaigns.length > 0) {
          const avgROI = campaigns.reduce((sum, c) => sum + c.roi, 0) / campaigns.length;
          const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
          contextData = `

## Recent Campaign Performance (30 days)
- Active campaigns: ${campaigns.length}
- Average ROI: ${avgROI.toFixed(1)}%
- Total spend: $${totalSpend.toFixed(2)}
- Top campaign: ${campaigns[0].campaignName} (ROI: ${campaigns[0].roi}%)`;
        }
      } catch (error) {
        console.warn('Could not fetch marketing context:', error);
      }
    } else if (aiName.toLowerCase() === 'content ai') {
      try {
        // Fetch recent content performance
        const campaigns = await ga4Service.getCampaignsByPeriod(
          task.company_id,
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          new Date().toISOString().split('T')[0]
        );

        if (campaigns.length > 0) {
          const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
          contextData = `

## Recent Content Performance (7 days)
- Total conversions: ${totalConversions}
- Active campaigns using content: ${campaigns.length}`;
        }
      } catch (error) {
        console.warn('Could not fetch content context:', error);
      }
    }

    // Create context for the AI
    const prompt = `
You are reviewing the following task:

**Task**: ${taskTitle}
**Priority**: ${task.priority}
**Details**: ${taskDescription || task.description || 'No additional details'}${contextData}

Based on your expertise and authority, please:
1. Determine if you can handle this task independently
2. Provide your recommendation (approve/reject/escalate)
3. Explain your reasoning

Format your response as:
DECISION: [approved/rejected/escalate]
REASONING: [your explanation]
NEXT_STEPS: [what should happen next]`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      system: this.getAIPrompt(aiName),
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const aiResponse = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse response
    const decision = aiResponse.includes('approved')
      ? 'approved'
      : aiResponse.includes('escalate')
        ? 'pending_review'
        : 'rejected';

    return {
      status: decision,
      reason: aiResponse,
      recommendation: this.extractNextSteps(aiResponse),
    };
  }

  private extractNextSteps(response: string): string {
    const match = response.match(/NEXT_STEPS:\s*(.+?)(?:\n|$)/i);
    return match ? match[1] : 'See full response for details';
  }

  async getAICapabilities(aiName: string): Promise<{
    name: string;
    domain: string;
    canApproveUpTo?: number;
    responsibilities: string[];
    escalationPath: string;
  }> {
    switch (aiName.toLowerCase()) {
      case 'finance ai':
        return {
          name: 'Finance AI',
          domain: 'Finance',
          canApproveUpTo: 10000,
          responsibilities: [
            'Invoice approval',
            'Vendor verification',
            'Cost center validation',
            'Duplicate payment detection',
            'Financial record review',
          ],
          escalationPath: 'Finance Director for amounts >$50,000',
        };

      case 'content ai':
        return {
          name: 'Content AI',
          domain: 'Content',
          responsibilities: [
            'Content review',
            'Quality assurance',
            'Brand voice verification',
            'Grammar and clarity check',
            'Fact checking guidance',
          ],
          escalationPath: 'Content Manager for final publication approval',
        };

      case 'marketing ai':
        return {
          name: 'Marketing AI',
          domain: 'Marketing',
          responsibilities: [
            'Campaign performance analysis',
            'Metric calculation',
            'Trend identification',
            'ROI forecasting',
            'Competitor benchmarking',
          ],
          escalationPath: 'Marketing Director for strategy decisions',
        };

      default:
        return {
          name: 'Unknown AI',
          domain: 'Unknown',
          responsibilities: [],
          escalationPath: 'Sandy (AI Orchestrator)',
        };
    }
  }
}

export const specialistAIService = new SpecialistAIService();
