"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChoiceGroup } from "../controls/ChoiceGroup";
import styles from "./Calendar.module.css";

export type CalendarEvent = {
  id: string;
  date: string;
  label: string;
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function startOfWeek(date: Date): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day);
  return copy;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function Calendar({
  events,
  selectedDate,
  onSelectDate,
  renderEvent,
}: {
  events: CalendarEvent[];
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
  renderEvent?: (event: CalendarEvent) => ReactNode;
}) {
  const [anchor, setAnchor] = useState(() => (selectedDate ? parseKey(selectedDate) : new Date()));
  const [view, setView] = useState<"month" | "week">("month");

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    }
    return map;
  }, [events]);

  const days = useMemo(() => {
    if (view === "week") {
      const start = startOfWeek(anchor);
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        return date;
      });
    }
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const gridStart = startOfWeek(first);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return date;
    });
  }, [anchor, view]);

  function shift(amount: number) {
    const next = new Date(anchor);
    if (view === "week") next.setDate(next.getDate() + amount * 7);
    else next.setMonth(next.getMonth() + amount);
    setAnchor(next);
  }

  const label =
    view === "week"
      ? `Week of ${days[0]?.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
      : anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <section className={styles.calendar} aria-label="Calendar">
      <header className={styles.toolbar}>
        <button type="button" onClick={() => shift(-1)} aria-label="Previous">
          Previous
        </button>
        <h2>{label}</h2>
        <button type="button" onClick={() => shift(1)} aria-label="Next">
          Next
        </button>
        <ChoiceGroup
          ariaLabel="Calendar view"
          value={view}
          onChange={(next) => setView(next as "month" | "week")}
          options={[
            { value: "month", label: "Month" },
            { value: "week", label: "Week" },
          ]}
        />
      </header>
      <div className={view === "week" ? styles.week : styles.month}>
        {WEEKDAYS.map((day) => (
          <div key={day} className={styles.weekday}>
            {day}
          </div>
        ))}
        {days.map((date) => {
          const key = toDateKey(date);
          const inMonth = date.getMonth() === anchor.getMonth();
          const dayEvents = byDate.get(key) ?? [];
          return (
            <button
              key={key}
              type="button"
              className={styles.day}
              data-outside={view === "month" && !inMonth ? "" : undefined}
              data-selected={selectedDate === key ? "" : undefined}
              onClick={() => onSelectDate?.(key)}
            >
              <span>{date.getDate()}</span>
              <span className={styles.events}>
                {dayEvents.map((event) => (
                  <span key={event.id}>{renderEvent ? renderEvent(event) : event.label}</span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
