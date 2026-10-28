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

### Token Utama Bank Saku Digital

Identitas merek: **HIJAU + EMAS**. Setiap tombol dan status memiliki peranan fungsional yang jelas (affordance tinggi) sehingga pengguna non-teknis (guru/bendahara) langsung memahami fungsinya.

| Nama Token | Hex Terang | Hex Gelap | Peran di aplikasi |
|---|---|---|---|
| `--brand` | `#29735c` | `#2a7059` | Aksi utama simpan / selesai |
| `--brand-hover` | `#215e4b` | `#2f7d65` | Hover tombol utama hijau |
| `--gold` | `#d4a338` | `#e5a93c` | Aksen merek, mode edit ("Input / Edit"), Saldo card |
| `--gold-hover` | `#c99a2e` | `#d49930` | Hover tombol aksen emas |
| `--gold-soft` | `#fbf3dc` | `#2a200f` | Latar banner mode edit, sel yang belum disimpan |
| `--gold-border` | `#ecd48a` | `#4a3818` | Garis batas banner edit, outline tabel edit |
| `--gold-text` | `#7a5600` | `#f0c25a` | Teks status "Belum disimpan", teks emas di atas latar terang |
| `--income` | `#146340` | `#3dc08f` | Batang/ikon pemasukan kas sekolah |
| `--income-text` | `#146340` | `#5ce0ad` | Teks nominal & label area pemasukan |
| `--income-soft` | `#eef9f2` | `#142920` | Permukaan kartu, header tabel, chip pemasukan |
| `--income-border`| `#a9d9bf` | `#2a6a50` | Garis tepi area pemasukan |
| `--expense` | `#e0604f` | `#c4453b` | Batang/ikon pengeluaran kas sekolah (MERAH) |
| `--expense-text` | `#9a2c20` | `#f28f85` | Teks nominal & label area pengeluaran |
| `--expense-soft` | `#fdf3f2` | `#301a18` | Permukaan kartu, header tabel, chip pengeluaran |
| `--expense-border`| `#e8a49c` | `#7a3a33` | Garis tepi area pengeluaran |
| `--danger` | `#b42318` | `#ef6b61` | Hapus baris, nonaktifkan akun, galat validasi, tunggakan belum lunas |
| `--canvas` | `#f7f8fa` | `#111413` | Kanvas latar belakang utama aplikasi |
| `--surface` | `#ffffff` | `#181d1a` | Latar kartu, modal dialog, formulir, dan tabel |
| `--panel` | `#f0f2f5` | `#202723` | Latar kontrol sekunder, bar navigasi sub-menu |
| `--text` | `#151515` | `#f5f5f5` | Teks judul, label penting, dan angka nominal umum |
| `--text-2` | `#383838` | `#cccccc` | Teks label input dan header tabel netral |
| `--text-3` | `#595959` | `#999999` | Teks pendukung, metadata, subtitle |
| `--line` | `#dcdcdc` | `#2b3530` | Garis batas tipis (border kartu, divider, garis tabel) |
| `--line-strong` | `#a3a3a3` | `#4d5b54` | Border input dan kontrol fokus aktif (kontras >= 3:1) |

### Aturan Kontras & Tema Area

1. **Tema Area Menyebar:** Warna area (Hijau = Pemasukan, Merah = Pengeluaran, Emas = Saldo/Edit) diterapkan ke SELURUH permukaan area tersebut (kartu ringkasan latar `-soft`, border `-border`, angka besar `-text`, header tabel `-soft`, chip rincian, dan batang grafik).
2. **Pemisahan Warna Area vs Tombol Aksi:** Warna tombol tetap mengikuti MAKNA di seluruh halaman. Mode edit = EMAS `accent`, Simpan Perubahan = HIJAU solid `primary`, Batal = netral `secondary`, Hapus = merah garis `danger` + `Trash2`. Tombol Simpan tidak boleh diwarnai merah di halaman Pengeluaran.
3. **Pengeluaran Kembali MERAH:** Pengeluaran menggunakan palet merah fungsional (`--expense` `#e0604f` / `#c4453b`). Merah bahaya (`--danger`) HANYA untuk tombol Hapus/Nonaktifkan, dialog konfirmasi, dan chip tunggakan `KURANG`.
4. **Sidebar Mode Gelap Kontras:** Latar sidebar gelap menggunakan hijau hutan `#17402f` (terang dari kanvas `#111413`, rasio 1,60:1) dengan garis kanan 1px `#3a7a62` (3,65:1), teks `#d6e8df` (9,1:1), dan divider `#2a5a47`.
5. **Aksesibilitas Buta Warna (Red-Green Contrast):** Tingkat terang batang Pemasukan dan Pengeluaran memiliki perbedaan rasio terang >= 2:1 di kedua tema. Teks pada latar `-soft` memenuhi rasio >= 4,5:1.

