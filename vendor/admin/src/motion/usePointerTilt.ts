// @ts-nocheck — compiled under CAKA-CMS; pulled into this app via tilt/swipe imports.
"use client";

import { useEffect, type RefObject } from "react";

const MAX_TILT = 8;
const PERSPECTIVE = 800;
const SMOOTHING = 10;
const HIT_SLOP = 16;

type Axis = { x: number; y: number };
type Origin = { x: number; y: number };
type CardTilt = { current: Axis; target: Axis; origin: Origin; width: number; height: number };

const CENTER: Origin = { x: 50, y: 50 };

const PROBES: Array<[number, number]> = [
  [HIT_SLOP, 0],
  [-HIT_SLOP, 0],
  [0, HIT_SLOP],
  [0, -HIT_SLOP],
  [HIT_SLOP, HIT_SLOP],
  [HIT_SLOP, -HIT_SLOP],
  [-HIT_SLOP, HIT_SLOP],
  [-HIT_SLOP, -HIT_SLOP],
];

export function pointerLayout(clientX: number, clientY: number) {
  const raw = Number(getComputedStyle(document.documentElement).zoom);
  const scale = Number.isFinite(raw) && raw > 0 ? raw : 1;
  return { x: clientX / scale, y: clientY / scale };
}

function flatBox(el: HTMLElement) {
  const written = el.style.transform;
  const origin = el.style.transformOrigin;
  const perspective = el.style.perspectiveOrigin;
  if (written) {
    el.style.transform = "none";
    el.style.transformOrigin = "";
    el.style.perspectiveOrigin = "";
  }
  const rect = el.getBoundingClientRect();
  if (written) {
    el.style.transform = written;
    el.style.transformOrigin = origin;
    el.style.perspectiveOrigin = perspective;
  }
  return rect;
}

function tiltFromElement(clientX: number, clientY: number, el: HTMLElement, maxTilt: number) {
  const rect = flatBox(el);
  const point = pointerLayout(clientX, clientY);
  const width = Math.max(rect.width, 1);
  const height = Math.max(rect.height, 1);
  const px = (point.x - rect.left) / width - 0.5;
  const py = (point.y - rect.top) / height - 0.5;
  const clamp = (value: number) => Math.max(-maxTilt, Math.min(maxTilt, value));
  return {
    // The side under the pointer comes forward.
    x: clamp(py * maxTilt * 2),
    y: clamp(-(px * maxTilt * 2)),
    width,
    height,
    origin: {
      x: ((point.x - rect.left) / width) * 100,
      y: ((point.y - rect.top) / height) * 100,
    },
  };
}

function holdScale(rxDeg: number, ryDeg: number, origin: Origin, width: number, height: number) {
  const rx = (rxDeg * Math.PI) / 180;
  const ry = (ryDeg * Math.PI) / 180;
  const ox = (origin.x / 100) * width;
  const oy = (origin.y / 100) * height;
  const sinX = Math.sin(rx);
  const cosX = Math.cos(rx);
  const sinY = Math.sin(ry);
  const cosY = Math.cos(ry);
  let minRatio = 1;
  for (const [x, y] of [
    [-ox, -oy],
    [width - ox, -oy],
    [-ox, height - oy],
    [width - ox, height - oy],
  ]) {
    const dist = Math.hypot(x, y);
    if (dist < 1) continue;
    const z = y * sinX - x * sinY * cosX;
    const x2 = x * cosY;
    const y2 = y * cosX + x * sinY * sinX;
    const projected = PERSPECTIVE / Math.max(PERSPECTIVE - z, 1);
    const ratio = Math.hypot(x2 * projected, y2 * projected) / dist;
    if (ratio < minRatio) minRatio = ratio;
  }
  return minRatio > 0 ? 1 / minRatio : 1;
}

function tiltLimit(el: HTMLElement) {
  const raw = Number(el.dataset.tiltMax);
  return Number.isFinite(raw) && raw > 0 ? raw : MAX_TILT;
}

