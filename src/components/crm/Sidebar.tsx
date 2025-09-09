"use client";
import { Link, useLocation } from "react-router-dom";
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

export function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const selectedWorkspace = "Sattva Leaf"; // Placeholder for workspace selector

  return (
    <aside className="w-[280px] bg-white border-r border-slate-200 flex flex-col py-6 px-4">
      {/* Workspace Selector */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="justify-between px-3 py-2 mb-6 text-lg font-semibold text-slate-900 hover:bg-slate-50">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-600" />
              {selectedWorkspace}
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1">
          {/* Placeholder for workspace options */}
          <div className="text-sm text-slate-700 p-2">No other workspaces available.</div>
        </PopoverContent>
      </Popover>

      <nav className="flex flex-col gap-1">
        {navItems.map(({ name, href, icon: Icon }) => (
          <Link
            key={href}
            to={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === href
                ? "bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600 -ml-4 pl-3" // Selected state
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{name}</span>
          </Link>
        ))}
      </nav>

      <Separator className="my-4 bg-slate-200" />

      {/* Sattva Leaf Tasks - specific list item */}
      <Link
        to="/crm/sattva-leaf-tasks" // Placeholder path
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          pathname === "/crm/sattva-leaf-tasks"
            ? "bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600 -ml-4 pl-3"
            : "text-slate-600 hover:bg-slate-50"
        )}
      >
        <ListChecks className="w-5 h-5" />
        <span>Sattva Leaf Tasks</span>
      </Link>
    </aside>
  );
}