---

## 6. Komponen Tombol Bermakna

Setiap tombol aksi WAJIB memiliki **ikon Lucide 16px + label teks eksplisit** agar pengguna non-teknis langsung memahami maksud tindakan.

### Varian Tombol (`Button.tsx`)

| Varian | Tampilan Visual | Penggunaan Wajib |
|---|---|---|
| `primary` | Latar hijau solid (`--brand`), teks putih | Simpan Perubahan / Selesai edit (`Check`), Buat Akun (`Check`/`Plus`) |
| `accent` | Latar emas solid (`--gold`), teks gelap (`#151515`) | Masuk mode edit ("Edit Pembayaran Siswa", "Input", "Edit") (`Pencil`) |
| `outline-brand` | Garis tepi hijau (`--brand`), teks hijau | Tambah Baris / Kolom (`Plus`), Terapkan Filter (`Filter`), Aktifkan Akun (`UserCheck`) |
| `secondary` | Latar surface netral, garis netral, teks gelap | Batal edit (`X`), Export Excel (`FileSpreadsheet` hijau) |
| `danger` | Garis tepi merah (`--danger`), teks merah | Tombol Hapus pada baris (`Trash2`), Nonaktifkan Akun (`UserX`) |
| `danger-solid` | Latar merah solid (`--danger`), teks putih | Tombol konfirmasi final dalam modal dialog bahaya |
| `ghost` | Tanpa border, hover lembut | Reset filter (`RotateCcw`), aksi baris sekunder |

**Aturan Hirarki Tombol:** Maksimal **SATU** tombol solid per area kerja.
- Saat mode lihat: tombol solid adalah EMAS `accent` ("Edit Pembayaran Siswa" / "Input").
- Saat mode edit: tombol solid adalah HIJAU `primary` ("Simpan Perubahan"). Tombol Input berubah menjadi `secondary` netral ("Batal").
- Tinggi tombol `sm` minimal 40px pada target sentuh mobile / layar sentuh. Prop `aria-*`, `title`, dan `tabIndex` diteruskan seutuhnya. Efek `scale` dihilangkan.

---

## 7. Tabel data dan grid entri [Turunan]

Ini komponen terpenting. Spreadsheet meminta perilaku seperti lembar kerja: Tambah Baris, Tambah Kolom, Enter, Simpan.

- Garis horizontal 1px Rule Gray antar-baris. Garis vertikal hanya antar-grup kolom (misal antara grup SPP dan grup Daftar Ulang), memakai Edge Gray. Tanpa zebra.
- Header kolom: 14px/600 Ink, border bawah 1px Edge Gray. Header grup (SPP, Daftar Ulang) rata tengah di atas sub-kolomnya.
- Tinggi baris 40px. Sel teks rata kiri, **sel angka rata kanan**, `tabular-nums`. Format uang: `Rp 1.250.000` (locale `id-ID`, tanpa `,-`, tanpa titik setelah Rp).
- Kolom pertama (No, Nama, Kode UID) menempel (`sticky left-0`) saat tabel digeser; latar Paper agar baris tidak tembus.
- Kode UID: `label-mono`.
- Hover baris: Ice Panel. Sel sedang diedit: latar Paper, outline 1px Ink inset. Baris yang diubah tetapi belum disimpan: sel Ice Panel + teks mono "Belum disimpan" (Ledger Brown) di ujung baris. Sel yang gagal validasi: border 1px Alert Red + pesan galat di bawah sel.
- **Dua mode.** Setelah Tarik Data/Enter, tabel hanya-baca (teks biasa, tanpa kotak input). Klik **Input**: sel berubah menjadi kolom isian (input tanpa border sampai difokus), tombol **Tambah Baris** (dan **Tambah Kolom** di Dari Siswa) muncul, tombol Input berganti menjadi **Batal**, tombol **Simpan** (utama) aktif. Simpan menyimpan semua perubahan sekaligus.
- Di dalam sel: **Enter** pindah ke sel di bawah (tidak menyimpan). **Tab/Shift+Tab** pindah sel. **Esc** membatalkan perubahan sel. **Tambah Baris** menambah baris kosong di bawah dan memindahkan fokus ke sel pertamanya.
- **Copy-paste:** gunakan `<table>` asli supaya salin bawaan browser bekerja. Di mode edit, tempel dari Excel mengisi ke bawah dan ke kanan mulai dari sel yang terfokus; baris baru dibuat bila kurang. Tidak ada animasi atau dialog khusus; sel hasil tempel langsung tampil sebagai "Belum disimpan".
- Meninggalkan halaman dengan perubahan yang belum disimpan memunculkan dialog konfirmasi biasa (judul "Perubahan belum disimpan", tombol Tinggalkan dan Tetap di sini).
- **Belum lunas:** nominal ditulis Alert Red 600, dan di bawahnya teks 14px Alert Red `kurang Rp 50.000`. Nominal lunas tetap Ink.
- Total di kaki tabel: baris dengan border atas 1px Ink, label "Total", angka 600.
- Di bawah 640px, tabel tetap tabel (bergulir horizontal di dalam wadahnya). Jangan diubah menjadi tumpukan kartu.

