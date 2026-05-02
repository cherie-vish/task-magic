'use client';

import { Button } from '@/components/ui/button';
import { categoryConfig } from '@/lib/services/taskService';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const categories = [
    { id: 'all', label: 'All', icon: '📋' },
    ...Object.entries(categoryConfig).map(([key, value]) => ({
      id: key,
      label: value.label,
      icon: value.icon,
    })),
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <Button
          key={cat.id}
          variant={selectedCategory === cat.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategoryChange(cat.id)}
          className="gap-2"
        >
          <span>{cat.icon}</span>
          {cat.label}
        </Button>
      ))}
    </div>
  );
}