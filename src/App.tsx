import { useEffect, useState } from "react";
import { Maximize2, Minimize2, Pause, Play, Settings } from "lucide-react";
import { api } from "./api";
import { useBot, type Link } from "./useBot";
import { useWalletBalance } from "./useWalletBalance";
import { useTheme, type Theme } from "./theme";
import { shortAddr, sol } from "./format";
import type { Snapshot } from "./types";
import { LinkGate } from "./components/LinkGate";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CycleRibbon } from "./components/CycleRibbon";
import { Hero } from "./components/Hero";
import { PositionsPanel } from "./components/PositionsPanel";
import { ActivityPanel } from "./components/ActivityPanel";
import { DecisionCard } from "./components/Decision";
import { SettingsScreen } from "./screens/Settings";

const LINK_TEXT: Record<Link, string> = {
  live: "Tersambung",
  reconnecting: "Terputus, mencoba lagi tiap 5 dtk",
  unauthorized: "Token ditolak",
  unreachable: "Backend tidak menjawab",
  connecting: "Menghubungkan",
};

interface SettingsProps {
  open: boolean;
  onClose: () => void;
  snapshot: Snapshot;
  theme: Theme;
  onTheme: (t: Theme) => void;
  paused: boolean;
  pauseBusy: boolean;
  pauseError: string | null;
  onTogglePause: () => void;
}

/** Settings live in a dialog over the dashboard, so the dashboard stays one page. */
function SettingsDialog({ open, onClose, ...rest }: SettingsProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] gap-3 overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Pengaturan</DialogTitle>
          <DialogDescription>Perubahan tersimpan di database dan menimpa nilai di backend/.env.</DialogDescription>
        </DialogHeader>
        <SettingsScreen {...rest} />
      </DialogContent>
    </Dialog>
  );
}

/** Icon-only button with a tooltip that doubles as its accessible name. */
function IconAction({ label, onClick, pressed, children }: { label: string; onClick: () => void; pressed?: boolean; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="icon" onClick={onClick} aria-label={label} aria-pressed={pressed}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** Browser fullscreen for the whole dashboard; tracks Esc and F11 exits too. */
function useFullscreen() {
  const [on, setOn] = useState(() => !!document.fullscreenElement);
  useEffect(() => {
    const sync = () => setOn(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const toggle = () => {
    const done = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    done.catch(() => {
      // Browser refused (blocked or unsupported): the page stays as it is.
    });
  };
  return { on, toggle, supported: document.fullscreenEnabled };
}

export function App() {
  const bot = useBot();
  const fullscreen = useFullscreen();
  const balance = useWalletBalance(!!bot.data);
  const [theme, setTheme] = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pauseBusy, setPauseBusy] = useState(false);
  const [pauseError, setPauseError] = useState<string | null>(null);

  const data = bot.data;
  const paused = data ? data.status.openingPaused : null;

  const balanceText = balance.sol !== null ? sol(balance.sol, 3) : balance.error ? "Saldo tak terbaca" : "Memuat…";
  const balanceTitle =
    balance.sol !== null ? `Saldo on-chain ${data?.snapshot.wallet ?? ""}` : (balance.error ?? "Menunggu saldo wallet");

  const togglePause = async (next: boolean) => {
    setPauseBusy(true);
    setPauseError(null);
    try {
      const r = await api.setOpeningPaused(next);
      bot.setStatus(r.status);
    } catch (e) {
      setPauseError((e as Error).message);
    } finally {
      setPauseBusy(false);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="app">
        <a className="skip-link" href="#main">
          Lompat ke konten
        </a>

        <header className="topbar">
          <div className="brand">
            <span className="brand__mark" aria-hidden="true">
              LP
            </span>
            <span className="brand__name">LP Agent</span>
            {data && (
              <Badge variant={data.snapshot.dryRun ? "secondary" : "destructive"}>
                {data.snapshot.dryRun ? "Paper" : "Live"}
              </Badge>
            )}
          </div>

          {data && (
            <div className="wallet" title={balanceTitle}>
              <span className="wallet__balance" aria-live="polite">
                {balanceText}
              </span>
              <span className="wallet__addr">{shortAddr(data.snapshot.wallet)}</span>
            </div>
          )}

          <span className={`link link--${bot.link}`} role="status">
            <span className="link__dot" aria-hidden="true" />
            <span className="link__text">{LINK_TEXT[bot.link]}</span>
          </span>

          {paused !== null && (
            <Button
              type="button"
              size="sm"
              variant={paused ? "default" : "secondary"}
              onClick={() => togglePause(!paused)}
              disabled={pauseBusy}
              aria-pressed={paused}
              title={pauseError ? `Gagal menyimpan: ${pauseError}` : undefined}
            >
              {paused ? <Play /> : <Pause />}
              <span className="topbar__pause-text">{paused ? "Lanjutkan buka posisi" : "Jeda buka posisi"}</span>
            </Button>
          )}

          {fullscreen.supported && (
            <IconAction
              label={fullscreen.on ? "Keluar layar penuh" : "Layar penuh"}
              onClick={fullscreen.toggle}
              pressed={fullscreen.on}
            >
              {fullscreen.on ? <Minimize2 /> : <Maximize2 />}
            </IconAction>
          )}

          {data && (
            <IconAction label="Pengaturan" onClick={() => setSettingsOpen(true)}>
              <Settings />
            </IconAction>
          )}

          {data && bot.link !== "live" && (
            <Alert variant="destructive" className="basis-full py-2">
              <AlertDescription>{LINK_TEXT[bot.link]}. Data di layar dari update terakhir.</AlertDescription>
            </Alert>
          )}
        </header>

        <main id="main" className="content">
          {!data ? (
            <LinkGate link={bot.link} onRetry={bot.retry} />
          ) : (
            <div className="cmd">
              <Hero snapshot={data.snapshot} balance={balance} refreshKey={bot.cycleEndedAt} />
              <CycleRibbon status={data.status} cycles={data.cycles} decisionMode={data.snapshot.decisionMode} />
              <div className="cmd__body">
                <div className="cmd__main">
                  <PositionsPanel status={data.status} snapshot={data.snapshot} refreshKey={bot.cycleEndedAt} />
                  <DecisionCard snapshot={data.snapshot} cycles={data.cycles} />
                </div>
                <aside className="cmd__aside" aria-label="Aktivitas">
                  <ActivityPanel cycles={data.cycles} refreshKey={bot.cycleEndedAt} />
                </aside>
              </div>
            </div>
          )}
        </main>

        {data && (
          <SettingsDialog
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            snapshot={data.snapshot}
            theme={theme}
            onTheme={setTheme}
            paused={data.status.openingPaused}
            pauseBusy={pauseBusy}
            pauseError={pauseError}
            onTogglePause={() => togglePause(!data.status.openingPaused)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
