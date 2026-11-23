"use client";

import type { ReactNode } from "react";
import { WorkspaceProvider } from "@/features/planner/store";

export function AppProviders({ children }: { children: ReactNode }) {
  return <WorkspaceProvider>{children}</WorkspaceProvider>;
}
