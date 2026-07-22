import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ai_office',
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Starting database seed...');

    // Clear existing data
    await client.query('DELETE FROM audit_log');
    await client.query('DELETE FROM ai_contracts');
    await client.query('DELETE FROM memory');
    await client.query('DELETE FROM project_tasks');
    await client.query('DELETE FROM knowledge');
    await client.query('DELETE FROM task_notes');
    await client.query('DELETE FROM messages');
    await client.query('DELETE FROM conversations');
    await client.query('DELETE FROM tasks');
    await client.query('DELETE FROM projects');
    await client.query('DELETE FROM ai_employees');
    await client.query('DELETE FROM companies');

    // Create company
    const companyResult = await client.query(
      'INSERT INTO companies (name) VALUES ($1) RETURNING id',
      ['Emilee Media']
    );
    const companyId = companyResult.rows[0].id;
    console.log(`✓ Created company: ${companyId}`);

    // Create Managing Director (human)
    const mdResult = await client.query(
      `INSERT INTO ai_employees (company_id, name, role, type, is_ai, emoji, status, accent_color, authority_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [companyId, 'John', 'Managing Director', 'human', false, '👨‍💼', 'available', '#000000', 'constitutional']
    );
    const managingDirectorId = mdResult.rows[0].id;
    console.log(`✓ Created Managing Director: ${managingDirectorId}`);

    // Create Sandy (AI - orchestrator)
    const sandyResult = await client.query(
      `INSERT INTO ai_employees (company_id, name, role, type, is_ai, emoji, status, accent_color, authority_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [companyId, 'Sandy', 'AI Orchestrator', 'ai', true, '🤖', 'available', '#6366f1', 'executive']
    );
    const sandyId = sandyResult.rows[0].id;
    console.log(`✓ Created Sandy: ${sandyId}`);

    // Create Finance AI
    const financeAIResult = await client.query(
      `INSERT INTO ai_employees (company_id, name, role, type, is_ai, emoji, status, accent_color, authority_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [companyId, 'Finance AI', 'Finance Specialist', 'ai', true, '💰', 'available', '#10b981', 'domain']
    );
    const financeAIId = financeAIResult.rows[0].id;
    console.log(`✓ Created Finance AI: ${financeAIId}`);

    // Create Content AI
    const contentAIResult = await client.query(
      `INSERT INTO ai_employees (company_id, name, role, type, is_ai, emoji, status, accent_color, authority_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [companyId, 'Content AI', 'Content Specialist', 'ai', true, '✍️', 'available', '#f59e0b', 'domain']
    );
    const contentAIId = contentAIResult.rows[0].id;
    console.log(`✓ Created Content AI: ${contentAIId}`);

    // Create Marketing AI
    const marketingAIResult = await client.query(
      `INSERT INTO ai_employees (company_id, name, role, type, is_ai, emoji, status, accent_color, authority_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [companyId, 'Marketing AI', 'Marketing Specialist', 'ai', true, '📊', 'available', '#0ea5e9', 'domain']
    );
    const marketingAIId = marketingAIResult.rows[0].id;
    console.log(`✓ Created Marketing AI: ${marketingAIId}`);

    // Create some human team members
    const emileeResult = await client.query(
      `INSERT INTO ai_employees (company_id, name, role, type, is_ai, emoji, status, accent_color, authority_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [companyId, 'Emilee', 'Marketing Director', 'human', false, '👩‍💼', 'available', '#6366f1', 'domain']
    );
    const emileeId = emileeResult.rows[0].id;

    const sallyResult = await client.query(
      `INSERT INTO ai_employees (company_id, name, role, type, is_ai, emoji, status, accent_color, authority_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [companyId, 'Sally', 'Content Manager', 'human', false, '👩‍💻', 'available', '#10b981', 'team']
    );
    const sallyId = sallyResult.rows[0].id;

    console.log(`✓ Created team members: ${emileeId}, ${sallyId}`);

    // Create a project
    const projectResult = await client.query(
      'INSERT INTO projects (company_id, name, description) VALUES ($1, $2, $3) RETURNING id',
      [companyId, 'Q3 Marketing Campaign', 'Main campaign for Q3 marketing initiatives']
    );
    const projectId = projectResult.rows[0].id;
    console.log(`✓ Created project: ${projectId}`);

    // Create sample tasks
    const task1Result = await client.query(
      `INSERT INTO tasks (company_id, employee_id, title, description, priority, status, assigned_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        companyId,
        sallyId,
        'Write blog post on AI marketing trends',
        'Create a 1500+ word blog post covering the latest AI applications in marketing',
        'high',
        'in_progress',
        sandyId,
      ]
    );
    const task1Id = task1Result.rows[0].id;

    const task2Result = await client.query(
      `INSERT INTO tasks (company_id, employee_id, title, description, priority, status, assigned_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        companyId,
        emileeId,
        'Review campaign budget allocation',
        'Review and approve the budget breakdown for Q3 campaign across channels',
        'high',
        'awaiting_brief',
        managingDirectorId,
      ]
    );
    const task2Id = task2Result.rows[0].id;

    const task3Result = await client.query(
      `INSERT INTO tasks (company_id, employee_id, title, description, priority, status, assigned_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [companyId, sallyId, 'Update email templates', 'Refresh email templates for Q3 campaign', 'medium', 'backlog', sandyId]
    );
    const task3Id = task3Result.rows[0].id;

    console.log(`✓ Created tasks: ${task1Id}, ${task2Id}, ${task3Id}`);

    // Associate tasks with project
    await client.query('INSERT INTO project_tasks (project_id, task_id) VALUES ($1, $2)', [
      projectId,
      task1Id,
    ]);
    await client.query('INSERT INTO project_tasks (project_id, task_id) VALUES ($1, $2)', [
      projectId,
      task2Id,
    ]);
    await client.query('INSERT INTO project_tasks (project_id, task_id) VALUES ($1, $2)', [
      projectId,
      task3Id,
    ]);

    // Create a conversation with Sandy
    const convResult = await client.query(
      `INSERT INTO conversations (company_id, ai_employee_id, user_id, title)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [companyId, sandyId, emileeId, 'Q3 Campaign Planning']
    );
    const conversationId = convResult.rows[0].id;
    console.log(`✓ Created conversation: ${conversationId}`);

    // Add messages to conversation
    await client.query(
      `INSERT INTO messages (conversation_id, sender_id, content, role)
       VALUES ($1, $2, $3, $4)`,
      [conversationId, emileeId, 'Sandy, can you help me organize the Q3 campaign?', 'user']
    );

    await client.query(
      `INSERT INTO messages (conversation_id, sender_id, content, role)
       VALUES ($1, $2, $3, $4)`,
      [conversationId, sandyId, 'Of course! I can help coordinate the campaign across the team. What are your priorities?', 'assistant']
    );

    // Create knowledge base entries
    const knowledgeResult = await client.query(
      `INSERT INTO knowledge (company_id, title, content, domain, type, owner_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        companyId,
        'Marketing Channel Guidelines',
        'Guidelines for using email, social, and paid channels effectively',
        'operations',
        'process',
        emileeId,
      ]
    );
    console.log(`✓ Created knowledge entry: ${knowledgeResult.rows[0].id}`);

    // Create AI contracts (Sandy's authority)
    await client.query(
      `INSERT INTO ai_contracts (company_id, ai_employee_id, scope, can_decide_independently, requires_notification, requires_approval, cannot_do)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        companyId,
        sandyId,
        'Orchestrate work across teams and AI employees',
        JSON.stringify(['assign tasks to team members', 'assign tasks to specialist AIs', 'create conversations']),
        JSON.stringify(['strategic decisions', 'major budget changes', 'policy changes']),
        JSON.stringify(['hiring/firing humans', 'spending >$10000', 'constitutional changes']),
        JSON.stringify(['override human decisions', 'modify constitution', 'access confidential data without authorization']),
      ]
    );

    console.log('✓ Database seed completed successfully');
  } catch (error) {
    console.error('✗ Seed failed:', error);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

seed();
