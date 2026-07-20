const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Company {
  id: string;
  name: string;
}

// Companies
export async function getDefaultCompany(): Promise<Company> {
  const response = await fetch(`${API_URL}/api/companies/default`);
  if (!response.ok) throw new Error('Failed to fetch company');
  return response.json();
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  type: 'human' | 'ai';
  is_ai: boolean;
  emoji: string;
  status: string;
  accent_color: string;
  authority_level: string;
  created_at: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
  employee_id?: string;
  employee_name?: string;
  assigned_by?: string;
  assigned_by_name?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  notes?: TaskNote[];
}

export interface TaskNote {
  id: string;
  content: string;
  author_id?: string;
  author_name?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title?: string;
  status: string;
  ai_employee_id: string;
  ai_name: string;
  ai_emoji: string;
  user_id?: string;
  user_name?: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_emoji: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

// Employees
export async function getEmployees(companyId: string): Promise<Employee[]> {
  const response = await fetch(`${API_URL}/api/employees?companyId=${companyId}`);
  if (!response.ok) throw new Error('Failed to fetch employees');
  return response.json();
}

export async function getEmployee(id: string): Promise<Employee> {
  const response = await fetch(`${API_URL}/api/employees/${id}`);
  if (!response.ok) throw new Error('Failed to fetch employee');
  return response.json();
}

export async function updateEmployeeStatus(id: string, status: string): Promise<Employee> {
  const response = await fetch(`${API_URL}/api/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update employee');
  return response.json();
}

export async function getEmployeeContract(id: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/employees/${id}/contract`);
  if (!response.ok) throw new Error('Failed to fetch contract');
  return response.json();
}

// Tasks
export async function getTasks(companyId: string): Promise<Task[]> {
  const response = await fetch(`${API_URL}/api/tasks?companyId=${companyId}`);
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
}

export async function getTask(id: string): Promise<Task> {
  const response = await fetch(`${API_URL}/api/tasks/${id}`);
  if (!response.ok) throw new Error('Failed to fetch task');
  return response.json();
}

export async function createTask(
  companyId: string,
  task: Partial<Task>
): Promise<Task> {
  const response = await fetch(`${API_URL}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companyId, ...task }),
  });
  if (!response.ok) throw new Error('Failed to create task');
  return response.json();
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  const response = await fetch(`${API_URL}/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update task');
  return response.json();
}

export async function addTaskNote(
  taskId: string,
  content: string,
  authorId?: string
): Promise<TaskNote> {
  const response = await fetch(`${API_URL}/api/tasks/${taskId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, authorId }),
  });
  if (!response.ok) throw new Error('Failed to add note');
  return response.json();
}

// Conversations
export async function getConversations(
  companyId: string,
  filters?: { userId?: string; aiEmployeeId?: string }
): Promise<Conversation[]> {
  const params = new URLSearchParams({ companyId });
  if (filters?.userId) params.append('userId', filters.userId);
  if (filters?.aiEmployeeId) params.append('aiEmployeeId', filters.aiEmployeeId);

  const response = await fetch(`${API_URL}/api/conversations?${params}`);
  if (!response.ok) throw new Error('Failed to fetch conversations');
  return response.json();
}

export async function getConversation(id: string): Promise<Conversation> {
  const response = await fetch(`${API_URL}/api/conversations/${id}`);
  if (!response.ok) throw new Error('Failed to fetch conversation');
  return response.json();
}

export async function createConversation(
  companyId: string,
  aiEmployeeId: string,
  userId?: string,
  title?: string
): Promise<Conversation> {
  const response = await fetch(`${API_URL}/api/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companyId, aiEmployeeId, userId, title }),
  });
  if (!response.ok) throw new Error('Failed to create conversation');
  return response.json();
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<Message> {
  const response = await fetch(`${API_URL}/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senderId, content }),
  });
  if (!response.ok) throw new Error('Failed to send message');
  return response.json();
}

export async function suggestSpecialistAI(
  conversationId: string,
  taskTitle: string,
  taskDescription: string,
  companyId: string
): Promise<any> {
  const response = await fetch(`${API_URL}/api/conversations/${conversationId}/suggest-specialist-ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskTitle, taskDescription, companyId }),
  });
  if (!response.ok) throw new Error('Failed to suggest specialist AI');
  return response.json();
}

// Specialist AI
export interface AICapability {
  name: string;
  domain: string;
  canApproveUpTo?: number;
  responsibilities: string[];
  escalationPath: string;
}

export async function getSpecialistAICapabilities(aiEmployeeId: string): Promise<AICapability> {
  const response = await fetch(`${API_URL}/api/specialist-ai/${aiEmployeeId}/capabilities`);
  if (!response.ok) throw new Error('Failed to fetch capabilities');
  return response.json();
}

