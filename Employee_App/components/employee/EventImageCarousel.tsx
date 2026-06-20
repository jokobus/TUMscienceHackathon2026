"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Horizontal, swipeable image strip with scroll-snap and dot indicators.
 * Lives at the top of an EventCard; the surrounding card handles navigation.
 */
export function EventImageCarousel({
  images,
  alt,
  className,
}: {
  images: string[];
  alt: string;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function onScroll() {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== active) setActive(i);
  }

  return (
    <div className={cn("relative", className)}>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
      >
        {images.map((src, i) => (
          <div key={src} className="relative h-full w-full shrink-0 snap-center">
            {/* Plain img keeps this dependency-free (no next/image domain config). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${alt} — photo ${i + 1}`}
              loading="lazy"
              draggable={false}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5">
          {images.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full bg-white transition-all",
                i === active ? "w-4 opacity-95" : "w-1.5 opacity-60"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
