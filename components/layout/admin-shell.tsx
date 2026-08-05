"use client";

import * as React from "react";
import { Sidebar, SidebarNav } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar />

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          showClose={false}
          className="w-60 border-0 bg-black p-0 text-white lg:hidden"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* lg+: same shell as before (fixed sidebar + ml-60 + p-6). Below lg: drawer nav. */}
      <div className="flex min-h-screen flex-col lg:ml-60">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-6 max-lg:p-4">{children}</main>
      </div>
    </div>
  );
}
