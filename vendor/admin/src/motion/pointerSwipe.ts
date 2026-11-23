// @ts-nocheck — compiled under CAKA-CMS; pulled into this app via tilt/swipe imports.
import { motionReduced, pointerLayout } from "./usePointerTilt";

/**
 * Pointer trail from HEFEST-PROMO's main-page swipe.
 * Samples, coast, and the goo melt stay the same. The paint is white.
 * Each tilted card (or spot) gets its own canvas, behind that card's content.
 */

type Sample = { x: number; y: number; time: number; dx: number; dy: number };
type Point = { x: number; y: number };

const LIFE = 700;
const SAMPLE_GAP = 18;
const STOP_MS = 40;
const COAST_CAP = 36;
const FILTER_ID = "admin-swipe-goo";
const GOO_FILTER = `url(#${FILTER_ID})`;
const BLUR_RADII = [5, 5, 6];
const SWIPE = "#ffffff";

function filterWritesPixels(filter: string) {
  const size = 48;
  const src = document.createElement("canvas");
  src.width = size;
  src.height = size;
  const source = src.getContext("2d");
  const out = document.createElement("canvas");
  out.width = size;
  out.height = size;
  const target = out.getContext("2d");
  if (!source || !target) return false;
  source.fillStyle = SWIPE;
  source.fillRect(18, 18, 12, 12);
  const before = source.getImageData(0, 0, size, size).data;
  try {
    target.filter = filter;
    target.drawImage(src, 0, 0);
    target.filter = "none";
  } catch {
    return false;
  }
  const after = target.getImageData(0, 0, size, size).data;
  for (let index = 3; index < after.length; index += 4) {
    if (after[index] !== before[index]) return true;
  }
  return false;
}

function blurHorizontal(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
) {
  const red = new Float64Array(width + 1);
  const green = new Float64Array(width + 1);
  const blue = new Float64Array(width + 1);
  const alpha = new Float64Array(width + 1);
  for (let y = 0; y < height; y += 1) {
    const row = y * width * 4;
    red[0] = 0;
    green[0] = 0;
    blue[0] = 0;
    alpha[0] = 0;
    for (let x = 0; x < width; x += 1) {
      const index = row + x * 4;
      red[x + 1] = red[x] + src[index];
      green[x + 1] = green[x] + src[index + 1];
      blue[x + 1] = blue[x] + src[index + 2];
      alpha[x + 1] = alpha[x] + src[index + 3];
    }
    for (let x = 0; x < width; x += 1) {
      const start = Math.max(0, x - radius);
      const end = Math.min(width - 1, x + radius);
      const count = end - start + 1;
      const index = row + x * 4;
      dst[index] = (red[end + 1] - red[start]) / count;
      dst[index + 1] = (green[end + 1] - green[start]) / count;
      dst[index + 2] = (blue[end + 1] - blue[start]) / count;
      dst[index + 3] = (alpha[end + 1] - alpha[start]) / count;
    }
  }
}

function blurVertical(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
) {
  const red = new Float64Array(height + 1);
  const green = new Float64Array(height + 1);
  const blue = new Float64Array(height + 1);
  const alpha = new Float64Array(height + 1);
  for (let x = 0; x < width; x += 1) {
    red[0] = 0;
    green[0] = 0;
    blue[0] = 0;
    alpha[0] = 0;
    for (let y = 0; y < height; y += 1) {
      const index = (y * width + x) * 4;
      red[y + 1] = red[y] + src[index];
      green[y + 1] = green[y] + src[index + 1];
      blue[y + 1] = blue[y] + src[index + 2];
      alpha[y + 1] = alpha[y] + src[index + 3];
    }
    for (let y = 0; y < height; y += 1) {
      const start = Math.max(0, y - radius);
      const end = Math.min(height - 1, y + radius);
      const count = end - start + 1;
      const index = (y * width + x) * 4;
      dst[index] = (red[end + 1] - red[start]) / count;
      dst[index + 1] = (green[end + 1] - green[start]) / count;
      dst[index + 2] = (blue[end + 1] - blue[start]) / count;
      dst[index + 3] = (alpha[end + 1] - alpha[start]) / count;
    }
  }
}

