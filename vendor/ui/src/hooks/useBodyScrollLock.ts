"use client";

import { useEffect } from "react";

const LOCK_ATTR = "data-scroll-locked";

function isInsidePreviewOverlay(target: EventTarget | null): boolean {
  if (!(target instanceof Node)) return false;
  return Boolean(document.querySelector("[data-preview-overlay]")?.contains(target));
}

/** Locks document scroll while a lightbox / modal is open. */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;

    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;

    const previous = {
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      bodyOverflow: body.style.overflow,
      bodyTouchAction: body.style.touchAction,
      htmlOverflow: html.style.overflow,
      htmlTouchAction: html.style.touchAction,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    body.style.touchAction = "none";
    html.style.overflow = "hidden";
    html.style.touchAction = "none";
    html.setAttribute(LOCK_ATTR, "");

    const blockBackgroundScroll = (event: Event) => {
      if (isInsidePreviewOverlay(event.target)) return;
      event.preventDefault();
    };

    window.addEventListener("wheel", blockBackgroundScroll, { passive: false });
    window.addEventListener("touchmove", blockBackgroundScroll, { passive: false });

    return () => {
      window.removeEventListener("wheel", blockBackgroundScroll);
      window.removeEventListener("touchmove", blockBackgroundScroll);

      body.style.position = previous.bodyPosition;
      body.style.top = previous.bodyTop;
      body.style.left = previous.bodyLeft;
      body.style.right = previous.bodyRight;
      body.style.width = previous.bodyWidth;
      body.style.overflow = previous.bodyOverflow;
      body.style.touchAction = previous.bodyTouchAction;
      html.style.overflow = previous.htmlOverflow;
      html.style.touchAction = previous.htmlTouchAction;
      html.removeAttribute(LOCK_ATTR);

      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}
