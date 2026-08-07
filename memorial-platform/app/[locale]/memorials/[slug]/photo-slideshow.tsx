"use client";

import { useState } from "react";

type SlidePhoto = { id: string; url: string; alt: string };

/**
 * A single-photo slideshow shown at the top of the memorial page. Click the
 * image (or the arrows) to advance; dots jump to a specific photo. Portraits
 * are shown whole (object-fit: contain) rather than cropped.
 */
export function PhotoSlideshow(props: {
  photos: SlidePhoto[];
  prevLabel: string;
  nextLabel: string;
}) {
  const [index, setIndex] = useState(0);
  const { photos } = props;

  if (photos.length === 0) return null;

  const count = photos.length;
  const go = (n: number): void => setIndex(((n % count) + count) % count);
  const current = photos[index] ?? photos[0]!;
  const many = count > 1;

  return (
    <section className="slideshow" aria-roledescription="carousel">
      <div className="slideshowStage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="slideshowImage"
          src={current.url}
          alt={current.alt}
          onClick={() => go(index + 1)}
          loading="eager"
        />
        {many ? (
          <>
            <button
              type="button"
              className="slideshowArrow slideshowPrev"
              onClick={() => go(index - 1)}
              aria-label={props.prevLabel}
            >
              ‹
            </button>
            <button
              type="button"
              className="slideshowArrow slideshowNext"
              onClick={() => go(index + 1)}
              aria-label={props.nextLabel}
            >
              ›
            </button>
            <span className="slideshowCounter">
              {index + 1} / {count}
            </span>
          </>
        ) : null}
      </div>

      {many ? (
        <div className="slideshowDots">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              className={
                i === index ? "slideshowDot slideshowDotActive" : "slideshowDot"
              }
              onClick={() => go(i)}
              aria-label={`${i + 1}`}
              aria-current={i === index}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
