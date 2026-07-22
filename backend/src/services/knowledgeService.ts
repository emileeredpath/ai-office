import { query } from '../db/connection.js';

export class KnowledgeService {
  async getConstitution(companyId: string): Promise<string> {
    // For now, return a basic constitution
    // In a real system, this would be fetched from the knowledge base
    return `
# AI Office Constitution

## Principles
1. Human Authority - Humans make final decisions
2. Transparency - All decisions documented
3. Accountability - Clear responsibility for actions
4. Respect - Honor team members and constraints

## Authority Hierarchy
- Constitutional: Managing Director, Board
- Executive: CEO, CFO, COO, CHRO, CTO
- Domain: Domain leaders (Marketing, Finance, Operations, etc.)
- Team: Managers and team leads
- Individual: Employees

## Non-Negotiable Rules
- Cannot hire/fire without HR
- Cannot spend >$100k without CFO approval
- Cannot change Constitution without board amendment
- Cannot violate privacy or confidentiality

## Sandy's Constraints
Sandy can delegate work and coordinate tasks but must:
- Respect human authority in all decisions
- Escalate strategic questions to Managing Director
- Follow approval chains for spending/hiring
- Maintain transparency in all actions
`;
  }

  async searchKnowledge(
    companyId: string,
    query: string
  ): Promise<
    Array<{
      id: string;
      title: string;
      content: string;
      domain: string;
      type: string;
    }>
  > {
    const result = await query(
      `SELECT id, title, content, domain, type FROM knowledge
       WHERE company_id = $1
       AND (
         LOWER(title) LIKE LOWER($2)
         OR LOWER(content) LIKE LOWER($2)
       )
       LIMIT 10`,
      [companyId, `%${query}%`]
    );

    return result.rows;
  }

  async getKnowledgeByDomain(
    companyId: string,
    domain: string
  ): Promise<
    Array<{
      id: string;
      title: string;
      content: string;
      domain: string;
      type: string;
    }>
  > {
    const result = await query(
      `SELECT id, title, content, domain, type FROM knowledge
       WHERE company_id = $1 AND domain = $2
       ORDER BY created_at DESC`,
      [companyId, domain]
    );

    return result.rows;
  }

  async addKnowledge(
    companyId: string,
    title: string,
    content: string,
    domain: string,
    type: string,
    ownerId?: string
  ): Promise<{ id: string }> {
    const result = await query(
      `INSERT INTO knowledge (company_id, title, content, domain, type, owner_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [companyId, title, content, domain, type, ownerId || null]
    );

    return { id: result.rows[0].id };
  }

  async recordLearning(
    companyId: string,
    taskId: string | null,
    content: string,
    category: string
  ): Promise<{ id: string }> {
    const result = await query(
      `INSERT INTO memory (company_id, task_id, content, category)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [companyId, taskId || null, content, category]
    );

    return { id: result.rows[0].id };
  }

  async getRecentLearnings(companyId: string, limit: number = 5): Promise<
    Array<{
      id: string;
      content: string;
      category: string;
      created_at: string;
    }>
  > {
    const result = await query(
      `SELECT id, content, category, created_at FROM memory
       WHERE company_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [companyId, limit]
    );

    return result.rows;
  }
}

export const knowledgeService = new KnowledgeService();
