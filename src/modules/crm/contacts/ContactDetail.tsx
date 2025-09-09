"use client";
import { useEffect, useState } from "react";
import { Contact, getContact, upsertContact } from "./api";
import { Button } from "@/components/ui/button"; // shadcn button
import { Input } from "@/components/ui/input"; // shadcn input
import { Textarea } from "@/components/ui/textarea"; // shadcn textarea
import { Label } from "@/components/ui/label"; // shadcn label
import { toast } from "sonner"; // toast

export default function ContactDetail({ id }: { id: string }) {
  const [c, setC] = useState<Contact | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContact = async () => {
      setLoading(true);
      try {
        setC(await getContact(id));
      } catch (error: any) {
        toast.error(`Failed to load contact: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    void fetchContact();
  }, [id]);

  async function save() {
    if (!c) return;
    try {
      const updated = await upsertContact(c);
      setC(updated);
      setEditing(false);
      toast.success("Contact saved successfully!");
    } catch (error: any) {
      toast.error(`Failed to save contact: ${error.message}`);
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading contact…</div>;
  if (!c) return <div className="p-6 text-sm text-rose-500">Contact not found.</div>;

  return (
    <div className="p-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="text-2xl font-bold text-gray-900">Contact Details</div>
          {!editing ? (
            <Button onClick={()=>setEditing(true)} variant="outline" className="border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-100">Edit</Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={save} className="bg-emerald-600 px-4 py-2 text-white text-sm hover:bg-emerald-700">Save</Button>
              <Button onClick={()=>{setEditing(false); void getContact(id).then(setC);}} variant="outline" className="border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-100">Cancel</Button>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name" value={c.name} editing={editing} onChange={(v)=>setC({...c, name: v})}/>
          <Field label="Email" value={c.email || ""} editing={editing} onChange={(v)=>setC({...c, email: v})}/>
          <Field label="Phone" value={c.phone || ""} editing={editing} onChange={(v)=>setC({...c, phone: v})}/>
          <Field label="Company" value={c.company || ""} editing={editing} onChange={(v)=>setC({...c, company: v})}/>
          <Field label="Notes" value={c.notes || ""} editing={editing} onChange={(v)=>setC({...c, notes: v})} textarea />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, editing, onChange, textarea }:{
  label: string; value: string; editing: boolean; onChange: (v:string)=>void; textarea?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label className="text-sm text-gray-600">{label}</Label>
      {editing ? (
        textarea ? (
          <Textarea className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-y" value={value} onChange={e=>onChange(e.target.value)} rows={3}/>
        ) : (
          <Input className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" value={value} onChange={e=>onChange(e.target.value)}/>
        )
      ) : (
        <div className="h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm flex items-center text-gray-800">{value || "—"}</div>
      )}
    </div>
  );
}