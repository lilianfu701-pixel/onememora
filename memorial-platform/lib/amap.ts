/**
 * Client-side AMap (高德地图) loader + small map helpers.
 *
 * AMap is used rather than Google/OSM because mainland China requires the
 * GCJ-02 coordinate system and foreign map tiles are blocked/offset there.
 * All of AMap's untyped SDK surface is contained in this file behind small
 * typed helpers, so components never touch the global directly.
 *
 * The JS key is public by design (restrict it by domain in the AMap console);
 * read from NEXT_PUBLIC_AMAP_KEY, with an optional NEXT_PUBLIC_AMAP_SECURITY.
 */

interface AMapLngLat {
  getLng(): number;
  getLat(): number;
}
interface AMapMarker {
  setPosition(p: [number, number]): void;
  getPosition(): AMapLngLat | null;
  on(event: string, handler: () => void): void;
}
interface AMapMapInstance {
  add(overlay: unknown): void;
  setCenter(p: [number, number]): void;
  setZoom(z: number): void;
  on(event: "click", handler: (e: { lnglat: AMapLngLat }) => void): void;
  destroy(): void;
}
interface AMapGeocoderResultRe {
  regeocode?: { formattedAddress?: string };
}
interface AMapGeocoderResultFwd {
  geocodes?: { location: AMapLngLat }[];
}
interface AMapGeocoder {
  getAddress(
    p: [number, number],
    cb: (status: string, result: AMapGeocoderResultRe) => void,
  ): void;
  getLocation(
    address: string,
    cb: (status: string, result: AMapGeocoderResultFwd) => void,
  ): void;
}
interface AMapNS {
  Map: new (el: HTMLElement, opts: Record<string, unknown>) => AMapMapInstance;
  Marker: new (opts: Record<string, unknown>) => AMapMarker;
  Geocoder: new (opts?: Record<string, unknown>) => AMapGeocoder;
}

declare global {
  interface Window {
    AMap?: AMapNS;
    _AMapSecurityConfig?: { securityJsCode: string };
  }
}

/** Beijing — a neutral default centre before any point is chosen. */
const DEFAULT_CENTER: [number, number] = [116.397, 39.908];

export function amapKey(): string | undefined {
  return process.env.NEXT_PUBLIC_AMAP_KEY || undefined;
}

let loader: Promise<AMapNS> | null = null;

function loadAMap(): Promise<AMapNS> {
  if (typeof window === "undefined") return Promise.reject(new Error("no-window"));
  if (window.AMap) return Promise.resolve(window.AMap);
  const key = amapKey();
  if (!key) return Promise.reject(new Error("no-key"));
  if (loader) return loader;

  const security = process.env.NEXT_PUBLIC_AMAP_SECURITY;
  if (security) window._AMapSecurityConfig = { securityJsCode: security };

  loader = new Promise<AMapNS>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(
      key,
    )}&plugin=AMap.Geocoder`;
    script.async = true;
    script.onload = () =>
      window.AMap ? resolve(window.AMap) : reject(new Error("amap-missing"));
    script.onerror = () => reject(new Error("amap-load-failed"));
    document.head.appendChild(script);
  });
  return loader;
}

export interface PickerHandle {
  search(address: string): void;
  destroy(): void;
}

/** An interactive picker: click or drag the marker to choose a point; a search
 *  moves it to an address. Each pick reports coords + a reverse-geocoded name. */
export async function initPicker(
  el: HTMLElement,
  opts: {
    lng?: number;
    lat?: number;
    onPick: (lng: number, lat: number, address: string | null) => void;
  },
): Promise<PickerHandle> {
  const AMap = await loadAMap();
  const hasInitial = opts.lng !== undefined && opts.lat !== undefined;
  const center: [number, number] = hasInitial
    ? [opts.lng as number, opts.lat as number]
    : DEFAULT_CENTER;

  const map = new AMap.Map(el, { zoom: hasInitial ? 15 : 4, center });
  const marker = new AMap.Marker({ position: center, draggable: true });
  const geocoder = new AMap.Geocoder({});
  let placed = false;

  const report = (lng: number, lat: number): void => {
    marker.setPosition([lng, lat]);
    if (!placed) {
      map.add(marker);
      placed = true;
    }
    geocoder.getAddress([lng, lat], (status, result) => {
      const addr =
        status === "complete"
          ? (result.regeocode?.formattedAddress ?? null)
          : null;
      opts.onPick(lng, lat, addr);
    });
  };

  if (hasInitial) {
    map.add(marker);
    placed = true;
  }

  map.on("click", (e) => report(e.lnglat.getLng(), e.lnglat.getLat()));
  marker.on("dragend", () => {
    const p = marker.getPosition();
    if (p) report(p.getLng(), p.getLat());
  });

  return {
    search(address: string): void {
      const q = address.trim();
      if (!q) return;
      geocoder.getLocation(q, (status, result) => {
        const loc =
          status === "complete" ? result.geocodes?.[0]?.location : undefined;
        if (loc) {
          const lng = loc.getLng();
          const lat = loc.getLat();
          map.setCenter([lng, lat]);
          map.setZoom(15);
          report(lng, lat);
        }
      });
    },
    destroy(): void {
      map.destroy();
    },
  };
}

/** A read-only map showing one marker. */
export async function initViewer(
  el: HTMLElement,
  point: { lng: number; lat: number },
): Promise<{ destroy(): void }> {
  const AMap = await loadAMap();
  const center: [number, number] = [point.lng, point.lat];
  const map = new AMap.Map(el, { zoom: 14, center });
  map.add(new AMap.Marker({ position: center }));
  return {
    destroy(): void {
      map.destroy();
    },
  };
}
