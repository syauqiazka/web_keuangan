# DESIGN.md — Pencatatan Keuangan Sekolah | Bank Saku Digital

> Lembar kerja keuangan yang tenang: kanvas putih, garis tipis, tinta gelap, satu warna hijau yang hemat.

**Tema dasar:** terang. Tema gelap tersedia (Pengaturan > Mode), lihat bagian "Tema gelap".
**Referensi sumber:** Modern Treasury di Refero Styles
https://styles.refero.design/style/2e9b3dcb-f937-488d-891c-351c7366188f

## 0. Cara membaca file ini

Modern Treasury adalah **situs pemasaran**. Aplikasi ini adalah **alat kerja internal** (sidebar, tabel, formulir, grafik). Maka:

- **[Sumber]** = nilai diambil langsung dari DESIGN.md Refero (warna, font, skala, radius, aturan Do/Don't).
- **[Turunan]** = komponen aplikasi yang tidak ada di situs sumber (sidebar, tabel, tab, formulir, grafik). Dibuat dari token sumber, bukan disalin dari situsnya.
- **[Tambahan]** = token yang tidak ada di sumber tetapi dibutuhkan fitur (merah untuk "belum lunas", palet tema gelap).

Hero 71px, carousel, newsletter, dan footer hijau dari situs sumber **tidak dipakai**.

## 1. Prinsip

1. Putih dan tinta. Hierarki dibangun dari ukuran, bobot, dan garis, bukan dari warna.
2. Angka adalah isi utama. Angka rata kanan, `tabular-nums`, tidak pernah dihias.
3. Hijau hanya untuk hal yang benar-benar perlu ditandai: pemasukan, fokus, penanda kecil.
4. Tidak ada elemen yang tidak membawa informasi. Jika dihapus dan tidak ada yang hilang, hapus.

## 2. Warna

### Token sumber [Sumber]

| Nama | Hex | Peran di aplikasi |
|---|---|---|
| Paper | `#ffffff` | Kanvas halaman, sidebar, input, kartu terang |
| Ink | `#151515` | Teks utama, judul, tombol utama, garis tegas |
| Graphite | `#424242` | Teks isi sekunder |
| Steel | `#706f6f` | Metadata, teks bantu, placeholder |
| Rule Gray | `#dcdcdc` | Garis tipis: pemisah baris, grid, border kartu |
| Edge Gray | `#cbcac8` | Border input dan kontainer yang perlu lebih tegas |
| Ice Panel | `#f0f8f9` | Blok ringkasan (Total Saldo), baris hover, sel sedang diedit |
| Network Green | `#29735c` | Seri Pemasukan di grafik, cincin fokus, tanda kecil |
| Ledger Brown | `#7b5953` | Label mono kecil dan status "Belum disimpan" |
| Forest Ledger | `#0c221d` | Cadangan. Tidak dipakai di layar aplikasi. |
| Plum Ledger | `#543b4e` | Tidak dipakai. |
| Mint Subscription | `#bae0cf` | Tidak dipakai. |

### Token tambahan [Tambahan]

| Nama | Hex | Peran |
|---|---|---|
| Alert Red | `#b42318` | Nominal "belum lunas" dan pesan galat. Kontras 6,6:1 di atas putih. |

Alert Red dipakai **hanya** untuk dua hal: nominal kurang bayar dan galat validasi. Selalu disertai teks ("Belum lunas", pesan galat), tidak mengandalkan warna saja.

### Aturan warna

- Dilarang: teks isi berwarna hijau atau cokelat. Hijau/cokelat bukan warna paragraf.
- Dilarang: gradien dalam bentuk apa pun, warna di luar tabel ini, atau kelas warna bawaan Tailwind (palet bawaan dimatikan di `@theme`, lihat bagian 9).
- Grafik batang: **Pemasukan = Network Green**, **Pengeluaran = Ink**. Dua warna ini dibedakan oleh kecerahan, jadi tetap terbaca untuk buta warna merah-hijau.

## 3. Tipografi

Font sumber (mt-neue-*, mt-sans, mt-mono) berbayar. Pengganti gratis yang disarankan oleh sumber, dimuat dengan `next/font/google`:

| Peran | Font | Bobot | Catatan |
|---|---|---|---|
| Display / judul | Manrope | **450** | Variabel, jadi bobot 450 valid. Jangan 600/700. |
| Judul fitur | Manrope | 400 | |
| Isi, tabel, tombol, navigasi | Inter | 360 isi, 500 navigasi, 600 kontrol | Variabel. |
| Label teknis, Kode UID | IBM Plex Mono | 500 | Tidak variabel, bobot 500 saja. |

```ts
// src/app/fonts.ts
import { Manrope, Inter, IBM_Plex_Mono } from "next/font/google";

export const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
export const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"], weight: ["500"], variable: "--font-plex-mono", display: "swap",
});
```

### Skala untuk aplikasi [Turunan dari skala 1,2 sumber]

| Peran | Font | Ukuran / tinggi baris | Bobot |
|---|---|---|---|
| `stat-primary` (Total Saldo) | Manrope | 47px / 1,25 | 450 |
| `page-title`, `stat` (Pemasukan, Pengeluaran) | Manrope | 32px / 1,25 | 400 |
| `section-title` | Manrope | 21px / 1,3 | 400 |
| `body` | Inter | 16px / 1,5 | 360 |
| `table`, `nav`, `control` | Inter | 14px / 1,5 | 400 / 500 / 600 |
| `label-mono`, `uid` | IBM Plex Mono | 14px / 1,2 | 500 |

Aturan: semua angka uang memakai `font-variant-numeric: tabular-nums`. Letter-spacing selalu normal. Tidak ada huruf kapital semua kecuali singkatan (TF, ST, SPP).

## 4. Ruang dan bentuk [Sumber]

- Satuan dasar 4px (sama dengan skala spacing bawaan Tailwind).
- Lebar konten maksimum **1200px** untuk Dashboard dan formulir. Tabel data boleh selebar area konten dan bergulir horizontal.
- Jarak antar-bagian 48px, padding kartu 24px, jarak antar-elemen kecil 8px.
- Radius: kartu **8px**, tombol **2px**, kontrol navigasi **4px**, input **0px**. Tidak ada radius lain. Tidak ada `rounded-full`.
- Bayangan: **tidak ada** pada kartu, sidebar, dan tabel. Pemisah memakai garis 1px. Bayangan satu-satunya (sumber) hanya untuk dialog dan popover: `0 20px 25px -5px rgb(0 0 0 / .04), 0 8px 10px -6px rgb(0 0 0 / .04)`, selalu dengan border 1px Edge Gray.

## 5. Kerangka aplikasi [Turunan]

```
┌──────────────┬───────────────────────────────────────────────┐
│ [logo]       │  Judul halaman                 Tahun / Filter │
│ Pencatatan   │───────────────────────────────────────────────│
│ Keuangan     │                                               │
│ Sekolah      │   isi halaman (maks 1200px, kecuali tabel)    │
│ Bank Saku    │                                               │
│ Digital      │                                               │
│──────────────│                                               │
│ Dashboard    │                                               │
│ Data Siswa & │                                               │
│  Guru        │                                               │
│ Pemasukan    │                                               │
│ Pengeluaran  │                                               │
│ Pengaturan   │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

- Sidebar 240px, latar Paper, garis kanan 1px Rule Gray. Urutan menu mengikuti spreadsheet: **Dashboard, Data Siswa & Guru, Pemasukan, Pengeluaran, Pengaturan**.
- Blok atas sidebar: logo 40×40px (`assets/logo-bank-saku-digital.jpeg`, jangan diwarnai ulang atau diberi bingkai tambahan) di samping teks "Pencatatan Keuangan Sekolah" (14px/600) dan "Bank Saku Digital" (14px/360, Steel).
- Item menu: 14px/500, tinggi 36px, padding 8px 12px, radius 4px. Aktif = outline 1px Ink (inset) dan bobot 600. Hover = latar Ice Panel. Tanpa ikon dekoratif; ikon 16px garis 1,5 boleh dipakai bila membantu, monokrom Ink.
- Di bawah 1024px: sidebar menjadi bar atas dengan tombol menu. Isi halaman satu kolom.

## 6. Komponen [Turunan]

**Tombol utama** — latar Ink, teks Paper 14px/600, padding 6px 12px (kecil) atau 8px 16px (standar), radius 2px, border 1px Ink. Dipakai untuk Simpan dan Tarik Data.
**Tombol sekunder** — transparan, teks Ink, outline 1px Ink inset, radius 4px. Dipakai untuk Input, Tambah Baris, Tambah Kolom, Batal.
**Tombol bahaya** — sama dengan sekunder, teks dan outline Alert Red. Hanya untuk hapus dan nonaktifkan; selalu lewat dialog konfirmasi berisi nama data yang dihapus.
**Input / select** — latar Paper, border 1px Edge Gray, radius 0, padding 8px 12px, teks 16px (14px di dalam sel tabel). Label di atas input, 14px/500 Ink. Fokus: outline 2px Network Green offset 2px. Galat: border Alert Red + pesan 14px Alert Red di bawah input.
**Tab** (Dari Siswa / Bantuan / Donatur) — baris teks 14px/500 di atas garis 1px Rule Gray. Aktif: teks Ink 600 + garis bawah 2px Ink. Tidak aktif: Steel.
**Blok ringkasan** — Total Saldo: latar Ice Panel, radius 8px, padding 24px, tanpa border dan tanpa bayangan. Pemasukan/Pengeluaran: latar Paper, border 1px Rule Gray, radius 8px, padding 24px. Isi: label mono 14px Ledger Brown di atas, angka di bawahnya, jarak 8px.
**Tabel data** — lihat bagian 7.
**Dialog** — Paper, border 1px Edge Gray, radius 8px, padding 24px, bayangan sumber. Judul 21px. Tombol di kanan bawah, utama paling kanan. Overlay `rgb(21 21 21 / .4)` tanpa blur.
**Toast** — kotak Paper, border 1px Edge Gray, radius 4px, teks 14px, hilang sendiri setelah 5 detik, tanpa ikon berwarna.
**Keadaan kosong** — satu kalimat biasa dan satu tombol bila ada aksi. Contoh: "Belum ada pengeluaran pada Oktober 2026." Tanpa ilustrasi.
**Memuat** — teks "Memuat…" atau kotak abu Rule Gray statis. Tanpa shimmer, tanpa spinner dekoratif.

## 7. Tabel data dan grid entri [Turunan]

Ini komponen terpenting. Spreadsheet meminta perilaku seperti lembar kerja: Tambah Baris, Tambah Kolom, Enter, Simpan.

- Garis horizontal 1px Rule Gray antar-baris. Garis vertikal hanya antar-grup kolom (misal antara grup SPP dan grup Daftar Ulang), memakai Edge Gray. Tanpa zebra.
- Header kolom: 14px/600 Ink, border bawah 1px Edge Gray. Header grup (SPP, Daftar Ulang) rata tengah di atas sub-kolomnya.
- Tinggi baris 40px. Sel teks rata kiri, **sel angka rata kanan**, `tabular-nums`. Format uang: `Rp 1.250.000` (locale `id-ID`, tanpa `,-`, tanpa titik setelah Rp).
- Kolom pertama (No, Nama, Kode UID) menempel (`sticky left-0`) saat tabel digeser; latar Paper agar baris tidak tembus.
- Kode UID: `label-mono`.
- Hover baris: Ice Panel. Sel sedang diedit: latar Paper, outline 1px Ink inset. Baris yang diubah tetapi belum disimpan: sel Ice Panel + teks mono "Belum disimpan" (Ledger Brown) di ujung baris.
- **Enter** menyimpan baris yang sedang diedit. **Tambah Baris** menambahkan baris kosong di bawah dan memindahkan fokus ke sel pertamanya. Tab/Shift+Tab berpindah sel. Esc membatalkan perubahan sel.
- **Belum lunas:** nominal ditulis Alert Red 600, dan di bawahnya teks 14px Alert Red `kurang Rp 50.000`. Nominal lunas tetap Ink.
- Total di kaki tabel: baris dengan border atas 1px Ink, label "Total", angka 600.
- Di bawah 640px, tabel tetap tabel (bergulir horizontal di dalam wadahnya). Jangan diubah menjadi tumpukan kartu.

## 8. Layout per halaman

**Login** — satu kolom, lebar 360px di tengah, latar Paper. Logo 56px, judul "Masuk" 32px, dua field (Kode, Kata sandi), satu tombol utama penuh lebar. Tanpa gambar latar, tanpa kutipan, tanpa "Lupa kata sandi" (admin yang mengatur ulang; tulis: "Hubungi admin untuk mengatur ulang kata sandi.").

**Dashboard** — header: judul "Dashboard", pilihan **Tahun** di kanan. Baris 1: tiga blok ringkasan (Total Saldo Dana Sekolah dengan angka 47px dan latar Ice Panel; Pemasukan; Pengeluaran). Baris 2: grafik batang 12 bulan (Jan–Des) dengan dua seri berdampingan. Spesifikasi grafik:
- Digambar sebagai **SVG dari server component**, tanpa library grafik, tanpa animasi.
- Garis kisi horizontal 1px Rule Gray, sumbu Y berlabel "Juta Rp", sumbu X singkatan bulan. Tanpa kisi vertikal.
- Batang radius 0, lebar sama, celah antar-bulan jelas. Nilai tertulis di atas batang hanya bila muat; selain itu lewat tooltip sederhana (kotak Paper, border Edge Gray, teks 14px).
- Legenda teks "Pemasukan" / "Pengeluaran" dengan kotak warna 12px di atas grafik.
- Alternatif teks: `<details>` "Lihat sebagai tabel" berisi tabel 12 baris yang sama.

**Data Siswa & Guru** — header: judul dan filter **Tahun Ajaran**, **Kelas** (atau "Guru"). Tabel: No, Nama, Kelas, Kode UID. Tombol: Input (membuka dialog tambah: Tahun Ajaran, Kelas/Guru, Nama, Kode UID), Simpan, Tambah Baris.

**Pemasukan** — header: judul, filter **Tahun Ajaran**, **Kelas**, **Bulan**, tombol **Tarik Data**. Di bawahnya: "Jumlah Pemasukan Bulan Ini" dan "Total Pemasukan Per Tahun" sebagai blok ringkasan, lalu baris rincian per jenis (SPP, Daftar Ulang, Uang Gedung, ... , Bantuan, Donatur) berupa daftar label-angka, bukan kartu berwarna. Lalu tab **Dari Siswa / Bantuan / Donatur**.
- Tab Dari Siswa: grid lebar bergrup kolom per jenis pemasukan. Tombol **Input** membuka dialog pengelolaan jenis; **Tambah Kolom** menambah jenis pemasukan baru.
- Tab Bantuan dan Donatur: tabel No, Jenis Bantuan (atau Nama Donatur), Tanggal, Nominal, Petugas, plus Tambah Baris.

**Pengeluaran** — header: judul, filter **Tahun Ajaran**, **Bulan**, tombol **Tarik Data**. Blok ringkasan "Jumlah Pengeluaran Bulan Ini" dan "Total Pengeluaran Per Tahun". Tabel: No, Tanggal, Jenis Pengeluaran, Nominal, Petugas. Tombol Input, Simpan, Tambah Baris.

**Pengaturan** — daftar vertikal tiga baris dengan garis pemisah: **Ganti Kata Sandi** (dialog), **Mode** (pilihan Terang / Gelap / Sistem, radio biasa), **Keluar**. Untuk ADMIN ditambah baris **Kelola Akun** (lihat AGENTS.md, bagian "Tambahan di luar spreadsheet").

## 9. Tailwind v4 (`src/app/globals.css`) [Sumber + Tambahan]

Palet bawaan Tailwind **dimatikan** supaya tidak ada yang bisa memakai `bg-indigo-500` atau `from-purple-400` tanpa sengaja. Komponen memakai token semantik, jadi **tidak ada kelas `dark:`**.

```css
@import "tailwindcss";

/* Token statis [Sumber] */
@theme {
  --color-*: initial;
  --shadow-*: initial;
  --radius-*: initial;

  --color-paper: #ffffff;
  --color-ink: #151515;
  --color-graphite: #424242;
  --color-steel: #706f6f;
  --color-rule: #dcdcdc;
  --color-edge: #cbcac8;
  --color-ice: #f0f8f9;
  --color-network-green: #29735c;
  --color-ledger-brown: #7b5953;
  --color-alert: #b42318;      /* [Tambahan] */

  --radius-button: 2px;
  --radius-control: 4px;
  --radius-card: 8px;
  --radius-input: 0px;
  --shadow-overlay: 0 20px 25px -5px rgb(0 0 0 / .04), 0 8px 10px -6px rgb(0 0 0 / .04);

  --font-display: var(--font-manrope), ui-sans-serif, system-ui, sans-serif;
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-plex-mono), ui-monospace, SFMono-Regular, Menlo, monospace;
}

