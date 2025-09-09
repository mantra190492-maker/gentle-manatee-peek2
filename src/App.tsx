import ProtocolsPage from "@/pages/stability/ProtocolsPage";
import { Toaster } from "@/components/ui/toaster";
import { Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CRMPage from "./pages/CRMPage";
import QMSPage from "./pages/QMSPage";
import SuppliersIndexPage from "./pages/suppliers/Index";
import NewInvitePage from "./pages/suppliers/NewInvite";
import SupplierDetailPage from "./pages/suppliers/Detail";
import DatePickerDemoPage from "./pages/DatePickerDemo";
import ComplaintsIndexPage from "./pages/complaints/Index";
import ComplaintNewPage from "./pages/complaints/New";
import ComplaintDetailPage from "./pages/complaints/Detail";
import ContactDetailPage from "./pages/crm/contacts/Detail";
import LabelSpecIndexPage from "./pages/labels/Index";
import LabelSpecDetailPage from "./pages/labels/Detail";
import BatchesIndexPage from "./pages/batches/Index";
import BatchDetailPage from "./pages/batches/Detail";

// New imports for stability module
import DashboardLanding from "@/pages/stability/DashboardLanding";
import StabilityLayout from "@/pages/stability/StabilityLayout";

// placeholder component:
const StabilityPlaceholder = ({ title }: { title: string }) => (
  <div className="p-6 text-sm text-slate-600">Coming soon: {title}</div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
           <Route path="/stability/protocols" element={<ProtocolsPage />} />
          <Route path="/" element={<Index />} />
          <Route path="/crm" element={<CRMPage />} />
          <Route path="/crm/contacts/:id" element={<ContactDetailPage />} />
          <Route path="/qms/:module" element={<QMSPage />} />
          <Route path="/suppliers" element={<SuppliersIndexPage />} />
          <Route path="/suppliers/new" element={<NewInvitePage />} />
          <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
          <Route path="/complaints" element={<ComplaintsIndexPage />} />
          <Route path="/complaints/new" element={<ComplaintNewPage />} />
          <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
          <Route path="/labels" element={<LabelSpecIndexPage />} />
          <Route path="/labels/:id" element={<LabelSpecDetailPage />} />
          <Route path="/batches" element={<BatchesIndexPage />} />
          <Route path="/batches/:id" element={<BatchDetailPage />} />
          <Route path="/datepicker-demo" element={<DatePickerDemoPage />} />
          
          {/* Stability Study Tracker Routes */}
          <Route
            path="/stability"
            element={
              <StabilityLayout>
                <DashboardLanding />
              </StabilityLayout>
            }
          />
          <Route
            path="/stability/studies"
            element={
              <StabilityLayout>
                <StabilityPlaceholder title="Studies" />
              </StabilityLayout>
            }
          />
          <Route
            path="/stability/protocols"
            element={
              <StabilityLayout>
                <StabilityPlaceholder title="Protocols" />
              </StabilityLayout>
            }
          />
          <Route
            path="/stability/pulls"
            element={
              <StabilityLayout>
                <StabilityPlaceholder title="Pulls" />
              </StabilityLayout>
            }
          />
          <Route
            path="/stability/results"
            element={
              <StabilityLayout>
                <StabilityPlaceholder title="Results" />
              </StabilityLayout>
            }
          />
          <Route
            path="/stability/trends"
            element={
              <StabilityLayout>
                <StabilityPlaceholder title="Trends" />
              </StabilityLayout>
            }
          />
          <Route
            path="/stability/reports"
            element={
              <StabilityLayout>
                <StabilityPlaceholder title="Reports" />
              </StabilityLayout>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;