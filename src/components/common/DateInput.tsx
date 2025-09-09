// @ts-nocheck
import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { cn } from "@/lib/utils"; // Import cn for utility classes
import { format } from "date-fns"; // Import format from date-fns

type Props = {
  value: Date | undefined;
  onChange: (d: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean; // Added disabled prop
};

export default function DateInput({
  value,
  onChange,
  placeholder = "Pick a date",
  minDate,
  maxDate,
  className = "",
  buttonClassName = "",
  disabled = false // Default to false
}: Props) {
  return (
    <div className={cn("relative", className)}>
      <DatePicker
        selected={value}
        onChange={onChange}
        placeholderText={placeholder}
        minDate={minDate}
        maxDate={maxDate}
        dateFormat="MMM d, yyyy"
        closeOnScroll={false}
        showPopperArrow={false}
        popperPlacement="bottom-start"
        disabled={disabled} // Pass disabled prop to DatePicker
        // Apply custom classes to the datepicker component itself
        className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" // Standardized input style
        wrapperClassName="w-full" // Ensures the wrapper takes full width
        customInput={
          <button
            type="button"
            className={cn(
              "flex h-10 w-full justify-start text-left font-normal rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", // Standardized input style
              !value && "text-gray-500",
              buttonClassName
            )}
            disabled={disabled} // Pass disabled prop to custom input button
          >
            {value ? format(value, "MMM d, yyyy") : <span>{placeholder}</span>}
          </button>
        }
        // Render into our own container to ensure z-index & isolation
        popperContainer={({ children }) => (
          <div className="date-popper-container">{children}</div>
        )}
      />
    </div>
  );
}