"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./Topbar";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <Topbar />
      <MobileNav />
      <main className="lg:pl-64 pt-0 lg:pt-0 overflow-x-hidden">
        <div className="max-container py-6 sm:py-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}