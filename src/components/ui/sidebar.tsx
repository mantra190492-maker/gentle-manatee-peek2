// @ts-nocheck
import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  ShieldAlert, // QMS Lite
  Package, // Supplier Onboarding
  Bug, // Complaints & Adverse Events
  FileText, // Label Spec Generator
  Truck, // Batch/Lot Traceability
  FlaskConical, // Stability Study Tracker
  DollarSign, // Costing & BOM
  Factory, // 3PL Control Tower I/O
  // Removed: Contact, // Icon for Contacts
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useScrollToModule } from "@/lib/scrollToModule";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { name: "Home", icon: Home, target: "/", isModule: false },
  { name: "CRM", icon: Users, target: "/crm", isModule: false },
  // Removed: { name: "Contacts", icon: Contact, target: "/crm?tab=contacts", isModule: false }, // Updated target
  { name: "Supplier Onboarding", icon: Package, target: "/suppliers", isModule: false },
  { name: "Complaints & Adverse Events", icon: Bug, target: "/complaints", isModule: false }, // Changed to direct link
  { name: "QMS Lite", icon: ShieldAlert, target: "module-qms", isModule: true },
  { name: "Label Spec Generator (EN/FR)", icon: FileText, target: "module-labels", isModule: true },
  { name: "Batch/Lot Traceability + CoA", icon: Truck, target: "module-traceability", isModule: true },
  { name: "Stability Study Tracker", icon: FlaskConical, target: "module-stability", isModule: true },
  { name: "Costing & BOM", icon: DollarSign, target: "module-costing", isModule: true },
  { name: "3PL Control Tower I/O", icon: Factory, target: "module-3pl", isModule: true },
];

export function Sidebar({ className }: { className?: string }) { // Accept className prop
  const location = useLocation();
  const pathname = location.pathname;
  const scrollToModule = useScrollToModule();
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);

  const renderNavItems = () => (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        // Special handling for CRM to correctly highlight the tab
        const isActive = item.isModule
          ? pathname === "/" && location.hash === `#${item.target}`
          : pathname.startsWith(item.target);


        const commonClasses = cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          isActive
            ? "bg-gray-200 text-gray-900"
            : "text-gray-500 hover:bg-gray-100"
        );

        if (item.isModule) {
          return (
            <button
              key={item.target}
              onClick={() => {
                scrollToModule(item.target);
                if (isMobile) setOpenMobile(false);
              }}
              className={cn(commonClasses, "w-full text-left")}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden md:inline">{item.name}</span>
            </button>
          );
        } else {
          return (
            <Link
              key={item.target}
              to={item.target}
              className={commonClasses}
              onClick={() => {
                if (isMobile) setOpenMobile(false);
              }}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden md:inline">{item.name}</span>
            </Link>
          );
        }
      })}
    </nav>
  );

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-40 md:hidden bg-white shadow-md"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-4 flex flex-col">
          <div className="mb-8 text-lg font-bold tracking-tight">Sattva Leaf Ops</div>
          {renderNavItems()}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className={cn("w-20 md:w-56 bg-gray-50 border-r flex flex-col py-6 px-2 md:px-4", className)}>
      <div className="mb-8 text-lg font-bold tracking-tight hidden md:block">Sattva Leaf Ops</div>
      {renderNavItems()}
    </aside>
  );
}