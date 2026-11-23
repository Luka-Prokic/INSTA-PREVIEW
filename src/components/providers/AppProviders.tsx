"use client";

import { AdminNoticeProvider } from "@/lib/caka-admin";
import type { ReactNode } from "react";
import { WorkspaceProvider } from "@/features/planner/store";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AdminNoticeProvider>
      <WorkspaceProvider>{children}</WorkspaceProvider>
    </AdminNoticeProvider>
  );
}
