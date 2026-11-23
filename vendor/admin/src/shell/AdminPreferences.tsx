"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  applyAdminTableDensityToDocument,
  DEFAULT_ADMIN_TABLE_DENSITY,
  DEFAULT_ADMIN_TIME_FORMAT,
  readStoredAdminTableDensity,
  readStoredAdminTimeFormat,
  writeStoredAdminTableDensity,
  writeStoredAdminTimeFormat,
  type AdminTableDensity,
  type AdminTimeFormat,
} from "../preferences";

type AdminPreferencesContextValue = {
  tableDensity: AdminTableDensity;
  setTableDensity: (density: AdminTableDensity) => void;
  timeFormat: AdminTimeFormat;
  setTimeFormat: (format: AdminTimeFormat) => void;
};

const AdminPreferencesContext = createContext<AdminPreferencesContextValue | null>(null);

export function AdminPreferencesProvider({ children }: { children: ReactNode }) {
  const [tableDensity, setTableDensityState] = useState<AdminTableDensity>(DEFAULT_ADMIN_TABLE_DENSITY);
  const [timeFormat, setTimeFormatState] = useState<AdminTimeFormat>(DEFAULT_ADMIN_TIME_FORMAT);

  useEffect(() => {
    const storedDensity = readStoredAdminTableDensity();
    setTableDensityState(storedDensity);
    applyAdminTableDensityToDocument(storedDensity);
    setTimeFormatState(readStoredAdminTimeFormat());
  }, []);

  const setTableDensity = useCallback((density: AdminTableDensity) => {
    setTableDensityState(density);
    writeStoredAdminTableDensity(density);
    applyAdminTableDensityToDocument(density);
  }, []);

  const setTimeFormat = useCallback((format: AdminTimeFormat) => {
    setTimeFormatState(format);
    writeStoredAdminTimeFormat(format);
  }, []);

  return (
    <AdminPreferencesContext.Provider value={{ tableDensity, setTableDensity, timeFormat, setTimeFormat }}>
      {children}
    </AdminPreferencesContext.Provider>
  );
}

export function useAdminPreferences(): AdminPreferencesContextValue {
  const context = useContext(AdminPreferencesContext);
  if (!context) {
    throw new Error("useAdminPreferences must be used within AdminPreferencesProvider");
  }
  return context;
}
