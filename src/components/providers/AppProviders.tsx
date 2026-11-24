"use client";

import { readStoredAdminTheme } from "@/lib/caka-admin";
import { applyPreviewTheme } from "@/features/theme/applyPreviewTheme";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { WorkspaceProvider } from "@/features/planner/store";

function ThemeSync({ children }: { children: ReactNode }) {
  useEffect(() => {
    applyPreviewTheme(readStoredAdminTheme());
  }, []);
  return children;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeSync>
      <WorkspaceProvider>{children}</WorkspaceProvider>
    </ThemeSync>
  );
}
