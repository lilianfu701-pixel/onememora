"use client";

import { useEffect, useRef, useState } from "react";
import { amapKey, initPicker, type PickerHandle } from "@/lib/amap";

/**
 * Map point picker for the disposition place: search an address, or click /
 * drag the marker. Reports coordinates and a reverse-geocoded name back up.
 * Renders a fallback line when no AMap key is configured.
 */
export function DispositionMapPicker(props: {
  lng: string;
  lat: string;
  onPick: (lng: string, lat: string, address: string | null) => void;
  searchPlaceholder: string;
  searchLabel: string;
  hint: string;
  unavailable: string;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<PickerHandle | null>(null);
  const onPickRef = useRef(props.onPick);
  useEffect(() => {
    onPickRef.current = props.onPick;
  }, [props.onPick]);

  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!amapKey() || !elRef.current) {
      setFailed(true);
      return;
    }
    let cancelled = false;
    const lng = props.lng ? Number(props.lng) : undefined;
    const lat = props.lat ? Number(props.lat) : undefined;
    initPicker(elRef.current, {
      ...(Number.isFinite(lng) ? { lng: lng as number } : {}),
      ...(Number.isFinite(lat) ? { lat: lat as number } : {}),
      onPick: (a, b, addr) =>
        onPickRef.current(a.toFixed(6), b.toFixed(6), addr),
    })
      .then((h) => {
        if (cancelled) {
          h.destroy();
          return;
        }
        handleRef.current = h;
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      handleRef.current?.destroy();
      handleRef.current = null;
    };
    // Initialise once; live coordinate changes come from the map itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed || !amapKey()) {
    return <p className="muted">{props.unavailable}</p>;
  }

  return (
    <div className="stack">
      <div className="dispMapSearch">
        <input
          className="input"
          value={q}
          placeholder={props.searchPlaceholder}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleRef.current?.search(q);
            }
          }}
        />
        <button
          type="button"
          className="button buttonQuiet buttonCompact"
          onClick={() => handleRef.current?.search(q)}
        >
          {props.searchLabel}
        </button>
      </div>
      <div ref={elRef} className="dispMap" />
      <p className="muted" style={{ margin: 0 }}>
        {props.hint}
      </p>
    </div>
  );
}