function melt(image: ImageData) {
  const { data, width, height } = image;
  for (let index = 0; index < data.length; index += 4) {
    const scale = data[index + 3] / 255;
    data[index] *= scale;
    data[index + 1] *= scale;
    data[index + 2] *= scale;
  }
  const tmp = new Uint8ClampedArray(data.length);
  for (const radius of BLUR_RADII) {
    blurHorizontal(data, tmp, width, height, radius);
    blurVertical(tmp, data, width, height, radius);
  }
  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3];
    const next = (alpha / 255) * 18 - 7;
    if (alpha === 0 || next <= 0) {
      data[index] = 0;
      data[index + 1] = 0;
      data[index + 2] = 0;
      data[index + 3] = 0;
      continue;
    }
    const scale = 255 / alpha;
    data[index] = Math.min(255, data[index] * scale);
    data[index + 1] = Math.min(255, data[index + 1] * scale);
    data[index + 2] = Math.min(255, data[index + 2] * scale);
    data[index + 3] = next >= 1 ? 255 : Math.round(next * 255);
  }
}

function sampleBounds(list: Sample[], width: number, height: number) {
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (const sample of list) {
    const reach = 22 + Math.hypot(sample.dx, sample.dy) + 24;
    minX = Math.min(minX, sample.x - reach);
    minY = Math.min(minY, sample.y - reach);
    maxX = Math.max(maxX, sample.x + reach);
    maxY = Math.max(maxY, sample.y + reach);
  }
  const x = Math.max(0, Math.floor(minX));
  const y = Math.max(0, Math.floor(minY));
  const right = Math.min(width, Math.ceil(maxX));
  const bottom = Math.min(height, Math.ceil(maxY));
  if (right - x < 1 || bottom - y < 1) return null;
  return { x, y, width: right - x, height: bottom - y };
}

