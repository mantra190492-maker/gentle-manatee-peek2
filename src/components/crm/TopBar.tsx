"use client";
import { Link } from "react-router-dom";
import { Home, LayoutDashboard, ListChecks, Bug, History, BookOpen, Target, Leaf, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { name: "Tasks", href: "/crm", icon: ListChecks },
  { name: "Sprints", href: "/crm/sprints", icon: LayoutDashboard },
  { name: "Epics", href: "/crm/epics", icon: Target },
  { name: "Bugs Queue", href: "/crm/bugs", icon: Bug },
  { name: "Retrospectives", href: "/crm/retrospectives", icon: History },
  { name: "Getting Started", href: "/crm/getting-started", icon: BookOpen },
  { name: "Master Tracker", href: "/crm/master-tracker", icon: Home },
];

export function TopBar() {
  const selectedWorkspace = "Sattva Leaf"; // Placeholder for workspace selector

  return (
    <header className="h-16 flex items-center px-6 border-b bg-white/80 backdrop-blur">
      <span className="font-semibold text-lg tracking-tight">Sattva Leaf Ops</span>
      {/* Removed Person icon as per request */}
    </header>
  );
}