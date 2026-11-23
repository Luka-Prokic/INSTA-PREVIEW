"use client";

import type { ViewMode } from "@/features/planner/types";
import { FlipToggle } from "./FlipToggle";

export function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <FlipToggle
      ariaLabel="Preview mode"
      value={value}
      onChange={(next) => onChange(next as ViewMode)}
      options={[
        { value: "mobile", label: "Mobile" },
        { value: "desktop", label: "Desktop" },
      ]}
    />
  );
}
