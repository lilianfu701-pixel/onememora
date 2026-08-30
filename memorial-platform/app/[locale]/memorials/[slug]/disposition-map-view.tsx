"use client";

import { useEffect, useRef, useState } from "react";
import { amapKey, initViewer } from "@/lib/amap";

/** Read-only map with a single marker for the disposition point (public page). */
export function DispositionMapView(props: { lng: string; lat: string }) {
  const elRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const lng = Number(props.lng);
    const lat = Number(props.lat);
    if (!amapKey() || !elRef.current || !Number.isFinite(lng) || !Number.isFinite(lat)) {
      setFailed(true);
      return;
    }
    let cancelled = false;
    let destroy: (() => void) | undefined;
    initViewer(elRef.current, { lng, lat })
      .then((h) => {
        if (cancelled) {
          h.destroy();
          return;
        }
        destroy = h.destroy;
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [props.lng, props.lat]);

  if (failed || !amapKey()) return null;
  return <div ref={elRef} className="dispMapView" />;
}