class CardSwipe {
  private readonly samples: Sample[] = [];
  private committed: Point | null = null;
  private head: Point | null = null;
  private tip: Sample | null = null;
  private pointer: Point | null = null;
  private velocity = { x: 0, y: 0 };
  private frame = 0;
  private lastMove = 0;
  private released = false;
  private coastLeft = 0;
  private readonly buffer: HTMLCanvasElement;
  private readonly soft: HTMLCanvasElement;
  private readonly bufferContext: CanvasRenderingContext2D;
  private readonly softContext: CanvasRenderingContext2D;
  private readonly useFilter: boolean;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly context: CanvasRenderingContext2D,
    useFilter: boolean,
  ) {
    this.useFilter = useFilter;
    this.buffer = document.createElement("canvas");
    this.soft = document.createElement("canvas");
    const bufferContext = this.buffer.getContext("2d", { willReadFrequently: !useFilter });
    const softContext = this.soft.getContext("2d");
    if (!bufferContext || !softContext) throw new Error("Canvas unavailable");
    this.bufferContext = bufferContext;
    this.softContext = softContext;
  }

  track(x: number, y: number, now: number) {
    if (this.pointer && this.lastMove > 0) {
      const dt = Math.max(now - this.lastMove, 8);
      const vx = ((x - this.pointer.x) / dt) * 1000;
      const vy = ((y - this.pointer.y) / dt) * 1000;
      this.velocity = { x: this.velocity.x * 0.35 + vx * 0.65, y: this.velocity.y * 0.35 + vy * 0.65 };
    }
    this.pointer = { x, y };
    if (this.coastLeft > 0) {
      this.samples.length = 0;
      this.committed = null;
      this.head = null;
      this.tip = null;
    }
    this.lastMove = now;
    this.released = false;
    this.coastLeft = 0;
    this.extendTo(x, y, now);
    if (!this.frame) this.frame = requestAnimationFrame(this.step);
  }

  stop() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  private pushSample(point: Point, time: number, dx = 0, dy = 0) {
    this.samples.push({ x: point.x, y: point.y, time, dx, dy });
  }

  private placeTip(x: number, y: number, time: number, dx: number, dy: number, fresh: boolean) {
    if (fresh || !this.tip) {
      this.tip = { x, y, time, dx, dy };
      return;
    }
    this.tip.x = x;
    this.tip.y = y;
    this.tip.dx = dx;
    this.tip.dy = dy;
  }

  private extendTo(x: number, y: number, now: number) {
    if (!this.committed) {
      this.committed = { x, y };
      this.head = { x, y };
      this.pushSample(this.committed, now);
      this.tip = null;
      return;
    }
    const dx = x - this.committed.x;
    const dy = y - this.committed.y;
    const dist = Math.hypot(dx, dy);
    this.head = { x, y };
    if (dist < 0.5) return;
    const ux = dx / dist;
    const uy = dy / dist;
    const smear = Math.min(28, Math.max(0, dist - 14) * 0.35);
    if (dist < SAMPLE_GAP) {
      this.placeTip(x, y, now, ux * smear, uy * smear, false);
      return;
    }
    let left = dist;
    let inherited = false;
    while (left >= SAMPLE_GAP) {
      this.committed.x += ux * SAMPLE_GAP;
      this.committed.y += uy * SAMPLE_GAP;
      const birth = !inherited && this.tip ? this.tip.time : now;
      inherited = true;
      this.pushSample(this.committed, birth, ux * smear, uy * smear);
      left -= SAMPLE_GAP;
    }
    if (left < 0.5) {
      this.tip = null;
      return;
    }
    this.placeTip(x, y, now, ux * smear, uy * smear, true);
  }

  private expire(now: number) {
    let index = 0;
    while (index < this.samples.length && now - this.samples[index].time > LIFE) index += 1;
    if (index > 0) this.samples.splice(0, index);
    if (this.tip && now - this.tip.time > LIFE) this.tip = null;
  }

  private drawDiscs(target: CanvasRenderingContext2D, now: number, list: Sample[]) {
    const last = Math.max(list.length - 1, 1);
    for (let index = 0; index < list.length; index += 1) {
      const sample = list[index];
      const fade = Math.max(0, 1 - (now - sample.time) / LIFE);
      const along = index / last;
      const radius = 14 + 8 * along;
      const stretch = Math.hypot(sample.dx, sample.dy);
      target.save();
      target.translate(sample.x, sample.y);
      if (stretch > 1) target.rotate(Math.atan2(sample.dy, sample.dx));
      target.scale((radius + stretch) / radius, 1);
      target.globalAlpha = (0.7 + 0.3 * along) * fade;
      target.fillStyle = SWIPE;
      target.beginPath();
      target.arc(0, 0, radius, 0, Math.PI * 2);
      target.fill();
      target.restore();
    }
    target.globalAlpha = 1;
  }

  private fit() {
    const card = this.canvas.parentElement;
    if (!card) return { width: 1, height: 1 };
    const width = Math.max(1, card.clientWidth);
    const height = Math.max(1, card.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const nextWidth = Math.floor(width * dpr);
    const nextHeight = Math.floor(height * dpr);
    if (this.canvas.width !== nextWidth || this.canvas.height !== nextHeight) {
      this.canvas.width = nextWidth;
      this.canvas.height = nextHeight;
    }
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.buffer.width !== width || this.buffer.height !== height) {
      this.buffer.width = width;
      this.buffer.height = height;
      this.soft.width = width;
      this.soft.height = height;
    }
    return { width, height };
  }

  private paint(now: number) {
    this.expire(now);
    const list = this.tip ? [...this.samples, this.tip] : this.samples;
    const { width, height } = this.fit();
    this.context.clearRect(0, 0, width, height);
    if (list.length === 0) return;
    this.bufferContext.setTransform(1, 0, 0, 1, 0, 0);
    this.bufferContext.clearRect(0, 0, this.buffer.width, this.buffer.height);
    this.drawDiscs(this.bufferContext, now, list);
    this.softContext.setTransform(1, 0, 0, 1, 0, 0);
    this.softContext.clearRect(0, 0, this.soft.width, this.soft.height);
    if (this.useFilter) {
      this.softContext.filter = GOO_FILTER;
      this.softContext.drawImage(this.buffer, 0, 0);
      this.softContext.filter = "none";
    } else {
      const box = sampleBounds(list, this.buffer.width, this.buffer.height);
      if (!box) return;
      const image = this.bufferContext.getImageData(box.x, box.y, box.width, box.height);
      melt(image);
      this.softContext.putImageData(image, box.x, box.y);
    }
    this.context.save();
    this.context.filter = "blur(18px)";
    this.context.globalAlpha = 0.7;
    this.context.drawImage(this.soft, 0, 0, width, height);
    this.context.restore();
    this.context.globalAlpha = 0.92;
    this.context.drawImage(this.soft, 0, 0, width, height);
    this.context.globalAlpha = 1;
  }

  private release() {
    this.released = true;
    const speed = Math.hypot(this.velocity.x, this.velocity.y);
    const extra = Math.min(COAST_CAP, speed * 0.045);
    this.coastLeft = speed > 80 && extra >= 4 ? extra : 0;
  }

  private step = (now: number) => {
    if (!this.canvas.isConnected) {
      this.stop();
      return;
    }
    if (!this.released && this.lastMove > 0 && now - this.lastMove > STOP_MS) this.release();
    if (this.coastLeft > 0 && this.head) {
      const speed = Math.hypot(this.velocity.x, this.velocity.y) || 1;
      const move = Math.min(this.coastLeft, Math.max(1.2, this.coastLeft * 0.2));
      this.extendTo(this.head.x + (this.velocity.x / speed) * move, this.head.y + (this.velocity.y / speed) * move, now);
      this.coastLeft -= move;
    }
    this.paint(now);
    const moving = this.coastLeft > 0 || (this.lastMove > 0 && now - this.lastMove <= STOP_MS);
    if (moving || this.samples.length > 0 || this.tip) {
      this.frame = requestAnimationFrame(this.step);
      return;
    }
    const { width, height } = this.fit();
    this.context.clearRect(0, 0, width, height);
    this.frame = 0;
  };
}

