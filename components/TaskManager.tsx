'use client';

import { useState, useEffect } from 'react';
import { taskService, Task, CreateTaskInput, priorityConfig, categoryConfig, getDueDateStatus } from '@/lib/services/taskService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, CheckCircle, Circle, Search, Flag } from 'lucide-react';
import { toast } from 'sonner';
import TaskSkeleton from './TaskSkeleton';
import CategoryFilter from './CategoryFilter';
import { DatePicker } from './DatePicker';
import { SortableTaskContainer } from './SortableTaskContainer';

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: '',
    description: '',
    priority: 1,
    category: 'other',
    dueDate: null,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);

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
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!formData.title.trim()) {
      toast.warning('Task title is required');
      return;
    }
    try {
      const newTask = await taskService.createTask(formData);
      setTasks([newTask, ...tasks]);
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Task created successfully');
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    if (!formData.title?.trim()) {
      toast.warning('Task title is required');
      return;
    }
    try {
      const updatedTask = await taskService.updateTask(editingTask.id, {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        category: formData.category,
        dueDate: formData.dueDate,
      });
      setTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task));
      setEditingTask(null);
      resetForm();
      toast.success('Task updated successfully');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleToggleComplete = async (task: Task) => {
    setCompletingTaskId(task.id);
    try {
      const updatedTask = await taskService.updateTask(task.id, {
        completed: !task.completed,
      });
      setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
      toast.success(!task.completed ? 'Task completed! 🎉' : 'Task marked incomplete');
    } catch (error) {
      toast.error('Failed to update');
    } finally {
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
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Failed to delete');
    } finally {
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', priority: 1, category: 'other', dueDate: null });
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate,
    });
  };

  // FIXED: Reorder with local order update - NO REFRESH NEEDED
  const handleReorderTasks = async (taskIds: number[]) => {
    // Get the tasks being reordered
    const reorderedTasksData = taskIds.map(id => tasks.find(t => t.id === id)!);
    
    // Update local order values immediately (0, 1, 2, 3...)
    const updatedTasks = tasks.map(task => {
      const newIndex = taskIds.indexOf(task.id);
      if (newIndex !== -1) {
        return { ...task, order: newIndex };
      }
      return task;
    });
    
    // Update UI instantly with new order values
    setTasks(updatedTasks);
    
    // Send to server in background
    try {
      const response = await fetch('/api/tasks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds }),
      });
      
      if (!response.ok) {
        throw new Error('Reorder failed');
      }
    } catch (error) {
      console.error('Failed to save order:', error);
      toast.error('Failed to save order');
      // Reload to restore original order
      const freshTasks = await taskService.getAllTasks();
      setTasks(freshTasks);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort by order field (now updated instantly by handleReorderTasks)
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return (a.order || 0) - (b.order || 0);
  });

  const incompleteTasks = sortedTasks.filter(t => !t.completed);
  const completedTasks = sortedTasks.filter(t => t.completed);

  const PriorityBadge = ({ priority }: { priority: number }) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgLight} ${config.textColor}`}>
        <Flag className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const CategoryBadge = ({ category }: { category: string }) => {
    const config = categoryConfig[category as keyof typeof categoryConfig];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgLight} ${config.textColor}`}>
        <span>{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const DueDateBadge = ({ dueDate }: { dueDate: string | null }) => {
    if (!dueDate) return null;
    const status = getDueDateStatus(dueDate);
    const config = {
      overdue: { label: 'Overdue', className: 'bg-red-100 text-red-700' },
      today: { label: 'Today', className: 'bg-yellow-100 text-yellow-700' },
      upcoming: { label: 'Upcoming', className: 'bg-green-100 text-green-700' },
    }[status || 'upcoming'];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

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
      </div>

      {/* Category Filter */}
      <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />

      {/* Task List Area */}
      {loading ? (
        <TaskSkeleton />
      ) : (
        <>
          {incompleteTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">To Do</h2>
              <SortableTaskContainer
                tasks={incompleteTasks}
                onReorder={handleReorderTasks}
                onToggleComplete={handleToggleComplete}
                onEdit={openEditDialog}
                onDelete={confirmDelete}
                isUpdatingId={completingTaskId}
              />
            </div>
          )}

          {completedTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Completed</h2>
              <SortableTaskContainer
                tasks={completedTasks}
                onReorder={handleReorderTasks}
                onToggleComplete={handleToggleComplete}
                onEdit={openEditDialog}
                onDelete={confirmDelete}
                isUpdatingId={completingTaskId}
              />
            </div>
          )}

          {filteredTasks.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                {tasks.length === 0 ? (
                  <p className="text-muted-foreground">No tasks yet. Create your first task!</p>
                ) : (
                  <div>
                    <p className="text-muted-foreground">No tasks found matching your filters</p>
                    <Button variant="link" onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }} className="mt-2">
                      Clear filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Add a new task to your list.</DialogDescription>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={String(formData.priority ?? 1)}
                  onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value as string) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Low</SelectItem>
                    <SelectItem value="1">Medium</SelectItem>
                    <SelectItem value="2">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={formData.category ?? 'other'}
                  onValueChange={(value) => setFormData({ ...formData, category: value as string })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">💼 Work</SelectItem>
                    <SelectItem value="personal">👤 Personal</SelectItem>
                    <SelectItem value="shopping">🛒 Shopping</SelectItem>
                    <SelectItem value="health">💪 Health</SelectItem>
                    <SelectItem value="other">📌 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <DatePicker
                date={formData.dueDate ? new Date(formData.dueDate) : null}
                onSelect={(date) => setFormData({ ...formData, dueDate: date ? date.toISOString() : null })}
                placeholder="No due date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTask}>Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>Update your task details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={String(formData.priority ?? 1)}
                    onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value as string) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Low</SelectItem>
                      <SelectItem value="1">Medium</SelectItem>
                      <SelectItem value="2">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={formData.category ?? 'other'}
                    onValueChange={(value) => setFormData({ ...formData, category: value as string })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work">💼 Work</SelectItem>
                      <SelectItem value="personal">👤 Personal</SelectItem>
                      <SelectItem value="shopping">🛒 Shopping</SelectItem>
                      <SelectItem value="health">💪 Health</SelectItem>
                      <SelectItem value="other">📌 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <DatePicker
                  date={formData.dueDate ? new Date(formData.dueDate) : null}
                  onSelect={(date) => setFormData({ ...formData, dueDate: date ? date.toISOString() : null })}
                  placeholder="No due date"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTask(null)}>Cancel</Button>
              <Button onClick={handleUpdateTask}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmedDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}