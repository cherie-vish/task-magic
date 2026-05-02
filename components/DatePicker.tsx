'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  date: Date | null;
  onSelect: (date: Date | null) => void;
  placeholder?: string;
}

export function DatePicker({ date, onSelect, placeholder = "Pick a date" }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "w-full justify-start text-left font-normal inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground cursor-pointer",
          !date && "text-muted-foreground"
        )}
        onClick={() => setOpen(true)}
      >
        <CalendarIcon className="h-4 w-4" />
        {date ? format(date, "PPP") : placeholder}
      </div>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date || undefined}
          onSelect={(day) => {
            onSelect(day || null);
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}