export function motionReduced() {
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.querySelector("[data-reduce-motion]") !== null
  );
}

/**
 * Pointer tilt shared with NEXT-CAKA-UI's Tilt card.
 * The side under the pointer tilts forward. A scale keeps the far edge at its original size.
 * Touch and reduced motion leave the surface flat.
 */
export function usePointerTilt(
  ref: RefObject<HTMLElement | null>,
  selectors?: { tilt?: string; spot?: string },
) {
  const tiltSel = selectors?.tilt ?? "[data-tilt]";

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const cards = new Map<HTMLElement, CardTilt>();
    let active: HTMLElement | null = null;
    let raf = 0;
    let last = performance.now();

    const settle = (card: HTMLElement | null) => {
      if (!card) return;
      const state = cards.get(card);
      if (state) state.target = { x: 0, y: 0 };
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const reduced = motionReduced();
      const alpha = 1 - Math.exp(-SMOOTHING * dt);
      cards.forEach((state, el) => {
        if (!el.isConnected) {
          cards.delete(el);
          return;
        }
        if (reduced) {
          state.current = { x: 0, y: 0 };
          state.target = { x: 0, y: 0 };
          state.origin = CENTER;
          el.style.transform = "";
          el.style.transformOrigin = "";
          el.style.perspectiveOrigin = "";
          return;
        }
        state.current.x += (state.target.x - state.current.x) * alpha;
        state.current.y += (state.target.y - state.current.y) * alpha;
        const { x, y } = state.current;
        if (Math.abs(x) < 0.02 && Math.abs(y) < 0.02 && state.target.x === 0 && state.target.y === 0) {
          el.style.transform = "";
          el.style.transformOrigin = "";
          el.style.perspectiveOrigin = "";
          return;
        }
        const { x: ox, y: oy } = state.origin;
        const scale = holdScale(x, y, state.origin, state.width, state.height);
        el.style.transformOrigin = `${ox.toFixed(2)}% ${oy.toFixed(2)}%`;
        el.style.perspectiveOrigin = `${ox.toFixed(2)}% ${oy.toFixed(2)}%`;
        el.style.transform = `scale(${scale.toFixed(4)}) perspective(${PERSPECTIVE}px) rotateX(${x.toFixed(2)}deg) rotateY(${y.toFixed(2)}deg)`;
      });
      raf = requestAnimationFrame(tick);
    };

    const cardFrom = (x: number, y: number) => {
      const node = document.elementFromPoint(x, y);
      const card = node instanceof Element ? node.closest(tiltSel) : null;
      return card instanceof HTMLElement && root.contains(card) ? card : null;
    };

    const cardAt = (x: number, y: number) => {
      const direct = cardFrom(x, y);
      if (direct) return direct;
      if (active && PROBES.some(([dx, dy]) => cardFrom(x + dx, y + dy) === active)) return active;
      for (const [dx, dy] of PROBES) {
        const card = cardFrom(x + dx, y + dy);
        if (card) return card;
      }
      return null;
    };

    const onMove = (event: PointerEvent) => {
      const next = cardAt(event.clientX, event.clientY);
      if (active && active !== next) settle(active);
      active = next;
      if (!next || motionReduced() || event.pointerType === "touch") return;
      let state = cards.get(next);
      if (!state) {
        state = { current: { x: 0, y: 0 }, target: { x: 0, y: 0 }, origin: CENTER, width: 1, height: 1 };
        cards.set(next, state);
      }
      const nextTilt = tiltFromElement(event.clientX, event.clientY, next, tiltLimit(next));
      state.target = { x: nextTilt.x, y: nextTilt.y };
      state.origin = nextTilt.origin;
      state.width = nextTilt.width;
      state.height = nextTilt.height;
    };

    const onLeave = () => {
      settle(active);
      active = null;
    };

    raf = requestAnimationFrame(tick);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      cards.forEach((_, el) => {
        el.style.transform = "";
        el.style.transformOrigin = "";
        el.style.perspectiveOrigin = "";
      });
    };
  }, [ref, tiltSel]);
}
