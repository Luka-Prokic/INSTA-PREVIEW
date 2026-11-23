/** Nearest scrollport for an element (nested overflow or window). */
export function getScrollParent(el: Element | null): HTMLElement | Window {
  if (!el) return window;

  const marked = el.closest("[data-caka-scroll-root], [data-scroll-root]");
  if (marked instanceof HTMLElement) {
    const { overflowY, overflow } = getComputedStyle(marked);
    if (/(auto|scroll|overlay)/.test(`${overflowY}${overflow}`)) {
      return marked;
    }
  }

  let node: HTMLElement | null = el.parentElement;
  while (node && node !== document.documentElement) {
    const { overflowY, overflow } = getComputedStyle(node);
    if (/(auto|scroll|overlay)/.test(`${overflowY}${overflow}`)) {
      return node;
    }
    node = node.parentElement;
  }
  return window;
}

/** IntersectionObserver root - nested scrollport, or null for the viewport. */
export function getIntersectRoot(el: Element | null): Element | null {
  const scroller = getScrollParent(el);
  return scroller instanceof Window ? null : scroller;
}

export function getScrollPort(scroller: HTMLElement | Window): { top: number; height: number } {
  if (scroller instanceof Window) {
    return { top: 0, height: window.innerHeight || 1 };
  }
  const rect = scroller.getBoundingClientRect();
  return { top: rect.top, height: scroller.clientHeight || 1 };
}

export function getScrollerScrollMetrics(scroller: HTMLElement | Window): {
  scrollTop: number;
  max: number;
} {
  if (scroller instanceof Window) {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    return { scrollTop: doc.scrollTop || window.scrollY || 0, max };
  }
  return {
    scrollTop: scroller.scrollTop,
    max: scroller.scrollHeight - scroller.clientHeight,
  };
}
