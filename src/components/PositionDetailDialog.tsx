import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Position } from "../types";

interface Props {
  position: Position | null;
  /** The bot's own data for the position, rendered beside the Meteora page. */
  children: ReactNode;
  onClose: () => void;
}

export const meteoraPoolUrl = (pool: string) => `https://app.meteora.ag/dlmm/${pool}`;

/** Full-screen detail: the bot's numbers next to the live Meteora pool page. */
export function PositionDetailDialog({ position: p, children, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (p && !d.open) d.showModal();
    if (!p && d.open) d.close();
  }, [p]);

  const pool = p?.poolAddress;
  useEffect(() => setLoaded(false), [pool]);

  return (
    <dialog ref={ref} className="sheet sheet--full detail" aria-labelledby="detail-title" onClose={onClose}>
      {p && pool && (
        <>
          <header className="detail__head">
            <div className="detail__titles">
              <h2 id="detail-title" className="sheet__title">
                {p.poolName}
              </h2>
              {/* Meteora crashes when a browser denies storage to embedded sites (incognito, Brave, strict modes). */}
              <p className="muted small">Halaman Meteora kosong? Browser memblokir cookie pihak ketiga. Buka di tab baru.</p>
            </div>
            <a className="btn btn--small btn--secondary" href={meteoraPoolUrl(pool)} target="_blank" rel="noreferrer">
              Buka di Meteora
            </a>
            <button type="button" className="btn btn--small" onClick={onClose}>
              Tutup
            </button>
          </header>
          <div className="detail__body">
            <div className="detail__data">{children}</div>
            <div className="detail__frame">
              {!loaded && (
                <p className="detail__loading muted" role="status">
                  Memuat halaman pool di Meteora...
                </p>
              )}
              {/* No allow-top-navigation: the embedded app cannot redirect this dashboard. */}
              <iframe
                key={pool}
                src={meteoraPoolUrl(pool)}
                title={`Pool ${p.poolName} di Meteora`}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                referrerPolicy="no-referrer"
                onLoad={() => setLoaded(true)}
              />
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}
