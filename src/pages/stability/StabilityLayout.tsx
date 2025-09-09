"use client";
import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function StabilityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <aside className="hidden md:flex w-60 shrink-0 border-r bg-white">
        <nav className="w-full p-4">
          <h2 className="text-sm font-semibold text-teal-700 mb-3">Stability Study Tracker</h2>
          <ul className="space-y-1">
            <NavItem to="/stability" label="Dashboard" />
            <NavItem to="/stability/studies" label="Studies" />
            <NavItem to="/stability/protocols" label="Protocols" />
            <NavItem to="/stability/pulls" label="Pulls" />
            <NavItem to="/stability/results" label="Results" />
            <NavItem to="/stability/trends" label="Trends" />
            <NavItem to="/stability/reports" label="Reports" />
          </ul>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto bg-slate-50">
        <div className="mx-auto max-w-6xl p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <li>
      <Link
        to={to}
        className={`flex items-center rounded-md px-3 py-2 text-sm ${
          active
            ? "bg-teal-50 text-teal-700 border-l-4 border-teal-500 font-medium"
            : "text-slate-700 hover:bg-slate-100"
        }`}
      >
        {label}
      </Link>
    </li>
  );
}