import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
  /** Selected tab uses filled glyphs; idle uses outline */
  filled?: boolean;
};

function svg({ size = 24, filled: _filled, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    ...rest,
  };
}

function igGlyph(
  { size = 24, filled: _filled, ...rest }: IconProps,
  children: ReactNode,
) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Instagram profile Posts tab — 9 rounded tiles (fill) / hollow cells (outline) */
export function GridIcon(props: IconProps) {
  if (props.filled) {
    return igGlyph(
      props,
      <>
        <rect height="6" rx="1" ry="1" width="4.667" x="3" y="1" />
        <rect height="6" rx="1" ry="1" width="4.667" x="9.667" y="1" />
        <rect height="6" rx="1" ry="1" width="4.667" x="16.333" y="1" />
        <rect height="6" rx="1" ry="1" width="4.667" x="3" y="9" />
        <rect height="6" rx="1" ry="1" width="4.667" x="9.667" y="9" />
        <rect height="6" rx="1" ry="1" width="4.667" x="16.333" y="9" />
        <rect height="6" rx="1" ry="1" width="4.667" x="3" y="17" />
        <rect height="6" rx="1" ry="1" width="4.667" x="9.667" y="17" />
        <rect height="6" rx="1" ry="1" width="4.667" x="16.333" y="17" />
      </>,
    );
  }
  return igGlyph(
    props,
    <path d="M20 1H4a1 1 0 0 0-1 1v20a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1Zm-9.654 13.32V9.68h3.307v4.64h-3.307Zm3.307 2V21h-3.307v-4.68h3.307ZM5 9.68h3.346v4.64H5V9.68Zm5.346-2V3h3.307v4.68h-3.307Zm5.307 2H19v4.64h-3.347V9.68Zm3.347-2h-3.347V3H19v4.68ZM8.346 3v4.68H5V3h3.346ZM5 16.32h3.346V21H5v-4.68ZM15.653 21v-4.68H19V21h-3.347Z" />,
  );
}

/** Instagram profile Reels tab — rounded square + play */
export function ReelsIcon(props: IconProps) {
  if (props.filled) {
    return igGlyph(
      props,
      <path d="M22.942 7.464c-.062-1.36-.306-2.143-.511-2.671a5.366 5.366 0 0 0-1.272-1.952 5.364 5.364 0 0 0-1.951-1.27c-.53-.207-1.312-.45-2.673-.513-1.2-.054-1.557-.066-4.535-.066s-3.336.012-4.536.066c-1.36.062-2.143.306-2.672.511-.769.3-1.371.692-1.951 1.272s-.973 1.182-1.27 1.951c-.207.53-.45 1.312-.513 2.673C1.004 8.665.992 9.022.992 12s.012 3.336.066 4.536c.062 1.36.306 2.143.511 2.671.298.77.69 1.373 1.272 1.952.58.581 1.182.974 1.951 1.27.53.207 1.311.45 2.673.513 1.199.054 1.557.066 4.535.066s3.336-.012 4.536-.066c1.36-.062 2.143-.306 2.671-.511a5.368 5.368 0 0 0 1.953-1.273c.58-.58.972-1.181 1.27-1.95.206-.53.45-1.312.512-2.673.054-1.2.066-1.557.066-4.535s-.012-3.336-.066-4.536Zm-7.085 6.055-5.25 3c-1.167.667-2.619-.175-2.619-1.519V9c0-1.344 1.452-2.186 2.619-1.52l5.25 3c1.175.672 1.175 2.368 0 3.04Z" />,
    );
  }
  return igGlyph(
    props,
    <path d="M22.935 7.468c-.063-1.36-.307-2.142-.512-2.67a5.341 5.341 0 0 0-1.27-1.95 5.345 5.345 0 0 0-1.95-1.27c-.53-.206-1.311-.45-2.672-.513C15.333 1.012 14.976 1 12 1s-3.333.012-4.532.065c-1.36.063-2.142.307-2.67.512-.77.298-1.371.69-1.95 1.27a5.36 5.36 0 0 0-1.27 1.95c-.206.53-.45 1.311-.513 2.672C1.012 8.667 1 9.024 1 12s.012 3.333.065 4.532c.063 1.36.307 2.142.512 2.67.297.77.69 1.372 1.27 1.95.58.581 1.181.974 1.95 1.27.53.206 1.311.45 2.672.513C8.667 22.988 9.024 23 12 23s3.333-.012 4.532-.065c1.36-.063 2.142-.307 2.67-.512a5.33 5.33 0 0 0 1.95-1.27 5.356 5.356 0 0 0 1.27-1.95c.206-.53.45-1.311.513-2.672.053-1.198.065-1.555.065-4.531s-.012-3.333-.065-4.532Zm-1.998 8.972c-.05 1.07-.228 1.652-.38 2.04-.197.51-.434.874-.82 1.258a3.362 3.362 0 0 1-1.258.82c-.387.151-.97.33-2.038.379-1.162.052-1.51.063-4.441.063s-3.28-.01-4.44-.063c-1.07-.05-1.652-.228-2.04-.38a3.354 3.354 0 0 1-1.258-.82 3.362 3.362 0 0 1-.82-1.258c-.151-.387-.33-.97-.379-2.038C3.011 15.28 3 14.931 3 12s.01-3.28.063-4.44c.05-1.07.228-1.652.38-2.04.197-.51.434-.875.82-1.26a3.372 3.372 0 0 1 1.258-.819c.387-.15.97-.329 2.038-.378C8.72 3.011 9.069 3 12 3s3.28.01 4.44.063c1.07.05 1.652.228 2.04.38.51.197.874.433 1.258.82.385.382.622.747.82 1.258.151.387.33.97.379 2.038C20.989 8.72 21 9.069 21 12s-.01 3.28-.063 4.44Zm-4.584-6.828-5.25-3a2.725 2.725 0 0 0-2.745.01A2.722 2.722 0 0 0 6.988 9v6c0 .992.512 1.88 1.37 2.379.432.25.906.376 1.38.376.468 0 .937-.123 1.365-.367l5.25-3c.868-.496 1.385-1.389 1.385-2.388s-.517-1.892-1.385-2.388Zm-.993 3.04-5.25 3a.74.74 0 0 1-.748-.003.74.74 0 0 1-.374-.649V9a.74.74 0 0 1 .374-.65.737.737 0 0 1 .748-.002l5.25 3c.341.196.378.521.378.652s-.037.456-.378.651Z" />,
  );
}

