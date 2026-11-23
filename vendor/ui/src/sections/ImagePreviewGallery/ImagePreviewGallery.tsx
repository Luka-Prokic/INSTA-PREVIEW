"use client";


import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { useAxisLockedScroll } from "../../hooks/useAxisLockedScroll";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { createPortal } from "react-dom";
import { Image } from "../../primitives/Image";
import { getCollectionPortalRoot } from "../../utils/portal";
import { cn } from "../../utils/cn";
import {
  PreviewZoomImage,
  touchPinchDistance,
  type PreviewZoomImageHandle,
} from "./PreviewZoomImage";
import styles from "./ImagePreviewGallery.module.css";

export type PreviewImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type GalleryInsert = {
  key: string;
  ariaLabel: string;
  content: ReactNode;
};

type SlideItem =
  | { kind: "image"; image: PreviewImage; sourceIndex: number }
  | { kind: "insert"; item: GalleryInsert };

function buildSlideItems(
  images: PreviewImage[],
  inserts?: { at: number; item: GalleryInsert }[],
): SlideItem[] {
  const items: SlideItem[] = images.map((image, sourceIndex) => ({
    kind: "image",
    image,
    sourceIndex,
  }));

  if (!inserts?.length) return items;

  const sorted = [...inserts].sort((a, b) => b.at - a.at);
  for (const { at, item } of sorted) {
    const index = Math.max(0, Math.min(at, items.length));
    items.splice(index, 0, { kind: "insert", item });
  }

  return items;
}

function indexFromScrollStrip(strip: HTMLElement): number {
  const slides = strip.querySelectorAll<HTMLElement>("[data-scroll-slide]");
  if (slides.length === 0) return 0;

  const center = strip.scrollLeft + strip.clientWidth / 2;
  let closest = 0;
  let minDistance = Number.POSITIVE_INFINITY;

  slides.forEach((slide, slideIndex) => {
    const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
    const distance = Math.abs(slideCenter - center);
    if (distance < minDistance) {
      minDistance = distance;
      closest = slideIndex;
    }
  });

  return closest;
}

function scrollStripToIndex(
  strip: HTMLElement,
  slideIndex: number,
  behavior: ScrollBehavior = "auto",
): void {
  const slide = strip.querySelectorAll<HTMLElement>("[data-scroll-slide]")[
    slideIndex
  ];
  if (!slide) return;
  strip.scrollTo({ left: slide.offsetLeft, behavior });
}

