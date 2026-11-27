/** Two-line menu mark (Lavanda `IconMenu` — minimal =). */
export function MenuEqualsIcon() {
  return (
    <svg
      className="adminIcon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M5 9h14" />
      <path d="M5 15h14" />
    </svg>
  );
}

/** Ionicons trash-outline (MIT) — rail delete drop target. */
export function TrashIcon() {
  return (
    <svg
      className="adminIcon"
      viewBox="0 0 512 512"
      fill="none"
      stroke="currentColor"
      strokeWidth="32"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M112 112l20 320c1.1 17.4 14.9 32 32.2 32h183.6c17.3 0 31.1-14.6 32.2-32l20-320" />
      <path d="M80 112h352" />
      <path d="M192 112V72h128v40M200 208v160M256 208v160M312 208v160" />
    </svg>
  );
}

/** Ionicons remove-outline — second-step remove confirm. */
export function RemoveIcon() {
  return (
    <svg
      className="adminIcon"
      viewBox="0 0 512 512"
      fill="none"
      stroke="currentColor"
      strokeWidth="32"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M400 256H112" />
    </svg>
  );
}

/** Instagram-style create marks: filled post square with a + cutout (bg shows through). */

export function AddPostIcon() {
  return (
    <svg className="adminIcon" viewBox="0 0 24 24" aria-hidden="true">
      {/* Full-bleed square (matches rail thumbs) + plus hole via evenodd. */}
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.67 0H17.33A6.67 6.67 0 0 1 24 6.67V17.33A6.67 6.67 0 0 1 17.33 24H6.67A6.67 6.67 0 0 1 0 17.33V6.67A6.67 6.67 0 0 1 6.67 0ZM12 6.5a1.1 1.1 0 0 1 1.1 1.1v2.3h2.3a1.1 1.1 0 1 1 0 2.2h-2.3v2.3a1.1 1.1 0 1 1-2.2 0v-2.3h-2.3a1.1 1.1 0 1 1 0-2.2h2.3v-2.3A1.1 1.1 0 0 1 12 6.5Z"
      />
    </svg>
  );
}

export function AddReelIcon() {
  return (
    <svg className="adminIcon" viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="4.25"
        y="3.25"
        width="15.5"
        height="17.5"
        rx="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M4.25 7.5h15.5M8 3.25v4.25M16 3.25v4.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 10.25v5.5M9.25 13h5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
