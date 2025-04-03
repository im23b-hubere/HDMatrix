import axios from 'axios';
import { 
  Workflow, 
  Task, 
  WorkflowStage, 
  TaskComment, 
  TaskAttachment, 
  Notification 
} from '../types/workflow';

const API_URL = 'http://localhost:5000/api/workflow';

// Service-Methoden
export const getAllWorkflows = async (): Promise<Workflow[]> => {
  const response = await axios.get(`${API_URL}/workflows`);
  return response.data;
};

export const getWorkflowById = async (workflowId: number): Promise<Workflow> => {
  const response = await axios.get(`${API_URL}/workflows/${workflowId}`);
  return response.data;
};

export const createWorkflow = async (workflowData: Partial<Workflow>): Promise<{ id: number; message: string }> => {
  const response = await axios.post(`${API_URL}/workflows`, workflowData);
  return response.data;
};

export const updateWorkflow = async (workflowId: number, workflowData: Partial<Workflow>): Promise<{ message: string }> => {
  const response = await axios.put(`${API_URL}/workflows/${workflowId}`, workflowData);
  return response.data;
};

export const deleteWorkflow = async (workflowId: number): Promise<{ message: string }> => {
  const response = await axios.delete(`${API_URL}/workflows/${workflowId}`);
  return response.data;
};

export const getTaskById = async (taskId: number): Promise<Task> => {
  const response = await axios.get(`${API_URL}/tasks/${taskId}`);
  return response.data;
};

export const createTask = async (taskData: Partial<Task>): Promise<{ id: number; message: string }> => {
  const response = await axios.post(`${API_URL}/tasks`, taskData);
  return response.data;
};

export const updateTask = async (taskId: number, taskData: Partial<Task>): Promise<{ message: string }> => {
  const response = await axios.put(`${API_URL}/tasks/${taskId}`, taskData);
  return response.data;
};

export const addTaskComment = async (taskId: number, comment: string, userId?: number): Promise<{ id: number; message: string }> => {
  const response = await axios.post(`${API_URL}/tasks/${taskId}/comments`, {
    comment,
    created_by: userId
  });
  return response.data;
};

export const addTaskAttachment = async (taskId: number, file: File, userId?: number): Promise<{ id: number; file_name: string; message: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  if (userId) {
    formData.append('user_id', userId.toString());
  }

  const response = await axios.post(`${API_URL}/tasks/${taskId}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const getUserTasks = async (userId: number, status?: string): Promise<Task[]> => {
  const url = status 
    ? `${API_URL}/user/${userId}/tasks?status=${status}` 
    : `${API_URL}/user/${userId}/tasks`;
  const response = await axios.get(url);
  return response.data;
};

export const getUserNotifications = async (userId: number, isRead?: boolean): Promise<Notification[]> => {
  const url = isRead !== undefined 
    ? `${API_URL}/user/${userId}/notifications?is_read=${isRead}` 
    : `${API_URL}/user/${userId}/notifications`;
  const response = await axios.get(url);
  return response.data;
};

export const markNotificationAsRead = async (notificationId: number): Promise<{ message: string }> => {
  const response = await axios.put(`${API_URL}/notifications/${notificationId}/read`, {});
  return response.data;
};

const workflowService = {
  getAllWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  getTaskById,
  createTask,
  updateTask,
  addTaskComment,
  addTaskAttachment,
  getUserTasks,
  getUserNotifications,
  markNotificationAsRead
};

export default workflowService; 