export function ImagePreviewGallery({
  images,
  closeLabel,
  previousLabel,
  nextLabel,
  imageClassName,
  sizes = "(min-width: 64rem) 60vw, 100vw",
  priorityIndex = 0,
  layout = "stack",
  className,
  inserts,
}: {
  images: PreviewImage[];
  closeLabel: string;
  previousLabel: string;
  nextLabel: string;
  imageClassName?: string;
  sizes?: string;
  priorityIndex?: number;
  /** `detail` - vertical stack on desktop; horizontal strip + line indicators on tablet/phone. */
  layout?: "stack" | "detail";
  className?: string;
  /** Non-image slides spliced into the detail gallery (e.g. QR at index 1). */
  inserts?: { at: number; item: GalleryInsert }[];
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [previewZoomed, setPreviewZoomed] = useState(false);
  const [pinching, setPinching] = useState(false);

  const indexRef = useRef(index);
  const stripRef = useRef<HTMLDivElement>(null);
  const detailStripRef = useRef<HTMLDivElement>(null);
  const previewStripRef = useRef<HTMLDivElement>(null);
  const zoomRefs = useRef<(PreviewZoomImageHandle | null)[]>([]);
  const skipPreviewScrollSync = useRef(false);
  const lastTapRef = useRef(0);

  const hasMultiple = images.length > 1;
  const lastIndex = images.length - 1;
  const slideItems = useMemo(
    () => buildSlideItems(images, inserts),
    [images, inserts],
  );
  const hasMultipleSlides = slideItems.length > 1;

  useBodyScrollLock(open);
  useAxisLockedScroll(detailStripRef, layout === "detail" && slideItems.length > 0);

  const activeZoom = useCallback(() => zoomRefs.current[indexRef.current], []);

  const syncActiveSlide = useCallback(() => {
    const strip = detailStripRef.current;
    if (!strip) return;
    setActiveSlide(indexFromScrollStrip(strip));
  }, []);

  const centerActiveThumb = useCallback((behavior: ScrollBehavior = "smooth") => {
    const strip = stripRef.current;
    if (!strip) return;

    const thumb = strip.querySelector<HTMLElement>(
      `[data-index="${indexRef.current}"]`,
    );
    if (!thumb) return;

    thumb.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior,
    });
  }, []);

  const syncPreviewIndex = useCallback(() => {
    const strip = previewStripRef.current;
    if (!strip) return;

    if (skipPreviewScrollSync.current) {
      const settled = indexFromScrollStrip(strip);
      if (settled === indexRef.current) {
        skipPreviewScrollSync.current = false;
      }
      return;
    }

    if (previewZoomed || pinching) return;

    const next = indexFromScrollStrip(strip);
    if (next === indexRef.current) return;

    indexRef.current = next;
    setIndex(next);
    centerActiveThumb("smooth");
  }, [previewZoomed, pinching, centerActiveThumb]);

  const navigateToIndex = useCallback(
    (
      nextIndex: number,
      behavior: ScrollBehavior = "smooth",
      centerThumb = true,
    ) => {
      const clamped = Math.max(0, Math.min(lastIndex, nextIndex));
      if (clamped === indexRef.current && behavior !== "auto") return;

      skipPreviewScrollSync.current = true;
      indexRef.current = clamped;
      setIndex(clamped);

      const strip = previewStripRef.current;
      if (strip) scrollStripToIndex(strip, clamped, behavior);

      if (hasMultiple && centerThumb) centerActiveThumb(behavior);
    },
    [lastIndex, hasMultiple, centerActiveThumb],
  );

  const close = useCallback(() => setOpen(false), []);

  const goPrevious = useCallback(() => {
    navigateToIndex(indexRef.current - 1);
  }, [navigateToIndex]);

  const goNext = useCallback(() => {
    navigateToIndex(indexRef.current + 1);
  }, [navigateToIndex]);

  const openAt = useCallback((nextIndex: number) => {
    skipPreviewScrollSync.current = true;
    indexRef.current = nextIndex;
    setIndex(nextIndex);
    setPreviewZoomed(false);
    setOpen(true);
  }, []);

  const toggleActiveZoom = useCallback(() => {
    activeZoom()?.toggleZoom();
  }, [activeZoom]);

  const handlePreviewWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      if (!event.ctrlKey && !event.metaKey) return;

      event.preventDefault();
      event.stopPropagation();

      const zoom = activeZoom();
      if (!zoom) return;

      if (event.deltaY < 0) {
        zoom.zoomIn();
      } else {
        zoom.zoomOut();
      }
    },
    [activeZoom],
  );

  const handlePreviewDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      toggleActiveZoom();
    },
    [toggleActiveZoom],
  );

  const handlePreviewTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (event.touches.length === 2) {
        setPinching(true);
        const distance = touchPinchDistance(event.touches);
        activeZoom()?.pinchStart(distance);
        return;
      }

      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        event.preventDefault();
        toggleActiveZoom();
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;
    },
    [activeZoom, toggleActiveZoom],
  );

  const handlePreviewTouchMove = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (!pinching || event.touches.length < 2) return;

      event.preventDefault();
      event.stopPropagation();
      const distance = touchPinchDistance(event.touches);
      activeZoom()?.pinchMove(distance);
    },
    [activeZoom, pinching],
  );

  const handlePreviewTouchEnd = useCallback(() => {
    if (!pinching) return;
    setPinching(false);
    activeZoom()?.pinchEnd();
  }, [activeZoom, pinching]);

  const handleOverlayClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-preview-image]")) return;
      if (target.closest("[data-preview-thumbs]")) return;
      if (target.closest("button")) return;
      close();
    },
    [close],
  );

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setPreviewZoomed(false);
      setPinching(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (previewZoomed) return;
      if (event.key === "ArrowLeft") goPrevious();
      if (event.key === "ArrowRight") goNext();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close, goPrevious, goNext, previewZoomed]);

  useEffect(() => {
    if (!open) return;

    const strip = previewStripRef.current;
    if (!strip) return;

    const onScroll = () => syncPreviewIndex();
    strip.addEventListener("scroll", onScroll, { passive: true });

    return () => strip.removeEventListener("scroll", onScroll);
  }, [open, syncPreviewIndex]);

  useEffect(() => {
    if (!open) return;

    const strip = previewStripRef.current;
    if (!strip) return;

    skipPreviewScrollSync.current = true;
    const frame = window.requestAnimationFrame(() => {
      scrollStripToIndex(strip, indexRef.current, "auto");
      if (hasMultiple) centerActiveThumb("auto");
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, hasMultiple, centerActiveThumb]);

  useEffect(() => {
    if (layout !== "detail" || slideItems.length === 0) return;

    const strip = detailStripRef.current;
    if (!strip) return;

    const onScroll = () => syncActiveSlide();
    strip.addEventListener("scroll", onScroll, { passive: true });
    syncActiveSlide();

    return () => strip.removeEventListener("scroll", onScroll);
  }, [layout, slideItems.length, syncActiveSlide]);

  if (images.length === 0) return null;

  const lightbox =
    mounted && open
      ? createPortal(
          <div
            className={styles.overlay}
            data-preview-overlay
            data-has-thumbs={hasMultiple || undefined}
            role="dialog"
            aria-modal="true"
            aria-label={images[index]?.alt}
            onClick={handleOverlayClick}
            onWheel={handlePreviewWheel}
          >
            <button
              type="button"
              className={styles.close}
              onClick={(event) => {
                event.stopPropagation();
                close();
              }}
            >
              {closeLabel}
            </button>

            {hasMultiple ? (
              <>
                <button
                  type="button"
                  className={`${styles.nav} ${styles.navDesktop}`}
                  data-direction="prev"
                  disabled={index === 0 || previewZoomed || pinching}
                  aria-label={previousLabel}
                  onClick={(event) => {
                    event.stopPropagation();
                    goPrevious();
                  }}
                >
                  <Chevron direction="prev" />
                </button>
                <button
                  type="button"
                  className={`${styles.nav} ${styles.navDesktop}`}
                  data-direction="next"
                  disabled={index === lastIndex || previewZoomed || pinching}
                  aria-label={nextLabel}
                  onClick={(event) => {
                    event.stopPropagation();
                    goNext();
                  }}
                >
                  <Chevron direction="next" />
                </button>
              </>
            ) : null}

            <div
              ref={previewStripRef}
              className={styles.previewStrip}
              data-zoomed={previewZoomed || pinching || undefined}
              onDoubleClick={handlePreviewDoubleClick}
              onTouchStart={handlePreviewTouchStart}
              onTouchMove={handlePreviewTouchMove}
              onTouchEnd={handlePreviewTouchEnd}
              onTouchCancel={handlePreviewTouchEnd}
            >
              {images.map((image, imageIndex) => (
                <div
                  key={`preview-${image.src}-${imageIndex}`}
                  data-scroll-slide
                  className={styles.previewSlide}
                >
                  <PreviewZoomImage
                    ref={(node) => {
                      zoomRefs.current[imageIndex] = node;
                    }}
                    src={image.src}
                    alt={image.alt}
                    active={imageIndex === index}
                    onZoomChange={
                      imageIndex === index ? setPreviewZoomed : undefined
                    }
                  />
                </div>
              ))}
            </div>

            {hasMultiple ? (
              <div
                ref={stripRef}
                className={cn(styles.previewThumbBar, styles.previewThumbs)}
                data-preview-thumbs
              >
                {images.map((image, imageIndex) => (
                  <button
                    key={`thumb-${image.src}-${imageIndex}`}
                    type="button"
                    data-index={imageIndex}
                    className={cn(
                      styles.thumb,
                      styles.thumbFrame,
                      imageIndex === index && styles.thumbActive,
                    )}
                    aria-label={image.alt}
                    aria-current={imageIndex === index ? "true" : undefined}
                    onClick={(event) => {
                      event.stopPropagation();
                      navigateToIndex(imageIndex, "smooth", false);
                    }}
                  >
                    <Image
                      src={image.src}
                      alt=""
                      width={image.width}
                      height={image.height}
                      className={styles.thumbImage}
                      decoding="async"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>,
          getCollectionPortalRoot(),
        )
      : null;

  if (layout === "detail") {
    return (
      <>
        <div className={cn(styles.detailRoot, styles.detailDesktop, className)}>
          {slideItems.map((slide, slideIndex) => {
              if (slide.kind === "insert") {
                return (
                  <div
                    key={slide.item.key}
                    className={styles.detailInsert}
                    aria-label={slide.item.ariaLabel}
                  >
                    {slide.item.content}
                  </div>
                );
              }

              const { image, sourceIndex } = slide;
              return (
                <button
                  key={`desktop-${image.src}-${slideIndex}`}
                  type="button"
                  className={styles.trigger}
                  onClick={() => openAt(sourceIndex)}
                  aria-label={image.alt}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                    className={imageClassName}
                    decoding="async"
                  />
                </button>
              );
            })}
        </div>

        <div className={cn(styles.detailRoot, styles.detailMobile)}>
          <div
            ref={detailStripRef}
            className={styles.detailStrip}
            aria-label="Gallery images"
          >
              {slideItems.map((slide, slideIndex) => {
                if (slide.kind === "insert") {
                  return (
                    <div
                      key={slide.item.key}
                      data-scroll-slide
                      className={styles.detailInsertSlide}
                      aria-label={slide.item.ariaLabel}
                    >
                      {slide.item.content}
                    </div>
                  );
                }

                const { image, sourceIndex } = slide;
                return (
                  <button
                    key={`mobile-${image.src}-${slideIndex}`}
                    type="button"
                    data-scroll-slide
                    className={styles.detailSlide}
                    onClick={() => openAt(sourceIndex)}
                    aria-label={image.alt}
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={image.width}
                      height={image.height}
                      className={imageClassName}
                      decoding="async"
                    />
                  </button>
                );
              })}
            </div>
            {hasMultipleSlides ? (
              <div className={styles.lineIndicators} aria-hidden>
                {slideItems.map((slide, slideIndex) => (
                  <span
                    key={
                      slide.kind === "insert"
                        ? `line-${slide.item.key}`
                        : `line-${slide.image.src}-${slideIndex}`
                    }
                    className={
                      slideIndex === activeSlide
                        ? `${styles.line} ${styles.lineActive}`
                        : styles.line
                    }
                  />
                ))}
              </div>
            ) : null}
        </div>
        {lightbox}
      </>
    );
  }

  return (
    <>
      {images.map((image, imageIndex) => (
        <button
          key={`${image.src}-${imageIndex}`}
          type="button"
          className={styles.trigger}
          onClick={() => openAt(imageIndex)}
          aria-label={image.alt}
        >
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            className={imageClassName}
            decoding="async"
          />
        </button>
      ))}
      {lightbox}
    </>
  );
}

function Chevron({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg
      className={styles.chevron}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d={direction === "prev" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
