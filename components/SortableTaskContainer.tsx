'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableTaskCard } from './SortableTaskCard';
import { Task } from '@/lib/services/taskService';

interface SortableTaskContainerProps {
  tasks: Task[];
  onReorder: (taskIds: number[]) => void;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  isUpdatingId: number | null;
}

export function SortableTaskContainer({
  tasks,
  onReorder,
  onToggleComplete,
  onEdit,
  onDelete,
  isUpdatingId,
}: SortableTaskContainerProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      const newOrder = arrayMove(tasks, oldIndex, newIndex);
      const taskIds = newOrder.map((t) => t.id);
      
      // Call parent handler immediately
      onReorder(taskIds);
    }
  };

  if (tasks.length === 0) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext 
        items={tasks.map((t) => t.id)} 
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onToggleComplete={() => onToggleComplete(task)}
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task.id)}
              isUpdating={isUpdatingId === task.id}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}