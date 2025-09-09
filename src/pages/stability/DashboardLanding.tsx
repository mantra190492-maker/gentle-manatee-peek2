"use client";
import React from "react";
import { Link } from "react-router-dom";

export default function DashboardLanding() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900">Stability Dashboard</h1>
        <Link
          to="/stability/studies"
          className="inline-flex items-center rounded-md bg-teal-600 text-white px-4 py-2 text-sm hover:bg-teal-700"
        >
          Create New Study
        </Link>
      </header>

      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
        <Card title="Study Overview">
          <Empty message="No studies yet. Create your first study to get started." />
        </Card>
        <Card title="Upcoming Pulls">
          <Empty message="No scheduled pulls. Activate a protocol to generate timepoints." />
        </Card>
        <Card title="Alerts">
          <Empty message="No alerts. You’re all clear." />
        </Card>
        <Card title="Reports">
          <Empty message="No reports yet. Generate from completed studies." />
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <section className="rounded-xl border bg-white p-4 md:p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-800 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ message }: { message: string }) {
  return <p className="text-sm text-slate-500">{message}</p>;
}