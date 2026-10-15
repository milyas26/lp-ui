import { useState } from "react";
import { API_BASE, setToken } from "../api";
import type { Link } from "../useBot";

/** Full-screen states shown before the first data arrives. */
export function LinkGate({ link, onRetry }: { link: Link; onRetry: () => void }) {
  const [token, setDraft] = useState("");
  const where = API_BASE || window.location.origin;

  if (link === "unauthorized") {
    return (
      <div className="gate">
        <h2>Masukkan token API</h2>
        <p>
          Backend menolak koneksi karena token salah atau belum diisi. Isi dengan nilai API_TOKEN di backend/.env.
        </p>
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            setToken(token.trim());
            onRetry();
          }}
        >
          <label htmlFor="gate-token" className="visually-hidden">
            Token API
          </label>
          <input
            id="gate-token"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="API_TOKEN"
            required
          />
          <button type="submit" className="btn btn--primary">
            Hubungkan
          </button>
        </form>
      </div>
    );
  }

  if (link === "unreachable") {
    return (
      <div className="gate" role="alert">
        <h2>Bot tidak bisa dihubungi</h2>
        <p>
          Dashboard tidak mendapat jawaban dari backend di <span className="mono">{where}/api</span>. Pastikan
          backend jalan (<span className="mono">npm start</span> di folder backend, atau container lp-agent hidup).
        </p>
        <button type="button" className="btn btn--primary" onClick={onRetry}>
          Coba hubungkan lagi
        </button>
      </div>
    );
  }

  return (
    <div className="gate" role="status">
      <h2>Menghubungkan ke bot</h2>
      <p className="muted">Mengambil status, posisi, dan langkah siklus terakhir dari {where}.</p>
    </div>
  );
}
