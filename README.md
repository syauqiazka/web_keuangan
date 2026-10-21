# Bank Saku Digital — Pencatatan Keuangan Sekolah

Aplikasi web internal untuk mencatat pemasukan dan pengeluaran sekolah. Dirancang untuk digunakan oleh admin dan petugas keuangan sekolah, bukan oleh siswa atau wali murid.

Nama aplikasi "Bank Saku Digital" bersifat internal; nama yang ditampilkan di antarmuka adalah **"Pencatatan Keuangan Sekolah"** dengan sub-judul **"Bank Saku Digital"**.

---

## Daftar Isi

- [Fitur Aplikasi](#fitur-aplikasi)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Prasyarat Instalasi](#prasyarat-instalasi)
- [Instalasi Lokal](#instalasi-lokal)
- [Environment Variables](#environment-variables)
- [Struktur Direktori](#struktur-direktori)
- [Panduan Penggunaan](#panduan-penggunaan)
- [Database dan Relasi Data](#database-dan-relasi-data)
- [Scripts dan Perintah Developer](#scripts-dan-perintah-developer)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Keamanan dan Hak Akses](#keamanan-dan-hak-akses)
- [Status Pengembangan](#status-pengembangan)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)

---

## Fitur Aplikasi

### Sudah Diimplementasikan

| Fitur | Keterangan |
|---|---|
| **Autentikasi** | Login dengan Kode dan Kata Sandi. Sesi berbasis cookie `httpOnly`, berlaku 12 jam. Paksa ganti kata sandi setelah akun dibuat atau direset admin. |
| **Dashboard** | Ringkasan total saldo, pemasukan, dan pengeluaran per tahun kalender. Grafik batang bulanan (pemasukan hijau, pengeluaran biru) digambar sebagai SVG tanpa library grafik eksternal. Filter berdasarkan tahun kalender. |
| **Data Siswa & Guru** | Tabel siswa dan guru dengan filter Tahun Ajaran dan Kelas. Mode edit: tambah baris, simpan massal dalam satu transaksi. Dukungan paste TSV dari Excel/Google Sheets. Kenaikan kelas siswa ke tahun ajaran baru tanpa menghapus riwayat lama. |
| **Pemasukan — Dari Siswa** | Kolom dinamis per jenis pemasukan (SPP bulanan dengan sub-kolom Bulan Terbayar, jenis lain tanpa sub-kolom bulan). Tambah jenis pemasukan baru (Tambah Kolom). Status belum lunas ditandai merah jika total pembayaran < nominal standar. Mendukung cicilan (beberapa pembayaran per sel dijumlahkan). |
| **Pemasukan — Bantuan** | Pencatatan pemasukan dari sumber bantuan (contoh: BOSP, BPMU, PIP) dengan kolom Jenis, Tanggal, Nominal, Petugas. |
| **Pemasukan — Donatur** | Pencatatan pemasukan dari donatur (contoh: OTA, infak, hibah) dengan kolom yang sama. Jenis dipilih dari daftar master sumber dana untuk konsistensi ejaan. |
| **Pengeluaran** | Pencatatan pengeluaran dengan kolom Tanggal, Jenis Pengeluaran (teks bebas), Nominal, Petugas. Filter per tahun ajaran dan bulan. Ringkasan bulan ini dan total tahunan. |
| **Tahun Ajaran** | Manajemen tahun ajaran: tambah, lihat daftar, atur tanggal mulai dan selesai, tetapkan tahun ajaran aktif. Pergantian tahun ajaran aktif dilakukan secara atomik (satu transaksi database). |
| **Master Kelas** | Data master kelas (Kelas 10, Kelas 11, Kelas 12) yang dikelola ADMIN. Kelas baru dapat ditambahkan melalui antarmuka Pengaturan. |
| **Penempatan Kelas** | Siswa ditempatkan ke kelas pada tahun ajaran tertentu menggunakan tabel `PenempatanKelas`. Setiap siswa maksimal satu penempatan per tahun ajaran. Kenaikan kelas membuat penempatan baru tanpa mengubah penempatan tahun ajaran sebelumnya. |
| **Pengaturan Akun** | Admin dapat membuat akun (Kode, Nama, Peran, kata sandi awal), mengatur ulang kata sandi, dan menonaktifkan akun. Akun tidak dihapus, hanya dinonaktifkan. |
| **Mode Tampilan** | Terang (default), Gelap, dan Mengikuti Sistem. Preferensi disimpan ke database dan cookie agar tidak berkedip saat dimuat ulang. |
| **Validasi Input** | Semua input divalidasi di server menggunakan Zod. Pesan kesalahan dalam Bahasa Indonesia. |
| **Hapus Lunak** | `PembayaranSiswa`, `PemasukanDana`, dan `Pengeluaran` memiliki kolom `deletedAt`. Data dihapus secara lunak; seluruh query menyertakan filter `deletedAt: null`. |
| **Pembatasan Login** | Setelah 5 kali gagal login, akun dikunci selama 15 menit. Pesan kesalahan tidak membedakan "Kode tidak ada" dan "Kata sandi salah". |

### Belum Diimplementasikan

Fitur-fitur berikut tidak ada dalam kode dan tidak direncanakan berdasarkan dokumen proyek:

- Pencarian global
- Ekspor Excel atau PDF
- Unggah file Excel
- Notifikasi push
- Portal siswa atau wali murid
- Laporan cetak
- Tabungan siswa

---

## Teknologi yang Digunakan

| Teknologi | Versi | Fungsi |
|---|---|---|
| [Next.js](https://nextjs.org) | 16.4.0 | Framework React dengan App Router, Server Components, Server Actions |
| React | 19.3.0 | Library UI |
| TypeScript | ^5 | Bahasa pemrograman, mode strict diaktifkan |
| Tailwind CSS | ^4 | Utility CSS; dikonfigurasi via `@import "tailwindcss"` dan `@theme` di `globals.css`, tanpa `tailwind.config.js` |
| PostgreSQL | — | Database relasional (dihosting di Neon) |
| Prisma | ^7.10.0 | ORM; URL database dikonfigurasi di `prisma.config.ts`, bukan di `schema.prisma` |
| `@prisma/adapter-neon` | ^7.10.0 | Adapter Neon WebSocket untuk Prisma Client |
| `@neondatabase/serverless` | ^1.2.0 | Driver serverless Neon |
| `@node-rs/argon2` | ^2.2.2 | Hash kata sandi (argon2id) |
| Zod | ^4.6.7 | Validasi input di server |
| GSAP | ^3.15.0 | Animasi (blur-to-sharp reveal, animated number) |
| `@gsap/react` | ^2.1.2 | Integrasi GSAP dengan React hooks |
| Motion | ^14.2.0 | Animasi deklaratif React (digunakan di komponen motion) |
| Lucide React | ^1.55.0 | Ikon SVG |
| `server-only` | ^0.0.1 | Penanda modul agar tidak dapat diimpor di sisi client |
| TSX | ^4.23.15 | Eksekutor TypeScript untuk seed dan test |
| dotenv | ^18.0.7 | Memuat `.env` di seed dan konfigurasi Prisma |
| Manrope, Inter, IBM Plex Mono | — | Tipografi via `next/font/google` |

---

## Prasyarat Instalasi

| Kebutuhan | Versi Minimum | Catatan |
|---|---|---|
| Node.js | 20.19 | Diperlukan oleh Prisma 7. Direkomendasikan Node 22+. |
| npm | Bawaan Node.js | Lockfile `package-lock.json` tersedia; `pnpm-lock.yaml` juga ada di repository. |
| PostgreSQL | — | Menggunakan Neon (PostgreSQL terkelola). Koneksi pooled dan koneksi langsung keduanya diperlukan. |

> **Catatan pnpm:** Repository memiliki `pnpm-lock.yaml` dan `package-lock.json`. Gunakan salah satu secara konsisten dalam satu lingkungan. Panduan ini menggunakan `npm`.

---

## Instalasi Lokal

### 1. Clone repository

```bash
git clone https://github.com/syauqiazka/web_keuangan.git
cd web_keuangan
```

### 2. Install dependency

```bash
npm install
```

`postinstall` akan menjalankan `prisma generate` secara otomatis setelah instalasi.

### 3. Siapkan environment variable

Salin file contoh dan isi nilai yang sesuai:

```bash
cp .env.example .env
```

Edit file `.env` dengan kredensial database Neon Anda. Lihat bagian [Environment Variables](#environment-variables).

### 4. Terapkan migrasi database

```bash
npx prisma migrate deploy
```

Perintah ini menerapkan migrasi yang sudah ada tanpa mereset database. Aman untuk database yang sudah memiliki data.

> Untuk pengembangan lokal yang ingin membuat migrasi baru:
> ```bash
> npx prisma migrate dev --name <nama-migrasi>
> ```

### 5. Generate Prisma Client

```bash
npx prisma generate
```

Jika langkah `npm install` sudah berjalan, perintah ini dijalankan otomatis. Jalankan ulang jika schema berubah.

### 6. Jalankan seed (opsional, hanya untuk instalasi pertama)

Seed membuat: akun admin, master kelas (Kelas 10, 11, 12), tahun ajaran `2026/2027`, dan jenis pemasukan SPP awal.

```bash
npx prisma db seed
```

> Seed bersifat idempoten: aman dijalankan ulang. Jika data sudah ada, seed tidak membuat duplikat. Seed tidak membuat data siswa, transaksi, atau data demo.

Pastikan variabel `SEED_ADMIN_KODE` dan `SEED_ADMIN_PASSWORD` sudah diatur di `.env` sebelum menjalankan seed.

### 7. Jalankan aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Aplikasi akan mengarahkan ke halaman `/masuk`.

---

## Environment Variables

Buat file `.env` dari `.env.example`. Jangan commit file `.env` ke version control.

| Variabel | Fungsi | Wajib | Contoh Nilai |
|---|---|---|---|
| `DATABASE_URL` | URL koneksi database Neon **pooled** (digunakan oleh aplikasi saat berjalan) | Ya | `postgresql://USER:PASS@ep-xxxx-pooler.REGION.aws.neon.tech/DB?sslmode=require` |
| `DIRECT_URL` | URL koneksi database Neon **langsung** tanpa pooler (digunakan oleh Prisma CLI untuk migrasi dan seed) | Ya | `postgresql://USER:PASS@ep-xxxx.REGION.aws.neon.tech/DB?sslmode=require` |
| `SEED_ADMIN_KODE` | Kode login untuk akun admin yang dibuat saat seed | Hanya saat seed | `admin` |
| `SEED_ADMIN_PASSWORD` | Kata sandi awal akun admin. **Ganti sebelum menjalankan seed.** | Hanya saat seed | *(kata sandi pilihan Anda)* |

> Variabel `DIRECT_URL` juga harus tersedia di lingkungan build (misalnya Vercel) karena `prisma.config.ts` membacanya saat proses generate dijalankan via `postinstall`.

---

## Struktur Direktori

```
web_keuangan/
├── prisma/
│   ├── schema.prisma          # Definisi model database
│   ├── seed.ts                # Script seed idempoten
│   └── migrations/            # Riwayat migrasi database
├── public/
│   └── logo-bank-saku-digital.jpeg
├── src/
│   ├── app/
│   │   ├── fonts.ts           # Konfigurasi Google Fonts (Manrope, Inter, IBM Plex Mono)
│   │   ├── globals.css        # Design tokens (Tailwind v4 @theme), tema terang/gelap
│   │   ├── layout.tsx         # Root layout; membaca cookie tema -> <html data-theme>
│   │   ├── page.tsx           # Redirect ke /dashboard
│   │   ├── (auth)/
│   │   │   └── masuk/         # Halaman login
│   │   └── (app)/
│   │       ├── layout.tsx     # Layout dengan sidebar; penjaga sesi
│   │       ├── dashboard/     # Ringkasan saldo, grafik bulanan
│   │       ├── data-siswa-guru/  # Tabel siswa & guru, filter, mode edit, kenaikan kelas
│   │       ├── pemasukan/     # Tab: Dari Siswa, Bantuan, Donatur
│   │       ├── pengeluaran/   # Tabel pengeluaran, filter, mode edit
│   │       └── pengaturan/
│   │           ├── PengaturanView.tsx # Ganti kata sandi, mode tampilan, keluar
│   │           ├── akun/              # Kelola akun (hanya ADMIN)
│   │           └── tahun-ajaran/      # Tahun Ajaran & Master Kelas (hanya ADMIN)
│   ├── components/
│   │   ├── ui/                # Button, Input, Select, Tabs, Dialog, Toast, DataGrid
│   │   ├── charts/            # GrafikBulanan (SVG server component)
│   │   ├── motion/            # AnimatedNumber, BlurReveal, FadeIn, Reveal, StaggerGroup
│   │   ├── Sidebar.tsx
│   │   ├── GantiPasswordModal.tsx
│   │   └── InputAnggotaDialog.tsx
│   ├── server/
│   │   ├── auth/
│   │   │   ├── session.ts     # Manajemen sesi (buat, hapus, baca)
│   │   │   └── guards.ts      # requireAuth(), requireAdmin(), requirePetugas()
│   │   ├── queries/           # Satu-satunya tempat membaca database untuk halaman
│   │   │   ├── anggota.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── pemasukan.ts
│   │   │   ├── pengeluaran.ts
│   │   │   ├── tahun-ajaran.ts
│   │   │   ├── totals.ts
│   │   │   └── akun.ts
│   │   └── actions/           # Server Actions untuk semua operasi tulis
│   │       ├── anggota.ts     # CRUD siswa/guru, kenaikan kelas
│   │       ├── pemasukan.ts
│   │       ├── pengeluaran.ts
│   │       ├── tahun-ajaran.ts
│   │       ├── akun.ts
│   │       ├── auth.ts
│   │       └── theme.ts
│   ├── lib/
│   │   ├── db.ts              # Inisialisasi Prisma Client dengan adapter Neon
│   │   ├── money.ts           # parseRupiah(), formatRupiah()
│   │   ├── dates.ts           # Utilitas tanggal (zona waktu Asia/Jakarta)
│   │   ├── status-lunas.ts    # hitungStatusLunas() — fungsi murni
│   │   ├── tsv-paste.ts       # parseTsv(), applyTsvPaste()
│   │   ├── uid.ts             # generateUID()
│   │   ├── validators.ts
│   │   └── motion.ts          # Konfigurasi animasi GSAP
│   ├── generated/prisma/      # Output prisma generate — jangan diedit manual
│   └── proxy.ts               # Middleware Next.js (penjaga rute, redirect login)
├── tests/
│   ├── dates.test.ts
│   ├── money.test.ts
│   ├── status-lunas.test.ts
│   ├── tahun-ajaran.test.ts
│   ├── tsv-paste.test.ts
│   └── uid.test.ts
├── .env.example
├── .gitignore
├── AGENTS.md                  # Instruksi dan aturan bisnis
├── DESIGN.md                  # Panduan desain visual dan komponen
├── next.config.ts
├── prisma.config.ts           # Konfigurasi Prisma 7 (URL database dari env)
├── tsconfig.json
└── package.json
```

---

## Panduan Penggunaan

### Login

Buka `/masuk`, masukkan **Kode** dan **Kata Sandi** yang diberikan oleh admin.

Jika admin baru membuat atau mereset akun Anda, Anda akan diarahkan ke dialog **Ganti Kata Sandi** sebelum dapat menggunakan halaman lain.

Setelah 5 kali percobaan login gagal, akun dikunci selama 15 menit.

### Dashboard

Menampilkan ringkasan keuangan untuk tahun yang dipilih:

- **Total Saldo Dana Sekolah**: total pemasukan dikurangi total pengeluaran pada tahun terpilih.
- **Pemasukan**: jumlah seluruh pembayaran siswa, bantuan, dan donatur.
- **Pengeluaran**: jumlah seluruh catatan pengeluaran.
- **Grafik batang**: rincian per bulan, Januari–Desember.

Angka pada dashboard selalu konsisten dengan angka total di halaman Pemasukan dan Pengeluaran karena menggunakan fungsi query yang sama.

### Data Siswa & Guru

**Alur kerja:**

1. Pilih **Tahun Ajaran** dan **Kelas** (atau "Guru"), lalu klik **Enter**.
2. Data muncul sebagai tabel (mode hanya-baca).
3. Klik **Mulai Edit** untuk masuk mode edit. Sel menjadi dapat diubah; tombol **Tambah Baris** muncul.
4. Klik **Simpan Perubahan** untuk menyimpan semua perubahan sekaligus dalam satu transaksi. Jika ada baris yang gagal validasi, tidak ada yang tersimpan.
5. Klik **Batal** untuk membatalkan semua perubahan yang belum disimpan.

Mode edit mendukung paste dari Excel atau Google Sheets (format TSV). Paste mengisi sel dari posisi terfokus ke bawah dan ke kanan, menambah baris bila data melebihi baris yang ada.

#### Kenaikan Kelas

Tombol **Naik Kelas / Penempatan Baru** tersedia di halaman Data Siswa & Guru. Fungsinya:

1. Pilih **Tahun Ajaran tujuan** dan **Kelas tujuan**.
2. Klik **Proses Kenaikan Kelas**.

Aplikasi membuat entri `PenempatanKelas` baru untuk tahun ajaran tujuan. Data penempatan di tahun ajaran sebelumnya **tidak diubah atau dihapus**. Siswa yang sudah memiliki penempatan di tahun ajaran tujuan akan diperbarui kelasnya, bukan diduplikasi.

Kenaikan kelas **tidak otomatis**; admin atau petugas harus melakukannya secara eksplisit.

### Pemasukan

Tiga tab tersedia: **Dari Siswa**, **Bantuan**, **Donatur**.

Filter: Tahun Ajaran, Kelas, Bulan, lalu klik **Tarik Data**.

Ringkasan di atas tabel:

- **Total Pemasukan Per Tahun**: seluruh sumber, seluruh kelas, pada tahun ajaran terpilih.
- **Jumlah Pemasukan Bulan Ini**: seluruh sumber pada bulan dan tahun terpilih.

Filter Kelas hanya menentukan baris yang tampil di tabel Dari Siswa; nilai ringkasan tidak berubah karenanya.

Sel berwarna merah menandai pembayaran yang jumlahnya kurang dari nominal standar. Jika `nominalStandar` tidak diatur (null), sel tidak pernah merah.

### Pengeluaran

Filter: Tahun Ajaran, Bulan, lalu klik **Tarik Data**.

Mode edit mengikuti pola yang sama dengan Data Siswa & Guru.

### Pengaturan

| Menu | Hak Akses | Fungsi |
|---|---|---|
| Ganti Kata Sandi | Semua pengguna | Mengubah kata sandi sendiri |
| Mode Tampilan | Semua pengguna | Pilih Terang, Gelap, atau Mengikuti Sistem |
| Kelola Akun | ADMIN | Buat, reset, nonaktifkan akun petugas |
| Tahun Ajaran & Master Kelas | ADMIN | Kelola tahun ajaran dan data master kelas |
| Keluar | Semua pengguna | Menghapus sesi |

### Tahun Ajaran dan Kelas (Khusus Admin)

Buka **Pengaturan → Tahun Ajaran & Master Kelas**.

**Perbedaan konsep penting:**

| Konsep | Definisi |
|---|---|
| **Tahun Ajaran Aktif** | Satu tahun ajaran yang ditandai aktif. Digunakan sebagai default filter di semua halaman. Hanya satu yang aktif pada satu waktu; invariant ini dijaga pada level transaksi database. |
| **Tahun Ajaran Historis** | Tahun ajaran yang sudah tidak aktif. Data dan transaksinya tetap dapat dilihat dengan memilih tahun tersebut di filter. |
| **Master Kelas** | Data tingkatan kelas (Kelas 10, Kelas 11, Kelas 12) yang merupakan referensi bersama untuk semua tahun ajaran. |
| **Penempatan Kelas** | Hubungan antara seorang siswa, satu kelas, dan satu tahun ajaran. Satu siswa memiliki maksimal satu penempatan per tahun ajaran. Ini bukan field di tabel siswa, melainkan tabel tersendiri (`PenempatanKelas`). |

**Menambah Tahun Ajaran:**

1. Klik **Tambah Tahun Ajaran**.
2. Isi Nama (contoh: `2027/2028`), Tanggal Mulai, dan Tanggal Selesai.
3. Pilih apakah tahun ajaran baru langsung menjadi aktif.
4. Klik **Simpan**.

Validasi: tanggal mulai tidak boleh melebihi tanggal selesai. Nama tahun ajaran harus unik.

**Mengganti Tahun Ajaran Aktif:**

Klik **Jadikan Aktif** pada tahun ajaran yang diinginkan. Pergantian dilakukan dalam satu transaksi database: tahun ajaran lama dinonaktifkan dan yang baru diaktifkan secara bersamaan.

---

## Database dan Relasi Data

Berdasarkan `prisma/schema.prisma`:

### Model Utama

| Model | Tabel | Keterangan |
|---|---|---|
| `Pengguna` | `pengguna` | Akun pengguna (Admin/Petugas). Tidak pernah dihapus, hanya dinonaktifkan. |
| `Sesi` | `sesi` | Sesi login. Menyimpan SHA-256 dari token, bukan token asli. |
| `TahunAjaran` | `tahun_ajaran` | Periode akademik. Field `aktif` hanya boleh `true` pada satu baris. |
| `Kelas` | `kelas` | Master tingkatan kelas (contoh: Kelas 10). |
| `Anggota` | `anggota` | Siswa dan guru. Field `uid` bersifat unik. Guru tidak memiliki `PenempatanKelas`. |
| `PenempatanKelas` | `penempatan_kelas` | Relasi siswa — kelas — tahun ajaran. Constraint `@@unique([anggotaId, tahunAjaranId])` memastikan satu siswa satu penempatan per tahun ajaran. |
| `JenisPemasukan` | `jenis_pemasukan` | Kolom dinamis di tab Dari Siswa (SPP, Daftar Ulang, dll). Terhubung ke satu tahun ajaran. |
| `PembayaranSiswa` | `pembayaran_siswa` | Satu baris = satu pembayaran. Mendukung `deletedAt` (hapus lunak). |
| `SumberDana` | `sumber_dana` | Daftar nama bantuan dan donatur (mencegah inkonsistensi ejaan). |
| `PemasukanDana` | `pemasukan_dana` | Pencatatan pemasukan dari bantuan atau donatur. Mendukung `deletedAt`. |
| `Pengeluaran` | `pengeluaran` | Pencatatan pengeluaran. Mendukung `deletedAt`. |

### Relasi Penting

```
TahunAjaran --< PenempatanKelas >-- Anggota (SISWA)
                      |
                      +--< PembayaranSiswa >-- JenisPemasukan -- TahunAjaran

Kelas --< PenempatanKelas

Pengguna --< PembayaranSiswa  (sebagai petugas)
Pengguna --< PemasukanDana    (sebagai petugas)
Pengguna --< Pengeluaran      (sebagai petugas)
Pengguna --< Sesi
```

### Invariant yang Dijaga Aplikasi

- `JenisPemasukan.tahunAjaranId` harus sama dengan `PenempatanKelas.tahunAjaranId` pada pembayaran yang sama. Validasi ini ada di Server Actions, bukan di constraint database.
- Hanya satu `TahunAjaran.aktif = true`. Diubah dalam satu `$transaction`.
- `bulanTerbayar` wajib diisi jika `jenis.bulanan = true`, dan harus kosong jika `false`.
- `petugasId` diisi dari sesi pengguna yang login, tidak dapat dimanipulasi dari client.

### Catatan Desain

- Saldo tidak disimpan di tabel tersendiri; selalu dihitung dari transaksi (pemasukan dikurangi pengeluaran).
- Status lunas tidak disimpan di database; dihitung di lapisan query (`SUM(nominal) < nominalStandar`).
- Semua nominal bertipe `Decimal(15,0)` (Rupiah utuh, tanpa desimal). Tidak menggunakan `Float`.

---

## Scripts dan Perintah Developer

Berdasarkan `package.json`:

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan server development (Turbopack) |
| `npm run build` | Build production |
| `npm run start` | Jalankan build production |
| `npm run lint` | Periksa kode dengan ESLint |
| `npm test` | Jalankan semua unit test (`tests/**/*.test.ts`) menggunakan Node.js test runner via `tsx` |
| `npx tsc --noEmit` | Periksa tipe TypeScript tanpa menghasilkan file |
| `npx prisma generate` | Generate Prisma Client ke `src/generated/prisma/` |
| `npx prisma migrate dev --name <nama>` | Buat dan terapkan migrasi baru (lingkungan development) |
| `npx prisma migrate deploy` | Terapkan migrasi yang sudah ada (lingkungan production) |
| `npx prisma db seed` | Jalankan seed (`prisma/seed.ts`) |

> `postinstall` dalam `package.json` menjalankan `prisma generate` secara otomatis setiap kali `npm install` dijalankan.

---

## Deployment

Repository ini tidak menyertakan Dockerfile, Docker Compose, atau konfigurasi platform hosting secara spesifik.

Untuk deployment ke platform serverless yang kompatibel dengan Next.js (seperti Vercel):

1. Hubungkan repository ke platform deployment.
2. Atur environment variable (`DATABASE_URL`, `DIRECT_URL`) di dashboard platform.
3. Pastikan `DIRECT_URL` tersedia saat build karena `postinstall` menjalankan `prisma generate`.
4. Gunakan `npm run build` sebagai build command dan `npm run start` sebagai start command.

> Tidak ada konfigurasi platform deployment yang dapat diverifikasi dari file proyek saat ini. Panduan di atas bersifat umum.

---

## Troubleshooting

### Environment variable belum diatur

**Gejala:** Error `DIRECT_URL atau DATABASE_URL belum diatur` saat seed, atau error koneksi database.

**Solusi:** Salin `.env.example` ke `.env` dan isi nilai yang benar.

### Prisma Client belum di-generate

**Gejala:** Error `Cannot find module '@/generated/prisma/client'`.

**Solusi:**
```bash
npx prisma generate
```

### Migrasi belum diterapkan

**Gejala:** Error tabel tidak ditemukan saat aplikasi pertama dijalankan.

**Solusi:**
```bash
npx prisma migrate deploy
```

### Seed gagal karena konflik data

**Gejala:** Error unik constraint saat seed dijalankan ulang.

**Solusi:** Seed sudah dirancang idempoten menggunakan `upsert`. Jika tetap gagal, periksa apakah ada data yang tidak konsisten di database dan sesuaikan secara manual. Jangan jalankan `prisma migrate reset` pada database yang berisi data.

### Login gagal

**Gejala:** Pesan "Kode atau kata sandi tidak valid" meskipun data sudah benar.

**Kemungkinan penyebab:**
- Seed belum dijalankan sehingga akun admin belum ada.
- Akun dinonaktifkan oleh admin.
- Akun terkunci karena terlalu banyak percobaan gagal (kunci berlaku 15 menit).

### Halaman tampil kosong, tidak ada data

**Gejala:** Tabel Data Siswa, Pemasukan, atau Pengeluaran tidak menampilkan data.

**Kemungkinan penyebab:**
- Belum ada tahun ajaran aktif. Buka **Pengaturan → Tahun Ajaran & Master Kelas** dan tambahkan atau aktifkan tahun ajaran.
- Filter tahun ajaran atau kelas tidak sesuai dengan data yang ada di database.
- Seed belum dijalankan sehingga master data belum tersedia.

### Build atau typecheck gagal

**Gejala:** Error saat `npm run build` atau `npx tsc --noEmit`.

**Solusi:** Pastikan `prisma generate` sudah dijalankan agar tipe yang digenerate tersedia. Jika ada perubahan schema, jalankan `prisma generate` kembali.

---

## Keamanan dan Hak Akses

### Autentikasi

- Sesi berbasis cookie `httpOnly`, `Secure` (di production), `SameSite=Lax`.
- Token sesi 32 byte acak; yang disimpan di database adalah **SHA-256 hash** dari token, bukan token asli.
- Sesi berlaku 12 jam.

### Kata Sandi

- Kata sandi di-hash menggunakan **argon2id** via `@node-rs/argon2`.
- Minimal 8 karakter.
- Hash tidak pernah di-log atau ditampilkan.

### Otorisasi

Setiap Server Action dan fungsi query memeriksa sesi dan peran secara mandiri. Middleware di `src/proxy.ts` hanya lapisan tambahan untuk redirect, bukan satu-satunya penjaga.

| Aksi | Peran yang Diperlukan |
|---|---|
| Login, logout, ganti kata sandi | Semua pengguna terautentikasi |
| Catat dan ubah pemasukan/pengeluaran | ADMIN atau PETUGAS |
| Kelola Data Siswa & Guru | ADMIN atau PETUGAS |
| Kelola Akun pengguna | ADMIN |
| Kelola Tahun Ajaran & Master Kelas | ADMIN |
| Aktifkan/nonaktifkan pengguna | ADMIN |

### Validasi

Semua input pengguna divalidasi menggunakan Zod di sisi server. Nilai dari client, termasuk `petugasId`, `nominal`, dan ID relasi, tidak dipercaya begitu saja.

---

## Status Pengembangan

### Sudah Diimplementasikan dan Diverifikasi

- Autentikasi, manajemen sesi, pembatasan login
- CRUD data siswa, guru, dan penempatan kelas
- Pencatatan pemasukan (dari siswa, bantuan, donatur) dan pengeluaran
- Manajemen tahun ajaran dan master kelas
- Kenaikan kelas dengan preservasi riwayat historis
- Mode tampilan terang/gelap/sistem
- Kelola akun pengguna (ADMIN)
- Dashboard dengan grafik SVG
- Paste dari Excel (format TSV)
- Validasi Zod di server
- Hapus lunak pada transaksi
- Unit test: 46 test lulus pada 6 file test (dijalankan 21 Oktober 2026)

### Belum Diverifikasi Secara Menyeluruh

- Skenario deployment ke production belum diuji dari repository ini.
- Tidak ada test integrasi end-to-end; hanya unit test library dan logika murni.
- Tampilan di lebar layar 375px (mobile) belum diverifikasi dari audit ini.

### Pertanyaan Terbuka ke Pemilik

Beberapa asumsi implementasi tercatat dalam kode dengan komentar `// ASUMSI:`. Lihat `AGENTS.md` bagian 9 untuk daftarnya, termasuk:

- Apakah `ST` pada kolom Metode berarti Setor Tunai?
- Apakah saldo akhir tahun perlu terbawa ke tahun berikutnya?
- Format dan makna Kode UID.

---

## Kontribusi

1. Buat branch baru dari `main`.
2. Lakukan perubahan sesuai panduan di `AGENTS.md` dan `DESIGN.md`.
3. Jalankan pemeriksaan sebelum commit:
   ```bash
   npm run lint
   npx tsc --noEmit
   npm test
   npm run build
   ```
4. Pastikan semua pemeriksaan lulus sebelum mengajukan pull request.
5. Jangan mengubah `prisma/schema.prisma` tanpa menyertakan migrasi dan catatan alasan perubahan.
6. Jangan menambahkan dependensi baru tanpa alasan tertulis.

---

## Lisensi

File `LICENSE` tidak ditemukan di repository ini. Lisensi proyek belum ditentukan.