/* Token semantik yang berganti saat tema berubah */
:root {
  --canvas: #ffffff;
  --panel: #f0f8f9;
  --text: #151515;
  --text-2: #424242;
  --text-3: #706f6f;
  --line: #dcdcdc;
  --line-strong: #cbcac8;
  --on-ink: #ffffff;
  --accent: #29735c;
  --accent-text: #29735c;
  --series-in: #29735c;
  --series-out: #151515;
  --danger: #b42318;
  --label: #7b5953;
}

/* [Tambahan] Tema gelap: turunan, tidak ada di situs sumber */
:root[data-theme="dark"] {
  --canvas: #0e1411;
  --panel: #16201c;
  --text: #f1f3f2;
  --text-2: #c3c9c6;
  --text-3: #8f9a95;
  --line: #25302b;
  --line-strong: #34413b;
  --on-ink: #0e1411;
  --accent: #29735c;
  --accent-text: #6fc3a5;
  --series-in: #6fc3a5;
  --series-out: #e6e8e7;
  --danger: #f2877d;
  --label: #c9a79f;
}
@media (prefers-color-scheme: dark) {
  :root[data-theme="system"] {
    --canvas: #0e1411; --panel: #16201c; --text: #f1f3f2; --text-2: #c3c9c6;
    --text-3: #8f9a95; --line: #25302b; --line-strong: #34413b; --on-ink: #0e1411;
    --accent: #29735c; --accent-text: #6fc3a5; --series-in: #6fc3a5;
    --series-out: #e6e8e7; --danger: #f2877d; --label: #c9a79f;
  }
}

