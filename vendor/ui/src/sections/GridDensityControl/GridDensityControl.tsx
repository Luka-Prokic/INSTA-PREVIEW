import { cn } from "../../utils/cn";
import styles from "./GridDensityControl.module.css";

export const GRID_DENSITY_PRESETS = [1, 3, 9] as const;

export type GridDensity = (typeof GRID_DENSITY_PRESETS)[number];

export type GridDensityControlProps = {
  value: GridDensity | number;
  onChange: (cols: GridDensity) => void;
  presets?: readonly GridDensity[];
  suffix?: string;
  /**
   * `header` - full presets on desktop, compact select on tablet.
   * `toolbar` - compact select for phone toolbars.
   * `inline` - always show full presets (playground demos).
   */
  placement?: "header" | "toolbar" | "inline";
  className?: string;
  "aria-label"?: string;
};

/** Preset switch (1 / 3 / 9) for archive layout density. */
export function GridDensityControl({
  value,
  onChange,
  presets = GRID_DENSITY_PRESETS,
  suffix = "per row",
  placement = "inline",
  className,
  "aria-label": ariaLabel = "Grid density",
}: GridDensityControlProps) {
  const select = (
    <label className={styles.compactSelect}>
      <span className={styles.visuallyHidden}>{ariaLabel}</span>
      <span className={styles.compactValue} aria-hidden>
        {value}
      </span>
      <select
        value={value}
        onChange={(event) =>
          onChange(Number.parseInt(event.target.value, 10) as GridDensity)
        }
        className={styles.selectOverlay}
        aria-label={ariaLabel}
      >
        {presets.map((preset) => (
          <option key={preset} value={preset}>
            {preset} {suffix}
          </option>
        ))}
      </select>
      <svg
        className={styles.chevron}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <path
          d="M6 9l6 6 6-6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </label>
  );

  return (
    <div className={cn(styles.control, className)} data-placement={placement}>
      <div className={styles.desktopPresets} role="group" aria-label={ariaLabel}>
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            aria-pressed={preset === value}
            className={styles.preset}
          >
            {preset}
          </button>
        ))}
        {suffix ? <span className={styles.suffix}>{suffix}</span> : null}
      </div>
      {select}
    </div>
  );
}
