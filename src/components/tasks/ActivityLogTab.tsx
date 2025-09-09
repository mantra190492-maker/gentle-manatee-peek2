"use client";
import ActivityLog from "@/components/activity/ActivityLog.tsx";
import React from "react"; // Import React

export default function ActivityLogTab({ taskId, title }:{ taskId: string; title: string }) {
  return <ActivityLog taskId={taskId} itemTitle={title} />;
}