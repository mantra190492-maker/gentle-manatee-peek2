"use client";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { BadgeProps } from "@/components/ui/badge"; // Import BadgeProps
import type { ButtonProps } from "@/components/ui/button"; // Import ButtonProps

type BadgeType = { label: string; color?: string };
type ButtonType = { label: string; variant?: ButtonProps["variant"]; onClick?: () => void };

export interface ModuleCardProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  badges?: BadgeType[];
  buttons?: ButtonType[];
  comingSoon?: boolean;
  className?: string;
}

export function ModuleCard({
  icon,
  title,
  subtitle,
  badges = [],
  buttons = [],
  comingSoon,
  className,
}: ModuleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
      className={cn(
        "rounded-2xl bg-white dark:bg-neutral-900 shadow-lg hover:shadow-xl transition-shadow p-6 flex flex-col gap-4 group relative",
        "hover:-translate-y-1 duration-200",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-2xl">
          {icon}
        </div>
        <div>
          <div className="font-semibold text-lg flex items-center gap-2">
            {title}
            {comingSoon && (
              <Badge className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" variant="outline">
                Coming Soon
              </Badge>
            )}
          </div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {badges.map((b: BadgeType, i: number) => (
          <Badge
            key={i}
            className={cn(
              "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
              b.color
            )}
            variant="outline"
          >
            {b.label}
          </Badge>
        ))}
      </div>
      <div className="flex gap-2 mt-auto">
        {buttons.map((btn: ButtonType, i: number) => (
          <Button
            key={i}
            variant={btn.variant ?? "default"}
            size="sm"
            className={btn.variant === "secondary" ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200" : ""}
            onClick={btn.onClick}
            disabled={comingSoon}
          >
            {btn.label}
          </Button>
        ))}
      </div>
      {comingSoon && (
        <div className="absolute inset-0 bg-white/70 dark:bg-neutral-900/70 rounded-2xl flex items-center justify-center pointer-events-none text-lg font-semibold text-yellow-700 dark:text-yellow-200">
          Coming Soon
        </div>
      )}
    </motion.div>
  );
}