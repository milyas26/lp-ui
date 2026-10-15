# lp-agent: frontend (dashboard)

Dashboard pemantau bot di [`../backend`](../backend). Dirancang untuk HP dulu, lalu melebar ke tablet dan desktop.

## Yang ditampilkan

- **Sekarang**: apa yang sedang dikerjakan bot (langkah yang berjalan + lamanya, atau hitung mundur ke siklus berikutnya), hasil hari ini, modal, kondisi SOL, modal terpasang terhadap batas, kartu **Keputusan AI**, dan tangga langkah siklus berjalan. Kartu Keputusan AI menampilkan keputusan terakhir (pool, bin step, shape, range, jumlah bin, size, keyakinan, SL/TP, alasan), perbandingan bin step yang dipertimbangkan AI (tiap pool digambar sebagai deretan bin terhadap batas maksimum), tabel simulasi, dan jejak lengkap putaran AI. Kalau AI sedang menimbang di siklus baru, statusnya muncul sebagai strip di atas keputusan terakhir. 30 siklus terakhir bisa dibuka satu per satu.
- **Posisi**: tiap posisi terbuka dengan P&L, bin step, siapa yang memilih (AI dan keyakinannya, atau rule engine), bin strip (seberapa dalam harga masuk ke range), deposit, nilai, fee, stop loss / take profit, umur, dan alasan posisi dibuka.
- **Jurnal**: semua open, close, claim, dan kandidat yang dilewati, bisa disaring.
- **Pengaturan**: tema (terang sebagai bawaan / gelap / ikuti HP), jeda buka posisi baru, token API, pengambil keputusan entry.

Data datang lewat Server-Sent Events, jadi layar bergerak sendiri tanpa refresh. Kalau backend diam lebih dari 40 detik, status berubah jadi "Terputus" dan dashboard menyambung ulang tiap 5 detik.

## Jalankan

```bash
npm install
```

```bash
npm run dev
```

Vite meneruskan `/api` ke backend di `127.0.0.1:8787`. Untuk produksi, `npm run build` lalu sajikan `dist/` (Dockerfile + `nginx.conf` di folder ini sudah melakukannya, termasuk proxy `/api` dan setelan SSE).

Kalau frontend di-host di domain berbeda dari backend, isi `VITE_API_BASE` (lihat `.env.example`) dan `API_CORS_ORIGIN` di backend.

## Desain

Arah desain ada di [DESIGN.md](DESIGN.md). Aturan antislop terpasang di `.claude/skills/` dengan pointer di [CLAUDE.md](CLAUDE.md), jadi sesi Claude Code berikutnya di folder ini otomatis memakainya.
