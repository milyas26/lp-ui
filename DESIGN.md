---
name: design
description: Design system for lp-agent web apps. Use when building or restyling dashboard UI, sidebars, cards, data viz, stat widgets, and admin layouts. Provides live-inspected tokens (color, type, radius, shadow) and component patterns.
---

# Clean Design System — Dashboard Admin

Referensi style: hasil inspeksi live situs referensi (via BrowserOS neo, 12 Okt 2026). Semua nilai dari `getComputedStyle` langsung, bukan tebakan.

## 1. Karakter Umum

- **Karakter visual:** clean, airy, "friendly fintech". Banyak ruang kosong, sudut super bulat (rounded), surface abu sangat muda di atas background putih, satu foto hangat sebagai aksen.
- **Tone copy:** casual, sapaan waktu ("Selamat sore."), sentence case (bukan Title Case), hangat & personal.

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

### Netral
| Token | Nilai | Pakai di |
|---|---|---|
| `--bg` / page | `#FFFFFF` | background utama |
| `--surface` | `#F5F5F7` | kartu, sidebar item aktif, chip, tombol sekunder |
| `--surface-2` | `#ECECEF` / `#E3E3E7` | divider, sel kalender |
| `--text` | `#171717` | teks utama (bukan hitam pekat) |
| `--text-muted` | `#6B6B70` | label, meta, caption |
| `--text-faint` | `rgba(23,23,23,0.66)` | teks sekunder tambahan |
| `--ink` | `#171717` | tombol primer (bg hitam) |

### Aksen
| Token | Nilai | Pakai |
|---|---|---|
| `--brand-brown` | `#B07A4F` | aksen hangat, donut chart |
| `--brand-brown-tint` | `rgba(176,122,79,0.14)` | badge/ikon background |
| `--accent-green` | `#1E9E4A` (rgb 30,158,74) | sukses, saldo positif, sparkline |
| `--danger` | `#E11D48` (rose) | nominal negatif, pengeluaran |

### Warna kategori (tint `alpha 0.13` untuk background, warna solid untuk teks/ikon)
`#F0892E` orange · `#14B8A6` teal · `#3B82F6` blue · `#F59E0B` amber · `#0EA5E9` sky · `#E11D48` rose · `#6D6AF0` indigo (tint `#D1D2F5`)

Pola konsisten: **background kategori = warna yang sama dengan alpha 0.13**, bukan pastel hardcoded. Gampang di-generate dari satu hex.

## 4. Bentuk, Radius, Shadow

| Token | Nilai |
|---|---|
| Radius kartu | 20px (paling sering) & 24px |
| Radius elemen dalam | 14–18px |
| Radius pill / chip / tombol | `999px` |
| Radius kecil | 3px (badge mini) |
| Shadow (satu-satunya) | `rgba(40,60,110,0.1) 0px 4px 16px` |

- Shadow sangat halus, warna kebiruan (bukan hitam), blur lebar 16px. Nyaris semua flat.
- Hampir semua elemen interaktif = pill (`border-radius: 999px`).

## 5. Layout

- **Shell:** sidebar kiri fixed (~250px) + area konten.
- **Sidebar:** brand di atas (logo + nama), lalu grup nav dengan label kecil muted:
  - `Keuangan`: Ringkasan, Transaksi, Laporan, Anggaran, Dompet
  - `Fitur`: Streak, Oyenku, Ikuti uangmu, Kekayaan, Kanvas, Peta Oyen, Transit
  - Bottom: kartu upsell Pro, CTA primer "Tambah transaksi", baris akun + status sync.
- **Item nav aktif:** pill `--surface` (#F5F5F7), bukan border/warna. Ikon kiri, teks 15px weight 600.
- **Konten:** judul halaman besar kiri-atas; tombol aksi kanan-atas (pill). Grid: kolom utama lebar + "right rail" kartu ringkas di kanan untuk layar lebar.
- **Hero:** kartu lebar dengan foto (bukan gradient CSS) + overlay teks & input search (pill putih translusen, tombol submit bulat hitam). Radius ~24px.

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
- Donut: ring tebal, warna tunggal `--brand-brown`, teks di tengah.
- Heatmap kalender: sel rounded, intensitas via tint ungu bertingkat, hari ini di-highlight penuh.
- Line chart: satu garis aksen ungu (`#6D6AF0`) + tooltip pill hitam. Grid nyaris tak terlihat.

## 7. Prinsip yang bisa dicontek

1. **Disiplin warna:** netral untuk 90% UI, satu warna aksen + tint 0.13 untuk kategori.
2. **Rounded everywhere:** kartu 20–24px, semua kontrol interaktif pill 999px.
3. **Surface muda di atas putih** (`#F5F5F7`) sebagai pengganti border — murah, bersih.
4. **Type scale kecil tapi kontras:** body 15–16px, heading 40px weight 600, tracking negatif.
5. **Teks near-black `#171717`**, muted `#6B6B70` — jangan pakai hitam murni / abu generic.
6. **Satu hero fotogenik** (hangat/terracotta) sebagai titik emosional, sisanya netral.
7. **Copy hangat & personal** bikin app terasa hidup.

## 8. Contoh token siap pakai (CSS)

```css
:root{
  --bg:#FFFFFF;
  --surface:#F5F5F7;
  --surface-2:#ECECEF;
  --border:#E3E3E7;
  --text:#171717;
  --text-muted:#6B6B70;
  --ink:#171717;

  --brand-brown:#B07A4F;
  --brand-brown-tint:rgba(176,122,79,.14);
  --accent-green:#1E9E4A;
  --danger:#E11D48;

  --radius-card:20px;
  --radius-lg:24px;
  --radius-pill:999px;
  --shadow-card:0 4px 16px rgba(40,60,110,.10);

  --font: -apple-system,"system-ui","SF Pro Text","Segoe UI",
          Roboto,"Helvetica Neue",Arial,sans-serif;
}
```

## 9. Catatan teknis / caveat

- Situs referensi = Expo web; banyak style inline (bukan design token CSS). Nilai di atas di-sample dari elemen nyata.
- Hero background = **foto**, bukan CSS gradient. Kalau mau gradient hangat serupa, arah: `#F0892E → #E8B98A → #9BB0C9` (oranye → krem → biru langit senja).
- Angka warna kategori (indigo kalender) di-approximate dari screenshot; verifikasi ulang kalau dipakai presisi.