/** Instagram profile Tagged tab — person in photo frame */
export function TaggedIcon(props: IconProps) {
  if (props.filled) {
    return igGlyph(
      props,
      <path d="M12.003 7c-2.205 0-4.001 1.795-4.001 4s1.796 4 4 4c2.205 0 4-1.794 4-4s-1.795-4-4-4Zm2.549 9.45H9.447l-.221.005a4.95 4.95 0 0 0-4.688 4.323l-.023.224h14.97a4.95 4.95 0 0 0-4.711-4.547l-.222-.005Zm-1.94-15.242.095.083 1.8 1.799.07.06c.075.054.161.09.253.105l.093.007h5.259a2.818 2.818 0 0 1 2.813 2.647l.005.172v14.103a2.818 2.818 0 0 1-2.646 2.813l-.172.005H3.819c-1.5 0-2.725-1.17-2.814-2.646L1 20.184V6.081c0-1.5 1.17-2.725 2.647-2.814l.172-.005h5.258a.59.59 0 0 0 .346-.112l.07-.06 1.8-1.8a1 1 0 0 1 1.32-.082Z" />,
    );
  }
  return igGlyph(
    props,
    <>
      <path d="M21 7.48a2 2 0 0 0-2-2h-3.046a2.002 2.002 0 0 1-1.506-.683l-1.695-1.939a1 1 0 0 0-1.506 0L9.552 4.797c-.38.434-.93.682-1.506.682H5a2 2 0 0 0-2 2V19l.01.206A2 2 0 0 0 5 21h14a2 2 0 0 0 2-2V7.48ZM23 19a4 4 0 0 1-4 4H5a4 4 0 0 1-3.995-3.794L1 19V7.48a4 4 0 0 1 4-4h3.046l1.696-1.94a3 3 0 0 1 4.516 0l1.696 1.94H19a4 4 0 0 1 4 4V19Z" />
      <path d="M14.5 10.419a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Zm2 0a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM12 16.003c3.511 0 6.555 1.99 8.13 4.906a1 1 0 0 1-1.76.95c-1.248-2.31-3.64-3.857-6.37-3.857S6.878 19.55 5.63 21.86a1 1 0 0 1-1.76-.951c1.575-2.915 4.618-4.906 8.13-4.906Z" />
    </>,
  );
}

/** Instagram multi-photo (carousel) badge on grid tiles */
export function CarouselIcon(props: IconProps) {
  const { size = 16, ...rest } = props;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="currentColor"
      aria-hidden
      {...rest}
    >
      <path d="M34.8 29.7V11c0-2.9-2.3-5.2-5.2-5.2H11c-2.9 0-5.2 2.3-5.2 5.2v18.7c0 2.9 2.3 5.2 5.2 5.2h18.7c2.8-.1 5.1-2.4 5.1-5.2zM39.2 15v16.1c0 4.5-3.7 8.2-8.2 8.2H14.9c-.6 0-.9.7-.5 1.1 1 1.1 2.4 1.8 4.1 1.8h13.4c5.7 0 10.3-4.6 10.3-10.3V18.5c0-1.6-.7-3.1-1.8-4.1-.5-.4-1.2 0-1.2.6z" />
    </svg>
  );
}

