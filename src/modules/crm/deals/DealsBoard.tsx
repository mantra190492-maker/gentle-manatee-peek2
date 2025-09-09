"use client";
import React, { useState, useEffect } from "react";
import type { DealWithContact, DealStage } from "./types.ts";
import { DealCard } from "./DealCard.tsx";
import { DEAL_STAGES, moveDeal } from "./api.ts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DealsBoardProps {
  deals: DealWithContact[];
  onDealClick: (deal: DealWithContact) => void;
  onDealMoved: () => void; // Callback to refresh parent data
}

export function DealsBoard({ deals, onDealClick, onDealMoved }: DealsBoardProps) {
  const [localDeals, setLocalDeals] = useState<DealWithContact[]>(deals);
  const [draggingItem, setDraggingItem] = useState<DealWithContact | null>(null);

  useEffect(() => {
    setLocalDeals(deals);
  }, [deals]);

  const handleDragStart = (e: React.DragEvent, deal: DealWithContact) => {
    setDraggingItem(deal);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", deal.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetStage: DealStage) => {
    e.preventDefault();
    if (!draggingItem) return;

    const dealId = e.dataTransfer.getData("text/plain");
    if (dealId !== draggingItem.id) return; // Ensure we're dropping the item we started dragging

    if (draggingItem.stage === targetStage) {
      setDraggingItem(null);
      return; // No change in stage
    }

    // Optimistic UI update
    setLocalDeals(prev => prev.map(d =>
      d.id === draggingItem.id ? { ...d, stage: targetStage } : d
    ));

    try {
      await moveDeal(draggingItem.id, targetStage);
      onDealMoved(); // Trigger a refresh in the parent component
    } catch (error) {
      console.error("Error moving deal:", error);
      toast.error("Failed to move deal. Reverting changes.");
      // Revert optimistic update on error
      setLocalDeals(deals);
    } finally {
      setDraggingItem(null);
    }
  };

  const getDealsInStage = (stage: DealStage) => {
    return localDeals.filter(deal => deal.stage === stage);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {DEAL_STAGES.map((stage) => (
        <div
          key={stage}
          className={cn(
            "min-w-[280px] flex-1 bg-gray-50 rounded-lg border border-gray-200 p-3 flex flex-col shadow-sm",
            draggingItem && draggingItem.stage === stage && "opacity-50", // Dim the source column
            draggingItem && draggingItem.stage !== stage && "hover:border-emerald-400" // Highlight potential drop target
          )}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, stage)}
        >
          <div className="font-semibold mb-3 flex items-center justify-between text-gray-900">
            <span>{stage}</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{getDealsInStage(stage).length}</span>
          </div>
          <div className="flex flex-col gap-3 min-h-[100px]"> {/* Added min-h to make drop targets visible */}
            {getDealsInStage(stage).map((deal) => (
              <div
                key={deal.id}
                draggable
                onDragStart={(e) => handleDragStart(e, deal)}
                onDragEnd={() => setDraggingItem(null)}
                className={cn(
                  "cursor-grab",
                  draggingItem?.id === deal.id && "opacity-50 border-dashed border-2 border-emerald-500"
                )}
              >
                <DealCard deal={deal} onClick={onDealClick} />
              </div>
            ))}
            {getDealsInStage(stage).length === 0 && (
              <div className="text-sm text-gray-500 text-center py-6">No deals in this stage.</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}