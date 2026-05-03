'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Circle, Pencil, Trash2, GripVertical, Flag } from 'lucide-react';
import { priorityConfig, categoryConfig, getDueDateStatus, Task } from '@/lib/services/taskService';

interface SortableTaskCardProps {
  task: Task;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isUpdating: boolean;
}

export function SortableTaskCard({ task, onToggleComplete, onEdit, onDelete, isUpdating }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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
    <div ref={setNodeRef} style={style} className="group">
      <Card className={`transition-all ${task.completed ? 'opacity-75' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing mt-1 flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <GripVertical className="h-5 w-5" />
            </div>

            {/* Checkbox */}
            <button
              onClick={onToggleComplete}
              disabled={isUpdating}
              className="mt-1 flex-shrink-0 hover:scale-110 transition-transform disabled:opacity-50"
            >
              {isUpdating ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : task.completed ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {/* Task Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`font-semibold ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </h3>
                <PriorityBadge priority={task.priority} />
                <CategoryBadge category={task.category} />
                <DueDateBadge dueDate={task.dueDate} />
              </div>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
              )}
              {task.dueDate && (
                <p className="text-xs text-muted-foreground mt-2">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Action Buttons */}
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
    </div>
  );
}