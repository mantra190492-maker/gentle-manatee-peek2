"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, List, Grid, RefreshCw } from "lucide-react";
import { DealsList } from "./DealsList.tsx";
import { DealsBoard } from "./DealsBoard.tsx";
import { DealDrawer } from "./DealDrawer.tsx";
import { listDeals, DEAL_STAGES } from "./api.ts";
import type { DealWithContact, DealStage } from "./types.ts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client"; // For realtime

type ViewMode = "List" | "Board";

export default function DealsRoot() {
  const [deals, setDeals] = useState<DealWithContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<DealStage | "All">("All");
  const [viewMode, setViewMode] = useState<ViewMode>("List");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<DealWithContact | null>(null);

  const refreshDeals = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedDeals = await listDeals(searchQuery, stageFilter);
      setDeals(fetchedDeals);
    } catch (err: any) {
      setError(err.message || "Failed to fetch deals.");
      toast.error(err.message || "Failed to fetch deals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshDeals();
  }, [searchQuery, stageFilter]);

  useEffect(() => {
    const channel = supabase
      .channel('deals_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deals' },
        (payload) => {
          console.log('Realtime deal change received!', payload);
          void refreshDeals(); // Refresh all deals on any change
          toast.info(`Deal "${(payload.new as DealWithContact)?.title || (payload.old as DealWithContact)?.title}" ${payload.eventType}d!`);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          setError("Realtime updates for deals are not available. Data might be stale.");
          toast.error("Realtime updates for deals are not available. Data might be stale.");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [searchQuery, stageFilter]);


  const handleNewDeal = () => {
    setSelectedDeal(null); // Clear any previously selected deal
    setDrawerOpen(true);
  };

  const handleDealClick = (deal: DealWithContact) => {
    setSelectedDeal(deal);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedDeal(null);
  };

  const handleDealSaved = () => {
    void refreshDeals();
    handleDrawerClose();
  };

  const handleDealDeleted = () => {
    void refreshDeals();
    handleDrawerClose();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 h-8 px-3 rounded-xl" onClick={handleNewDeal}>
            <Plus className="w-4 h-4" /> New Deal
          </Button>

          <div className="relative flex-1 min-w-[150px] max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search deals..."
              className="pl-8 pr-2 py-1 border border-gray-200 rounded-md text-sm focus:border-emerald-500 focus:ring-emerald-500 h-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={stageFilter} onValueChange={(val: DealStage | "All") => setStageFilter(val)}>
            <SelectTrigger className="h-8 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Stages</SelectItem>
              {DEAL_STAGES.map(stage => (
                <SelectItem key={stage} value={stage}>
                  {stage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode("List")}
              className={cn(
                "h-8 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50",
                viewMode === "List" && "bg-gray-100"
              )}
            >
              <List className="w-4 h-4 mr-2" /> List
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode("Board")}
              className={cn(
                "h-8 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50",
                viewMode === "Board" && "bg-gray-100"
              )}
            >
              <Grid className="w-4 h-4 mr-2" /> Board
            </Button>
            <Button variant="outline" size="sm" onClick={refreshDeals} disabled={loading} className="h-8 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-1 p-6 overflow-y-auto">
        {error && <div className="text-center text-rose-500 mb-4">{error}</div>}
        {loading && deals.length === 0 ? (
          <div className="text-center text-gray-500 py-6">Loading deals...</div>
        ) : deals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center text-gray-500">
            No deals found. Click "New Deal" to add one.
          </div>
        ) : viewMode === "List" ? (
          <DealsList deals={deals} onRowClick={handleDealClick} />
        ) : (
          <DealsBoard deals={deals} onDealClick={handleDealClick} onDealMoved={refreshDeals} />
        )}
      </main>

      <DealDrawer
        deal={selectedDeal}
        open={drawerOpen}
        onClose={handleDrawerClose}
        onSaved={handleDealSaved}
        onDeleted={handleDealDeleted}
      />
    </div>
  );
}