/** Instagram Reels badge on posts grid tiles */
export function ReelBadgeIcon(props: IconProps) {
  const { size = 16, ...rest } = props;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      {...rest}
    >
      <path d="M22.942 7.464c-.062-1.36-.306-2.143-.511-2.671a5.366 5.366 0 0 0-1.272-1.952 5.364 5.364 0 0 0-1.951-1.27c-.53-.207-1.312-.45-2.673-.513-1.2-.054-1.557-.066-4.535-.066s-3.336.012-4.536.066c-1.36.062-2.143.306-2.672.511-.769.3-1.371.692-1.951 1.272s-.973 1.182-1.27 1.951c-.207.53-.45 1.312-.513 2.673C1.004 8.665.992 9.022.992 12s.012 3.336.066 4.536c.062 1.36.306 2.143.511 2.671.298.77.69 1.373 1.272 1.952.58.581 1.182.974 1.951 1.27.53.207 1.311.45 2.673.513 1.199.054 1.557.066 4.535.066s3.336-.012 4.536-.066c1.36-.062 2.143-.306 2.671-.511a5.368 5.368 0 0 0 1.953-1.273c.58-.58.972-1.181 1.27-1.95.206-.53.45-1.312.512-2.673.054-1.2.066-1.557.066-4.535s-.012-3.336-.066-4.536Zm-7.085 6.055-5.25 3c-1.167.667-2.619-.175-2.619-1.519V9c0-1.344 1.452-2.186 2.619-1.52l5.25 3c1.175.672 1.175 2.368 0 3.04Z" />
    </svg>
  );
}

export function PinIcon(props: IconProps) {
  const { size = 14, ...rest } = props;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      {...rest}
    >
      <path d="m22.707 7.583-6.29-6.29a1 1 0 0 0-1.414 0 5.183 5.183 0 0 0-1.543 3.593L8.172 8.79a5.161 5.161 0 0 0-4.768 1.42 1 1 0 0 0 0 1.414l3.779 3.778-5.89 5.89a1 1 0 1 0 1.414 1.414l5.89-5.89 3.778 3.779a1 1 0 0 0 1.414 0 5.174 5.174 0 0 0 1.42-4.769l3.905-5.287a5.183 5.183 0 0 0 3.593-1.543 1 1 0 0 0 0-1.414Z" />
    </svg>
  );
}

export function VerifiedBadge({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-label="Verified" role="img">
      <path
        fill="#0095F6"
        d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h6.234L14.638 40l5.36-3.094L25.358 40l3.137-5.6h6.217v-6.05L40 25.359 36.905 20 40 14.641l-5.288-3.136V5.15h-6.217L25.358 0z"
      />
      <path fill="#fff" d="m17.5 26.3-6.2-6.2 2.1-2.1 4.1 4.1 9.1-9.1 2.1 2.1z" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...svg({ size: 12, strokeWidth: 2.25, ...props })}>
      <path d="m5 8 7 7 7-7" />
    </svg>
  );
}

export function MoreIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <circle cx="12" cy="5.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path d="M4 10.8 12 4l8 6.8V20a1 1 0 0 1-1 1h-5.2v-6.2H10.2V21H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <circle cx="11" cy="11" r="6.25" />
      <path d="m16.2 16.2 4 4" />
    </svg>
  );
}

export function CreateIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path d="M12 20.2S3.8 14.8 3.8 9.7A4.1 4.1 0 0 1 12 7.2a4.1 4.1 0 0 1 8.2 2.5c0 5.1-8.2 10.5-8.2 10.5z" />
    </svg>
  );
}

export function BackIcon(props: IconProps) {
  return (
    <svg {...svg({ size: 24, strokeWidth: 2, ...props })}>
      <path d="M15.5 5 8 12.5 15.5 20" />
    </svg>
  );
}

export function NotificationsIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path d="M12 3.5a5.5 5.5 0 0 0-5.5 5.5v3.4L5 15.5h14l-1.5-3.1V9A5.5 5.5 0 0 0 12 3.5z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path d="M4.5 7h15M4.5 12h15M4.5 17h15" />
    </svg>
  );
}

export function PlayCountIcon(props: IconProps) {
  const { size = 14, ...rest } = props;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
      {...rest}
    >
      <path d="M13.126 9.949c1.5-.866 1.5-3.031 0-3.897l-6.75-3.898C4.875 1.288 3 2.371 3 4.103v7.794c0 1.732 1.875 2.815 3.375 1.949l6.75-3.897z" />
    </svg>
  );
}
