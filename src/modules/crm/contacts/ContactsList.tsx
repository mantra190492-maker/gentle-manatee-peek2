"use client";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // Changed from next/link
import { listContacts, upsertContact, Contact } from "./api";
import { Button } from "@/components/ui/button"; // shadcn button
import { Input } from "@/components/ui/input"; // shadcn input
import { Plus, Search } from "lucide-react"; // icons
import NewContactDialog from "@/components/crm/contacts/NewContactDialog"; // Import the new dialog

export default function ContactsList() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContactDialogOpen, setNewContactDialogOpen] = useState(false);

  async function refresh() {
    setLoading(true);
    try { setItems(await listContacts(q)); } finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);
  useEffect(() => { const t = setTimeout(() => { void refresh(); }, 250); return () => clearTimeout(t); }, [q]);

  const handleContactAdded = () => {
    void refresh(); // Refresh the list after a new contact is added
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
        <Button onClick={() => setNewContactDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Contact
        </Button>
      </div>

      <div className="mb-4 relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          placeholder="Search contacts..."
          className="h-10 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {loading ? <div className="text-sm text-gray-500 p-4">Loading contacts…</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(c => (
            <Link key={c.id} to={`/crm/contacts/${c.id}`} className="rounded-2xl border border-gray-200 bg-white p-4 hover:bg-gray-50 transition-colors shadow-sm">
              <div className="font-semibold text-gray-900 truncate">{c.name}</div>
              <div className="text-sm text-gray-600 truncate">{c.email || "—"}</div>
              <div className="text-sm text-gray-600 truncate">{c.phone || "—"}</div>
              <div className="text-xs text-gray-500 mt-1">{c.company || "No company"}</div>
            </Link>
          ))}
          {items.length === 0 && (
            <div className="text-sm text-gray-500 p-4 col-span-full text-center">No contacts found.</div>
          )}
        </div>
      )}

      <NewContactDialog
        open={newContactDialogOpen}
        onOpenChange={setNewContactDialogOpen}
        onContactAdded={handleContactAdded}
      />
    </div>
  );
}