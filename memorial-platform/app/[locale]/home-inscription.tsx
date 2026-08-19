"use client";

import { useEffect, useState } from "react";

/**
 * The page's signature: a name written on the inscription line, cycling slowly
 * through scripts so the promise "in every language" is shown rather than
 * stated. Given names only, chosen to span writing systems — never a real
 * memorial subject.
 *
 * The motion is deliberately unhurried and carries no information a reader
 * needs, so it is hidden from assistive tech (the lead-in sentence carries the
 * meaning) and stops entirely under prefers-reduced-motion.
 */
const NAMES = [
  "Mary",
  "慧兰",
  "María",
  "محمّد",
  "はると",
  "지우",
  "Amara",
  "João",
  "Наталья",
  "Elif",
] as const;

const HOLD_MS = 3400;

export function HomeInscription() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    let fade: ReturnType<typeof setTimeout>;
    const cycle = setInterval(() => {
      setVisible(false);
      fade = setTimeout(() => {
        setIndex((i) => (i + 1) % NAMES.length);
        setVisible(true);
      }, 460);
    }, HOLD_MS);

    return () => {
      clearInterval(cycle);
      clearTimeout(fade);
    };
  }, []);

  return (
    <span className="homeInscribed" aria-hidden="true">
      <span
        className="homeInscribedName"
        data-visible={visible ? "true" : "false"}
      >
        {NAMES[index]}
      </span>
    </span>
  );
}
