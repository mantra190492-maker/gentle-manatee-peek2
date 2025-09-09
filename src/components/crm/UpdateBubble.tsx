import { cn } from "@/lib/utils";

export function UpdateBubble({ count, className }: { count: number; className?: string }) {
  if (count === 0) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-xs font-bold",
        className
      )}
    >
      {count}
    </span>
  );
}