function cardFor(target: EventTarget | null, root: HTMLElement) {
  if (!(target instanceof Element)) return null;
  const spot = target.closest("[data-spot]");
  const tilt = (spot ?? target).closest("[data-tilt]");
  const card = tilt ?? spot;
  if (!(card instanceof HTMLElement) || !root.contains(card)) return null;
  return card;
}

function ensureCanvas(card: HTMLElement) {
  const existing = card.querySelector(":scope > canvas[data-swipe]");
  if (existing instanceof HTMLCanvasElement) return existing;
  const canvas = document.createElement("canvas");
  canvas.dataset.swipe = "";
  canvas.setAttribute("aria-hidden", "true");
  card.prepend(canvas);
  return canvas;
}

function ensureFilter(root: HTMLElement) {
  if (document.getElementById(FILTER_ID)) return;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.style.position = "absolute";
  svg.style.width = "0";
  svg.style.height = "0";
  svg.innerHTML = `<filter id="${FILTER_ID}" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" /><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" /></filter>`;
  root.prepend(svg);
}

export function mountPointerSwipe(root: HTMLElement) {
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (!fine.matches) return () => {};
  ensureFilter(root);
  const useFilter = filterWritesPixels(GOO_FILTER);
  const swipes = new Map<HTMLElement, CardSwipe>();

  let active: HTMLElement | null = null;
  const probes: Array<[number, number]> = [
    [16, 0],
    [-16, 0],
    [0, 16],
    [0, -16],
    [16, 16],
    [16, -16],
    [-16, 16],
    [-16, -16],
  ];
  const cardAt = (x: number, y: number) => {
    const node = document.elementFromPoint(x, y);
    return cardFor(node, root);
  };

  function onMove(event: PointerEvent) {
    if (motionReduced() || event.pointerType === "touch") return;
    const direct = cardAt(event.clientX, event.clientY);
    const card =
      direct ??
      (active && probes.some(([dx, dy]) => cardAt(event.clientX + dx, event.clientY + dy) === active)
        ? active
        : probes.reduce<HTMLElement | null>((found, [dx, dy]) => found ?? cardAt(event.clientX + dx, event.clientY + dy), null));
    active = card;
    if (!card) return;
    const canvas = ensureCanvas(card);
    const context = canvas.getContext("2d");
    if (!context) return;
    let swipe = swipes.get(card);
    if (!swipe) {
      swipe = new CardSwipe(canvas, context, useFilter);
      swipes.set(card, swipe);
    }
    const box = card.getBoundingClientRect();
    const points = event.getCoalescedEvents?.() ?? [];
    const batch = points.length > 0 ? points : [event];
    for (const point of batch) {
      const local = pointerLayout(point.clientX, point.clientY);
      swipe.track(local.x - box.left, local.y - box.top, point.timeStamp);
    }
  }

  window.addEventListener("pointermove", onMove);
  return () => {
    window.removeEventListener("pointermove", onMove);
    swipes.forEach((swipe) => swipe.stop());
    swipes.clear();
  };
}