export async function processTaskWithAI(
  aiEmployeeId: string,
  taskId: string
): Promise<any> {
  const response = await fetch(`${API_URL}/api/specialist-ai/${aiEmployeeId}/process-task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId }),
  });
  if (!response.ok) throw new Error('Failed to process task');
  return response.json();
}

export async function delegateTaskToAI(
  aiEmployeeId: string,
  taskId: string,
  reason?: string
): Promise<any> {
  const response = await fetch(`${API_URL}/api/specialist-ai/${aiEmployeeId}/delegate-task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, reason }),
  });
  if (!response.ok) throw new Error('Failed to delegate task');
  return response.json();
}

// Task Workspace
export async function getTaskWorkspace(taskId: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/task-workspace/${taskId}`);
  if (!response.ok) throw new Error('Failed to fetch task workspace');
  return response.json();
}

export async function delegateTask(
  taskId: string,
  employeeId: string,
  delegatedById: string
): Promise<any> {
  const response = await fetch(`${API_URL}/api/task-workspace/${taskId}/delegate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId, delegatedById }),
  });
  if (!response.ok) throw new Error('Failed to delegate task');
  return response.json();
}

export async function getTaskMessages(taskId: string): Promise<Message[]> {
  const response = await fetch(`${API_URL}/api/task-workspace/${taskId}/messages`);
  if (!response.ok) throw new Error('Failed to fetch task messages');
  return response.json();
}

export async function addTaskMessage(
  taskId: string,
  senderId: string,
  content: string,
  role: 'user' | 'assistant'
): Promise<Message> {
  const response = await fetch(`${API_URL}/api/task-workspace/${taskId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senderId, content, role }),
  });
  if (!response.ok) throw new Error('Failed to add message');
  return response.json();
}

export async function createDraft(
  taskId: string,
  title: string,
  content: string,
  createdById: string,
  messageId?: string
): Promise<any> {
  const response = await fetch(`${API_URL}/api/task-workspace/${taskId}/drafts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, createdById, messageId }),
  });
  if (!response.ok) throw new Error('Failed to create draft');
  return response.json();
}

export async function getTaskDrafts(taskId: string): Promise<any[]> {
  const response = await fetch(`${API_URL}/api/task-workspace/${taskId}/drafts`);
  if (!response.ok) throw new Error('Failed to fetch drafts');
  return response.json();
}

export async function approveDraft(
  taskId: string,
  draftId: string,
  approvedById: string,
  outputType?: string
): Promise<any> {
  const response = await fetch(`${API_URL}/api/task-workspace/${taskId}/outputs/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ draftId, approvedById, outputType }),
  });
  if (!response.ok) throw new Error('Failed to approve draft');
  return response.json();
}

export async function getTaskOutputs(taskId: string): Promise<any[]> {
  const response = await fetch(`${API_URL}/api/task-workspace/${taskId}/outputs`);
  if (!response.ok) throw new Error('Failed to fetch outputs');
  return response.json();
}

export async function getTaskFiles(taskId: string): Promise<any[]> {
  const response = await fetch(`${API_URL}/api/task-workspace/${taskId}/files`);
  if (!response.ok) throw new Error('Failed to fetch files');
  return response.json();
}

export async function updateTaskStatus(
  taskId: string,
  status: string,
  updatedById: string
): Promise<any> {
  const response = await fetch(`${API_URL}/api/task-workspace/${taskId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, updatedById }),
  });
  if (!response.ok) throw new Error('Failed to update task status');
  return response.json();
}

export async function getTaskHistory(taskId: string): Promise<any[]> {
  const response = await fetch(`${API_URL}/api/task-workspace/${taskId}/history`);
  if (!response.ok) throw new Error('Failed to fetch task history');
  return response.json();
}

export async function getSpecialistResponse(
  taskId: string,
  senderId: string,
  content: string
): Promise<Message> {
  const response = await fetch(`${API_URL}/api/task-workspace/${taskId}/specialist-response`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senderId, content }),
  });
  if (!response.ok) throw new Error('Failed to get specialist response');
  return response.json();
}

// Phase 5: Knowledge Integration

export async function getCompanyGuidelines(companyId: string): Promise<any[]> {
  const response = await fetch(`${API_URL}/api/task-workspace/company/${companyId}/guidelines`);
  if (!response.ok) throw new Error('Failed to fetch guidelines');
  return response.json();
}

export async function createCompanyGuideline(
  companyId: string,
  guideline: {
    category: string;
    title: string;
    description: string;
    examples?: string[];
    createdById?: string;
  }
): Promise<any> {
  const response = await fetch(`${API_URL}/api/task-workspace/company/${companyId}/guidelines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(guideline),
  });
  if (!response.ok) throw new Error('Failed to create guideline');
  return response.json();
}

export async function getCompanyKnowledge(companyId: string): Promise<any[]> {
  const response = await fetch(`${API_URL}/api/task-workspace/company/${companyId}/knowledge`);
  if (!response.ok) throw new Error('Failed to fetch knowledge');
  return response.json();
}

export async function createKnowledgeEntry(
  companyId: string,
  knowledge: {
    title: string;
    content: string;
    domain?: string;
    type?: string;
    tags?: string[];
    ownerId?: string;
  }
): Promise<any> {
  const response = await fetch(`${API_URL}/api/task-workspace/company/${companyId}/knowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(knowledge),
  });
  if (!response.ok) throw new Error('Failed to create knowledge entry');
  return response.json();
}

