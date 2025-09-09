import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { StatusBadge } from "./StatusBadge";
import { StatPill } from "./StatPill";

interface ModuleCardProps {
  id?: string; // Added id property
  icon: ReactNode;
  title: string;
  subtitle: string;
  status: "Ready" | "Coming Soon" | "In Progress";
  stats?: string[];
  primaryCta: { label: string; onClick: () => void };
  secondaryCta?: { label: string; onClick: () => void };
  className?: string;
}

export function ModuleCard({
  id, // Destructure id
  icon,
  title,
  subtitle,
  status,
  stats = [],
  primaryCta,
  secondaryCta,
  className,
}: ModuleCardProps) {
  const isComingSoon = status === "Coming Soon";

  // Define the base transition for initial/animate
  const baseTransition = { duration: 0.5, type: "spring" as const };
  // Define the hover transition
  const hoverTransition = { type: 'spring' as const, stiffness: 220, damping: 18, mass: 0.6 };

  return (
    <motion.div
      id={id} // Assign id to the motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={baseTransition}
      whileHover={isComingSoon ? {} : { scale: 1.015, y: -2, transition: hoverTransition }}
      className={cn(
        "rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow p-6 flex flex-col gap-4 group relative border border-gray-200",
        isComingSoon && "opacity-70", // Dim if coming soon
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-2xl text-gray-700">
          {icon}
        </div>
        <div>
          <div className="font-semibold text-lg flex items-center gap-2 text-gray-900">
            {title}
            <StatusBadge status={status} />
          </div>
          <div className="text-sm text-gray-500">{subtitle}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {stats.map((stat, i) => (
          <StatPill key={i} label={stat} />
        ))}
      </div>
      <div className="flex gap-2 mt-auto">
        <Button
          variant="default"
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
          onClick={primaryCta.onClick}
          disabled={isComingSoon}
        >
          {primaryCta.label}
        </Button>
        {secondaryCta && (
          <Button
            variant="outline"
            size="sm"
            className="border-gray-200 text-gray-700 hover:bg-gray-50"
            onClick={secondaryCta.onClick}
            disabled={isComingSoon}
          >
            {secondaryCta.label}
          </Button>
        )}
      </div>
      {isComingSoon && (
        <div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center pointer-events-none text-lg font-semibold text-yellow-700">
          Coming Soon
        </div>
      )}
    </motion.div>
  );
}