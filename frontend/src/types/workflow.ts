// Workflow-Typdefinitionen
export interface Workflow {
  id: number;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
  total_tasks: number;
  completed_tasks: number;
  stages?: WorkflowStage[];
}

export interface WorkflowStage {
  id: number;
  workflow_id: number;
  name: string;
  description?: string;
  order_index: number;
  is_required: boolean;
  estimated_duration?: number;
  created_at: string;
  tasks?: Task[];
}

export interface Task {
  id: number;
  workflow_id: number;
  stage_id?: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigned_to?: number;
  assigned_by?: number;
  assigned_to_name?: string;
  assigned_by_name?: string;
  due_date?: string;
  start_date?: string;
  completion_date?: string;
  estimated_hours?: number;
  created_at: string;
  updated_at: string;
  updated_by?: number;
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  dependencies?: Task[];
  workflow_name?: string;
  stage_name?: string;
}

export interface TaskComment {
  id: number;
  task_id: number;
  comment: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
}

export interface TaskAttachment {
  id: number;
  task_id: number;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  uploaded_by?: number;
  uploaded_by_name?: string;
  uploaded_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  related_entity_type?: string;
  related_entity_id?: number;
  created_at: string;
}

// Status-Optionen für Workflows und Aufgaben
export const WORKFLOW_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in progress',
  BLOCKED: 'blocked',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
}; 