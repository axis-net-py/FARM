"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface DashboardShellProps {
  tenantId: string;
  children: React.ReactNode;
}

export function DashboardShell({ tenantId, children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-background relative w-full">
      {/* Backdrop for Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 dark:bg-black/70 backdrop-blur-sm md:hidden transition-all duration-300 cursor-pointer animate-in fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Drawer Container */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:z-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar tenantId={tenantId} collapsed={collapsed} />
      </div>

      {/* Main Layout Area */}
      <div className="flex flex-1 flex-col overflow-hidden w-full min-w-0">
        <Header
          tenantId={tenantId}
          onToggleSidebar={() => {
            if (window.innerWidth < 768) {
              setMobileOpen((prev) => !prev);
            } else {
              setCollapsed((c) => !c);
            }
          }}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