/* Utilitas semantik: bg-canvas, bg-panel, text-text, border-line, ... */
@theme inline {
  --color-canvas: var(--canvas);
  --color-panel: var(--panel);
  --color-text: var(--text);
  --color-text-2: var(--text-2);
  --color-text-3: var(--text-3);
  --color-line: var(--line);
  --color-line-strong: var(--line-strong);
  --color-on-ink: var(--on-ink);
  --color-accent: var(--accent);
  --color-accent-text: var(--accent-text);
  --color-series-in: var(--series-in);
  --color-series-out: var(--series-out);
  --color-danger: var(--danger);
  --color-label: var(--label);
}

body { background: var(--canvas); color: var(--text); font-family: var(--font-sans); font-weight: 360; }
.num { font-variant-numeric: tabular-nums; }
```

Penggunaan: tombol utama = `bg-text text-on-ink` (Ink di tema terang, terbalik di tema gelap). Permukaan = `bg-canvas`, `bg-panel`. Garis = `border-line`, `border-line-strong`. Token statis (`paper`, `ink`, ...) hanya untuk gambar/ekspor yang memang tidak berubah tema.

Nilai tema gelap adalah turunan saya dari palet sumber (hijau diterangkan agar teks lolos kontras 4,5:1; seri grafik dibedakan oleh kecerahan). Periksa visual di perangkat nyata sebelum rilis.

## 10. Gambar dan ikon

- Satu-satunya gambar: logo Bank Saku Digital.
- **Gambar grafik di spreadsheet (latar kartun, koin, kalkulator, daun, batang 3D hijau-biru) hanya contoh data, bukan arahan visual.** Jangan ditiru. Grafik asli dibuat sesuai bagian 8.
- Ikon: lucide-react 16px, garis 1,5, warna `currentColor`. Hanya untuk aksi (menu, tutup, panah dropdown, kalender). Tidak ada ikon di lingkaran/kotak berwarna, tidak ada ikon hiasan di samping judul.

## 11. Nada tulisan (Bahasa Indonesia)

- Pakai istilah dari spreadsheet: Total Saldo Dana Sekolah, Pemasukan, Pengeluaran, Tahun Ajaran, Tarik Data, Input, Simpan, Tambah Baris, Tambah Kolom, Petugas, Kode UID.
- Kalimat pendek, netral, tanpa tanda seru, tanpa emoji, tanpa sapaan basa-basi.
- Galat menyebut masalah dan cara memperbaikinya: "Nominal harus berupa angka lebih dari 0." Bukan "Oops, terjadi kesalahan!".
- Tanggal tampil `13 Okt 2026` (tabel) atau `13-10-2026` (input), sesuai spreadsheet. Bulan penuh di judul: "Oktober 2026".

## 12. Daftar larangan (periksa sebelum setiap commit UI)

Visual
- [ ] Tidak ada gradien (latar, teks, border, tombol).
- [ ] Tidak ada glassmorphism, `backdrop-blur`, glow, bayangan berwarna, blob/orb/mesh.
- [ ] Tidak ada ungu, indigo, violet, biru-neon. Tidak ada warna di luar bagian 2.
- [ ] Tidak ada radius di atas 8px, tidak ada `rounded-full`, tidak ada `rounded-xl/2xl/3xl`.
- [ ] Tidak ada kartu dengan border kiri berwarna sebagai penanda.
- [ ] Tidak ada ikon di lingkaran berwarna, tidak ada ikon "sparkles", tidak ada emoji sebagai ikon.
- [ ] Tidak ada ilustrasi 3D/isometrik/stok, foto stok, atau gambar latar.
- [ ] Tidak ada animasi hitung naik, efek mengangkat saat hover (`-translate-y`, `scale`), shimmer, atau parallax. Satu-satunya transisi: warna 120ms.
- [ ] Tidak ada tata letak bento, tidak ada kartu KPI dengan panah tren dan persentase karangan.
- [ ] Tidak ada komponen shadcn/ui yang disalin mentah dengan gaya bawaannya. Radix Primitives boleh dipakai sebagai perilaku, gayanya dari token di sini.

Isi
- [ ] Tidak ada data contoh di halaman produksi: tidak ada "Lorem ipsum", "John Doe", angka karangan, testimoni.
- [ ] Tidak ada kata pemasaran ("powerful", "seamless", "revolusioner", "all-in-one") dan tidak ada sapaan "Selamat datang kembali 👋".
- [ ] Setiap angka di layar berasal dari database.

Aksesibilitas
- [ ] Kontras teks minimal 4,5:1, elemen grafis minimal 3:1, di kedua tema.
- [ ] Semua kontrol bisa dioperasikan dengan keyboard; fokus selalu terlihat.
- [ ] Warna tidak pernah menjadi satu-satunya pembeda (belum lunas = merah **dan** teks "kurang Rp ...").
- [ ] Target sentuh minimal 40px tingginya di layar sentuh.
