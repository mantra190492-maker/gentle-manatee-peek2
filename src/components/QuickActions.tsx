"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Import useNavigate

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, type: "spring", delay: 0.3 }}
      className="bg-white rounded-2xl shadow-lg p-5"
    >
      <div className="font-semibold text-lg mb-3">Quick Actions</div>
      <div className="flex flex-col gap-3">
        <Button variant="default" className="justify-start gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate("/qms/capa?action=newItem")}>
          <PlusCircle className="w-4 h-4" /> New CAPA
        </Button>
        <Button variant="default" className="justify-start gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate("/suppliers/new")}>
          <PlusCircle className="w-4 h-4" /> New Supplier
        </Button>
        <Button variant="default" className="justify-start gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate("/complaints/new")}>
          <PlusCircle className="w-4 h-4" /> New Complaint
        </Button>
      </div>
    </motion.div>
  );
}