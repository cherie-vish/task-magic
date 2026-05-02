export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  priority: number; // 0=low,1=medium,2=high
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: number;
  completed?: boolean;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  priority?: number;
  completed?: boolean;
}

class TaskService {
  private baseUrl = '/api/tasks';

  async getAllTasks(): Promise<Task[]> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  }

  async getTask(id: number): Promise<Task> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) throw new Error('Failed to fetch task');
    return response.json();
  }

  async createTask(data: CreateTaskInput): Promise<Task> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create task');
    }
    return response.json();
  }

  async updateTask(id: number, data: UpdateTaskInput): Promise<Task> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update task');
    }
    return response.json();
  }

  async deleteTask(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete task');
    }
  }
}

export const taskService = new TaskService();

export const priorityConfig = {
  0: { label: 'Low', color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-100' },
  1: { label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgLight: 'bg-yellow-100' },
  2: { label: 'High', color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-100' },
};