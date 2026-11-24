"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IonIcon, usePointerTilt } from "@/lib/caka-admin";
import { SharedImage } from "@/features/preview/SharedImage";
import { mergeGrid } from "@/features/planner/mergeGrid";
import type { GridItem, PlannedKind } from "@/features/planner/types";
import { useWorkspace } from "@/features/planner/store";
import { useCallback, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from "react";
import { PopupMenu, popupMenuStyles as pop, type PopupAnchor } from "./PopupMenu";
import styles from "./PlannedList.module.css";
import shell from "./Shell.module.css";

const KIND_OPTIONS: { value: PlannedKind; label: string }[] = [
  { value: "image", label: "Post" },
  { value: "carousel", label: "Carousel" },
  { value: "reel", label: "Reel" },
];

function kindLabel(kind: GridItem["kind"]) {
  if (kind === "reel") return "Reel";
  if (kind === "carousel") return "Carousel";
  if (kind === "video") return "Video";
  return "Post";
}

function toPlannedKind(kind: GridItem["kind"]): PlannedKind {
  if (kind === "carousel" || kind === "reel") return kind;
  return "image";
}

type MenuState = {
  id: string;
  anchor: PopupAnchor;
};

function SortableRow({
  item,
  label,
  menuOpen,
  onOpenMenu,
}: {
  item: GridItem;
  label: string;
  menuOpen: boolean;
  onOpenMenu: (id: string, rect: DOMRect) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 2 : undefined,
  };

  const onClick = (event: ReactMouseEvent<HTMLElement>) => {
    if (isDragging) return;
    onOpenMenu(item.id, event.currentTarget.getBoundingClientRect());
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={styles.itemWrap}
      data-dragging={isDragging || undefined}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      <div
        className={styles.item}
        data-tilt=""
        data-tilt-max={isDragging ? "0" : undefined}
        data-active={menuOpen || undefined}
        role="button"
        tabIndex={-1}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={`${label}, options`}
      >
        <span className={styles.handle} aria-hidden>
          ⠿
        </span>
        <SharedImage image={item.image} alt="" className={styles.thumb} />
        <div className={styles.meta}>
          <span className={styles.name}>{label}</span>
          <span className={styles.kind}>
            {kindLabel(item.kind)}
            {item.source === "planned" ? " · Planned" : item.pinned ? " · Pinned" : " · Published"}
          </span>
        </div>
      </div>
    </li>
  );
}

function SortableRailTile({ item }: { item: GridItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = {
    transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 2 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={styles.railItem}
      data-dragging={isDragging || undefined}
      {...attributes}
      {...listeners}
    >
      <SharedImage image={item.image} alt="" className={styles.railThumb} />
      {item.pinned ?
        <span className={styles.railPin} aria-hidden />
      : item.kind === "reel" || item.kind === "video" ?
        <span className={styles.railBadge} aria-hidden />
      : item.kind === "carousel" ?
        <span className={styles.railLayers} aria-hidden />
      : null}
    </li>
  );
}

function ItemOptionsMenu({
  item,
  open,
  anchor,
  onClose,
}: {
  item: GridItem;
  open: boolean;
  anchor: PopupAnchor | null;
  onClose: () => void;
}) {
  const { setItemKind, setItemPinned, removeGridItem } = useWorkspace();
  const kind = toPlannedKind(item.kind);

  return (
    <PopupMenu open={open} onClose={onClose} anchor={anchor} ariaLabel="Post options">
      <p className={pop.sectionTitle}>Type</p>
      {KIND_OPTIONS.map((option) => {
        const selected = kind === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="menuitemradio"
            aria-checked={selected}
            className={pop.item}
            data-active={selected || undefined}
            onClick={() => {
              setItemKind(item.id, option.value);
              onClose();
            }}
          >
            <span>{option.label}</span>
            {selected ? <IonIcon name="checkmark-outline" /> : null}
          </button>
        );
      })}
      <div className={pop.sep} role="separator" />
      <button
        type="button"
        role="menuitem"
        className={pop.item}
        onClick={() => {
          setItemPinned(item.id, !item.pinned);
          onClose();
        }}
      >
        <span>{item.pinned ? "Unpin" : "Pin"}</span>
      </button>
      <button
        type="button"
        role="menuitem"
        className={`${pop.item} ${pop.itemDanger}`}
        onClick={() => {
          void removeGridItem(item.id);
          onClose();
        }}
      >
        <span>Remove</span>
      </button>
    </PopupMenu>
  );
}

/** Sidebar Content list — full DnD; order drives the preview grid. */
export function PlannedList({ variant = "list" }: { variant?: "list" | "rail" }) {
  const { planned, snapshot, gridOrder, reorderGrid } = useWorkspace();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const items = mergeGrid(snapshot?.fields.media.value, planned, "posts", gridOrder);
  const plannedNames = new Map(planned.map((p) => [p.id, p.name]));
  const listRef = useRef<HTMLUListElement>(null);
  usePointerTilt(listRef, { tilt: `.${styles.item}` });

  const [menu, setMenu] = useState<MenuState | null>(null);
  const skipClick = useRef(false);
  const menuItem = menu ? items.find((i) => i.id === menu.id) : undefined;

  const closeMenu = useCallback(() => setMenu(null), []);

  const openMenu = useCallback((id: string, rect: DOMRect) => {
    if (skipClick.current) {
      skipClick.current = false;
      return;
    }
    const pad = 12;
    const gap = 6;
    const top = Math.min(rect.bottom + gap, window.innerHeight - pad - 120);
    const left = Math.min(rect.left, window.innerWidth - pad - 200);
    setMenu({
      id,
      anchor: { top: Math.max(pad, top), left: Math.max(pad, left) },
    });
  }, []);

  if (items.length === 0) {
    if (variant === "rail") return null;
    return <p className={shell.muted}>No content yet. Connect a profile or add a post.</p>;
  }

  const onDragStart = (_event: DragStartEvent) => {
    skipClick.current = true;
    setMenu(null);
  };

  const onDragEnd = (event: DragEndEvent) => {
    skipClick.current = true;
    window.setTimeout(() => {
      skipClick.current = false;
    }, 0);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const activeItem = items.find((i) => i.id === activeId);
    const overItem = items.find((i) => i.id === overId);
    if (!activeItem || !overItem) return;
    if (Boolean(activeItem.pinned) !== Boolean(overItem.pinned)) return;

    const pinnedIds = items.filter((i) => i.pinned).map((i) => i.id);
    const restIds = items.filter((i) => !i.pinned).map((i) => i.id);
    if (activeItem.pinned) {
      const oldIndex = pinnedIds.indexOf(activeId);
      const newIndex = pinnedIds.indexOf(overId);
      if (oldIndex < 0 || newIndex < 0) return;
      reorderGrid([...arrayMove(pinnedIds, oldIndex, newIndex), ...restIds]);
      return;
    }
    const oldIndex = restIds.indexOf(activeId);
    const newIndex = restIds.indexOf(overId);
    if (oldIndex < 0 || newIndex < 0) return;
    reorderGrid([...pinnedIds, ...arrayMove(restIds, oldIndex, newIndex)]);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => {
          skipClick.current = true;
          window.setTimeout(() => {
            skipClick.current = false;
          }, 0);
        }}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {variant === "rail" ?
            <ul className={styles.railList} aria-label="Content order">
              {items.map((item) => (
                <SortableRailTile key={item.id} item={item} />
              ))}
            </ul>
          : <ul ref={listRef} className={styles.list} aria-label="Content order">
              {items.map((item) => (
                <SortableRow
                  key={item.id}
                  item={item}
                  label={
                    item.source === "planned" ?
                      (plannedNames.get(item.id) ?? kindLabel(item.kind))
                    : kindLabel(item.kind)
                  }
                  menuOpen={menu?.id === item.id}
                  onOpenMenu={openMenu}
                />
              ))}
            </ul>
          }
        </SortableContext>
      </DndContext>

      {menuItem ?
        <ItemOptionsMenu
          item={menuItem}
          open={menu != null}
          anchor={menu?.anchor ?? null}
          onClose={closeMenu}
        />
      : null}
    </>
  );
}
