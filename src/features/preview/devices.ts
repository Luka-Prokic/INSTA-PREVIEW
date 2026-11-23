/**
 * iPhone catalog — logical screen points from Apple + body mm from Apple tech specs.
 * Chassis bezels are derived so the outer silhouette matches the real body aspect ratio.
 */

export type PhoneFace = "island" | "notch" | "home";

export type PhoneModelId =
  | "iphone-se-3"
  | "iphone-13-mini"
  | "iphone-14"
  | "iphone-15"
  | "iphone-15-pro-max"
  | "iphone-16-pro"
  | "iphone-16-pro-max";

export type PhoneScaleMode = "actual" | "fill";

type PhoneModelInput = {
  id: PhoneModelId;
  name: string;
  sizeLabel: string;
  /** Logical CSS points @1x */
  screenW: number;
  screenH: number;
  /** Marketing display diagonal (inches) — used to size the active panel */
  diagonalIn: number;
  /** Apple body width / height (mm) */
  bodyWmm: number;
  bodyHmm: number;
  face: PhoneFace;
  statusBarH: number;
  island?: { width: number; height: number; top: number };
  notch?: { width: number; height: number };
  homeIndicator: boolean;
  homeButton?: boolean;
  /**
   * Vertical bezel split for home-button phones (forehead : chin).
   * Defaults to equal top/bottom on modern all-screen models.
   */
  chinShare?: number;
  /** Approximate body corner radius as a fraction of body width */
  cornerFrac?: number;
  buttons: {
    silent?: number;
    volumeUp: number;
    volumeDown: number;
    power: number;
  };
};

export type PhoneModel = PhoneModelInput & {
  /** Flat side bezel (CSS px around the logical screen) */
  bezel: number;
  /** Top forehead (CSS px) */
  forehead: number;
  /** Bottom chin (CSS px) */
  chin: number;
  bodyRadius: number;
  screenRadius: number;
};

/** CSS reference px/mm (96dpi). */
export const CSS_PX_PER_MM = 96 / 25.4;

/**
 * Known panels: native px + diagonal inches.
 * Physical width is derived from diagonal × aspect (same math as the phone bodies).
 */
const KNOWN_PANELS: readonly { w: number; h: number; inches: number }[] = [
  { w: 3024, h: 1964, inches: 14.2 }, // MacBook Pro 14"
  { w: 3456, h: 2234, inches: 16.2 }, // MacBook Pro 16"
  { w: 2560, h: 1664, inches: 13.6 }, // MacBook Air 13" M2/M3
  { w: 2880, h: 1864, inches: 15.3 }, // MacBook Air 15"
  { w: 2560, h: 1600, inches: 13.3 }, // MacBook Pro 13"
  { w: 3072, h: 1920, inches: 16.0 }, // MacBook Pro 16" (2019)
  { w: 2880, h: 1800, inches: 15.4 }, // MacBook Pro 15" (older)
  { w: 4480, h: 2520, inches: 23.5 }, // iMac 24"
  { w: 5120, h: 2880, inches: 27.0 }, // Studio Display
  { w: 6016, h: 3384, inches: 32.0 }, // Pro Display XDR
];

/** Typical Retina laptop CSS px/in — safe default when the panel isn't recognized. */
const DEFAULT_LIFE_CSS_PX_PER_IN = 126;

function panelWidthMm(panel: { w: number; h: number; inches: number }): number {
  const diagMm = panel.inches * 25.4;
  const aspect = panel.w / panel.h;
  return diagMm / Math.sqrt(1 + 1 / (aspect * aspect));
}

/**
 * CSS px per physical mm for life-size “Real”.
 * Matches `screen` CSS size to a known panel at common scale factors (Default /
 * More Space), then uses cssWidth / physicalWidthMm — never the inflated 180dpi
 * fallback that made phones larger than life.
 */
export function lifeSizeCssPxPerMm(): number {
  if (typeof window === "undefined") return DEFAULT_LIFE_CSS_PX_PER_IN / 25.4;

  const cssW = window.screen.width;
  const cssH = window.screen.height;
  const dpr = window.devicePixelRatio || 1;
  const scales = Array.from(new Set([dpr, 2, 1.68, 1.5, 1.25, 3].filter((s) => s > 0)));

  let best: { panel: (typeof KNOWN_PANELS)[number]; err: number; cssW: number } | null = null;

  for (const panel of KNOWN_PANELS) {
    for (const scale of scales) {
      if (!(scale > 0)) continue;
      const expectedW = panel.w / scale;
      const expectedH = panel.h / scale;
      const err = Math.hypot(cssW - expectedW, cssH - expectedH);
      const errRot = Math.hypot(cssW - expectedH, cssH - expectedW);
      const e = Math.min(err, errRot);
      if (!best || e < best.err) best = { panel, err: e, cssW: err <= errRot ? cssW : cssH };
    }
    // Also match raw native px in case dpr is honest
    const nativeW = Math.round(cssW * dpr);
    const nativeH = Math.round(cssH * dpr);
    const nativeErr = Math.min(
      Math.hypot(nativeW - panel.w, nativeH - panel.h),
      Math.hypot(nativeW - panel.h, nativeH - panel.w),
    );
    if (!best || nativeErr < best.err) {
      best = { panel, err: nativeErr, cssW };
    }
  }

  // ~80 CSS px tolerance covers rounding across scaled modes
  if (best && best.err <= 80) {
    const widthMm = panelWidthMm(best.panel);
    const pxPerMm = best.cssW / widthMm;
    if (Number.isFinite(pxPerMm) && pxPerMm > 2 && pxPerMm < 12) return pxPerMm;
  }

  return DEFAULT_LIFE_CSS_PX_PER_IN / 25.4;
}

