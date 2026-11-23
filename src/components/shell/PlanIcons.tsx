/** Instagram-style create marks: post square / reel frame with a centered +. */

export function AddPostIcon() {
  return (
    <svg className="adminIcon" viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="3.25"
        y="3.25"
        width="17.5"
        height="17.5"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M12 8.25v7.5M8.25 12h7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
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
