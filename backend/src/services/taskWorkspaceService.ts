import { query } from '../db/connection.js';

export class TaskWorkspaceService {
  // Get task workspace (overview, conversation, drafts, outputs)
  async getTaskWorkspace(taskId: string) {
    // Get task details
    const taskResult = await query(
      `SELECT * FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      throw new Error('Task not found');
    }

    const task = taskResult.rows[0];

    // Get task conversation
    const convResult = await query(
      `SELECT * FROM task_conversations WHERE task_id = $1`,
      [taskId]
    );

    let taskConversation = convResult.rows[0] || null;

    // Get task messages if conversation exists
    let messages = [];
    if (taskConversation) {
      const messagesResult = await query(
        `SELECT tm.*, ae.name, ae.emoji
         FROM task_messages tm
         LEFT JOIN ai_employees ae ON tm.sender_id = ae.id
         WHERE tm.task_conversation_id = $1
         ORDER BY tm.created_at ASC`,
        [taskConversation.id]
      );
      messages = messagesResult.rows;
    }

    // Get task drafts
    const draftsResult = await query(
      `SELECT td.*, ae.name as created_by_name
       FROM task_drafts td
       LEFT JOIN ai_employees ae ON td.created_by_id = ae.id
       WHERE td.task_id = $1
       ORDER BY td.version DESC`,
      [taskId]
    );

    // Get task outputs
    const outputsResult = await query(
      `SELECT to_out.*,
              creator.name as created_by_name,
              approver.name as approved_by_name
       FROM task_outputs to_out
       LEFT JOIN ai_employees creator ON to_out.created_by_id = creator.id
       LEFT JOIN ai_employees approver ON to_out.approved_by_id = approver.id
       WHERE to_out.task_id = $1
       ORDER BY to_out.created_at DESC`,
      [taskId]
    );

    // Get task files
    const filesResult = await query(
      `SELECT tf.*, ae.name as uploaded_by_name
       FROM task_files tf
       LEFT JOIN ai_employees ae ON tf.uploaded_by_id = ae.id
       WHERE tf.task_id = $1
       ORDER BY tf.created_at DESC`,
      [taskId]
    );

    // Get task history
    const historyResult = await query(
      `SELECT th.*, ae.name as actor_name
       FROM task_history th
       LEFT JOIN ai_employees ae ON th.actor_id = ae.id
       WHERE th.task_id = $1
       ORDER BY th.created_at DESC`,
      [taskId]
    );

    return {
      task,
      conversation: taskConversation,
      messages,
      drafts: draftsResult.rows,
      outputs: outputsResult.rows,
      files: filesResult.rows,
      history: historyResult.rows,
    };
  }

  // Delegate task to specialist
  async delegateTask(taskId: string, employeeId: string, delegatedById: string) {
    // Create task conversation if it doesn't exist
    const convResult = await query(
      `SELECT id FROM task_conversations WHERE task_id = $1`,
      [taskId]
    );

    let conversationId;
    if (convResult.rows.length === 0) {
      const newConvResult = await query(
        `INSERT INTO task_conversations (task_id, delegated_to_id, status)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [taskId, employeeId, 'in_progress']
      );
      conversationId = newConvResult.rows[0].id;
    } else {
      conversationId = convResult.rows[0].id;
      // Update delegated_to_id if different
      await query(
        `UPDATE task_conversations SET delegated_to_id = $1 WHERE id = $2`,
        [employeeId, conversationId]
      );
    }

