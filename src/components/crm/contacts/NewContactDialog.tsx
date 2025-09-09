"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { upsertContact } from "@/modules/crm/contacts/api";
import { toast } from "sonner";

interface NewContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactAdded: () => void;
}

export default function NewContactDialog({ open, onOpenChange, onContactAdded }: NewContactDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setCompany("");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await upsertContact({ name, email: email || null, phone: phone || null, company: company || null, notes: notes || null });
      toast.success(`Contact "${name}" created successfully!`);
      resetForm();
      onContactAdded();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Failed to create contact: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-6 rounded-2xl border border-gray-200 bg-white shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">New Contact</DialogTitle>
          <DialogDescription className="text-gray-600">
            Add a new contact to your CRM. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-y"
            />
          </div>
          <DialogFooter className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="border-gray-300 text-gray-700 hover:bg-gray-50">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? "Saving..." : "Save Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}