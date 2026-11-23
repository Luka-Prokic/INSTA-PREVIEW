"use client";

import { useState } from "react";
import { DeviceCarousel } from "@/components/shell/DeviceCarousel";
import type { PreviewTab, ViewMode } from "@/features/planner/types";
import {
  DEFAULT_PHONE_MODEL_ID,
  type PhoneModelId,
  type PhoneScaleMode,
} from "@/features/preview/devices";
import type { SharedPlan } from "@/features/share/types";
import styles from "./ShareView.module.css";

export function ShareView({ plan }: { plan: SharedPlan }) {
  const [viewMode, setViewMode] = useState<ViewMode>(plan.viewMode ?? "mobile");
  const [phoneModelId, setPhoneModelId] = useState<PhoneModelId>(
    plan.phoneModelId ?? DEFAULT_PHONE_MODEL_ID,
  );
  const phoneScaleMode: PhoneScaleMode = "actual";
  const [tab, setTab] = useState<PreviewTab>("posts");

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <p className={styles.title}>@{plan.username}</p>
          <p className={styles.sub}>Shared plan · swipe devices to preview</p>
        </div>
        <div className={styles.actions}>
          <a className={styles.home} href="/">
            Open INSTA PREVIEW
          </a>
        </div>
      </header>
      <div className={styles.stage}>
        <DeviceCarousel
          snapshot={plan.snapshot}
          planned={plan.planned}
          editMode={false}
          tab={tab}
          onTabChange={setTab}
          viewMode={viewMode}
          phoneModelId={phoneModelId}
          phoneScaleMode={phoneScaleMode}
          onViewModeChange={setViewMode}
          onPhoneModelIdChange={setPhoneModelId}
        />
      </div>
    </div>
  );
}

export function ShareMissing({ id }: { id: string }) {
  return (
    <div className={styles.root}>
      <div className={styles.missing}>
        <p className={styles.title}>Share not found</p>
        <p className={styles.sub}>No planned look is stored for “{id}”.</p>
        <a className={styles.home} href="/">
          Back to INSTA PREVIEW
        </a>
      </div>
    </div>
  );
}
