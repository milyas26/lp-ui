# lp-agent: frontend (dashboard)

Dashboard pemantau bot di [`../backend`](../backend). Dirancang untuk HP dulu, lalu melebar ke tablet dan desktop.

## Yang ditampilkan

Semua ada di satu halaman, tanpa pindah layar:

- **Command center**: hero dengan hasil hari ini sebagai angka besar, ditemani modal (bebas dan terpasang terhadap batas), slot posisi, harga SOL, dan hasil posisi terakhir ditutup. Posisi jadi tabel utama di kolom kiri, keputusan AI di bawahnya, aktivitas di rail kanan.
- **Stepper siklus**: enam langkah (cek SOL, kelola posisi, izin buka, screening, keputusan, buka posisi) sebagai node bernomor yang bisa diklik. Langkah selesai emerald, langkah aktif berdenyut halus, yang dilewati/gagal dibedakan. Klik node untuk melihat detail langkah itu; rincian lengkap ada di disclosure.
- **Posisi**: satu baris per posisi terbuka (P&L, nilai, fee, umur, seberapa dalam harga masuk range) dengan tombol Detail dan Tutup. Tab Riwayat dan Di luar bot ada di kartu yang sama. Detail posisi menampilkan pergerakan harga pool terhadap bin posisi (band range + garis putus-putus harga masuk) dan tabel simulasi IL sesuai metode DLMM.
- **Keputusan AI**: keputusan terakhir, perbandingan bin step, simulasi, dan jejak putaran AI (dilipat supaya ringkas).
- **Aktivitas**: jurnal (open, close, claim, kandidat dilewati, bisa disaring) dan riwayat siklus, menempel di kanan dan bisa digulir sendiri.
- **Pengaturan** dibuka dari ikon gir di bilah atas: tema, jeda buka posisi baru, dan konfigurasi bot.

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

## Komponen UI

Komponen dasar (tombol, tab, dialog, kartu, switch, input, tooltip, dan lainnya) memakai [shadcn/ui](https://ui.shadcn.com) di `src/components/ui`, di atas Tailwind v4 dan Radix. Warna shadcn dipetakan ke palet dashboard di `src/index.css`, jadi tema terang, gelap, dan ikuti perangkat tetap diatur dari `src/styles.css`. Tambah komponen baru dengan:

```bash
npx shadcn@latest add <nama-komponen>
```

Komponen shadcn terbaru memakai `ref` sebagai prop, jadi project ini butuh React 19.

## Desain

Arah desain ada di [DESIGN.md](DESIGN.md). Aturan antislop terpasang di `.claude/skills/` dengan pointer di [CLAUDE.md](CLAUDE.md), jadi sesi Claude Code berikutnya di folder ini otomatis memakainya.