## 8. Layout per halaman

**Login** — satu kolom, lebar 360px di tengah, latar Paper. Logo 56px, judul "Masuk" 32px, dua field (Kode, Kata sandi), satu tombol utama penuh lebar. Tanpa gambar latar, tanpa kutipan, tanpa "Lupa kata sandi" (admin yang mengatur ulang; tulis: "Hubungi admin untuk mengatur ulang kata sandi.").

**Dashboard** — header: judul "Dashboard", pilihan **Tahun** di kanan. Baris 1: tiga blok ringkasan (Total Saldo Dana Sekolah dengan angka 47px dan latar Ice Panel; Pemasukan; Pengeluaran). Baris 2: grafik batang 12 bulan (Jan–Des) dengan dua seri berdampingan. Spesifikasi grafik:
- Digambar sebagai **SVG dari server component**, tanpa library grafik, tanpa animasi.
- Garis kisi horizontal 1px Rule Gray, sumbu Y berlabel "Juta Rp", sumbu X singkatan bulan. Tanpa kisi vertikal.
- Dua batang per bulan berdampingan dengan celah 2px di antaranya: **hijau (Pemasukan) di kiri, biru (Pengeluaran) di kanan**.
- Batang radius 0, lebar sama, celah antar-bulan jelas. Nilai tertulis di atas batang hanya bila muat; selain itu lewat tooltip sederhana (kotak Paper, border Edge Gray, teks 14px).
- Legenda teks "Pemasukan" (kotak hijau) / "Pengeluaran" (kotak biru), kotak 12px, di atas grafik. Pilihan **Tahun** di header berupa daftar klik (2024, 2025, 2026, ...) sesuai AGENTS.md 4.2.
- Alternatif teks: `<details>` "Lihat sebagai tabel" berisi tabel 12 baris yang sama.

**Data Siswa & Guru** — header: judul, filter **Tahun Ajaran** dan **Kelas** (atau "Guru"), tombol **Enter**. Tabel: No, Nama, Kelas/Guru, Kode UID; tampil sampai sekitar 50 baris, tinggi awal sekitar 20 baris, sisanya bergulir. Alur edit: Input, Tambah Baris, Simpan (bagian 7). Paste dari Excel aktif.

**Pemasukan** — header: judul, filter **Tahun Ajaran**, **Kelas**, **Bulan**, tombol **Tarik Data**. Di bawahnya: "Jumlah Pemasukan Bulan Ini" dan "Total Pemasukan Per Tahun" sebagai blok ringkasan, lalu baris rincian per jenis (SPP, Daftar Ulang, Uang Gedung, ... , Bantuan, Donatur) berupa daftar label-angka, bukan kartu berwarna. Lalu tab **Dari Siswa / Bantuan / Donatur**.
- Tab Dari Siswa: grid lebar bergrup kolom. **SPP selalu grup pertama dengan empat sub-kolom** (Tanggal Transaksi, Bulan Terbayar, Metode, Petugas); grup lain tiga sub-kolom (Tanggal Transaksi, Metode, Petugas). Di mode edit (tombol **Input**), **Tambah Kolom** menambah grup jenis baru di kanan lewat dialog kecil (Nama, nominal standar opsional); **Tambah Baris** menambah pembayaran. Paste tidak aktif di tab ini.
- Tab Bantuan dan Donatur: tabel No, Jenis Bantuan (atau Jenis/Nama Donatur), Tanggal, Nominal, Petugas. Alur edit sama, paste aktif.

