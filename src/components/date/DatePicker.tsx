"use client";

import React, { useState, useMemo } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
}

export function DatePicker({ selectedDate, onSelectDate }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const startOfCurrentMonth = startOfMonth(currentMonth);
    const endOfCurrentMonth = endOfMonth(currentMonth);
    const startOfCalendar = startOfWeek(startOfCurrentMonth, { weekStartsOn: 0 }); // Sunday start
    const endOfCalendar = endOfWeek(endOfCurrentMonth, { weekStartsOn: 0 }); // Sunday end

    return eachDayOfInterval({ start: startOfCalendar, end: endOfCalendar }).map((date) => ({
      key: date.toISOString(),
      label: format(date, "d"),
      date: date,
      isCurrentMonth: isSameMonth(date, currentMonth),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
      isToday: isToday(date),
    }));
  }, [currentMonth, selectedDate]);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  return (
    <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Month Controls */}
      <div className="flex items-center justify-between p-3">
        <button
          onClick={handlePrevMonth}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-gray-900">{format(currentMonth, "MMMM yyyy")}</span>
        <button
          onClick={handleNextMonth}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Week Headers */}
      <div className="grid grid-cols-7 gap-1 px-3 pb-1 border-b border-gray-100">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="py-1 text-center text-xs font-medium text-gray-500">
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 p-3 pt-0">
        {days.map((day) => (
          <button
            key={day.key}
            onClick={() => onSelectDate(day.date)}
            className={cn(
              "aspect-square w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300",
              day.isCurrentMonth ? "text-gray-900 hover:bg-gray-100" : "text-gray-400 hover:bg-gray-50",
              day.isToday && "font-bold ring-1 ring-emerald-500",
              day.isSelected && "bg-emerald-600 text-white hover:bg-emerald-700"
            )}
            aria-selected={day.isSelected || undefined}
            tabIndex={day.isCurrentMonth ? 0 : -1} // Only allow tabbing to days in the current month
          >
            {day.label}
          </button>
        ))}
      </div>
    </div>
  );
}