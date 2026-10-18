import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../api";
import type { Theme } from "../theme";
import type { SettingView, SettingsView, Snapshot } from "../types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const THEMES: { id: Theme; label: string }[] = [
  { id: "light", label: "Terang" },
  { id: "dark", label: "Gelap" },
  { id: "system", label: "Ikuti perangkat" },
];

/** Draft per key: input text (numbers, lists), a boolean, or null = reset to the .env value. */
type Draft = string | boolean | null;

function toText(s: SettingView, v: SettingView["value"]): string | boolean {
  if (s.type === "boolean") return v as boolean;
  if (s.type === "list") return (v as string[]).join("\n");
  return String(v);
}

function show(s: SettingView, v: SettingView["value"]): string {
  if (s.type === "boolean") return v ? "ya" : "tidak";
  if (s.type === "list") return (v as string[]).length === 0 ? "kosong" : `${(v as string[]).length} alamat`;
  if (s.type === "choice") return s.options?.find((o) => o.value === v)?.label ?? String(v);
  return `${(v as number).toLocaleString("id-ID")}${s.unit ? ` ${s.unit}` : ""}`;
}

/** Draft back to the API value, or an error message. */
function parse(s: SettingView, d: Exclude<Draft, null>): { value: unknown } | { error: string } {
  if (s.type === "boolean" || s.type === "choice") return { value: d };
  if (s.type === "list") {
    return { value: (d as string).split(/[\s,]+/).map((x) => x.trim()).filter(Boolean) };
  }
  const text = (d as string).trim().replace(",", ".");
  const n = Number(text);
  if (text === "" || !Number.isFinite(n)) return { error: `${s.label}: isi dengan angka.` };
  if (s.type === "integer" && !Number.isInteger(n)) return { error: `${s.label}: harus bilangan bulat.` };
  if (s.min !== undefined && n < s.min) return { error: `${s.label}: minimal ${s.min}.` };
  if (s.max !== undefined && n > s.max) return { error: `${s.label}: maksimal ${s.max}.` };
  return { value: n };
}

function sameValue(s: SettingView, d: Exclude<Draft, null>): boolean {
  const p = parse(s, d);
  return "value" in p && JSON.stringify(p.value) === JSON.stringify(s.value);
}

