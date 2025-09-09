"use client";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import type { BadgeProps } from "@/components/ui/badge"; // Import BadgeProps

interface Activity {
  module: string;
  tagColor: string;
  message: string;
  time: string;
}

const activities: Activity[] = [
  {
    module: "QMS",
    tagColor: "bg-blue-100 text-blue-800",
    message: "CAPA overdue",
    time: "2 days ago",
  },
  {
    module: "Suppliers",
    tagColor: "bg-green-100 text-green-800",
    message: "GMP certificate expires soon",
    time: "1 day ago",
  },
  {
    module: "Dossier",
    tagColor: "bg-purple-100 text-purple-800",
    message: "Review completed",
    time: "3 hours ago",
  },
  {
    module: "Complaints",
    tagColor: "bg-red-100 text-red-800",
    message: "New adverse event reported",
    time: "Just now",
  },
  {
    module: "QMS",
    tagColor: "bg-blue-100 text-blue-800",
    message: "SOP-105 approved",
    time: "4 hours ago",
  },
  {
    module: "Training",
    tagColor: "bg-orange-100 text-orange-800",
    message: "User 'John Doe' completed training",
    time: "5 hours ago",
  },
  {
    module: "Vault",
    tagColor: "bg-gray-100 text-gray-800",
    message: "New document uploaded: 'QMS Manual v2.0'",
    time: "Yesterday",
  },
  {
    module: "CRM",
    tagColor: "bg-emerald-100 text-emerald-800",
    message: "Deal with 'Tech Solutions' moved to 'Negotiation'",
    time: "2 days ago",
  },
  {
    module: "Change Control",
    tagColor: "bg-indigo-100 text-indigo-800",
    message: "Change CC-301 implemented",
    time: "3 days ago",
  },
  {
    module: "Complaints",
    tagColor: "bg-red-100 text-red-800",
    message: "Complaint #C-007 closed",
    time: "4 days ago",
  },
  {
    module: "QMS",
    tagColor: "bg-blue-100 text-blue-800",
    message: "CAPA-203 assigned to 'Jane Smith'",
    time: "5 days ago",
  },
  {
    module: "Supplier",
    tagColor: "bg-green-100 text-green-800",
    message: "New supplier 'BioPharm Inc.' added",
    time: "1 week ago",
  },
];

export function ActivityFeed() {
  const displayedActivities = activities.slice(0, 10); // Limit to 10 items

  return (
    <motion.div
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, type: "spring", delay: 0.2 }}
      className="bg-white rounded-2xl shadow-lg p-5 mb-6 max-h-[420px] overflow-y-auto"
    >
      <div className="font-semibold text-lg mb-3">Recent Activity</div>
      <ul className="space-y-4">
        {displayedActivities.map((a: Activity, i: number) => (
          <li key={i} className="flex items-start gap-3">
            <Badge className={a.tagColor + " min-w-[70px] justify-center"} variant="outline" >
              {a.module}
            </Badge>
            <div className="flex-1">
              <div className="text-sm text-gray-800">{a.message}</div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <Clock className="w-3 h-3" />
                {a.time}
              </div>
            </div>
          </li>
        ))}
        {displayedActivities.length === 0 && (
          <li className="text-center text-gray-500 py-4">No recent activity.</li>
        )}
      </ul>
    </motion.div>
  );
}