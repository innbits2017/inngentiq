"use client";

import { ReactNode } from "react";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

interface Props {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: Props) {
  return (
    <div className="flex min-h-screen bg-slate-50">

      <AppSidebar />

      <div className="flex-1 flex flex-col">

        <DashboardHeader />

        <main className="p-8">
          {children}
        </main>

      </div>

    </div>
  );
}