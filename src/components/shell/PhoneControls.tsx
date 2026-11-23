"use client";

import { useWorkspace } from "@/features/planner/store";
import {
  CAROUSEL_PHONE_IDS,
  PHONE_MODELS,
  type PhoneModelId,
} from "@/features/preview/devices";
import { SidebarSection } from "./SidebarSection";
import styles from "./Shell.module.css";
import sideStyles from "./AppSidebar.module.css";

type DeviceId = PhoneModelId | "desktop" | "macbook" | "bare";

const FEATURED_EXTRAS: { id: "bare" | "macbook"; name: string; subtitle: string }[] = [
  { id: "bare", name: "No device", subtitle: "Full feed · no frame" },
  { id: "macbook", name: "MacBook", subtitle: "16:10" },
];

export function PhoneControls() {
  const { viewMode, phoneModelId, setPhoneModelId, setViewMode } = useWorkspace();

  const active: DeviceId =
    viewMode === "desktop" || viewMode === "macbook" || viewMode === "bare" ?
      viewMode
    : phoneModelId;

  const deviceName =
    active === "desktop" ? "Desktop"
    : PHONE_MODELS.find((m) => m.id === active)?.name ??
      FEATURED_EXTRAS.find((d) => d.id === active)?.name ??
      "Device";

  const select = (id: DeviceId) => {
    if (id === "desktop" || id === "macbook" || id === "bare") {
      setViewMode(id);
      return;
    }
    setPhoneModelId(id);
    setViewMode("mobile");
  };

  const featuredPhone = PHONE_MODELS.filter((m) => CAROUSEL_PHONE_IDS.includes(m.id));
  const morePhones = PHONE_MODELS.filter((m) => !CAROUSEL_PHONE_IDS.includes(m.id));

  const row = (id: DeviceId, label: string, meta: string) => {
    const selected = id === active;
    return (
      <li key={id}>
        <button
          type="button"
          role="option"
          aria-selected={selected}
          className={styles.row}
          data-active={selected || undefined}
          onClick={() => select(id)}
        >
          <span className={styles.rowLabel}>
            <span className={sideStyles.phoneDot} data-active={selected || undefined} />
            {label}
          </span>
          <span className={styles.muted}>{meta}</span>
        </button>
      </li>
    );
  };

  return (
    <SidebarSection title="Device" defaultOpen={false} summary={deviceName}>
      <ul className={styles.card} role="listbox" aria-label="Preview device">
        {row("bare", "No device", "Full feed · no frame")}
        {featuredPhone.map((model) =>
          row(model.id, model.name, `${model.sizeLabel} · ${model.screenW}×${model.screenH}`),
        )}
        {row("macbook", "MacBook", "16:10")}
        <li className={styles.listDivider} aria-hidden>
          <span className={styles.muted}>More</span>
        </li>
        {row("desktop", "Desktop", "16:9")}
        {morePhones.map((model) =>
          row(model.id, model.name, `${model.sizeLabel} · ${model.screenW}×${model.screenH}`),
        )}
      </ul>
    </SidebarSection>
  );
}
