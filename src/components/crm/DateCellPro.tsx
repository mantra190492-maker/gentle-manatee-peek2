"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CalendarDays, Sparkles } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useTasksStore } from "@/lib/tasksStore";
import { CustomComponents } from 'react-day-picker';
import { cn } from "@/lib/utils"; // Import cn for utility classes

type Props = { id: string; value?: string | null };

export default function DateCellPro({ id, value }: Props) {
  const updateTask = useTasksStore(s => s.updateTask);
  const [open, setOpen] = React.useState(false);

  const date = value ? new Date(value) : undefined;
  const [input, setInput] = React.useState(date ? format(date, "MM/dd/yyyy") : "");

  React.useEffect(() => {
    const d = value ? new Date(value) : undefined;
    setInput(d ? format(d, "MM/dd/yyyy") : "");
  }, [value]);

  const commit = (d: Date | null) => {
    updateTask(id, { date: d ? format(d, "yyyy-MM-dd") : null });
  };

  const onInputBlur = () => {
    if (!input) return commit(null);
    const parsed = parse(input, "MM/dd/yyyy", new Date());
    if (isValid(parsed)) commit(parsed);
    else setInput(date ? format(date, "MM/dd/yyyy") : "");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 shadow-sm
                     hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 h-8"
          aria-label="Pick a date"
        >
          <CalendarDays className="h-4 w-4 opacity-80" />
          <span className="min-w-[6.5rem] text-left">
            {date ? format(date, "MMM d, yyyy") : "Pick a date"}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        collisionPadding={12}
        className="z-[90] w-[320px] rounded-xl border border-gray-200 bg-white p-0 text-gray-900 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 pb-2">
          <button
            onClick={() => commit(new Date())}
            className="rounded-md border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
          >
            Today
          </button>
          <CalendarIcon className="h-4 w-4 opacity-70 text-gray-500" />
        </div>

        {/* Input */}
        <div className="px-3 pb-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onBlur={onInputBlur}
            placeholder="MM/DD/YYYY"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none text-gray-900
                       focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Calendar */}
        <div className="px-2 pb-2">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              if (d) {
                commit(d);
                setInput(format(d, "MM/dd/yyyy"));
              } else {
                commit(null);
                setInput("");
              }
              setOpen(false); // Close popover on date selection
            }}
            initialFocus
            // Light theme + aligned grid
            className="rdp text-gray-900"
            classNames={{
              months: "flex flex-col space-y-0",
              month: "space-y-2",
              caption: "flex items-center justify-between px-2 pt-2",
              caption_label: "text-sm font-medium",
              nav: "flex items-center gap-2",
              nav_button: "inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-100 text-gray-700",
              nav_button_previous: "",
              nav_button_next: "",
              table: "w-full border-collapse",
              head_row: "grid grid-cols-7 text-xs text-gray-500 px-2",
              head_cell: "text-center py-1 font-medium",
              row: "grid grid-cols-7 px-2",
              cell: "h-9 text-center align-middle",
              day: "mx-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm hover:bg-gray-100",
              day_selected: "bg-emerald-600 text-white hover:bg-emerald-600",
              day_today: "ring-1 ring-emerald-500",
              day_outside: "text-gray-400 opacity-60",
            }}
            components={{
              IconLeft: () => <ChevronLeft className="h-4 w-4" />,
              IconRight: () => <ChevronRight className="h-4 w-4" />,
            } as Partial<CustomComponents>}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-gray-200 px-3 py-2 text-sm">
          <Sparkles className="h-4 w-4 opacity-80 text-gray-500" />
          <button
            onClick={() => {
              const base = new Date();
              const dow = base.getDay();
              const add = dow === 5 ? 3 : dow === 6 ? 2 : 1;
              const d = new Date(base);
              d.setDate(base.getDate() + add);
              commit(d);
              setInput(format(d, "MM/dd/yyyy"));
              setOpen(false);
            }}
            className="text-gray-700 hover:text-gray-900"
          >
            Autofill date
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}