import { DispositionMapView } from "./disposition-map-view";

/**
 * The "身后安置" (final resting) card: a quiet, centered panel with a leaf
 * emblem, the method, place/date as chips, an epitaph note, and the map.
 */
export function DispositionCard(props: {
  heading: string;
  method: string;
  place: string | null;
  placeLabel: string;
  date: string | null;
  dateLabel: string;
  note: string | null;
  lng: string | null;
  lat: string | null;
  photoUrl?: string | null;
}) {
  return (
    <section className="dispositionCard">
      <span className="dispositionKicker">{props.heading}</span>

      <span className="dispositionEmblem" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M16 28C9 22 7.5 14.5 16 4c8.5 10.5 7 18 0 24z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M16 26V9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M16 15c-2-.4-3.4-1.6-4-3.4M16 19c2-.4 3.4-1.6 4-3.4"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      </span>

      <h3 className="dispositionMethod">{props.method}</h3>

      {props.place || props.date ? (
        <div className="dispositionMeta">
          {props.place ? (
            <span className="dispositionChip">
              <svg
                className="dispositionChipIcon"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="10"
                  r="2.4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
              </svg>
              <span className="dispositionChipLabel">{props.placeLabel}</span>
              {props.place}
            </span>
          ) : null}
          {props.date ? (
            <span className="dispositionChip">
              <svg
                className="dispositionChipIcon"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="3.5"
                  y="5"
                  width="17"
                  height="15"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M3.5 9.5h17M8 3.5v3M16 3.5v3"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              <span className="dispositionChipLabel">{props.dateLabel}</span>
              {props.date}
            </span>
          ) : null}
        </div>
      ) : null}

      {props.note ? <p className="dispositionNote">{props.note}</p> : null}

      {props.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="dispositionPhoto"
          src={props.photoUrl}
          alt={props.method}
          loading="lazy"
        />
      ) : null}

      {props.lng && props.lat ? (
        <DispositionMapView lng={props.lng} lat={props.lat} />
      ) : null}
    </section>
  );
}