**Pengeluaran** — header: judul, filter **Tahun Ajaran**, **Bulan**, tombol **Tarik Data**. Blok ringkasan "Jumlah Pengeluaran Bulan Ini" dan "Total Pengeluaran Per Tahun". Tabel: No, Tanggal, Jenis Pengeluaran, Nominal, Petugas. Alur edit: Input, Tambah Baris, Simpan (bagian 7). Paste dari Excel aktif.

**Pengaturan** — daftar vertikal tiga baris dengan garis pemisah: **Ganti Kata Sandi** (dialog), **Mode** (dua pilihan: Terang / Gelap, radio biasa), **Keluar**. Untuk ADMIN ditambah baris **Kelola Akun** (lihat AGENTS.md, bagian "Tambahan di luar spreadsheet").

## 9. Tailwind v4 (`src/app/globals.css`) [Sumber + Tambahan]

Palet bawaan Tailwind **dimatikan** supaya tidak ada yang bisa memakai `bg-indigo-500` atau `from-purple-400` tanpa sengaja. Komponen memakai token semantik, jadi **tidak ada kelas `dark:`**.

```css
@import "tailwindcss";

/* Token statis [Bank Saku Digital Official Design Tokens] */
@theme {
  --color-*: initial;
  --shadow-*: initial;
  --radius-*: initial;

  --color-paper: #ffffff;
  --color-surface: #ffffff;
  --color-canvas: #f7f8fa;
  --color-brand: #29735c;
  --color-brand-secondary: #215e4b;
  --color-surface-soft: #eaf1ed;
  --color-ink: #151515;
  --color-steel: #595959;
  --color-rule: #dcdcdc;
  --color-warning: #a96d19;
  --color-alert: #b42318;
  --color-network-green: #29735c;
  --color-ledger-blue: #4f86c0;

  --radius-button: 8px;
  --radius-control: 8px;
  --radius-card: 12px;
  --radius-input: 8px;
  --shadow-xs: 0 1px 2px 0 rgb(21 21 21 / 0.04);
  --shadow-card: 0 1px 3px 0 rgb(21 21 21 / 0.05), 0 1px 2px -1px rgb(21 21 21 / 0.03);
  --shadow-overlay: 0 16px 24px -4px rgb(21 21 21 / 0.08), 0 6px 10px -4px rgb(21 21 21 / 0.03);

  --font-display: var(--font-manrope), ui-sans-serif, system-ui, sans-serif;
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-plex-mono), ui-monospace, SFMono-Regular, Menlo, monospace;
}

/* Token semantik yang berganti saat tema berubah */
:root {
  --canvas: #f7f8fa;
  --surface: #ffffff;
  --panel: #f0f2f5;
  --surface-soft: #eaf1ed;
  --brand: #29735c;
  --brand-secondary: #215e4b;
  --brand-hover: #215e4b;
  --text: #151515;
  --text-2: #383838;
  --text-3: #595959;
  --line: #dcdcdc;
  --line-strong: #cbcac8;
  --on-ink: #ffffff;
  --accent: #29735c;
  --accent-hover: #215e4b;
  --accent-text: #29735c;
  --series-in: #29735c;
  --series-out: #4f86c0;
  --warning: #a96d19;
  --danger: #b42318;
  --label: #595959;
}

/* Tema gelap yang tenang dan tidak menyilaukan */
:root[data-theme="dark"] {
  --canvas: #111413;
  --surface: #181d1a;
  --panel: #202723;
  --surface-soft: #243029;
  --brand: #368a70;
  --brand-secondary: #429f82;
  --brand-hover: #429f82;
  --text: #f5f5f5;
  --text-2: #cccccc;
  --text-3: #999999;
  --line: #2b3530;
  --line-strong: #38453f;
  --on-ink: #ffffff;
  --accent: #368a70;
  --accent-hover: #429f82;
  --accent-text: #5ec2a3;
  --series-in: #368a70;
  --series-out: #6ba1db;
  --warning: #d48e24;
  --danger: #d9453b;
  --label: #999999;
}

/* Utilitas semantik: bg-canvas, bg-surface, bg-panel, text-text, border-line, ... */
@theme inline {
  --color-canvas: var(--canvas);
  --color-surface: var(--surface);
  --color-panel: var(--panel);
  --color-surface-soft: var(--surface-soft);
  --color-brand: var(--brand);
  --color-brand-secondary: var(--brand-secondary);
  --color-brand-hover: var(--brand-hover);
  --color-text: var(--text);
  --color-text-2: var(--text-2);
  --color-text-3: var(--text-3);
  --color-line: var(--line);
  --color-line-strong: var(--line-strong);
  --color-on-ink: var(--on-ink);
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-accent-text: var(--accent-text);
  --color-series-in: var(--series-in);
  --color-series-out: var(--series-out);
  --color-warning: var(--warning);
  --color-danger: var(--danger);
  --color-label: var(--label);
}

body { background: var(--canvas); color: var(--text); font-family: var(--font-sans); }
.num { font-variant-numeric: tabular-nums; }
```

