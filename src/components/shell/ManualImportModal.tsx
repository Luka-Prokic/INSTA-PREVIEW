"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import type { Highlight, ImageRef, ManualOverrides } from "@/features/import/types";
import { putBlob } from "@/features/planner/persistence";
import { useWorkspace } from "@/features/planner/store";
import { SharedImage } from "@/features/preview/SharedImage";
import { useForwardWheelScroll } from "@/hooks/useForwardWheelScroll";
import { usePresence } from "@/hooks/usePresence";
import styles from "./AddMediaModal.module.css";
import editStyles from "./ManualImportModal.module.css";
import motion from "./ModalMotion.module.css";
import shell from "./Shell.module.css";

function FileUpload({
  label,
  file,
  onPick,
  inputRef,
}: {
  label: string;
  file: File | null;
  onPick: (file: File | null) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const [drop, setDrop] = useState(false);

  return (
    <div className={`${shell.field} ${styles.mediaField}`}>
      <span>{label}</span>
      {file ?
        <div className={styles.selected}>
          <div className={styles.meta}>
            <p className={styles.fileName}>{file.name}</p>
            <div className={styles.actions}>
              <button type="button" className={styles.linkBtn} onClick={() => inputRef.current?.click()}>
                Replace
              </button>
              <button type="button" className={styles.linkBtn} onClick={() => onPick(null)}>
                Remove
              </button>
            </div>
          </div>
        </div>
      : <button
          type="button"
          className={styles.upload}
          data-drop={drop || undefined}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDrop(true);
          }}
          onDragLeave={() => setDrop(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDrop(false);
            onPick(event.dataTransfer.files?.[0] ?? null);
          }}
        >
          <span className={styles.uploadLabel}>Upload image</span>
          <span className={styles.uploadHint}>Drop a file here, or choose one</span>
        </button>
      }
      <input
        ref={inputRef}
        className={styles.file}
        type="file"
        accept="image/*"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          onPick(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function seedHighlights(manual: ManualOverrides, imported: Highlight[] | undefined): Highlight[] {
  if (manual.highlights) return manual.highlights.map((h) => ({ ...h }));
  return (imported ?? []).map((h) => ({ ...h }));
}

export function ManualImportModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { manual, setManual, snapshot } = useWorkspace();
  const presence = usePresence(open);
  const scrollRef = useRef<HTMLDivElement>(null);
  const onWheel = useForwardWheelScroll(scrollRef);
  const avatarRef = useRef<HTMLInputElement>(null);
  const highlightRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [category, setCategory] = useState("");
  const [verified, setVerified] = useState(false);
  const [hasStory, setHasStory] = useState(false);
  const [posts, setPosts] = useState("");
  const [followers, setFollowers] = useState("");
  const [following, setFollowing] = useState("");
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [highlightTitle, setHighlightTitle] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [highlightFile, setHighlightFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const f = snapshot?.fields;
    const count = (manualVal: number | undefined, field: { value?: number } | undefined) =>
      manualVal !== undefined ? String(manualVal) : field?.value !== undefined ? String(field.value) : "";

    setDisplayName(manual.displayName ?? f?.displayName.value ?? "");
    setBio(manual.bio ?? f?.bio.value ?? "");
    setWebsite(manual.website ?? f?.website.value ?? "");
    setCategory(manual.category ?? f?.category.value ?? "");
    setVerified(manual.verified ?? f?.verified.value ?? false);
    setHasStory(manual.hasStory ?? snapshot?.hasStory ?? false);
    setPosts(count(manual.posts, f?.posts));
    setFollowers(count(manual.followers, f?.followers));
    setFollowing(count(manual.following, f?.following));
    setHighlights(seedHighlights(manual, f?.highlights.value));
    setHighlightTitle("");
    setAvatarFile(null);
    setHighlightFile(null);
  }, [open, manual, snapshot]);

  useEffect(() => {
    if (!presence.mounted) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !presence.closing) onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [presence.mounted, presence.closing, onOpenChange]);

  const updateHighlightTitle = (id: string, title: string) => {
    setHighlights((list) => list.map((h) => (h.id === id ? { ...h, title } : h)));
  };

  const removeHighlight = (id: string) => {
    setHighlights((list) => list.filter((h) => h.id !== id));
  };

  const save = async () => {
    setBusy(true);
    try {
      const patch: ManualOverrides = { ...manual };
      if (displayName.trim()) patch.displayName = displayName.trim();
      if (bio.trim()) patch.bio = bio.trim();
      if (website.trim()) patch.website = website.trim();
      if (category.trim()) patch.category = category.trim();
      patch.verified = verified;
      patch.hasStory = hasStory;
      if (posts.trim()) patch.posts = Number(posts.replace(/,/g, ""));
      if (followers.trim()) patch.followers = Number(followers.replace(/,/g, ""));
      if (following.trim()) patch.following = Number(following.replace(/,/g, ""));

      if (avatarFile) {
        const key = await putBlob(`manual-avatar-${Date.now()}`, avatarFile);
        patch.avatar = { kind: "blob", key };
      }

      let nextHighlights = highlights.map((h) => ({
        ...h,
        title: h.title.trim() || h.title,
      }));

      if (highlightFile && highlightTitle.trim()) {
        const key = await putBlob(`manual-hl-${Date.now()}`, highlightFile);
        nextHighlights = [
          ...nextHighlights,
          {
            id: `hl-${Date.now()}`,
            title: highlightTitle.trim(),
            cover: { kind: "blob", key } satisfies ImageRef,
          },
        ];
      }

      patch.highlights = nextHighlights;

      setManual(patch);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  if (!presence.mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`${shell.modalBackdrop} ${presence.closing ? motion.backdropClosing : motion.backdrop}`}
      role="presentation"
      onWheel={onWheel}
      onClick={() => {
        if (!presence.closing) onOpenChange(false);
      }}
    >
      <div
        className={`${shell.modalCard} ${shell.modalCardWide} ${presence.closing ? motion.dialogClosing : motion.dialog}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={shell.modalHeader}>
          <h2 id="manual-title">Edit profile</h2>
          <div className={shell.modalHeaderActions}>
            <button type="button" className={shell.modalSecondary} onClick={() => onOpenChange(false)}>
              Cancel
            </button>
            <button type="button" className={shell.modalPrimary} onClick={() => void save()} disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </header>

        <div ref={scrollRef} className={shell.modalPad} data-modal-scroll>
          <div className={shell.modalBody}>
            <section className={shell.modalSection}>
              <p className={shell.modalSectionTitle}>Profile</p>
              <div className={shell.modalRow}>
                <label className={shell.field}>
                  Display name
                  <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </label>
                <label className={shell.field}>
                  Category
                  <input value={category} onChange={(e) => setCategory(e.target.value)} />
                </label>
              </div>
              <label className={shell.field}>
                Bio
                <input value={bio} onChange={(e) => setBio(e.target.value)} />
              </label>
              <label className={shell.field}>
                Website
                <input value={website} onChange={(e) => setWebsite(e.target.value)} />
              </label>
              <div className={shell.modalSwitchRow}>
                Verified badge
                <button
                  type="button"
                  className={shell.switch}
                  data-on={verified || undefined}
                  aria-pressed={verified}
                  onClick={() => setVerified((v) => !v)}
                />
              </div>
            </section>

            <section className={shell.modalSection}>
              <p className={shell.modalSectionTitle}>Counts</p>
              <div className={shell.modalRow}>
                <label className={shell.field}>
                  Posts
                  <input value={posts} onChange={(e) => setPosts(e.target.value)} inputMode="numeric" />
                </label>
                <label className={shell.field}>
                  Followers
                  <input value={followers} onChange={(e) => setFollowers(e.target.value)} inputMode="numeric" />
                </label>
                <label className={shell.field}>
                  Following
                  <input value={following} onChange={(e) => setFollowing(e.target.value)} inputMode="numeric" />
                </label>
              </div>
            </section>

            <section className={shell.modalSection}>
              <p className={shell.modalSectionTitle}>Photo</p>
              <FileUpload label="Profile photo" file={avatarFile} onPick={setAvatarFile} inputRef={avatarRef} />
              <div className={shell.modalSwitchRow}>
                Story ring
                <button
                  type="button"
                  className={shell.switch}
                  data-on={hasStory || undefined}
                  aria-pressed={hasStory}
                  onClick={() => setHasStory((v) => !v)}
                />
              </div>
            </section>

            <section className={shell.modalSection}>
              <p className={shell.modalSectionTitle}>Highlights</p>
              {highlights.length ?
                <ul className={editStyles.highlightList}>
                  {highlights.map((h) => (
                    <li key={h.id} className={editStyles.highlightRow}>
                      <SharedImage image={h.cover} alt="" className={editStyles.highlightCover} />
                      <input
                        className={editStyles.highlightTitle}
                        value={h.title}
                        onChange={(e) => updateHighlightTitle(h.id, e.target.value)}
                        aria-label="Highlight name"
                      />
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() => removeHighlight(h.id)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              : null}
              <label className={shell.field}>
                Name
                <input
                  value={highlightTitle}
                  onChange={(e) => setHighlightTitle(e.target.value)}
                  placeholder="New highlight"
                />
              </label>
              <FileUpload
                label="Cover"
                file={highlightFile}
                onPick={setHighlightFile}
                inputRef={highlightRef}
              />
            </section>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
