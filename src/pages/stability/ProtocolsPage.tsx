
"use client";
import React from "react";
import StabilityLayout from "./StabilityLayout";
import StudySelector from "@/components/stability/StudySelector";
import { listProtocols } from "@/server/stability/service";
import type { StabilityProtocol } from "@/types/stability/types";
import ProtocolBuilderDrawer from "@/components/stability/ProtocolBuilder";


// Uncomment this after you create the builder file.
// import ProtocolBuilderDrawer from "@/components/stability/ProtocolBuilder";

export default function ProtocolsPage() {
  const [studyId, setStudyId] = React.useState<string | undefined>(undefined);
  const [rows, setRows] = React.useState<StabilityProtocol[]>([]);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<"" | "Draft" | "Active" | "Completed">("");
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  async function fetchRows() {
    setLoading(true);
    try {
      const data = await listProtocols({ studyId });
      setRows(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyId]);

  const filtered = rows.filter((r) => {
    const s = search.trim().toLowerCase();
    const matchesText =
      !s ||
      r.title?.toLowerCase().includes(s) ||
      r.product_batch?.toLowerCase().includes(s) ||
      r.storage_conditions?.toLowerCase().includes(s);
    const matchesStatus = !status || r.status === status;
    return matchesText && matchesStatus;
  });

  return (
    <StabilityLayout>
      <div className="space-y-4">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-lg md:text-xl font-semibold text-slate-900">Protocols</h1>
          <div className="flex flex-wrap items-center gap-3">
            <StudySelector value={studyId} onChange={setStudyId} />
            <input
              className="rounded-md border px-3 py-2 text-sm bg-white"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="rounded-md border px-3 py-2 text-sm bg-white"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="">All Status</option>
              <option>Draft</option>
              <option>Active</option>
              <option>Completed</option>
            </select>
            <button
              onClick={() => setOpen(true)}
              className="rounded-md bg-teal-600 text-white px-4 py-2 text-sm hover:bg-teal-700"
            >
              + New Protocol
            </button>
          </div>
        </header>

        <section className="rounded-xl border bg-white overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>ID</Th>
                <Th>Study</Th>
                <Th>Product / Batch</Th>
                <Th>Storage</Th>
                <Th>Start Date</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No protocols yet. Click <b>+ New Protocol</b>.
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-slate-50">
                    <Td mono short>{r.id.slice(0, 8)}</Td>
                    <Td>{r.study_id}</Td>
                    <Td>{r.product_batch || "—"}</Td>
                    <Td>{r.storage_conditions}</Td>
                    <Td>{r.start_date || "—"}</Td>
                    <Td>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs border ${
                          r.status === "Active"
                            ? "bg-teal-50 text-teal-700 border-teal-200"
                            : r.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        {r.status}
                      </span>
                    </Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      </div>

       
      <ProtocolBuilderDrawer
        open={open}
        onClose={() => setOpen(false)}
        defaultStudyId={studyId}
        onCreated={fetchRows}
      /> 
    </StabilityLayout>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-semibold px-4 py-3">{children}</th>;
}
function Td({
  children,
  mono,
  short,
}: React.PropsWithChildren<{ mono?: boolean; short?: boolean }>) {
  return (
    <td
      className={`px-4 py-3 ${mono ? "font-mono" : ""} ${
        short ? "w-[120px]" : ""
      }`}
    >
      {children}
    </td>
  );
}

