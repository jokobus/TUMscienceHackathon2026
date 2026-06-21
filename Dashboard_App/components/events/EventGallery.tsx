"use client";

import { useState } from "react";

/** Event hero image + thumbnail gallery, sourced from the event payload. */
export function EventGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  if (!images || images.length === 0) return null;
  const hero = images[Math.min(active, images.length - 1)];

  return (
    <div className="overflow-hidden rounded-card border border-we-line bg-we-canvas shadow-card">
      <div className="aspect-[21/9] w-full overflow-hidden bg-we-canvas">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={hero} alt={alt} className="h-full w-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-3">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-md border transition-colors ${
                i === active ? "border-we-red" : "border-we-line hover:border-we-line-strong"
              }`}
              aria-label={`Show image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