    // Update task status
    await query(
      `UPDATE tasks SET status = 'assigned', employee_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [employeeId, taskId]
    );

    // Add history entry
    await query(
      `INSERT INTO task_history (task_id, action, actor_id, changes)
       VALUES ($1, $2, $3, $4)`,
      [taskId, 'delegated', delegatedById, JSON.stringify({ delegated_to: employeeId })]
    );

    return { conversationId, taskId, employeeId };
  }

  // Add message to task conversation
  async addTaskMessage(
    taskConversationId: string,
    senderId: string,
    content: string,
    role: 'user' | 'assistant'
  ) {
    const result = await query(
      `INSERT INTO task_messages (task_conversation_id, sender_id, content, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, sender_id, content, role, created_at`,
      [taskConversationId, senderId, content, role]
    );

    return result.rows[0];
  }

  // Create draft from message
  async createDraft(
    taskId: string,
    taskMessageId: string,
    title: string,
    content: string,
    createdById: string
  ) {
    // Get the latest version number
    const versionResult = await query(
      `SELECT MAX(version) as max_version FROM task_drafts WHERE task_id = $1`,
      [taskId]
    );

    const nextVersion = (versionResult.rows[0]?.max_version || 0) + 1;

    const result = await query(
      `INSERT INTO task_drafts (task_id, task_message_id, title, content, version, created_by_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, version, created_at`,
      [taskId, taskMessageId, title, content, nextVersion, createdById]
    );

    return result.rows[0];
  }

  // Approve draft as output
  async approveDraft(
    taskId: string,
    draftId: string,
    approvedById: string,
    outputType: string = 'document'
  ) {
    // Get draft details
    const draftResult = await query(
      `SELECT * FROM task_drafts WHERE id = $1 AND task_id = $2`,
      [draftId, taskId]
    );

    if (draftResult.rows.length === 0) {
      throw new Error('Draft not found');
    }

    const draft = draftResult.rows[0];

    // Create output from draft
    const outputResult = await query(
      `INSERT INTO task_outputs (task_id, draft_id, title, content, type, status, created_by_id, approved_by_id, approved_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
       RETURNING id, title, status, approved_at`,
      [
        taskId,
        draftId,
        draft.title,
        draft.content,
        outputType,
        'approved',
        draft.created_by_id,
        approvedById,
      ]
    );

    // Add history entry
    await query(
      `INSERT INTO task_history (task_id, action, actor_id, changes)
       VALUES ($1, $2, $3, $4)`,
      [taskId, 'output_approved', approvedById, JSON.stringify({ draft_version: draft.version })]
    );

    return outputResult.rows[0];
  }

  // Upload file to task
  async uploadFile(
    taskId: string,
    fileName: string,
    fileType: string,
    filePath: string,
    fileSize: number,
    uploadedById: string
  ) {
    const result = await query(
      `INSERT INTO task_files (task_id, file_name, file_type, file_path, file_size, uploaded_by_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, file_name, file_type, created_at`,
      [taskId, fileName, fileType, filePath, fileSize, uploadedById]
    );

    return result.rows[0];
  }

  // Update task status
  async updateTaskStatus(taskId: string, status: string, updatedById: string) {
    const result = await query(
      `UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, status, updated_at`,
      [status, taskId]
    );

    // Add history entry
    await query(
      `INSERT INTO task_history (task_id, action, actor_id, changes)
       VALUES ($1, $2, $3, $4)`,
      [taskId, 'status_changed', updatedById, JSON.stringify({ status })]
    );

    return result.rows[0];
  }

  // Save employee preference from feedback
  async saveEmployeePreference(
    employeeId: string,
    preferenceKey: string,
    preferenceValue: string,
    confidenceScore: number = 0.8
  ) {
    const result = await query(
      `INSERT INTO employee_preferences (employee_id, preference_key, preference_value, feedback_source, confidence_score)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (employee_id, preference_key)
       DO UPDATE SET preference_value = $3, confidence_score = $5, updated_at = CURRENT_TIMESTAMP
       RETURNING id, preference_key, preference_value`,
      [employeeId, preferenceKey, preferenceValue, 'user_feedback', confidenceScore]
    );

    return result.rows[0];
  }

  // Get employee preferences
  async getEmployeePreferences(employeeId: string) {
    const result = await query(
      `SELECT * FROM employee_preferences WHERE employee_id = $1 ORDER BY confidence_score DESC`,
      [employeeId]
    );

    return result.rows;
  }
}

export const taskWorkspaceService = new TaskWorkspaceService();