export async function linkOutputToKnowledge(
  taskId: string,
  outputId: string,
  knowledgeId: string,
  relevanceScore?: number
): Promise<any> {
  const response = await fetch(
    `${API_URL}/api/task-workspace/task/${taskId}/output/${outputId}/link-knowledge/${knowledgeId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relevanceScore }),
    }
  );
  if (!response.ok) throw new Error('Failed to link output to knowledge');
  return response.json();
}

export async function getSpecialistContextHistory(
  specialistId: string,
  taskId: string
): Promise<any[]> {
  const response = await fetch(`${API_URL}/api/task-workspace/specialist/${specialistId}/context-history/${taskId}`);
  if (!response.ok) throw new Error('Failed to fetch context history');
  return response.json();
}

// Phase 6: Advanced Features

// Task Templates
export async function createTaskTemplate(
  companyId: string,
  template: {
    name: string;
    description?: string;
    category?: string;
    defaultPriority?: string;
    estimatedHours?: number;
    steps?: any[];
    requiredSpecialists?: string[];
  }
): Promise<any> {
  const response = await fetch(`${API_URL}/api/advanced/company/${companyId}/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(template),
  });
  if (!response.ok) throw new Error('Failed to create template');
  return response.json();
}

export async function getTaskTemplates(companyId: string): Promise<any[]> {
  const response = await fetch(`${API_URL}/api/advanced/company/${companyId}/templates`);
  if (!response.ok) throw new Error('Failed to fetch templates');
  return response.json();
}

// Task Collaborations
export async function addTaskCollaborator(
  taskId: string,
  specialistId: string,
  role: string = 'contributor'
): Promise<any> {
  const response = await fetch(`${API_URL}/api/advanced/task/${taskId}/collaborators`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ specialistId, role }),
  });
  if (!response.ok) throw new Error('Failed to add collaborator');
  return response.json();
}

export async function getTaskCollaborators(taskId: string): Promise<any[]> {
  const response = await fetch(`${API_URL}/api/advanced/task/${taskId}/collaborators`);
  if (!response.ok) throw new Error('Failed to fetch collaborators');
  return response.json();
}

// Specialist Performance
export async function getSpecialistPerformance(
  specialistId: string,
  periodStart: string,
  periodEnd: string
): Promise<any> {
  const response = await fetch(
    `${API_URL}/api/advanced/specialist/${specialistId}/performance?periodStart=${periodStart}&periodEnd=${periodEnd}`
  );
  if (!response.ok) throw new Error('Failed to fetch performance');
  return response.json();
}

export async function getTeamPerformance(
  companyId: string,
  periodStart: string,
  periodEnd: string
): Promise<any[]> {
  const response = await fetch(
    `${API_URL}/api/advanced/company/${companyId}/team-performance?periodStart=${periodStart}&periodEnd=${periodEnd}`
  );
  if (!response.ok) throw new Error('Failed to fetch team performance');
  return response.json();
}

// Task Analytics
export async function recordTaskAnalytics(
  taskId: string,
  analytics: {
    timeToComplete?: number;
    revisionCount?: number;
    approvalRate?: number;
    userSatisfaction?: number;
    businessImpact?: string;
  }
): Promise<any> {
  const response = await fetch(`${API_URL}/api/advanced/task/${taskId}/analytics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(analytics),
  });
  if (!response.ok) throw new Error('Failed to record analytics');
  return response.json();
}

export async function getTaskAnalytics(taskId: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/advanced/task/${taskId}/analytics`);
  if (!response.ok) throw new Error('Failed to fetch analytics');
  return response.json();
}

export async function getCompanyAnalytics(companyId: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/advanced/company/${companyId}/analytics`);
  if (!response.ok) throw new Error('Failed to fetch company analytics');
  return response.json();
}

// Task Dependencies
export async function addTaskDependency(
  taskId: string,
  prerequisiteTaskId: string,
  dependencyType: string = 'blocks'
): Promise<any> {
  const response = await fetch(`${API_URL}/api/advanced/task/${taskId}/dependencies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prerequisiteTaskId, dependencyType }),
  });
  if (!response.ok) throw new Error('Failed to add dependency');
  return response.json();
}

export async function getTaskDependencies(taskId: string): Promise<any[]> {
  const response = await fetch(`${API_URL}/api/advanced/task/${taskId}/dependencies`);
  if (!response.ok) throw new Error('Failed to fetch dependencies');
  return response.json();
}
