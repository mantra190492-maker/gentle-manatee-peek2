"use client";
import { useState } from "react";
import { useTasksStore } from "@/lib/tasksStore"; // Corrected import
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"; // shadcn
import { Calendar } from "@/components/ui/calendar"; // shadcn
import { format } from "date-fns";
import { Button } from "@/components/ui/button"; // Import Button for styling

export default function DateCell({ id, value }: { id: string; value?: string | null }) {
  const updateTask = useTasksStore(s => s.updateTask); // Corrected function name
  const [open, setOpen] = useState(false);
  const date = value ? new Date(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="inline-flex items-center rounded-md border border-slate-200 px-2 py-1 text-sm bg-white h-8"
          aria-label="Pick a date"
        >
          {date ? format(date, "MMM d, yyyy") : "N/A"}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        collisionPadding={12}
        className="z-[80] p-0 w-auto bg-white rounded-xl border border-slate-200 shadow-xl"
      >
        <Calendar
          className="w-[20rem] p-2"
          classNames={{
            head: "rdp-head",
            table: "rdp-table",
            tbody: "rdp-tbody",
            row: "rdp-row",
            head_cell: "rdp-head_cell text-xs font-medium text-slate-500",
            cell: "rdp-cell",
            day: "rdp-day text-sm",
          }}
          mode="single"
          selected={date}
          onSelect={(d) => {
            updateTask(id, { date: d ? format(d, "yyyy-MM-dd") : null }); // Format date to YYYY-MM-DD
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}