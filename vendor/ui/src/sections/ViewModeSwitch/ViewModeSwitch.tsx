import { cn } from "../../utils/cn";
import styles from "./ViewModeSwitch.module.css";

export type ViewModeOption = {
  id: string;
  label: string;
};

export type ViewModeSwitchProps = {
  options?: ViewModeOption[];
  value: string;
  onChange: (id: string) => void;
  layout?: "desktop" | "mobile";
  className?: string;
  "aria-label"?: string;
};

const DEFAULT_OPTIONS: ViewModeOption[] = [
  { id: "showcase", label: "Showcase" },
  { id: "archive", label: "Archive" },
];

export function ViewModeSwitch({
  options = DEFAULT_OPTIONS,
  value,
  onChange,
  layout = "desktop",
  className,
  "aria-label": ariaLabel = "View mode",
}: ViewModeSwitchProps) {
  const isMobile = layout === "mobile";

  return (
    <div
      className={cn(
        styles.switch,
        isMobile && styles.switchMobile,
        className,
      )}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => {
            if (option.id !== value) onChange(option.id);
          }}
          aria-pressed={option.id === value}
          className={cn(styles.option, isMobile && styles.mobileAction)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
