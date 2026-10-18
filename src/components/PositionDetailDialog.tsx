import { useEffect, useState, type ReactNode } from "react";
import type { Position } from "../types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  position: Position | null;
  /** The bot's own data for the position, rendered beside the Meteora page. */
  children: ReactNode;
  onClose: () => void;
}

export const meteoraPoolUrl = (pool: string) => `https://app.meteora.ag/dlmm/${pool}`;

/** Full-screen detail: the bot's numbers next to the live Meteora pool page. */
export function PositionDetailDialog({ position: p, children, onClose }: Props) {
  const [loaded, setLoaded] = useState(false);
  const pool = p?.poolAddress;
  useEffect(() => setLoaded(false), [pool]);

  return (
    <Dialog open={p !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="grid h-[100dvh] max-w-none grid-rows-[auto_minmax(0,1fr)] gap-3 rounded-none p-3 sm:h-[94dvh] sm:max-w-[min(1500px,96vw)] sm:rounded-xl sm:p-4"
      >
        {p && pool && (
          <>
            <header className="flex flex-wrap items-center gap-2">
              <div className="mr-auto min-w-0">
                <DialogTitle className="truncate">{p.poolName}</DialogTitle>
                {/* Meteora crashes when a browser denies storage to embedded sites (incognito, Brave, strict modes). */}
                <DialogDescription className="text-xs">
                  Halaman Meteora kosong? Browser memblokir cookie pihak ketiga. Buka di tab baru.
                </DialogDescription>
              </div>
              <Button asChild variant="secondary" size="sm">
                <a href={meteoraPoolUrl(pool)} target="_blank" rel="noreferrer">
                  Buka di Meteora
                </a>
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" size="sm">
                  Tutup
                </Button>
              </DialogClose>
            </header>
            <div className="grid min-h-0 gap-3 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
              <div className="min-h-0 overflow-y-auto">{children}</div>
              <div className="relative min-h-[60dvh] overflow-hidden rounded-lg bg-muted lg:min-h-0">
                {!loaded && (
                  <div className="absolute inset-0 grid place-content-center gap-2 p-6" role="status">
                    <Skeleton className="h-3 w-56" />
                    <p className="text-sm text-muted-foreground">Memuat halaman pool di Meteora...</p>
                  </div>
                )}
                {/* No allow-top-navigation: the embedded app cannot redirect this dashboard. */}
                <iframe
                  key={pool}
                  src={meteoraPoolUrl(pool)}
                  title={`Pool ${p.poolName} di Meteora`}
                  className="absolute inset-0 size-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  referrerPolicy="no-referrer"
                  onLoad={() => setLoaded(true)}
                />
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
