import { Anthropic } from 'anthropic';
import { query } from '../db/connection.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export class SpecialistService {
  // Get specialist employee profile with preferences
  async getSpecialistProfile(employeeId: string) {
    const employeeResult = await query(
      `SELECT * FROM ai_employees WHERE id = $1`,
      [employeeId]
    );

    if (employeeResult.rows.length === 0) {
      throw new Error('Specialist not found');
    }

    const employee = employeeResult.rows[0];

    // Get employee preferences (what they've learned)
    const prefsResult = await query(
      `SELECT * FROM employee_preferences WHERE employee_id = $1 ORDER BY confidence_score DESC`,
      [employeeId]
    );

    return {
      ...employee,
      preferences: prefsResult.rows,
    };
  }

  // Assemble context for specialist (handbook + preferences + knowledge + past outputs)
  async assembleSpecialistContext(employeeId: string, companyId: string) {
    // Get specialist profile
    const profile = await this.getSpecialistProfile(employeeId);

    // Get employee preferences
    const prefsResult = await query(
      `SELECT * FROM employee_preferences WHERE employee_id = $1`,
      [employeeId]
    );

    const preferences = prefsResult.rows.map((p: any) => `${p.preference_key}: ${p.preference_value}`);

    // Get company guidelines (brand voice, tone, style)
    const guidelinesResult = await query(
      `SELECT * FROM company_guidelines WHERE company_id = $1 ORDER BY category`,
      [companyId]
    );

    const guidelines = guidelinesResult.rows.reduce((acc: any, g: any) => {
      if (!acc[g.category]) {
        acc[g.category] = [];
      }
      acc[g.category].push(`${g.title}: ${g.description}`);
      return acc;
    }, {});

    // Get company knowledge (processes, decisions, policies)
    const knowledgeResult = await query(
      `SELECT * FROM knowledge WHERE company_id = $1 ORDER BY domain LIMIT 10`,
      [companyId]
    );

    const knowledge = knowledgeResult.rows.map((k: any) => ({
      domain: k.domain,
      title: k.title,
      summary: k.content.substring(0, 200),
    }));

    // Get recent outputs (past successful deliverables)
    const outputsResult = await query(
      `SELECT to.id, to.title, to.content, to.type, to.created_at
       FROM task_outputs to
       WHERE EXISTS (
         SELECT 1 FROM tasks t WHERE t.id = to.task_id AND t.company_id = $1
       )
       AND to.status = 'approved'
       ORDER BY to.created_at DESC LIMIT 5`,
      [companyId]
    );

    const recentOutputs = outputsResult.rows.map((o: any) => ({
      title: o.title,
      type: o.type,
      preview: o.content.substring(0, 150),
      date: o.created_at,
    }));

    // Get campaign performance data if available
    const campaignResult = await query(
      `SELECT name, impressions, clicks, conversions, revenue
       FROM campaigns WHERE company_id = $1
       ORDER BY created_at DESC LIMIT 3`,
      [companyId]
    );

    const campaignContext = campaignResult.rows.map((c: any) => ({
      name: c.name,
      conversions: c.conversions,
      revenue: c.revenue,
    }));

    const context = {
      employeeName: profile.name,
      role: profile.role,
      personality: profile.personality || [],
      preferences,
      recentLearnings: preferences.slice(0, 5),
      guidelines,
      knowledge,
      recentOutputs,
      campaignContext,
    };

    return context;
  }

  // Generate specialist system prompt with full context
  async generateSystemPrompt(employeeId: string, taskTitle: string, taskDescription: string, companyId?: string) {
    const profile = await this.getSpecialistProfile(employeeId);
    const context = await this.assembleSpecialistContext(employeeId, companyId || '');

    // Build context sections
    let contextSections = '';

    // Add guidelines
    if (Object.keys(context.guidelines).length > 0) {
      contextSections += '\n**Company Guidelines**:\n';
      Object.entries(context.guidelines).forEach(([category, items]: [string, any]) => {
        contextSections += `${category.toUpperCase()}:\n`;
        items.forEach((item: string) => {
          contextSections += `- ${item}\n`;
        });
      });
    }

    // Add knowledge
    if (context.knowledge.length > 0) {
      contextSections += '\n**Company Knowledge Base**:\n';
      context.knowledge.forEach((k: any) => {
        contextSections += `- [${k.domain}] ${k.title}: ${k.summary}...\n`;
      });
    }

    // Add recent outputs as examples
    if (context.recentOutputs.length > 0) {
      contextSections += '\n**Recent Successful Outputs** (use these as inspiration):\n';
      context.recentOutputs.forEach((o: any) => {
        contextSections += `- [${o.type}] ${o.title}: "${o.preview}..."\n`;
      });
    }

    // Add campaign context
    if (context.campaignContext.length > 0) {
      contextSections += '\n**Campaign Performance Context**:\n';
      context.campaignContext.forEach((c: any) => {
        contextSections += `- ${c.name}: ${c.conversions} conversions, $${c.revenue} revenue\n`;
      });
    }

    // Base prompt for all specialists
    const basePrompt = `You are ${profile.name}, a specialist AI employee.

**Your Role**: ${profile.role}
**Your Expertise**: Help users with ${profile.role.toLowerCase()} tasks
**Your Personality**: Professional, helpful, and collaborative

**Current Task**: ${taskTitle}
${taskDescription ? `**Details**: ${taskDescription}` : ''}

**How to Operate**:
1. Ask clarifying questions if needed
2. Provide expert recommendations
3. Create drafts for the user to review
4. Be specific and actionable
5. Explain your reasoning

**User Preferences** (learned from feedback):
${context.preferences.length > 0 ? context.preferences.join('\n') : 'No preferences recorded yet'}
${contextSections}

Remember: You're collaborating with the user on their task. Use company knowledge and past successful outputs to inform your recommendations. Listen carefully to user feedback and improve continuously.`;

    return basePrompt;
  }

  // Get specialist response to a message
  async generateResponse(
    employeeId: string,
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    taskTitle: string,
    taskDescription: string,
    companyId?: string
  ): Promise<string> {
    const systemPrompt = await this.generateSystemPrompt(employeeId, taskTitle, taskDescription, companyId);

    const messages = [
      ...conversationHistory,
      {
        role: 'user' as const,
        content: userMessage,
      },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }
}

export const specialistService = new SpecialistService();
