"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IonIcon } from "@/lib/caka-admin";
import { SharedImage } from "@/features/preview/SharedImage";
import { mergeGrid } from "@/features/planner/mergeGrid";
import type { GridItem } from "@/features/planner/types";
import { useWorkspace } from "@/features/planner/store";
import styles from "./PlannedList.module.css";
import shell from "./Shell.module.css";

function kindLabel(kind: GridItem["kind"]) {
  if (kind === "reel") return "Reel";
  if (kind === "carousel") return "Carousel";
  if (kind === "video") return "Video";
  return "Post";
}

function SortableRow({
  item,
  label,
  onRemove,
}: {
  item: GridItem;
  label: string;
  onRemove?: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className={styles.item} {...attributes}>
      <button type="button" className={styles.handle} aria-label="Drag to reorder" {...listeners}>
        ⠿
      </button>
      <SharedImage image={item.image} alt="" className={styles.thumb} />
      <div className={styles.meta}>
        <span className={styles.name}>{label}</span>
        <span className={styles.kind}>
          {kindLabel(item.kind)}
          {item.source === "planned" ? " · Planned" : item.pinned ? " · Pinned" : " · Published"}
        </span>
      </div>
      {onRemove ?
        <button
          type="button"
          className={shell.iconBtn}
          aria-label={`Remove ${label}`}
          onClick={() => onRemove(item.id)}
        >
          <IonIcon name="close-outline" />
        </button>
      : <span className={styles.handleSpacer} aria-hidden />}
    </li>
  );
}

/** Sidebar Content list — full DnD; order drives the preview grid. */
export function PlannedList() {
  const { planned, snapshot, gridOrder, reorderGrid, removePlanned } = useWorkspace();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const items = mergeGrid(snapshot?.fields.media.value, planned, "posts", gridOrder);
  const plannedNames = new Map(planned.map((p) => [p.id, p.name]));

  if (items.length === 0) {
    return <p className={shell.muted}>No content yet. Connect a profile or add a post.</p>;
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = items.map((i) => i.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    reorderGrid(arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className={styles.list}>
          {items.map((item) => (
            <SortableRow
              key={item.id}
              item={item}
              label={
                item.source === "planned" ?
                  (plannedNames.get(item.id) ?? kindLabel(item.kind))
                : kindLabel(item.kind)
              }
              onRemove={item.source === "planned" ? (id) => void removePlanned(id) : undefined}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