/** @deprecated Prefer lifeSizeCssPxPerMm(). */
export const LIFE_SIZE_CSS_PX_PER_MM = DEFAULT_LIFE_CSS_PX_PER_IN / 25.4;

function screenPanelMm(diagonalIn: number, screenW: number, screenH: number) {
  const diagMm = diagonalIn * 25.4;
  const aspect = screenH / screenW;
  const wMm = diagMm / Math.sqrt(1 + aspect * aspect);
  return { wMm, hMm: wMm * aspect };
}

function buildModel(input: PhoneModelInput): PhoneModel {
  const { wMm, hMm } = screenPanelMm(input.diagonalIn, input.screenW, input.screenH);
  const pxPerMm = input.screenW / wMm;

  const sideMm = Math.max(0, (input.bodyWmm - wMm) / 2);
  const vertMm = Math.max(0, input.bodyHmm - hMm);
  const chinShare = input.chinShare ?? 0.5;
  const bezel = Math.round(sideMm * pxPerMm);
  const forehead = Math.round(vertMm * (1 - chinShare) * pxPerMm);
  const chin = Math.round(vertMm * chinShare * pxPerMm);

  const cornerFrac = input.cornerFrac ?? (input.face === "home" ? 0.145 : 0.168);
  const bodyRadius = Math.round(input.bodyWmm * cornerFrac * pxPerMm);
  const screenRadius =
    input.face === "home" ? 2 : Math.max(0, bodyRadius - Math.round(bezel * 0.85));

  // Button Y positions as fractions of body height → CSS px on chassis
  const bodyHpx = input.screenH + forehead + chin;
  const mapY = (frac: number) => Math.round(bodyHpx * frac);

  return {
    ...input,
    bezel,
    forehead,
    chin,
    bodyRadius,
    screenRadius,
    buttons: {
      silent: input.buttons.silent != null ? mapY(input.buttons.silent) : undefined,
      volumeUp: mapY(input.buttons.volumeUp),
      volumeDown: mapY(input.buttons.volumeDown),
      power: mapY(input.buttons.power),
    },
  };
}

/**
 * Button values here are fractions of body height (0–1), converted in buildModel.
 * Specs: Apple Support + iosref logical resolutions.
 */
