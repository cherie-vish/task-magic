'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  date: Date | null;
  onSelect: (date: Date | null) => void;
  placeholder?: string;
}

export function DatePicker({ date, onSelect, placeholder = "Pick a date" }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        className={cn(
          "w-full justify-start text-left font-normal inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground",
          !date && "text-muted-foreground"
        )}
        onClick={() => setOpen(!open)}
      >
        <CalendarIcon className="h-4 w-4" />
        {date ? format(date, "PPP") : placeholder}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-md border shadow-md">
          <Calendar
            mode="single"
            selected={date || undefined}
            onSelect={(day) => {
              onSelect(day || null);
              setOpen(false);
            }}
            initialFocus
          />
        </div>
      )}
    </div>
  );
}