function Field({ s, draft, onDraft }: { s: SettingView; draft: Draft | undefined; onDraft: (d: Draft | undefined) => void }) {
  const id = `set-${s.key}`;
  const resetting = draft === null;
  const current = draft === undefined || draft === null ? toText(s, resetting ? s.envValue : s.value) : draft;
  const set = (d: string | boolean) => onDraft(sameValue(s, d) && !resetting ? undefined : d);

  return (
    <div className={`setting${draft !== undefined ? " is-dirty" : ""}`}>
      <div className="setting__text">
        <Label htmlFor={id} className="setting__label">
          {s.label}
        </Label>
        {s.help && <p className="setting__help">{s.help}</p>}
        <p className="setting__env">
          {resetting
            ? `Akan kembali ke nilai .env (${show(s, s.envValue)}) setelah disimpan.`
            : s.overridden
              ? `Diubah dari dashboard. Nilai .env: ${show(s, s.envValue)}.`
              : `Dari .env (${s.env}).`}
        </p>
        {s.overridden && !resetting && (
          <Button type="button" variant="link" className="h-auto justify-start p-0 text-xs" onClick={() => onDraft(null)}>
            Kembalikan ke nilai .env
          </Button>
        )}
        {resetting && (
          <Button type="button" variant="link" className="h-auto justify-start p-0 text-xs" onClick={() => onDraft(undefined)}>
            Batal kembalikan
          </Button>
        )}
      </div>

      <div className="setting__control">
        {s.type === "boolean" ? (
          <Switch id={id} checked={current as boolean} onCheckedChange={(v) => set(v)} />
        ) : s.type === "choice" ? (
          <ToggleGroup
            id={id}
            type="single"
            value={current as string}
            onValueChange={(v) => v && set(v)}
            variant="outline"
            aria-label={s.label}
            size="sm"
            className="flex-nowrap justify-end"
          >
            {s.options?.map((o) => (
              <ToggleGroupItem
                key={o.value}
                value={o.value}
                className="px-2 text-xs whitespace-nowrap data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {o.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : s.type === "list" ? (
          <Textarea
            id={id}
            rows={3}
            className="w-72 max-w-full font-mono text-xs"
            value={current as string}
            placeholder="Alamat mint, satu per baris"
            spellCheck={false}
            onChange={(e) => set(e.target.value)}
          />
        ) : (
          <div className="input-unit">
            <Input
              id={id}
              className="w-28 text-right"
              type="text"
              inputMode={s.type === "integer" ? "numeric" : "decimal"}
              value={current as string}
              onChange={(e) => set(e.target.value)}
            />
            {s.unit && <span className="input-unit__unit">{s.unit}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function ConfigEditor() {
  const [view, setView] = useState<SettingsView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .settings()
      .then((v) => alive && (setView(v), setLoadError(null)))
      .catch((e: Error) => alive && setLoadError(e.message));
    return () => {
      alive = false;
    };
  }, [attempt]);

  const byKey = useMemo(() => new Map(view?.groups.flatMap((g) => g.settings.map((s) => [s.key, s] as const))), [view]);
  const dirty = Object.keys(drafts).length;

  const onDraft = (key: string, d: Draft | undefined) => {
    setSavedAt(null);
    setProblems([]);
    setDrafts((prev) => {
      const next = { ...prev };
      if (d === undefined) delete next[key];
      else next[key] = d;
      return next;
    });
  };

  const save = async () => {
    const values: Record<string, unknown> = {};
    const errs: string[] = [];
    for (const [key, d] of Object.entries(drafts)) {
      const s = byKey.get(key);
      if (!s) continue;
      if (d === null) {
        values[key] = null;
        continue;
      }
      const p = parse(s, d);
      if ("error" in p) errs.push(p.error);
      else values[key] = p.value;
    }
    if (errs.length > 0) {
      setProblems(errs);
      return;
    }
    setSaving(true);
    setProblems([]);
    try {
      setView(await api.updateSettings(values));
      setDrafts({});
      setSavedAt(Date.now());
    } catch (e) {
      setProblems(e instanceof ApiError && e.problems.length > 0 ? e.problems : [(e as Error).message]);
    } finally {
      setSaving(false);
    }
  };

  if (loadError && !view) {
    return (
      <div className="empty" role="alert">
        <p className="empty__title">Konfigurasi gagal dimuat.</p>
        <p className="muted">{loadError}</p>
        <Button type="button" variant="secondary" onClick={() => setAttempt((a) => a + 1)}>
          Muat ulang konfigurasi
        </Button>
      </div>
    );
  }
  if (!view) {
    return (
      <p className="muted" role="status">
        Memuat konfigurasi...
      </p>
    );
  }

  return (
    <>
      {view.groups.map((g) => (
        <Card key={g.id} role="region" className="settings-group gap-3 border-0 p-3.5 shadow-none" aria-labelledby={`group-${g.id}`}>
          <div className="settings-group__head">
            <h2 id={`group-${g.id}`} className="card__title">
              {g.label}
            </h2>
            <p className="card__meta">{g.help}</p>
          </div>
          <div className="settings-group__list">
            {g.settings.map((s) => (
              <Field key={s.key} s={s} draft={drafts[s.key]} onDraft={(d) => onDraft(s.key, d)} />
            ))}
          </div>
        </Card>
      ))}

      {(dirty > 0 || problems.length > 0 || savedAt) && (
        <div className="savebar" role="region" aria-label="Simpan perubahan">
          <div className="savebar__text">
            {problems.length > 0 ? (
              <ul className="savebar__errors" role="alert">
                {problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            ) : dirty > 0 ? (
              <p>{dirty} perubahan belum disimpan. Berlaku mulai siklus berikutnya.</p>
            ) : (
              <p role="status">Tersimpan. Bot memakai nilai baru mulai siklus berikutnya.</p>
            )}
          </div>
          {dirty > 0 && (
            <div className="savebar__actions">
              <Button type="button" variant="secondary" onClick={() => (setDrafts({}), setProblems([]))} disabled={saving}>
                Batalkan
              </Button>
              <Button type="button" onClick={save} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan perubahan"}
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

interface Props {
  snapshot: Snapshot;
  theme: Theme;
  onTheme: (t: Theme) => void;
  paused: boolean;
  pauseBusy: boolean;
  pauseError: string | null;
  onTogglePause: () => void;
}

export function SettingsScreen(p: Props) {
  const snap = p.snapshot;
  return (
    <div className="settings">
      <div className="settings-top">
        <Card role="region" className="gap-2 border-0 p-3.5 shadow-none" aria-labelledby="opening-title">
          <h2 id="opening-title" className="tile__label">
            Buka posisi baru
          </h2>
          <p className="setting__help">
            {p.paused
              ? "Sedang dijeda. Posisi yang ada tetap dikelola dan ditutup sesuai aturan."
              : "Aktif. Bot boleh membuka posisi kalau ada kandidat yang lolos."}
          </p>
          <Button
            type="button"
            variant={p.paused ? "default" : "outline"}
            onClick={p.onTogglePause}
            disabled={p.pauseBusy}
            className="justify-self-start"
          >
            {p.pauseBusy ? "Menyimpan..." : p.paused ? "Lanjutkan buka posisi" : "Jeda buka posisi baru"}
          </Button>
          {p.pauseError && (
            <p className="error-text" role="alert">
              Gagal menyimpan: {p.pauseError}
            </p>
          )}
        </Card>

        <Card role="region" className="gap-2 border-0 p-3.5 shadow-none" aria-labelledby="theme-title">
          <h2 id="theme-title" className="tile__label">
            Tampilan
          </h2>
          <ToggleGroup
            type="single"
            value={p.theme}
            onValueChange={(v) => v && p.onTheme(v as Theme)}
            variant="outline"
            aria-labelledby="theme-title"
            className="justify-start"
          >
            {THEMES.map((t) => (
              <ToggleGroupItem key={t.id} value={t.id} className="px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                {t.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Card>
      </div>

      <ConfigEditor />

      <Card role="region" className="settings-group gap-3 border-0 p-3.5 shadow-none" aria-labelledby="fixed-title">
        <div className="settings-group__head">
          <h2 id="fixed-title" className="card__title">
            Hanya dari backend/.env
          </h2>
          <p className="card__meta">Butuh restart backend. Tidak bisa diubah dari sini karena menyangkut kunci atau uang asli.</p>
        </div>
        <dl className="facts facts--wide">
          <div>
            <dt>Mode</dt>
            <dd>{snap.dryRun ? "Paper (DRY_RUN=true)" : "Live, transaksi sungguhan"}</dd>
          </div>
          <div>
            <dt>Pengambil keputusan entry</dt>
            <dd>{snap.llm ?? "Rule engine (AI mati)"}</dd>
          </div>
          <div>
            <dt>Penyimpanan</dt>
            <dd>{snap.storage ?? "Tidak diketahui"}</dd>
          </div>
          <div>
            <dt>Wallet bot</dt>
            <dd className="mono">{snap.wallet}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
