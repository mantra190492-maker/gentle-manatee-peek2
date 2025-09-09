"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/lib/tasksStore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check } from "lucide-react";

type StatusValue = TaskStatus;

interface StatusPillProps {
  value: StatusValue | "";
  onChange: (next: StatusValue) => void;
  disabled?: boolean;
  isEmpty?: boolean; // For rendering empty state in table
}

const statusOptions: { label: TaskStatus; color: string }[] = [
  { label: "Not Started", color: "bg-violet-100 text-violet-800 border-violet-200" },
  { label: "In Progress", color: "bg-sky-100 text-sky-800 border-sky-200" },
  { label: "Working on it", color: "bg-amber-100 text-amber-800 border-amber-200" }, // Added "Working on it"
  { label: "Completed", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { label: "Stuck", color: "bg-rose-100 text-rose-800 border-rose-200" },
  { label: "Done", color: "bg-emerald-100 text-emerald-800 border-emerald-200" }, // Assuming "Done" is also completed
  { label: "Pending", color: "bg-gray-200 text-gray-800 border-gray-300" },
];

export function StatusPill({ value, onChange, disabled, isEmpty = false }: StatusPillProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const currentStatus = statusOptions.find(opt => opt.label === value);
  const displayLabel = currentStatus ? currentStatus.label : (isEmpty ? "" : "Select Status");
  const displayColor = currentStatus ? currentStatus.color : "bg-gray-100 text-gray-800 border-gray-200";

  const handleSelect = (status: StatusValue) => {
    onChange(status);
    setOpen(false);
    triggerRef.current?.focus(); // Return focus to the trigger button
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!open || !contentRef.current) return;

    const items = Array.from(contentRef.current.querySelectorAll<HTMLButtonElement>('[role="option"]'));
    if (items.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setFocusedIndex(prev => (prev + 1) % items.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setFocusedIndex(prev => (prev - 1 + items.length) % items.length);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (focusedIndex !== -1) {
        items[focusedIndex].click();
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  }, [open, focusedIndex]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      if (focusedIndex !== -1 && contentRef.current) {
        const items = Array.from(contentRef.current.querySelectorAll<HTMLButtonElement>('[role="option"]'));
        items[focusedIndex]?.focus();
      }
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      setFocusedIndex(-1); // Reset focus when closed
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleKeyDown, focusedIndex]);

  if (isEmpty && !value) {
    return (
      <span className="inline-flex items-center justify-center h-7 w-28 rounded-full text-xs font-medium border border-gray-300 bg-white text-transparent">
        &nbsp;
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="ghost"
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium hover:opacity-90 transition h-auto",
            displayColor,
            disabled && "opacity-50 cursor-not-allowed",
            "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          )}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {displayLabel}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        ref={contentRef}
        className="rounded-xl border border-gray-200 bg-white shadow-xl p-2 w-56 z-50"
        align="start"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()} // Prevent focus stealing on open
      >
        <div role="listbox" className="space-y-1">
          {statusOptions.map((option, index) => (
            <button
              key={option.label}
              role="option"
              aria-selected={option.label === value}
              onClick={() => handleSelect(option.label)}
              className={cn(
                "w-full rounded-lg border px-3 py-2 text-sm font-medium flex items-center justify-between hover:opacity-90 transition",
                option.color,
                "focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1"
              )}
              tabIndex={focusedIndex === index ? 0 : -1} // Only make focused item tabbable
            >
              {option.label}
              {option.label === value && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}