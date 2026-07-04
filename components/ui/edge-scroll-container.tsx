"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const EDGE_ZONE_PX = 56;
const SCROLL_SPEED_PX = 10;

type EdgeScrollContainerProps = {
  children: ReactNode;
  className?: string;
};

export function EdgeScrollContainer({ children, className }: EdgeScrollContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const directionRef = useRef<-1 | 0 | 1>(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeEdge, setActiveEdge] = useState<"left" | "right" | null>(null);

  const updateScrollHints = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < maxScroll - 1);
  }, []);

  const stopScrolling = useCallback(() => {
    directionRef.current = 0;
    setActiveEdge(null);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const el = scrollRef.current;
    if (!el || directionRef.current === 0) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    const next = el.scrollLeft + directionRef.current * SCROLL_SPEED_PX;
    el.scrollLeft = Math.max(0, Math.min(maxScroll, next));
    updateScrollHints();

    if (
      (directionRef.current === -1 && el.scrollLeft <= 0) ||
      (directionRef.current === 1 && el.scrollLeft >= maxScroll)
    ) {
      stopScrolling();
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [stopScrolling, updateScrollHints]);

  const startScrolling = useCallback(
    (direction: -1 | 1, edge: "left" | "right") => {
      if (directionRef.current === direction) {
        setActiveEdge(edge);
        return;
      }
      directionRef.current = direction;
      setActiveEdge(edge);
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    },
    [tick],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = scrollRef.current;
      if (!el || el.scrollWidth <= el.clientWidth) {
        stopScrolling();
        return;
      }

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;

      if (x < EDGE_ZONE_PX && el.scrollLeft > 0) {
        startScrolling(-1, "left");
      } else if (x > rect.width - EDGE_ZONE_PX && el.scrollLeft < el.scrollWidth - el.clientWidth) {
        startScrolling(1, "right");
      } else {
        stopScrolling();
      }
    },
    [startScrolling, stopScrolling],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollHints();
    el.addEventListener("scroll", updateScrollHints, { passive: true });
    const observer = new ResizeObserver(updateScrollHints);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollHints);
      observer.disconnect();
      stopScrolling();
    };
  }, [stopScrolling, updateScrollHints]);

  return (
    <div className="relative">
      {canScrollLeft && (
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-slate-200/80 to-transparent transition-opacity",
            activeEdge === "left" ? "opacity-100" : "opacity-40",
          )}
          aria-hidden
        />
      )}
      {canScrollRight && (
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-slate-200/80 to-transparent transition-opacity",
            activeEdge === "right" ? "opacity-100" : "opacity-40",
          )}
          aria-hidden
        />
      )}
      <div
        ref={scrollRef}
        className={cn("overflow-auto", className)}
        onMouseMove={handleMouseMove}
        onMouseLeave={stopScrolling}
      >
        {children}
      </div>
      {(canScrollLeft || canScrollRight) && (
        <p className="mt-2 text-xs text-slate-500">
          Hover near the left or right edge to scroll columns.
        </p>
      )}
    </div>
  );
}
