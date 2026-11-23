"use client";

import { createContext, useContext } from "react";

type AdminShellContextValue = {
  folded: boolean;
  toggleFold: () => void;
};

export const AdminShellContext = createContext<AdminShellContextValue | null>(null);

export function useAdminShell(): AdminShellContextValue | null {
  return useContext(AdminShellContext);
}
