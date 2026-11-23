"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { ImageRef } from "@/features/import/types";
import { resolveImageUrl } from "@/features/planner/persistence";

export function SharedImage({
  image,
  alt,
  className,
  style,
}: {
  image: ImageRef | undefined;
  alt: string;
  className?: string;
  style?: CSSProperties;
}) {
  const [src, setSrc] = useState<string | null>(image?.kind === "remote" ? image.url : null);

  useEffect(() => {
    let alive = true;
    if (!image) {
      setSrc(null);
      return;
    }
    if (image.kind === "remote") {
      setSrc(image.url);
      return;
    }
    void resolveImageUrl(image).then((url) => {
      if (alive) setSrc(url);
    });
    return () => {
      alive = false;
    };
  }, [image]);

  if (!src) return <div className={className} style={{ background: "#efefef", ...style }} aria-hidden />;
  return <img src={src} alt={alt} className={className} style={style} draggable={false} />;
}
