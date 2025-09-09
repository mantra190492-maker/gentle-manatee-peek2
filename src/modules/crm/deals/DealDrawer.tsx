"use client";
import { useState, useEffect } from "react";
import type { DealWithContact, DealStage, NewDeal, UpdateDeal } from "./types.ts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import DateInput from "@/components/common/DateInput";
import ContactPicker from "@/components/pickers/ContactPicker";
import { upsertDeal, deleteDeal, DEAL_STAGES } from "./api.ts";
import { DealStagePill } from "./DealStagePill.tsx";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client"; // For getting current user

interface DealDrawerProps {
  deal: DealWithContact | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

export function DealDrawer({ deal, open, onClose, onSaved, onDeleted }: DealDrawerProps) {
  const [localDealData, setLocalDealData] = useState<NewDeal | UpdateDeal | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (deal) {
      setLocalDealData({
        ...deal,
        amount: Number(deal.amount), // Ensure amount is a number for input
        close_date: deal.close_date || undefined,
        contact_id: deal.contact_id || null,
        notes: deal.notes || undefined,
      });
    } else {
      setLocalDealData(null);
    }
  }, [deal]);

  if (!open || !localDealData) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setLocalDealData(prev => prev ? { ...prev, [id]: value } : null);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setLocalDealData(prev => prev ? { ...prev, [id]: Number(value) } : null);
  };

  const handleSelectChange = (id: keyof (NewDeal | UpdateDeal), value: string) => {
    setLocalDealData(prev => prev ? { ...prev, [id]: value } : null);
  };

  const handleDateChange = (date: Date | null) => {
    setLocalDealData(prev => prev ? { ...prev, close_date: date ? format(date, "yyyy-MM-dd") : null } : null);
  };

  const handleContactChange = (contactId: string | null) => {
    setLocalDealData(prev => prev ? { ...prev, contact_id: contactId } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localDealData || !localDealData.title || !localDealData.stage || localDealData.amount === undefined) {
      toast.error("Title, Stage, and Amount are required.");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const ownerId = user?.id || null;

      const payload = {
        ...localDealData,
        owner: ownerId, // Set owner to current user
      };

      await upsertDeal(payload);
      onSaved();
      onClose();
    } catch (error) {
      console.error("Error saving deal:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deal?.id || !confirm("Are you sure you want to delete this deal?")) return;

    setDeleting(true);
    try {
      await deleteDeal(deal.id);
      onDeleted();
      onClose();
    } catch (error) {
      console.error("Error deleting deal:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-gray-900/30" onClick={onClose} />
      <aside className="relative ml-auto w-full max-w-xl bg-white h-full shadow-lg flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="font-semibold text-lg text-gray-900">Deal Details</div>
          <button className="text-2xl text-gray-400 hover:text-gray-600" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 p-4 overflow-y-auto">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={localDealData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stage">Stage</Label>
              <Select
                value={localDealData.stage}
                onValueChange={(val: DealStage) => handleSelectChange("stage", val)}
              >
                <SelectTrigger id="stage">
                  <SelectValue placeholder="Select Stage" />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <DealStagePill stage={s} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (CAD)</Label>
              <Input
                id="amount"
                type="number"
                value={localDealData.amount}
                onChange={handleNumberChange}
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="close_date">Close Date</Label>
              <DateInput
                value={localDealData.close_date ? new Date(localDealData.close_date) : undefined}
                onChange={handleDateChange}
                placeholder="Pick a date"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact_id">Contact</Label>
              <ContactPicker
                value={localDealData.contact_id}
                onChange={handleContactChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={localDealData.notes || ""}
                onChange={handleInputChange}
                rows={4}
                className="resize-y"
              />
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-gray-200 flex justify-between items-center">
            {deal?.id && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete Deal"}
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="secondary" onClick={onClose} disabled={saving || deleting}>
                Close
              </Button>
              <Button type="submit" disabled={saving || deleting}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </aside>
    </div>
  );
}