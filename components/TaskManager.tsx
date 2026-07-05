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
import { Plus, Pencil, Trash2, CheckCircle, Circle, Search, Flag, Sparkles, LayoutGrid, List, TrendingUp, Clock } from 'lucide-react';
import { toast } from 'sonner';
import TaskSkeleton from './TaskSkeleton';
import CategoryFilter from './CategoryFilter';
import { DatePicker } from './DatePicker';
import { SortableTaskContainer } from './SortableTaskContainer';
import { motion } from 'framer-motion';

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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

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

  // DND Handler - Instant reorder with local update
  const handleReorderTasks = async (taskIds: number[]) => {
    // Update local order values immediately
    const updatedTasks = tasks.map(task => {
      const newIndex = taskIds.indexOf(task.id);
      if (newIndex !== -1) {
        return { ...task, order: newIndex };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    
    try {
      await fetch('/api/tasks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds }),
      });
    } catch (error) {
      console.error('Failed to save order:', error);
      toast.error('Failed to save order');
      const freshTasks = await taskService.getAllTasks();
      setTasks(freshTasks);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return (a.order || 0) - (b.order || 0);
  });

  const incompleteTasks = sortedTasks.filter(t => !t.completed);
  const completedTasks = sortedTasks.filter(t => t.completed);

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    highPriority: tasks.filter(t => t.priority === 2 && !t.completed).length,
    dueToday: tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === new Date().toDateString() && !t.completed).length,
  };

  const PriorityBadge = ({ priority }: { priority: number }) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return (
      <span className={`glass-badge ${config.textColor}`}>
        <Flag className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const CategoryBadge = ({ category }: { category: string }) => {
    const config = categoryConfig[category as keyof typeof categoryConfig];
    return (
      <span className={`glass-badge ${config.textColor}`}>
        <span>{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const DueDateBadge = ({ dueDate }: { dueDate: string | null }) => {
    if (!dueDate) return null;
    const status = getDueDateStatus(dueDate);
    const config = {
      overdue: { label: 'Overdue', className: 'text-red-500' },
      today: { label: 'Today', className: 'text-yellow-500' },
      upcoming: { label: 'Upcoming', className: 'text-emerald-500' },
    }[status || 'upcoming'];
    return (
      <span className={`glass-badge ${config.className}`}>
        <Clock className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Glass Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/40 border-b border-white/20">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                TaskFlow
              </h1>
              <p className="text-gray-500 mt-1">Organize your day with elegance</p>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl hover:shadow-2xl transition-all"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Total Tasks', value: stats.total, icon: LayoutGrid, color: 'from-blue-500 to-cyan-500' },
              { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'from-emerald-500 to-green-500' },
              { label: 'High Priority', value: stats.highPriority, icon: TrendingUp, color: 'from-red-500 to-orange-500' },
              { label: 'Due Today', value: stats.dueToday, icon: Clock, color: 'from-yellow-500 to-amber-500' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-4 backdrop-blur-xl bg-white/30 border border-white/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Search & Filters */}
        <div className="rounded-2xl p-6 backdrop-blur-xl bg-white/30 border border-white/20 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white/50 border-white/30 focus:bg-white transition-all"
              />
            </div>
            <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/50'}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/50'}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

    {/* Task Sections */}
    {loading ? (
      <TaskSkeleton />
    ) : (
      <>
        {incompleteTasks.length > 0 && (
          <motion.div
            key="incomplete-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></span>
              To Do
              <span className="text-sm text-gray-400 ml-2">({incompleteTasks.length})</span>
            </h2>
            <SortableTaskContainer
              tasks={incompleteTasks}
              onReorder={handleReorderTasks}
              onToggleComplete={handleToggleComplete}
              onEdit={openEditDialog}
              onDelete={confirmDelete}
              isUpdatingId={completingTaskId}
              viewMode={viewMode}
            />
          </motion.div>
        )}

        {completedTasks.length > 0 && (
          <motion.div
            key="completed-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></span>
              Completed
              <span className="text-sm text-gray-400 ml-2">({completedTasks.length})</span>
            </h2>
            <SortableTaskContainer
              tasks={completedTasks}
              onReorder={handleReorderTasks}
              onToggleComplete={handleToggleComplete}
              onEdit={openEditDialog}
              onDelete={confirmDelete}
              isUpdatingId={completingTaskId}
              viewMode={viewMode}
            />
          </motion.div>
        )}

        {filteredTasks.length === 0 && (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="rounded-3xl p-12 backdrop-blur-xl bg-white/30 border border-white/20">
              <Sparkles className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No tasks found</p>
              <Button
                variant="link"
                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                className="mt-2"
              >
                Clear filters
              </Button>
            </div>
          </motion.div>
        )}
      </>
    )}
    </div>

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/90 border border-white/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Create New Task</DialogTitle>
            <DialogDescription>Add a new task to your workflow.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                placeholder="Enter task title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-white/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Enter task description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="bg-white/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={String(formData.priority ?? 1)}
                  onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value as string) })}
                >
                  <SelectTrigger className="bg-white/50">
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
                  <SelectTrigger className="bg-white/50">
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
            <Button onClick={handleCreateTask} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent className="backdrop-blur-xl bg-white/90 border border-white/30 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Edit Task</DialogTitle>
              <DialogDescription>Update your task details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-white/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="bg-white/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={String(formData.priority ?? 1)}
                    onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value as string) })}
                  >
                    <SelectTrigger className="bg-white/50">
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
                    <SelectTrigger className="bg-white/50">
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
              <Button onClick={handleUpdateTask} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/90 border border-white/30">
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