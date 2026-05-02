'use client';

import { useState, useEffect } from 'react';
import { taskService, Task, CreateTaskInput } from '@/lib/services/taskService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Pencil, Search, Trash2, CheckCircle, Circle } from 'lucide-react';
import { toast } from 'sonner';
import TaskSkeleton from './TaskSkeleton';

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: '',
    description: '',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getAllTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast.error('Failed to load tasks', {
        description: 'Please refresh the page and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!formData.title.trim()) {
      toast.warning('Task title is required', {
        description: 'Please enter a title for your task.',
      });
      return;
    }

    try {
      const newTask = await taskService.createTask(formData);
      setTasks([newTask, ...tasks]);
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Task created successfully', {
        description: `"${formData.title}" has been added.`,
      });
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task', {
        description: 'Please try again.',
      });
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    if (!formData.title?.trim()) {
      toast.warning('Task title is required', {
        description: 'Please enter a title for your task.',
      });
      return;
    }

    try {
      const updatedTask = await taskService.updateTask(editingTask.id, {
        title: formData.title,
        description: formData.description,
      });
      setTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task));
      setEditingTask(null);
      resetForm();
      toast.success('Task updated successfully', {
        description: `"${updatedTask.title}" has been updated.`,
      });
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task', {
        description: 'Please try again.',
      });
    }
  };

const handleToggleComplete = async (task: Task) => {
  // Set loading state for this specific task
  setCompletingTaskId(task.id);
  
  try {
    // Wait for server response FIRST
    const updatedTask = await taskService.updateTask(task.id, {
      completed: !task.completed,
    });
    
    // ONLY update UI after server confirms
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    
    toast.success(
      !task.completed ? 'Task completed! 🎉' : 'Task marked as incomplete',
      {
        description: `"${updatedTask.title}"`,
      }
    );
  } catch (error) {
    console.error('Failed to update task status:', error);
    toast.error('Failed to update task status', {
      description: 'Please try again.',
    });
  } finally {
    // Clear loading state
    setCompletingTaskId(null);
  }
};

  const confirmDelete = (id: number) => {
    setTaskToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmedDelete = async () => {
    if (!taskToDelete) return;
    
    try {
      await taskService.deleteTask(taskToDelete);
      setTasks(tasks.filter(task => task.id !== taskToDelete));
      toast.success('Task deleted successfully', {
        description: 'The task has been removed.',
      });
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task', {
        description: 'Please try again.',
      });
    } finally {
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '' });
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
    });
  };

const sortedTasks = [...tasks].sort((a, b) => {
  if (a.completed !== b.completed) return a.completed ? 1 : -1;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
});

// Add this filter
const filteredTasks = sortedTasks.filter(task =>
  task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
  (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
);

const incompleteTasks = filteredTasks.filter(t => !t.completed);
const completedTasks = filteredTasks.filter(t => t.completed);
return (
    <div className="container max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
{/* Header */}
<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
  <div>
    <h1 className="text-3xl font-bold">Task Manager</h1>
    <p className="text-muted-foreground mt-1">
      {!loading && `${tasks.length} task${tasks.length !== 1 ? 's' : ''} total`}
      {loading && 'Loading tasks...'}
    </p>
  </div>
  <div className="flex gap-2 w-full sm:w-auto">
    <div className="relative flex-1 sm:w-64">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search tasks..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-9 w-full"
        disabled={loading}
      />
    </div>
    <Button onClick={() => setIsCreateDialogOpen(true)} disabled={loading}>
      <Plus className="mr-2 h-4 w-4" />
      New Task
    </Button>
  </div>
</div>      {/* Task List Area - Show Skeleton OR Actual Tasks */}
      {loading ? (
        <TaskSkeleton />
      ) : (
        <>
          {/* Incomplete Tasks */}
          {incompleteTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">To Do</h2>
                {incompleteTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={() => handleToggleComplete(task)}
                    onEdit={() => openEditDialog(task)}
                    onDelete={() => confirmDelete(task.id)}
                    isUpdating={completingTaskId === task.id}
                  />
                ))}
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Completed</h2>
                {completedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={() => handleToggleComplete(task)}
                    onEdit={() => openEditDialog(task)}
                    onDelete={() => confirmDelete(task.id)}
                    isUpdating={completingTaskId === task.id}
                  />
                ))}
            </div>
          )}

          {/* No Results or Empty State */}
          {filteredTasks.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                {tasks.length === 0 ? (
                  <p className="text-muted-foreground">No tasks yet. Create your first task!</p>
                ) : (
                  <div>
                    <p className="text-muted-foreground">No tasks found matching "{searchTerm}"</p>
                    <Button 
                      variant="link" 
                      onClick={() => setSearchTerm('')}
                      className="mt-2"
                    >
                      Clear search
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}        </>
      )}

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to your list. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                placeholder="Enter task title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Enter task description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask}>Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Update your task details below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <Input
                  placeholder="Enter task title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Enter task description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTask(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTask}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Task?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmedDelete}>
              Delete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Task Card Component
// Task Card Component
function TaskCard({ task, onToggleComplete, onEdit, onDelete, isUpdating }: {
  task: Task;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isUpdating: boolean;
}) {
  return (
    <Card className={`transition-all ${task.completed ? 'opacity-75' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={onToggleComplete}
            disabled={isUpdating}
            className="mt-1 flex-shrink-0 hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : task.completed ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
              {isUpdating && (
                <span className="ml-2 text-xs text-muted-foreground">(updating...)</span>
              )}
            </h3>
            {task.description && (
              <p className={`text-sm mt-1 ${task.completed ? 'text-muted-foreground line-through' : 'text-muted-foreground'}`}>
                {task.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Created: {new Date(task.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}