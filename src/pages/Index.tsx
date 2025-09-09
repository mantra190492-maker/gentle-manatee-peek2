import { MadeWithDyad } from "@/components/made-with-dyad";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { ActivityFeed } from "@/components/ActivityFeed";
import { QuickActions } from "@/components/QuickActions";
import { useScrollToModule } from "@/lib/scrollToModule";
import { ModuleCard } from "@/components/home/ModuleCard";
import { useEffect, useState } from "react";
import { getComplaintCounts } from "@/lib/complaints/api.ts";

// New components for home page
import { Users, ShieldAlert, Package, Bug, FileText, Truck, Factory, DollarSign, FlaskConical } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const scrollToModule = useScrollToModule();
  const [complaintCounts, setComplaintCounts] = useState({ open: 0, critical: 0, total: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      const counts = await getComplaintCounts();
      setComplaintCounts(counts);
    };
    void fetchCounts();
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Hero Section */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-2">Welcome to Sattva Leaf Ops</h1>
            <p className="text-xl text-slate-600">Manage your CRM and QMS operations efficiently.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content Area (Module Cards) */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* CRM Card */}
              <ModuleCard
                icon={<Users />}
                title="CRM"
                subtitle="Customer Relationship Management"
                status="Ready"
                stats={["Pipeline Value: CAD 82K", "Active Deals: 4", "Win Rate: 42%", "Closes This Week: 1"]}
                primaryCta={{ label: "Open CRM", onClick: () => navigate("/crm") }}
                secondaryCta={{ label: "New Deal", onClick: () => navigate("/crm?tab=tasks&action=newTask") }}
              />

              {/* QMS Lite Card */}
              <ModuleCard
                id="module-qms"
                icon={<ShieldAlert />}
                title="QMS Lite"
                subtitle="Quality Management System"
                status="Ready"
                stats={["Open CAPAs: 3", "Change Controls: 1 pending", "Training Due: 2 users"]}
                primaryCta={{ label: "Open QMS", onClick: () => navigate("/qms/sop-register") }}
                secondaryCta={{ label: "Read SOPs", onClick: () => console.log("Read SOPs clicked") }}
              />

              {/* Supplier Onboarding Card */}
              <ModuleCard
                id="module-suppliers"
                icon={<Package />}
                title="Supplier Onboarding"
                subtitle="Manage supplier qualifications"
                status="Ready"
                stats={["Pending: 2", "Approved: 15"]}
                primaryCta={{ label: "Open Suppliers", onClick: () => navigate("/suppliers") }}
                secondaryCta={{ label: "View Suppliers", onClick: () => console.log("View Suppliers clicked") }}
              />
              {/* Complaints & AE Card */}
              <ModuleCard
                id="module-complaints"
                icon={<Bug />}
                title="Complaints & AE"
                subtitle="Track adverse events and complaints"
                status="Ready"
                stats={[`Open: ${complaintCounts.open}`, `Critical: ${complaintCounts.critical}`, `Total: ${complaintCounts.total}`]}
                primaryCta={{ label: "View Complaints", onClick: () => navigate("/complaints") }}
                secondaryCta={{ label: "New Complaint", onClick: () => navigate("/complaints/new") }}
              />
              {/* Label Spec Generator (EN/FR) Card */}
              <ModuleCard
                id="module-labels"
                icon={<FileText />}
                title="Label Spec Generator (EN/FR)"
                subtitle="Generate compliant labels"
                status="Ready"
                stats={["Drafts: 7", "Approved: 20"]}
                primaryCta={{ label: "Generate Label", onClick: () => navigate("/labels") }}
              />
              {/* Batch/Lot Traceability + CoA Card */}
              <ModuleCard
                id="module-traceability"
                icon={<Truck />}
                title="Batch/Lot Traceability + CoA"
                subtitle="Track product batches"
                status="Ready"
                stats={["Batches: 120", "COAs: 98"]}
                primaryCta={{ label: "View Batches", onClick: () => navigate("/batches") }}
              />
              {/* Stability Study Tracker Card */}
              <ModuleCard
                id="module-stability"
                icon={<FlaskConical />}
                title="Stability Study Tracker"
                subtitle="Monitor product stability"
                status="Ready"
                stats={["Active Studies: 3", "Upcoming: 1"]}
                primaryCta={{ label: "View Studies", onClick: () => navigate("/stability") }}
              />
              {/* Costing & BOM Card */}
              <ModuleCard
                id="module-costing"
                icon={<DollarSign />}
                title="Costing & BOM"
                subtitle="Manage product costs and BOMs"
                status="Ready"
                stats={["Products: 50", "BOMs: 45"]}
                primaryCta={{ label: "View Costing", onClick: () => console.log("View Costing clicked") }}
              />
              {/* 3PL Control Tower I/O Card */}
              <ModuleCard
                id="module-3pl"
                icon={<Factory />}
                title="3PL Control Tower I/O"
                subtitle="Integrate with 3PL logistics"
                status="Ready"
                stats={["Integrations: 2", "Errors: 0"]}
                primaryCta={{ label: "View Integrations", onClick: () => console.log("View Integrations clicked") }}
              />
            </div>

            {/* Right Rail */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <ActivityFeed />
              <QuickActions />
            </div>
          </div>
        </main>
        <div className="mt-auto">
          <MadeWithDyad />
        </div>
      </div>
    </div>
  );
};

export default Index;