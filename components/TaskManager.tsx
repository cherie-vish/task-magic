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
import { Plus, Pencil, Trash2, CheckCircle, Circle, Search, Flag, Calendar as CalendarIcon, Zap, BarChart3, Target, Award } from 'lucide-react';
import { toast } from 'sonner';
import TaskSkeleton from './TaskSkeleton';
import CategoryFilter from './CategoryFilter';
import { DatePicker } from './DatePicker';
import { motion, AnimatePresence } from 'framer-motion';

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
      toast.success('Task created');
    } catch (error) {
      toast.error('Failed to create');
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
      toast.success('Task updated');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleToggleComplete = async (task: Task) => {
    setCompletingTaskId(task.id);
    try {
      const updatedTask = await taskService.updateTask(task.id, {
        completed: !task.completed,
      });
      setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
      toast.success(!task.completed ? 'Completed! 🎯' : 'Back to todo');
    } catch (error) {
      toast.error('Failed');
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
      toast.success('Deleted');
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

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.priority !== b.priority) return b.priority - a.priority;
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const incompleteTasks = sortedTasks.filter(t => !t.completed);
  const completedTasks = sortedTasks.filter(t => t.completed);

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    productivity: tasks.length ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0,
    streak: Math.min(Math.floor(tasks.filter(t => t.completed).length / 3), 30),
  };

  const PriorityBadge = ({ priority }: { priority: number }) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    const colors = { 0: 'border-green-500 text-green-500', 1: 'border-yellow-500 text-yellow-500', 2: 'border-red-500 text-red-500' };
    return (
      <span className={`border-2 px-2 py-0.5 rounded-full text-xs font-bold ${colors[priority as keyof typeof colors]} bg-black`}>
        {config.label}
      </span>
    );
  };

  const CategoryBadge = ({ category }: { category: string }) => {
    const config = categoryConfig[category as keyof typeof categoryConfig];
    return (
      <span className="border-2 border-cyan-500 text-cyan-500 px-2 py-0.5 rounded-full text-xs font-bold bg-black">
        {config.icon} {config.label}
      </span>
    );
  };

  const DueDateBadge = ({ dueDate }: { dueDate: string | null }) => {
    if (!dueDate) return null;
    const status = getDueDateStatus(dueDate);
    const config = {
      overdue: { label: 'OVERDUE', className: 'border-red-500 text-red-500' },
      today: { label: 'TODAY', className: 'border-yellow-500 text-yellow-500' },
      upcoming: { label: 'SOON', className: 'border-emerald-500 text-emerald-500' },
    }[status || 'upcoming'];
    return (
      <span className={`border-2 ${config.className} px-2 py-0.5 rounded-full text-xs font-bold bg-black`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black border-b-2 border-cyan-500">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
                TASK//WARRIOR
              </h1>
              <p className="text-gray-500 mt-1 font-mono">crush your goals. every day.</p>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold border-2 border-cyan-400 shadow-[4px_4px_0px_0px_rgba(6,182,212,0.5)] hover:shadow-[2px_2px_0px_0px_rgba(6,182,212,0.5)] transition-all"
            >
              <Zap className="mr-2 h-4 w-4" />
              NEW TASK
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="border-2 border-cyan-500 p-4 bg-black">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-mono">TOTAL</p>
                  <p className="text-3xl font-black text-cyan-500">{stats.total}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-cyan-500" />
              </div>
            </div>
            <div className="border-2 border-purple-500 p-4 bg-black">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-mono">DONE</p>
                  <p className="text-3xl font-black text-purple-500">{stats.completed}</p>
                </div>
                <Target className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            <div className="border-2 border-emerald-500 p-4 bg-black">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-mono">PROGRESS</p>
                  <p className="text-3xl font-black text-emerald-500">{stats.productivity}%</p>
                </div>
                <Award className="h-8 w-8 text-emerald-500" />
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="h-4 bg-gray-900 border border-gray-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.productivity}%` }}
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
              />
            </div>
            <p className="text-right text-xs text-gray-500 mt-1 font-mono">{stats.productivity}% complete</p>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Search & Filters */}
        <div className="border-2 border-gray-800 p-6 bg-black mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
              <Input
                placeholder="SEARCH TASKS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-black border-gray-800 text-white font-mono focus:border-cyan-500"
              />
            </div>
            <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
          </div>
        </div>

        {/* Task Sections */}
        {loading ? (
          <TaskSkeleton />
        ) : (
          <AnimatePresence mode="wait">
            {incompleteTasks.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="border-l-4 border-cyan-500 pl-4 mb-4">
                  <h2 className="text-2xl font-black text-cyan-500 font-mono">// ACTIVE MISSIONS</h2>
                  <p className="text-gray-500 text-sm">{incompleteTasks.length} tasks remaining</p>
                </div>
                <div className="space-y-3">
                  <AnimatePresence>
                    {incompleteTasks.map((task, idx) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <NeoTaskCard
                          task={task}
                          onToggleComplete={() => handleToggleComplete(task)}
                          onEdit={() => openEditDialog(task)}
                          onDelete={() => confirmDelete(task.id)}
                          isUpdating={completingTaskId === task.id}
                          PriorityBadge={PriorityBadge}
                          CategoryBadge={CategoryBadge}
                          DueDateBadge={DueDateBadge}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {completedTasks.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="border-l-4 border-emerald-500 pl-4 mb-4">
                  <h2 className="text-2xl font-black text-emerald-500 font-mono">// COMPLETED</h2>
                  <p className="text-gray-500 text-sm">victory archive</p>
                </div>
                <div className="space-y-3">
                  {completedTasks.map((task) => (
                    <NeoTaskCard
                      key={task.id}
                      task={task}
                      onToggleComplete={() => handleToggleComplete(task)}
                      onEdit={() => openEditDialog(task)}
                      onDelete={() => confirmDelete(task.id)}
                      isUpdating={completingTaskId === task.id}
                      PriorityBadge={PriorityBadge}
                      CategoryBadge={CategoryBadge}
                      DueDateBadge={DueDateBadge}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {filteredTasks.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <div className="border-2 border-gray-800 p-12 bg-black">
                  <Zap className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-mono">NO TASKS FOUND</p>
                  <Button variant="link" onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }} className="text-cyan-500 mt-2">
                    CLEAR FILTERS
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Dialogs remain similar but with neo-brutalist styling */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-black border-2 border-cyan-500 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-cyan-500">NEW TASK</DialogTitle>
            <DialogDescription className="text-gray-500">deploy new mission</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-mono text-gray-400">TITLE *</label>
              <Input
                placeholder="Enter mission name"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-black border-gray-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-mono text-gray-400">DESCRIPTION</label>
              <Textarea
                placeholder="Mission details"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="bg-black border-gray-800 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-mono text-gray-400">PRIORITY</label>
                <Select value={String(formData.priority ?? 1)} onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value as string) })}>
                  <SelectTrigger className="bg-black border-gray-800">
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
                <label className="text-sm font-mono text-gray-400">CATEGORY</label>
                <Select value={formData.category ?? 'other'} onValueChange={(value) => setFormData({ ...formData, category: value as string })}>
                  <SelectTrigger className="bg-black border-gray-800">
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
              <label className="text-sm font-mono text-gray-400">DUE DATE</label>
              <DatePicker date={formData.dueDate ? new Date(formData.dueDate) : null} onSelect={(date) => setFormData({ ...formData, dueDate: date ? date.toISOString() : null })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-gray-800">CANCEL</Button>
            <Button onClick={handleCreateTask} className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold">DEPLOY</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="bg-black border-2 border-purple-500 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-purple-500">EDIT TASK</DialogTitle>
            <DialogDescription className="text-gray-500">modify mission parameters</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-mono text-gray-400">TITLE *</label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="bg-black border-gray-800 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-mono text-gray-400">DESCRIPTION</label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="bg-black border-gray-800 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-mono text-gray-400">PRIORITY</label>
                <Select value={String(formData.priority ?? 1)} onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value as string) })}>
                  <SelectTrigger className="bg-black border-gray-800">
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
                <label className="text-sm font-mono text-gray-400">CATEGORY</label>
                <Select value={formData.category ?? 'other'} onValueChange={(value) => setFormData({ ...formData, category: value as string })}>
                  <SelectTrigger className="bg-black border-gray-800">
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
              <label className="text-sm font-mono text-gray-400">DUE DATE</label>
              <DatePicker date={formData.dueDate ? new Date(formData.dueDate) : null} onSelect={(date) => setFormData({ ...formData, dueDate: date ? date.toISOString() : null })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)} className="border-gray-800">CANCEL</Button>
            <Button onClick={handleUpdateTask} className="bg-purple-600 hover:bg-purple-500 text-black font-bold">SAVE</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-black border-2 border-red-500">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-red-500">DELETE TASK?</DialogTitle>
            <DialogDescription className="text-gray-500">This action cannot be undone. Are you sure?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-gray-800">CANCEL</Button>
            <Button variant="destructive" onClick={handleConfirmedDelete} className="bg-red-600 hover:bg-red-500">DELETE</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Neo Task Card Component
function NeoTaskCard({ task, onToggleComplete, onEdit, onDelete, isUpdating, PriorityBadge, CategoryBadge, DueDateBadge }: {
  task: Task;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isUpdating: boolean;
  PriorityBadge: React.ComponentType<{ priority: number }>;
  CategoryBadge: React.ComponentType<{ category: string }>;
  DueDateBadge: React.ComponentType<{ dueDate: string | null }>;
}) {
  return (
    <div className={`border-2 ${task.completed ? 'border-gray-800 bg-black/50' : 'border-cyan-500 bg-black'} p-5 transition-all hover:shadow-[4px_4px_0px_0px_rgba(6,182,212,0.3)]`}>
      <div className="flex items-start gap-4">
        <button
          onClick={onToggleComplete}
          disabled={isUpdating}
          className="mt-1 flex-shrink-0 hover:scale-110 transition-transform disabled:opacity-50"
        >
          {isUpdating ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          ) : task.completed ? (
            <CheckCircle className="h-6 w-6 text-emerald-500" />
          ) : (
            <Circle className="h-6 w-6 text-cyan-500" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className={`font-bold font-mono ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>
              {task.title}
            </h3>
            <PriorityBadge priority={task.priority} />
            <CategoryBadge category={task.category} />
            <DueDateBadge dueDate={task.dueDate} />
          </div>
          {task.description && (
            <p className={`text-sm ${task.completed ? 'text-gray-600' : 'text-gray-400'} mt-1`}>
              {task.description}
            </p>
          )}
          {task.dueDate && (
            <p className="text-xs text-gray-600 mt-2 font-mono">
              DUE: {new Date(task.dueDate).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onEdit} className="text-gray-400 hover:text-cyan-500">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-gray-400 hover:text-red-500">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}