"use client";
import React from "react";
import type { DealWithContact } from "./types.ts";
import { DealStagePill } from "./DealStagePill.tsx";
import { Button } from "@/components/ui/button";
import { ChevronRight, CalendarDays, DollarSign, UserRound } from "lucide-react";
import { format, isBefore, addDays } from "date-fns";
import { cn } from "@/lib/utils";

interface DealCardProps {
  deal: DealWithContact;
  onClick: (deal: DealWithContact) => void;
}

export function DealCard({ deal, onClick }: DealCardProps) {
  const closeDate = deal.close_date ? new Date(deal.close_date) : null;
  const isClosingSoon = closeDate && isBefore(closeDate, addDays(new Date(), 7)) && deal.stage !== "Closed Won" && deal.stage !== "Closed Lost";

  return (
    <Button
      variant="ghost"
      className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 text-left hover:shadow-md transition-all cursor-pointer h-auto flex flex-col items-start gap-2 w-full"
      onClick={() => onClick(deal)}
    >
      <div className="flex items-center justify-between w-full">
        <h3 className="font-medium text-gray-900 text-base">{deal.title}</h3>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex flex-wrap gap-2 items-center text-sm w-full">
        <DealStagePill stage={deal.stage} />
        {isClosingSoon && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <CalendarDays className="w-3 h-3" /> Closing Soon
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-700 w-full">
        <DollarSign className="w-4 h-4 text-gray-500" />
        <span>{deal.amount.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })}</span>
        {closeDate && (
          <span className="flex items-center gap-1 ml-auto">
            <CalendarDays className="w-4 h-4 text-gray-500" />
            {format(closeDate, "MMM d, yyyy")}
          </span>
        )}
      </div>
      {deal.contacts?.name && (
        <div className="flex items-center gap-2 text-xs text-gray-600 w-full">
          <UserRound className="w-4 h-4 text-gray-500" />
          <span>{deal.contacts.name}</span>
        </div>
      )}
    </Button>
  );
}