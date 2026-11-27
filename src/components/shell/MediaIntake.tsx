"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useWorkspace } from "@/features/planner/store";
import type { PlannedItem } from "@/features/planner/types";
import { AddMediaModal } from "./AddMediaModal";
import styles from "./MediaIntake.module.css";

type Kind = PlannedItem["kind"];

type Seed = {
  file: File;
  kindHint?: Kind;
};

type MediaIntakeApi = {
  /** Opens the OS file picker; modal opens after a file is chosen. */
  openAddPicker: () => void;
};

const MediaIntakeContext = createContext<MediaIntakeApi | null>(null);

export function useMediaIntake(): MediaIntakeApi {
  const ctx = useContext(MediaIntakeContext);
  if (!ctx) throw new Error("useMediaIntake must be used inside MediaIntake");
  return ctx;
}

function pickSeed(files: FileList | File[]): Seed | null {
  const list = Array.from(files).filter(
    (f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
  );
  if (list.length === 0) return null;

  const video = list.find((f) => f.type.startsWith("video/"));
  if (video) return { file: video, kindHint: "reel" };

  const images = list.filter((f) => f.type.startsWith("image/"));
  if (images.length > 1) return { file: images[0]!, kindHint: "carousel" };
  if (images[0]) return { file: images[0], kindHint: "image" };
  return null;
}

function isFileDrag(event: DragEvent) {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

/**
 * Owns add-media picker + whole-app file drop. Dropping or picking a file
 * opens AddMediaModal with that file already loaded.
 */
export function MediaIntake({ children }: { children: ReactNode }) {
  const { snapshot } = useWorkspace();
  const canAdd = Boolean(snapshot);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState<Seed | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  const beginWithFiles = useCallback(
    (files: FileList | File[]) => {
      if (!canAdd) return;
      const next = pickSeed(files);
      if (!next) return;
      setSeed(next);
      setOpen(true);
    },
    [canAdd],
  );

  const openAddPicker = useCallback(() => {
    if (!canAdd) return;
    inputRef.current?.click();
  }, [canAdd]);

  const onOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setSeed(null);
  }, []);

  useEffect(() => {
    if (!canAdd) {
      dragDepth.current = 0;
      setDragging(false);
      return;
    }

    const onDragEnter = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      dragDepth.current += 1;
      setDragging(true);
    };

    const onDragLeave = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDragging(false);
    };

    const onDragOver = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    };

    const onDrop = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      const files = event.dataTransfer?.files;
      if (files?.length) beginWithFiles(files);
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [canAdd, beginWithFiles]);

  const api = useMemo(() => ({ openAddPicker }), [openAddPicker]);

  return (
    <MediaIntakeContext.Provider value={api}>
      {children}
      <input
        ref={inputRef}
        className={styles.file}
        type="file"
        accept="image/*,video/*"
        multiple
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const files = event.target.files;
          if (files?.length) beginWithFiles(files);
          event.target.value = "";
        }}
      />
      {dragging && canAdd && !open ?
        <div className={styles.dropOverlay} role="status" aria-live="polite">
          <p className={styles.dropTitle}>Drop to add</p>
          <p className={styles.dropHint}>Image or video → post, carousel, or reel</p>
        </div>
      : null}
      <AddMediaModal open={open} onOpenChange={onOpenChange} seed={seed} />
    </MediaIntakeContext.Provider>
  );
}
