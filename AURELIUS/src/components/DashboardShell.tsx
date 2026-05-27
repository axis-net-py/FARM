"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { AgriIAChat } from "@/components/dashboard/AgriIAChat";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  tenantId: string;
  children: React.ReactNode;
}

export function DashboardShell({ tenantId, children }: DashboardShellProps) {
  // Start with sidebar collapsed (hidden) for mobile layout
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="flex h-full overflow-hidden bg-background relative">
      {/* Backdrop overlay for mobile drawer */}
      {!collapsed && (
        <div 
          onClick={() => setCollapsed(true)} 
          className="absolute inset-0 bg-black/45 backdrop-blur-[2px] z-40 transition-opacity duration-300 cursor-pointer"
        />
      )}

      {/* Sidebar - positioned as slide-over drawer */}
      <div 
        className={cn(
          "absolute inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out shadow-2xl h-full",
          collapsed ? "-translate-x-full" : "translate-x-0"
        )}
      >
        <Sidebar tenantId={tenantId} collapsed={false} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden w-full h-full">
        {/* Header - toggles the sidebar drawer */}
        <Header tenantId={tenantId} onToggleSidebar={() => setCollapsed((c) => !c)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950/20">
          {children}
        </main>
      </div>
      <AgriIAChat tenantId={tenantId} />
    </div>
  );
}
