import { Calendar, ClipboardList, FileText, MessageSquare, Users, Flag, Hash, FilePlus, CheckCircle } from "lucide-react";
import React from "react";

export default function FieldIcon({ field }: { field: string }) {
  const map: Record<string, React.ElementType> = {
    text: MessageSquare, comment: MessageSquare,
    status: CheckCircle, assignee: Users, priority: Flag,
    due_date: Calendar, date: Calendar, title: FileText,
    group: Hash, file: FilePlus, created: ClipboardList,
  };
  const Icon = map[field] || FileText;
  return <Icon className="h-4 w-4 text-gray-600" />;
}