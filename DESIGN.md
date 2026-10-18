---
name: design
description: Design system for lp-agent web apps. Use when building or restyling dashboard UI, sidebars, cards, data viz, stat widgets, and admin layouts. Provides live-inspected tokens (color, type, radius, shadow) and component patterns.
---

# Clean Design System — Dashboard Admin

Referensi style: hasil inspeksi live situs referensi (via BrowserOS neo, 12 Okt 2026). Semua nilai dari `getComputedStyle` langsung, bukan tebakan.

## 1. Karakter Umum

- **Karakter visual:** clean, crisp, "modern fintech". Banyak ruang kosong, sudut bulat konsisten, surface abu **cool** di atas background putih, satu aksen **emerald**.
- **Tone copy:** casual, sapaan waktu ("Selamat sore."), sentence case (bukan Title Case), hangat & personal.
- **Dial:** ENERGY 2 / RHYTHM 1 / MOTION 1 (alat mantau harian, tetap kalem).

## 2. Tipografi

Font system stack (native-feel, bukan webfont custom):
```
-apple-system, "system-ui", "SF Pro Text", "SF Pro Display",
"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
```
(Di macOS jadi SF Pro — itu sebabnya terasa premium. Alternatif konsisten lintas OS: Inter.)

| Peran | Size | Weight | Line-height | Tracking |
|---|---|---|---|---|
| H1 / hero | 40px | 600 | 46px | -1.1px (-0.03em) |
| Judul halaman | ~32px | 600 | — | negatif |
| Judul seksi | 20–24px | 600 | — | -0.02em |
| Body / list utama | 15–16px | 500 | — | normal |
| Label grup sidebar | 14px | 600 | — | normal |
| Meta / chip / caption | 13px | 500 | — | normal |

- Angka finansial tampil besar & tebal (nominal), prefix "Rp" lebih kecil, sedikit tabular feel.
- Heading selalu near-black dengan tracking negatif dikit — kunci kesan modern.

## 3. Warna

Palet kecil, disiplin. Hampir semua UI = netral; warna hanya untuk aksen & kategori.

### Netral (cool grey)
| Token | Nilai | Pakai di |
|---|---|---|
| `--bg` / page | `#FFFFFF` | background utama |
| `--surface` | `#F5F7F9` | kartu, chip, tombol sekunder |
| `--surface-2` | `#ECEFF2` | divider, panel inset |
| `--border` | `#E3E7EB` | garis pemisah, border kartu |
| `--text` | `#0B0D10` | teks utama (near-black cool) |
| `--muted` | `#646A73` | label, meta, caption |
| `--ink` | `#0E1013` | tombol primer (bg ink) |

### Aksen (satu warna)
| Token | Nilai | Pakai |
|---|---|---|
| `--brand` (emerald) | `#00A37A` | aksen tunggal: brand, profit positif, meter |
| `--brand-text` | `#0A7A5C` | teks aksen di atas putih (AA) |
| `--brand-tint` | `rgba(0,163,122,0.12)` | badge/ikon background |
| `--up` | `#12A150` | profit |
| `--down` | `#E5484D` | loss |
| `--danger-fill` | `#C62B32` | tombol destructive (teks putih AA) |
| `--ai` (indigo) | `#6366F1` | hanya menandai AI |

Dark mode: canvas `#0B0C0E`, surface `#15171A`, emerald `#10B981`, teks `#F2F3F5`.

Pola konsisten: **background kategori = warna yang sama dengan alpha 0.13**, bukan pastel hardcoded. Gampang di-generate dari satu hex.

## 4. Bentuk, Radius, Shadow

| Token | Nilai |
|---|---|
| Radius kartu | 20px (paling sering) & 24px |
| Radius elemen dalam | 14–18px |
| Radius pill / chip / tombol | `999px` |
| Radius kecil | 3px (badge mini) |
| Shadow (satu-satunya) | `0 1px 2px rgba(16,24,40,.06), 0 4px 14px rgba(16,24,40,.05)` |

- Shadow sangat halus, netral-cool (bukan hitam). Nyaris semua flat; cuma elemen yang benar-benar naik yang dikasih shadow (R-12).
- Hampir semua elemen interaktif = pill (`border-radius: 999px`).

## 5. Layout

