"use client";
import { useEffect, useState } from "react";
import { listContacts, upsertContact, Contact } from "@/modules/crm/contacts/api";
import { Input } from "@/components/ui/input"; // shadcn input
import { Button } from "@/components/ui/button"; // shadcn button
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // shadcn select
import { Plus, Search } from "lucide-react"; // icons
import { toast } from "sonner"; // toast

export default function ContactPicker({
  value,
  onChange,
}: { value?: string | null; onChange: (id: string | null) => void }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try { setItems(await listContacts(q)); } catch (error: any) {
      toast.error(`Failed to load contacts: ${error.message}`);
    } finally { setLoading(false); }
  }
  useEffect(()=>{ void refresh(); }, []);
  useEffect(()=>{ const t=setTimeout(() => { void refresh(); },200); return ()=>clearTimeout(t); }, [q]);

  async function quickCreate() {
    const name = prompt("New contact name?");
    if (!name) return;
    try {
      const c = await upsertContact({ name });
      setItems(prev => [c, ...prev]);
      onChange(c.id);
      toast.success(`Contact "${c.name}" created!`);
    } catch (error: any) {
      toast.error(`Failed to create contact: ${error.message}`);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 min-w-[150px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          placeholder="Search contacts"
          className="h-10 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <Select value={value || "none"} onValueChange={(val) => onChange(val === "none" ? null : val)}>
        <SelectTrigger className="h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm min-w-[200px] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
          <SelectValue placeholder="Select contact…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Select contact…</SelectItem>
          {loading ? (
            <SelectItem value="loading" disabled>Loading...</SelectItem>
          ) : (
            items.map(c => <SelectItem key={c.id} value={c.id}>{c.name} {c.email ? `• ${c.email}` : ""}</SelectItem>)
          )}
        </SelectContent>
      </Select>
      <Button onClick={quickCreate} variant="outline" className="h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm hover:bg-gray-100 flex items-center gap-1">
        <Plus className="w-4 h-4" /> New
      </Button>
    </div>
  );
}