const PHONE_INPUTS: readonly PhoneModelInput[] = [
  {
    id: "iphone-se-3",
    name: "iPhone SE",
    sizeLabel: "4.7\"",
    screenW: 375,
    screenH: 667,
    diagonalIn: 4.7,
    bodyWmm: 67.3,
    bodyHmm: 138.4,
    face: "home",
    statusBarH: 20,
    homeIndicator: false,
    homeButton: true,
    chinShare: 0.62,
    cornerFrac: 0.14,
    buttons: { silent: 0.14, volumeUp: 0.22, volumeDown: 0.32, power: 0.28 },
  },
  {
    id: "iphone-13-mini",
    name: "iPhone 13 mini",
    sizeLabel: "5.4\"",
    screenW: 375,
    screenH: 812,
    diagonalIn: 5.4,
    bodyWmm: 64.2,
    bodyHmm: 131.5,
    face: "notch",
    statusBarH: 50,
    notch: { width: 164, height: 34 },
    homeIndicator: true,
    cornerFrac: 0.17,
    buttons: { silent: 0.145, volumeUp: 0.21, volumeDown: 0.3, power: 0.255 },
  },
  {
    id: "iphone-14",
    name: "iPhone 14",
    sizeLabel: "6.1\"",
    screenW: 390,
    screenH: 844,
    diagonalIn: 6.1,
    bodyWmm: 71.5,
    bodyHmm: 146.7,
    face: "notch",
    statusBarH: 47,
    notch: { width: 156, height: 33 },
    homeIndicator: true,
    cornerFrac: 0.168,
    buttons: { silent: 0.145, volumeUp: 0.21, volumeDown: 0.3, power: 0.255 },
  },
  {
    id: "iphone-15",
    name: "iPhone 15",
    sizeLabel: "6.1\"",
    screenW: 393,
    screenH: 852,
    diagonalIn: 6.1,
    bodyWmm: 71.6,
    bodyHmm: 147.6,
    face: "island",
    statusBarH: 59,
    island: { width: 126, height: 37, top: 11 },
    homeIndicator: true,
    cornerFrac: 0.168,
    buttons: { silent: 0.15, volumeUp: 0.215, volumeDown: 0.305, power: 0.26 },
  },
  {
    id: "iphone-15-pro-max",
    name: "iPhone 15 Pro Max",
    sizeLabel: "6.7\"",
    screenW: 430,
    screenH: 932,
    diagonalIn: 6.7,
    bodyWmm: 76.7,
    bodyHmm: 159.9,
    face: "island",
    statusBarH: 59,
    island: { width: 126, height: 37, top: 11 },
    homeIndicator: true,
    cornerFrac: 0.16,
    buttons: { silent: 0.15, volumeUp: 0.215, volumeDown: 0.305, power: 0.26 },
  },
  {
    id: "iphone-16-pro",
    name: "iPhone 16 Pro",
    sizeLabel: "6.3\"",
    screenW: 402,
    screenH: 874,
    diagonalIn: 6.3,
    bodyWmm: 71.5,
    bodyHmm: 149.6,
    face: "island",
    statusBarH: 59,
    island: { width: 126, height: 37, top: 12 },
    homeIndicator: true,
    cornerFrac: 0.17,
    buttons: { silent: 0.15, volumeUp: 0.215, volumeDown: 0.305, power: 0.26 },
  },
  {
    id: "iphone-16-pro-max",
    name: "iPhone 16 Pro Max",
    sizeLabel: "6.9\"",
    screenW: 440,
    screenH: 956,
    diagonalIn: 6.9,
    bodyWmm: 77.6,
    bodyHmm: 163.0,
    face: "island",
    statusBarH: 59,
    island: { width: 126, height: 37, top: 12 },
    homeIndicator: true,
    cornerFrac: 0.168,
    buttons: { silent: 0.15, volumeUp: 0.215, volumeDown: 0.305, power: 0.26 },
  },
];

export const PHONE_MODELS: readonly PhoneModel[] = PHONE_INPUTS.map(buildModel);

/** Newest catalog phone (sidebar / download lists). */
export const NEWEST_PHONE_MODEL_ID: PhoneModelId = "iphone-16-pro-max";

/** Phone always pinned in the carousel strip. */
export const FEATURED_PHONE_MODEL_ID: PhoneModelId = "iphone-13-mini";

/**
 * Phones always shown in the device carousel.
 * Other models stay available from the sidebar Device menu.
 */
export const CAROUSEL_PHONE_IDS: readonly PhoneModelId[] = [FEATURED_PHONE_MODEL_ID];

export const DEFAULT_PHONE_MODEL_ID: PhoneModelId = FEATURED_PHONE_MODEL_ID;
export const DEFAULT_PHONE_SCALE_MODE: PhoneScaleMode = "actual";

export function isCarouselPhoneId(id: PhoneModelId): boolean {
  return CAROUSEL_PHONE_IDS.includes(id);
}

const LEGACY_PHONE_IDS: Record<string, PhoneModelId> = {
  "iphone-13": "iphone-14",
  "iphone-15-pro": "iphone-15",
};

export function getPhoneModel(id: PhoneModelId | string | null | undefined): PhoneModel {
  const resolved = (id && LEGACY_PHONE_IDS[id]) || id;
  return (
    PHONE_MODELS.find((m) => m.id === resolved) ??
    PHONE_MODELS.find((m) => m.id === DEFAULT_PHONE_MODEL_ID)!
  );
}

export function isPhoneModelId(v: string): v is PhoneModelId {
  return PHONE_MODELS.some((m) => m.id === v) || v in LEGACY_PHONE_IDS;
}

export function isPhoneScaleMode(v: string): v is PhoneScaleMode {
  return v === "actual" || v === "fill";
}

/** Chassis outer box in CSS px (logical screen + derived bezels). */
export function phoneOuterSize(model: PhoneModel): { width: number; height: number } {
  return {
    width: model.screenW + model.bezel * 2,
    height: model.screenH + model.forehead + model.chin,
  };
}

/** Scale that draws the chassis at real-world body width on the current display. */
export function phoneActualScale(model: PhoneModel): number {
  const outer = phoneOuterSize(model);
  const targetW = model.bodyWmm * lifeSizeCssPxPerMm();
  const next = targetW / outer.width;
  return Number.isFinite(next) && next > 0 ? next : 1;
}