Penggunaan: tombol utama = `bg-text text-on-ink` (Ink di tema terang, terbalik di tema gelap). Permukaan = `bg-canvas`, `bg-panel`. Garis = `border-line`, `border-line-strong`. Token statis (`paper`, `ink`, ...) hanya untuk gambar/ekspor yang memang tidak berubah tema.

Nilai tema gelap adalah turunan saya dari palet sumber (hijau diterangkan agar teks lolos kontras 4,5:1; seri grafik dibedakan oleh kecerahan). Periksa visual di perangkat nyata sebelum rilis.

## 10. Gambar dan ikon

- Satu-satunya gambar: logo Bank Saku Digital.
- **Gambar grafik di spreadsheet (latar kartun, koin, kalkulator, daun, batang 3D mengilap) hanya contoh data, bukan arahan visual.** Yang dipertahankan dari gambar itu hanya pembagian warna hijau (pemasukan) dan biru (pengeluaran), karena diminta pemilik. Jangan meniru dekorasi atau efek 3D-nya. Grafik asli dibuat sesuai bagian 8.
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
- [ ] Tidak ada ungu, indigo, violet, biru-neon. Warna dibatasi pada palet resmi di Bagian 2 (Hijau, Emas, Ledger Blue, Alert Red, Netral).
- [ ] Tombol berwarna diperbolehkan HANYA sesuai varian semantik Bagian 6 (solid hijau untuk primary/simpan, solid emas untuk accent/edit, border merah untuk danger). Dilarang tombol berwarna di luar peran fungsional tersebut.
- [ ] Tidak ada kartu dengan border kiri berwarna tebal sebagai penanda visual acak.
- [ ] Tidak ada ikon di lingkaran berwarna-warni tanpa arti, tidak ada ikon "sparkles", tidak ada emoji sebagai ikon (wajib Lucide 16px).
- [ ] Tidak ada ilustrasi 3D/isometrik/stok, foto stok, atau gambar latar.
- [ ] Tidak ada animasi angkat hover berlebihan (`-translate-y`, `scale`). Transisi fokus pada warna & opacity.
- [ ] Tidak ada komponen shadcn/ui yang disalin mentah dengan gaya bawaannya.

Isi
- [ ] Tidak ada data contoh di halaman produksi: tidak ada "Lorem ipsum", "John Doe", angka karangan, testimoni.
- [ ] Tidak ada kata pemasaran ("powerful", "seamless", "revolusioner", "all-in-one").
- [ ] Setiap angka di layar berasal dari database.

Aksesibilitas
- [ ] Kontras teks minimal 4,5:1, elemen grafis & batas input minimal 3:1, di kedua tema.
- [ ] Teks di atas latar emas WAJIB gelap (`#151515`). Dilarang teks putih di atas emas.
- [ ] Semua kontrol bisa dioperasikan dengan keyboard; fokus selalu terlihat (ring 2px).
- [ ] Warna tidak pernah menjadi satu-satunya pembeda (setiap status wajib memiliki ikon + teks).
- [ ] Target sentuh minimal 40px tingginya di layar sentuh.