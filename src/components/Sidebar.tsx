"use client";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useScrollToModule } from "@/lib/scrollToModule";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // Import Sheet components
import { Button } from "@/components/ui/button"; // Import Button for mobile trigger
import { Menu } from "lucide-react"; // Import Menu icon for mobile trigger
import { useState } from "react"; // Import useState for mobile sheet state

const navItems = [
  { name: "Home", icon: Home, target: "/", isModule: false },
  { name: "CRM", icon: Users, target: "/crm", isModule: false },
  { name: "Supplier Onboarding", icon: Package, target: "/suppliers", isModule: false },
  { name: "Complaints & Adverse Events", icon: Bug, target: "/complaints", isModule: false },
  { name: "QMS Lite", icon: ShieldAlert, target: "/qms/sop-register", isModule: false },
  { name: "Label Spec Generator (EN/FR)", icon: FileText, target: "/labels", isModule: false },
  { name: "Batches & Lots", icon: Truck, target: "/batches", isModule: false },
  { name: "Stability Study Tracker", icon: FlaskConical, target: "module-stability", isModule: true },
  { name: "Costing & BOM", icon: DollarSign, target: "module-costing", isModule: true },
  { name: "3PL Control Tower I/O", icon: Factory, target: "module-3pl", isModule: true },
];

export function Sidebar({ className }: { className?: string }) { // Accept className prop
  const location = useLocation();
  const pathname = location.pathname;
  const scrollToModule = useScrollToModule();
  const [openMobile, setOpenMobile] = useState(false); // State for mobile sidebar

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
                setOpenMobile(false); // Close mobile sidebar on item click
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
              onClick={() => setOpenMobile(false)} // Close mobile sidebar on item click
              className={commonClasses}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden md:inline">{item.name}</span>
            </Link>
          );
        }
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Sidebar Trigger */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full bg-white shadow-md">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-[280px] bg-gray-50 border-r flex flex-col py-6 px-4">
            <div className="mb-8 text-lg font-bold tracking-tight">Sattva Leaf Ops</div>
            {renderNavItems()}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className={cn("w-20 md:w-56 bg-gray-50 border-r flex-col py-6 px-2 md:px-4 hidden md:flex", className)}>
        <div className="mb-8 text-lg font-bold tracking-tight hidden md:block">Sattva Leaf Ops</div>
        {renderNavItems()}
      </aside>
    </>
  );
}