- **Shell:** topbar tipis (brand, wallet, status, aksi), lalu satu halaman **Command Center** yang scroll natural (tanpa sidebar).
- **Hero:** satu kartu focal berisi angka besar (hasil hari ini) + metrik pendukung (modal, slot posisi, harga SOL, posisi ditutup). Satu-satunya elemen yang pakai shadow.
- **Body:** dua kolom. Kiri (lebar): **Posisi** (utama) lalu **Keputusan AI**. Kanan (rail): **Aktivitas**.
- **Di bawah hero:** stepper siklus interaktif, 6 langkah bernomor yang bisa diklik, langkah aktif berdenyut halus. Klik langkah menampilkan detailnya; rincian lengkap lewat disclosure.
- **Mobile:** kolom menumpuk (hero, stepper, posisi, keputusan, aktivitas); metrik hero jadi 2 kolom; label stepper disembunyikan (nomor + detail terpilih saja); baris posisi bertumpuk.

## 6. Komponen Kunci

**Tombol**
- Primer: pill, bg `#171717`, teks putih, weight 600, ikon `+` kiri.
- Sekunder: pill, bg `#F5F5F7`, teks `#171717`.
- Icon-button bulat kecil (notif, dark mode, setting) tanpa border.

**Chip / segmented**
- Segmented control pill container `#F5F5F7` dengan pill aktif putih (Bulanan / Tahunan).
- Chip filter: bg surface, radius pill, teks 13px weight 500 + chevron.

**Kartu (list row)**
- Baris besar bg `#F5F5F7`, radius 20px, padding ~14–18px.
- Kiri: ikon dalam lingkaran tint kategori; tengah: judul 16px/600 + meta 13px muted; kanan: nominal (warna danger kalau keluar).
- Kartu "call to action" pakai ilustrasi kecil sebagai aksen.

**Dashboard widgets**
- Stat cap di kanan rail dengan header caps 12px muted + angka besar + CTA gelap penuh lebar.
- Kartu fitur: judul + angka besar + mini bar-chart hijau (sparkline batang).

**Data viz (custom, minimalis)**
- Donut: ring tebal, warna tunggal `--brand` (emerald), teks di tengah.
- Heatmap kalender: sel rounded, intensitas via tint emerald bertingkat, hari ini di-highlight penuh.
- Line chart: satu garis aksen emerald (`#00A37A`) + tooltip pill ink. Grid nyaris tak terlihat.

## 7. Prinsip yang bisa dicontek

1. **Disiplin warna:** netral untuk 90% UI, satu warna aksen + tint 0.13 untuk kategori.
2. **Rounded everywhere:** kartu 20–24px, semua kontrol interaktif pill 999px.
3. **Surface muda di atas putih** (`#F5F5F7`) sebagai pengganti border — murah, bersih.
4. **Type scale kecil tapi kontras:** body 15–16px, heading 40px weight 600, tracking negatif.
5. **Teks near-black `#171717`**, muted `#6B6B70` — jangan pakai hitam murni / abu generic.
6. **Satu elemen hidup**: stepper siklus beranimasi halus sebagai "denyut" bot, sisanya netral.
7. **Copy hangat & personal** bikin app terasa hidup.

## 8. Contoh token siap pakai (CSS)

```css
:root{
  --bg:#FFFFFF;
  --surface:#F5F7F9;
  --surface-2:#ECEFF2;
  --border:#E3E7EB;
  --text:#0B0D10;
  --muted:#646A73;
  --ink:#0E1013;

  --brand:#00A37A;            /* emerald, satu-satunya aksen */
  --brand-text:#0A7A5C;
  --brand-tint:rgba(0,163,122,.12);
  --up:#12A150;
  --up-text:#0A7C3D;
  --down:#E5484D;
  --down-text:#C4272C;
  --danger-fill:#C62B32;
  --ai:#6366F1;

  --radius-card:16px;
  --radius-lg:20px;
  --radius-pill:999px;
  --shadow:0 1px 2px rgba(16,24,40,.06),0 4px 14px rgba(16,24,40,.05);

  --font: -apple-system,"system-ui","SF Pro Text","Segoe UI",
          Roboto,"Helvetica Neue",Arial,sans-serif;
}
```

## 9. Catatan teknis / caveat

- Situs referensi = Expo web; banyak style inline (bukan design token CSS). Nilai di atas di-sample dari elemen nyata.
- Aksen tunggal = emerald. Elemen hidup (stepper siklus) pakai emerald + animasi halus, tetap di bawah dose cap; jangan tambah warna aksen kedua.
- Semua pairing teks sudah dicek pakai `contrast-check.py` (skrip di `.claude/skills/antislop-human/`); cek ulang tiap ganti nilai warna.
