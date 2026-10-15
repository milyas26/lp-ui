import { useEffect, useState, type ReactNode } from "react";
import { api } from "./api";
import { useBot, type Link } from "./useBot";
import { useWalletBalance } from "./useWalletBalance";
import { useTheme } from "./theme";
import { shortAddr, sol } from "./format";
import { LinkGate } from "./components/LinkGate";
import { IconHalt, IconJournal, IconNow, IconPlay, IconPositions, IconSettings } from "./components/Icons";
import { NowScreen } from "./screens/Now";
import { PositionsScreen } from "./screens/Positions";
import { JournalScreen } from "./screens/Journal";
import { SettingsScreen } from "./screens/Settings";

type Tab = "sekarang" | "posisi" | "jurnal" | "pengaturan";
const TABS: Tab[] = ["sekarang", "posisi", "jurnal", "pengaturan"];

function tabFromHash(): Tab {
  const h = window.location.hash.replace("#", "");
  return (TABS as string[]).includes(h) ? (h as Tab) : "sekarang";
}

const LINK_TEXT: Record<Link, string> = {
  live: "Tersambung",
  reconnecting: "Terputus, mencoba lagi tiap 5 dtk",
  unauthorized: "Token ditolak",
  unreachable: "Backend tidak menjawab",
  connecting: "Menghubungkan",
};

function NavLinks({ tab, count, variant }: { tab: Tab; count?: number; variant: "side" | "bottom" }) {
  const items: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: "sekarang", label: "Sekarang", icon: <IconNow /> },
    { id: "posisi", label: "Posisi", icon: <IconPositions /> },
    { id: "jurnal", label: "Jurnal", icon: <IconJournal /> },
  ];
  return (
    <ul className={`nav nav--${variant}`}>
      {items.map((it) => (
        <li key={it.id}>
          <a
            className="nav__item"
            href={`#${it.id}`}
            aria-label={it.label}
            aria-current={tab === it.id ? "page" : undefined}
          >
            {it.icon}
            <span className="nav__label">{it.label}</span>
            {it.id === "posisi" && count !== undefined && count > 0 && (
              <span className="nav__count" aria-label={`${count} terbuka`}>
                {count}
              </span>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function App() {
  const bot = useBot();
  const balance = useWalletBalance(!!bot.data);
  const [theme, setTheme] = useTheme();
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [pauseBusy, setPauseBusy] = useState(false);
  const [pauseError, setPauseError] = useState<string | null>(null);

  useEffect(() => {
    const onHash = () => {
      setTab(tabFromHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const data = bot.data;
  const paused = data ? data.status.openingPaused : null;
  const count = data?.snapshot.positions.length;

  const balanceText = balance.sol !== null ? sol(balance.sol, 3) : balance.error ? "Saldo tak terbaca" : "Memuat…";
  const balanceTitle =
    balance.sol !== null
      ? `Saldo on-chain ${data?.snapshot.wallet ?? ""}`
      : (balance.error ?? "Menunggu saldo wallet");

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

  const mode = data && (
    <span className={`mode mode--${data.snapshot.dryRun ? "paper" : "live"}`}>
      {data.snapshot.dryRun ? "Paper" : "Live"}
    </span>
  );

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Lompat ke konten
      </a>

      <aside className="sidebar" aria-label="Navigasi utama">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            LP
          </span>
          <span className="brand__name">LP Agent</span>
          {mode}
        </div>

        {data && (
          <nav aria-label="Layar">
            <p className="nav__group">Bot</p>
            <NavLinks tab={tab} count={count} variant="side" />
            <p className="nav__group nav__group--spaced">Sistem</p>
            <ul className="nav nav--side">
              <li>
                <a className="nav__item" href="#pengaturan" aria-current={tab === "pengaturan" ? "page" : undefined}>
                  <IconSettings />
                  <span className="nav__label">Pengaturan</span>
                </a>
              </li>
            </ul>
          </nav>
        )}

        <div className="sidebar__foot">
          {paused !== null && (
            <div className="sidebar__cta">
              <button
                type="button"
                className="icon-btn"
                onClick={() => togglePause(!paused)}
                disabled={pauseBusy}
                aria-pressed={paused}
                aria-label={paused ? "Lanjutkan buka posisi" : "Jeda buka posisi baru"}
                title={pauseError ? `Gagal menyimpan: ${pauseError}` : paused ? "Lanjutkan buka posisi" : "Jeda buka posisi baru"}
              >
                {paused ? <IconPlay /> : <IconHalt />}
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="main">
        <header className="mobilebar">
          <div className="brand">
            <span className="brand__name">LP Agent</span>
            {mode}
          </div>
          {data && (
            <span className="mobilebar__balance" aria-live="polite" title={balanceTitle}>
              {balanceText}
            </span>
          )}
          <span className={`link link--${bot.link}`} role="status">
            <span className="link__dot" aria-hidden="true" />
            <span className="visually-hidden">{LINK_TEXT[bot.link]}</span>
          </span>
          {data && (
            <a
              className="icon-btn"
              href="#pengaturan"
              aria-label="Pengaturan"
              aria-current={tab === "pengaturan" ? "page" : undefined}
            >
              <IconSettings />
            </a>
          )}
          {data && bot.link !== "live" && (
            <p className="mobilebar__alert" aria-hidden="true">
              {LINK_TEXT[bot.link]}. Data di layar dari update terakhir.
            </p>
          )}
        </header>

        <header className="topbar">
          {data && (
            <div className="wallet">
              <div className="wallet__text">
                <span className="wallet__balance" aria-live="polite" title={balanceTitle}>
                  {balanceText}
                </span>
                <span className="wallet__addr" title={data.snapshot.wallet}>
                  {shortAddr(data.snapshot.wallet)}
                </span>
              </div>
              <span className={`link link--${bot.link}`} role="status">
                <span className="link__dot" aria-hidden="true" />
                {LINK_TEXT[bot.link]}
              </span>
            </div>
          )}
        </header>

      <main id="main" className="content">
        {!data ? (
          <LinkGate link={bot.link} onRetry={bot.retry} />
        ) : (
          <>
            {tab === "sekarang" && (
              <NowScreen
                status={data.status}
                snapshot={data.snapshot}
                cycles={data.cycles}
                refreshKey={bot.cycleEndedAt}
                balance={balance}
                onResume={() => togglePause(false)}
                resumeBusy={pauseBusy}
              />
            )}
            {tab === "posisi" && (
              <PositionsScreen status={data.status} snapshot={data.snapshot} refreshKey={bot.cycleEndedAt} />
            )}
            {tab === "jurnal" && <JournalScreen refreshKey={bot.cycleEndedAt} />}
            {tab === "pengaturan" && (
              <SettingsScreen
                snapshot={data.snapshot}
                theme={theme}
                onTheme={setTheme}
                paused={data.status.openingPaused}
                pauseBusy={pauseBusy}
                pauseError={pauseError}
                onTogglePause={() => togglePause(!data.status.openingPaused)}
              />
            )}
          </>
        )}
      </main>
      </div>

      {data && (
        <nav className="bottombar" aria-label="Layar">
          <NavLinks tab={tab} count={count} variant="bottom" />
        </nav>
      )}

    </div>
  );
}
