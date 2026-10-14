# AGENTS.md — Pencatatan Keuangan Sekolah | Bank Saku Digital

Aplikasi web internal untuk mencatat pemasukan dan pengeluaran sekolah. Pengguna: admin dan petugas sekolah. Bahasa antarmuka: Indonesia.

Baca file ini sampai selesai sebelum menulis kode. Baca `DESIGN.md` sebelum menyentuh UI apa pun.

## 1. Sumber kebenaran

| Urusan | File | Catatan |
|---|---|---|
| Tampilan, warna, font, komponen, larangan visual | `DESIGN.md` | Turunan dari Modern Treasury (Refero Styles). Patuhi daftar larangan di bagian 12. |
| Struktur data | `prisma/schema.prisma` | Sudah divalidasi dengan Prisma 7.10. Ubah hanya lewat migrasi dan sebutkan alasannya. |
| Fitur dan aturan bisnis | file ini, bagian 4 dan 5 | Berasal dari `Website.xlsx` milik pemilik. |
| Logo | `assets/logo-bank-saku-digital.jpeg` | Salin ke `public/`. Jangan diubah warnanya. |

Jika dua sumber bertentangan atau ada hal yang tidak tercakup: **berhenti dan tanyakan ke pemilik**, jangan menebak. Daftar pertanyaan yang sudah diketahui ada di bagian 9.

## 2. Stack

- **Next.js**, App Router, TypeScript strict. Pakai rilis stabil terbaru dari `create-next-app` (saat file ini ditulis: 16.x).
- **Tailwind CSS v4** (`@import "tailwindcss"` + `@theme` di `globals.css`). Tidak ada `tailwind.config.js`.
- **PostgreSQL di Neon**, ORM **Prisma 7**.
- Validasi: `zod`. Hash kata sandi: `@node-rs/argon2`. Ikon: `lucide-react`. Primitif UI tanpa gaya (dialog, select, popover): Radix UI boleh.
- Node.js minimal 20.19 (syarat Prisma 7).
- Tidak ada library grafik. Grafik digambar sebagai SVG (lihat `DESIGN.md` bagian 8).

**Kunci versi Prisma ke 7.** Pasang dengan `npm i prisma@7 @prisma/client@7 @prisma/adapter-neon@7`. Jangan pakai tag `latest` mentah: saat file ini disusun, tag `latest` di registry npm menunjuk ke rilis kandidat Prisma 8 (`8.0.0-rc`) yang CLI-nya berbeda.

### Perintah

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run build
npx prisma generate
npx prisma migrate dev --name <nama>      # lokal/dev
npx prisma migrate deploy                 # produksi
npx prisma db seed
```

### Konfigurasi Prisma 7

URL database **tidak** ada di `schema.prisma`; ada di `prisma.config.ts`. Perintah CLI (migrate) memakai koneksi langsung Neon, sedangkan aplikasi saat berjalan memakai koneksi pooled.

```ts
// prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url: env("DIRECT_URL") },
});
```

```bash
# .env.example  (salin ke .env; jangan commit .env)
DATABASE_URL="postgresql://USER:PASS@ep-xxxx-pooler.REGION.aws.neon.tech/DB?sslmode=require"  # host ada "-pooler"
DIRECT_URL="postgresql://USER:PASS@ep-xxxx.REGION.aws.neon.tech/DB?sslmode=require"           # tanpa "-pooler"
SEED_ADMIN_KODE="admin"
SEED_ADMIN_PASSWORD="ganti-saya-sebelum-seed"
```

```ts
// src/lib/db.ts
import "server-only";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

const g = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  g.prisma ??
  new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

if (process.env.NODE_ENV !== "production") g.prisma = db;
```

- `src/generated/` masuk `.gitignore`; jalankan `prisma generate` di langkah build (`"postinstall": "prisma generate"`). `prisma.config.ts` membaca `DIRECT_URL` saat dimuat, jadi variabel itu harus ada juga di lingkungan build (mis. Vercel), bukan hanya di runtime.
- Adapter Neon memakai WebSocket. Node 22+ sudah punya `WebSocket` bawaan; di Node yang lebih lama set `neonConfig.webSocketConstructor = ws`.
- Jika API Prisma atau Neon di atas berbeda dari yang terpasang, ikuti dokumentasi resmi versi terpasang dan catat perbedaannya di PR. Jangan membiarkan build rusak demi mengikuti file ini.

## 3. Struktur folder

```
src/
  app/
    fonts.ts  globals.css  layout.tsx          # layout membaca cookie `tema` -> <html data-theme>
    (auth)/masuk/page.tsx
    (app)/layout.tsx                           # sidebar + penjaga sesi
    (app)/dashboard/page.tsx
    (app)/data-siswa-guru/page.tsx
    (app)/pemasukan/page.tsx
    (app)/pengeluaran/page.tsx
    (app)/pengaturan/page.tsx
    (app)/pengaturan/akun/page.tsx             # hanya ADMIN, lihat bagian 4.7
  components/
    ui/                                        # Button, Input, Select, Tabs, Dialog, Toast, DataGrid
    charts/GrafikBulanan.tsx                   # SVG server component
  server/
    auth/                                      # sesi, hash, penjaga peran
    queries/                                   # SATU-SATUNYA tempat membaca DB untuk halaman
    actions/                                   # Server Actions untuk semua tulis
  lib/
    money.ts  dates.ts  validators.ts
  generated/prisma/                            # hasil `prisma generate`, jangan diedit
prisma/
  schema.prisma  seed.ts  migrations/
public/logo-bank-saku-digital.jpeg
```

Rute memakai istilah Indonesia sesuai menu spreadsheet.

## 4. Fitur (dari `Website.xlsx`)

Urutan menu di sidebar: **Dashboard, Data Siswa & Guru, Pemasukan, Pengeluaran, Pengaturan**. Header aplikasi: "Pencatatan Keuangan Sekolah" dan "Bank Saku Digital", dengan logo.

### 4.1 Login
- Masuk dengan **Kode** dan **Kata sandi**. Akun dibuat oleh admin (catatan di sheet Dashboard). Tidak ada pendaftaran mandiri.
- Setelah admin membuat atau mengatur ulang akun, `wajibGantiPassword = true`: pengguna dipaksa ke dialog Ganti Kata Sandi sebelum bisa memakai halaman lain.

### 4.2 Dashboard
- Filter **Tahun** (tahun kalender, contoh 2026).
- Tiga angka: **Total Saldo Dana Sekolah**, **Pemasukan**, **Pengeluaran** untuk tahun terpilih. Saldo = Pemasukan − Pengeluaran (sesuai contoh di spreadsheet: 1.067.000.000 − 700.000.000 = 367.000.000).
- Grafik batang Januari–Desember: Pemasukan vs Pengeluaran per bulan (satuan juta rupiah). Pemasukan = pembayaran siswa + bantuan + donatur.
- Logo ditampilkan di header, bukan sebagai hiasan di badan halaman.

### 4.3 Data Siswa & Guru
- Filter: **Tahun Ajaran**, **Kelas** (atau "Guru").
- Tabel: **No, Nama, Kelas/Guru, Kode UID**.
- Form tambah (tombol **Input**): Tahun Ajaran, Kelas atau Guru, Nama, Kode UID. Tombol **Simpan**.
- **Tambah Baris** menambah baris kosong; **Enter** menyimpan baris.
- Model: `Anggota` (siswa atau guru, `uid` unik) dan `PenempatanKelas` (siswa di kelas X pada tahun ajaran Y). Guru tidak punya penempatan.

### 4.4 Pemasukan
Filter: **Tahun Ajaran**, **Kelas**, **Bulan**, tombol **Tarik Data**. Ringkasan: **Jumlah Pemasukan Bulan Ini** dan **Total Pemasukan Per Tahun**, dengan rincian per jenis (contoh di spreadsheet: SPP, Daftar Ulang, Uang Gedung). Tiga tab:

**Dari Siswa**
- Tabel lebar: kolom tetap **No, Nama Siswa, Kode UID**, lalu satu **grup kolom per jenis pemasukan**.
- Grup **SPP** (bulanan): Tanggal Transaksi, **Bulan Terbayar**, Metode (TF/ST), Petugas, dengan Nominal di atas sub-kolom.
- Grup **Daftar Ulang** (tidak bulanan): Tanggal Transaksi, Metode, Petugas. Tidak ada Bulan Terbayar.
- Grup lain ("Dll.."): Uang Gedung, Ujian, dan seterusnya.
- Tombol **Input** (kelola jenis pemasukan) dan **Tambah Kolom** menentukan kolom apa yang ada. Itu membuat/mengubah `JenisPemasukan` (nama, `bulanan` ya/tidak, nominal standar) untuk tahun ajaran terpilih. Tombol **Tambah Baris** menambah pembayaran.
- **Nominal berwarna merah bila belum lunas** (contoh: Daftar Ulang 150.000 dari standar 200.000). Lihat aturan di 5.3.
- Tombol: Input, Simpan, Tarik Data, Tambah Baris, Tambah Kolom.

**Bantuan**
- Kolom: **No, Jenis Bantuan (BOSP, BPMU), Tanggal, Nominal, Petugas**. Model: `PemasukanDana` dengan `SumberDana.kategori = BANTUAN`.

**Donatur**
- Kolom: **No, Nama Donatur (Haji Isam, OTA), Tanggal, Nominal, Petugas**. Model sama dengan kategori `DONATUR`.

### 4.5 Pengeluaran
- Filter: **Tahun Ajaran**, **Bulan**, tombol **Tarik Data**.
- Ringkasan: **Jumlah Pengeluaran Bulan Ini** dan **Total Pengeluaran Per Tahun**.
- Tabel: **No, Tanggal, Jenis Pengeluaran, Nominal, Petugas** (contoh: 13-10-2026, Gaji Guru, 100.000.000, Bu Resa).
- Tombol: Input, Simpan, Tarik Data, Tambah Baris.

### 4.6 Pengaturan
1. **Ganti Kata Sandi**
2. **Log Out** (tampil sebagai "Keluar")
3. **Mode** (Terang / Gelap / Sistem). Simpan ke `Pengguna.tema` dan cookie `tema` supaya tidak berkedip saat dimuat.

### 4.7 Tambahan di luar spreadsheet (satu-satunya)
Spreadsheet menyatakan akun dibuat oleh admin tetapi tidak punya layar untuk itu. Bangun halaman minimal **Kelola Akun** di bawah Pengaturan, hanya untuk `ADMIN`: daftar akun, buat akun (Kode, Nama, Peran, kata sandi awal), atur ulang kata sandi, nonaktifkan. Akun admin pertama dibuat oleh `prisma/seed.ts` dari `SEED_ADMIN_*`.

### 4.8 Jangan dibangun (tidak ada di spreadsheet)
Pencarian global, ekspor Excel/PDF, impor massal, notifikasi, kategori pengeluaran, laporan cetak, portal untuk siswa/orang tua, tabungan siswa. Jika tampaknya perlu, tulis sebagai saran ke pemilik, jangan dikerjakan.

## 5. Aturan bisnis dan data

### 5.1 Uang
- Semua nominal `Decimal(15,0)` di database (Rupiah utuh). **Jangan** pakai `Float`.
- Di kode aplikasi, ubah `Prisma.Decimal` menjadi `number` di lapisan `server/queries` (`d.toNumber()`). Komponen client tidak boleh menerima `Decimal`.
- Format tampilan: `new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })`, lalu pastikan hasilnya `Rp 1.250.000`. Tanpa `,-`.
- `lib/money.ts` berisi `parseRupiah(input: string): number` yang menerima `"1.250.000"` / `"Rp 1.250.000"`, menolak desimal, negatif, nol, dan lebih dari 15 digit. Tulis unit test untuk fungsi ini.

### 5.2 Tanggal
- Kolom tanggal bertipe `DATE` (tanpa jam). Buat dengan `new Date(Date.UTC(y, m - 1, d))` dan tampilkan dengan `timeZone: "UTC"`. Ini mencegah tanggal bergeser sehari.
- "Hari ini" dan "bulan ini" dihitung dalam zona **Asia/Jakarta**.
- `bulanTerbayar` selalu tanggal 1 pada bulan yang dibayar.
- Input tanggal: `dd-mm-yyyy` (sesuai spreadsheet). Simpan ISO.

### 5.3 Status lunas (jangan disimpan, hitung)
- Jenis **bulanan**: jumlahkan `nominal` per (penempatan, jenis, `bulanTerbayar`). Jenis **tidak bulanan**: per (penempatan, jenis).
- Belum lunas jika `nominalStandar` tidak null **dan** jumlah < `nominalStandar`. Tampilkan nominal Alert Red + teks `kurang Rp X`. Jika `nominalStandar` null, tidak pernah merah.
- Lebih dari satu pembayaran pada sel yang sama (cicilan) dijumlahkan; rinciannya tampil sebagai sub-baris kecil.
- Tulis `statusLunas(...)` sebagai fungsi murni dan beri unit test (lunas, kurang, tanpa standar, cicilan).

### 5.4 Ringkasan dan grafik
- Pemasukan = Σ `PembayaranSiswa.nominal` + Σ `PemasukanDana.nominal`. Pengeluaran = Σ `Pengeluaran.nominal`. Semua dengan `deletedAt: null`.
- Dashboard: filter berdasarkan tahun kalender dari kolom tanggal. Halaman Pemasukan/Pengeluaran: rentang `TahunAjaran.mulai`–`selesai`, dan filter Bulan berdasarkan **tanggal transaksi**.
- Agregasi per bulan: satu query `$queryRaw` dengan `date_trunc('month', tanggal)`; ubah `bigint/Decimal` ke `number`. Jangan memuat semua baris ke memori lalu menjumlahkan di JS.
- **Tidak ada tabel saldo.** Saldo selalu dihitung.

### 5.5 Hapus lunak
`PembayaranSiswa`, `PemasukanDana`, `Pengeluaran` punya `deletedAt`. Menghapus = mengisi `deletedAt`. Setiap fungsi di `server/queries` wajib menyertakan `deletedAt: null`; komponen halaman tidak boleh memanggil `db` langsung.

### 5.6 Invarian yang dijaga aplikasi
- `JenisPemasukan.tahunAjaranId` harus sama dengan `PenempatanKelas.tahunAjaranId` pada pembayaran yang sama.
- Hanya satu `TahunAjaran.aktif = true`. Ubah dalam satu transaksi (matikan yang lama, hidupkan yang baru). Opsional: tambah indeks unik parsial lewat SQL migrasi.
- `bulanTerbayar` wajib terisi bila `jenis.bulanan = true`, dan harus kosong bila `false`.
- `petugasId` diisi dari sesi pengguna yang login, bukan dari input form.
- Pengguna tidak dihapus, hanya dinonaktifkan.

## 6. Autentikasi dan keamanan

- Sesi buatan sendiri (tanpa library auth): token acak 32 byte, simpan **hash SHA-256**-nya di `Sesi.tokenHash`, kirim token lewat cookie `httpOnly`, `Secure`, `SameSite=Lax`. Masa berlaku 12 jam (ubah bila pemilik meminta).
- Kata sandi: argon2id. Minimal 8 karakter. Jangan pernah log atau tampilkan hash.
- Pembatasan login: tambah `gagalLogin`; pada 5 kegagalan berturut-turut isi `terkunciSampai` = sekarang + 15 menit. Pesan galat sama untuk "Kode tidak ada" dan "Kata sandi salah".
- **Setiap** Server Action dan fungsi query memeriksa sesi dan peran sendiri. Penjaga rute (`proxy.ts` di Next 16, `middleware.ts` di versi lebih lama) hanya lapisan tambahan, bukan satu-satunya.
- Aksi khusus `ADMIN`: kelola akun, ubah/aktifkan Tahun Ajaran, kelola Kelas, kelola Jenis Pemasukan. `PETUGAS`: catat dan ubah pemasukan/pengeluaran, kelola Data Siswa & Guru.
- Validasi semua input dengan `zod` di server. Jangan percaya nilai dari client, termasuk `petugasId`, `nominal`, dan id relasi.
- Rahasia hanya di variabel lingkungan. Modul `db` dan semua yang menyentuhnya memakai `import "server-only"`.

## 7. UI dan perilaku

- Patuhi `DESIGN.md`. Sebelum selesai tiap halaman, jalankan daftar larangan di bagian 12 dan perbaiki pelanggaran.
- Filter disimpan di **URL** (`?tahunAjaran=...&kelas=...&bulan=...`). Tombol **Tarik Data** adalah submit form GET yang memuat ulang data sesuai filter.
- Grid entri bekerja seperti lembar kerja: Enter menyimpan baris, Tab/Shift+Tab pindah sel, Esc membatalkan, Tambah Baris memindahkan fokus ke sel pertama baris baru. Detail visual di `DESIGN.md` bagian 7.
- Tabel besar dipaginasi di server (50 baris per halaman).
- Pesan sukses/galat dalam Bahasa Indonesia, kalimat pendek, tanpa tanda seru dan emoji.
- Tema: `data-theme` pada `<html>` diatur di server dari cookie `tema`. Jangan memakai kelas `dark:` Tailwind; pakai token semantik (`bg-canvas`, `text-text`, `border-line`).

## 8. Urutan pengerjaan

Kerjakan berurutan; setiap tahap harus lolos `npm run lint`, `npx tsc --noEmit`, dan `npm run build` sebelum lanjut.

1. Inisialisasi Next.js + Tailwind v4, pasang `globals.css` dari `DESIGN.md` bagian 9, font, dan logo. Halaman kosong dengan kerangka sidebar.
2. Prisma: salin `schema.prisma`, `prisma.config.ts`, `src/lib/db.ts`, migrasi pertama, `seed.ts` (hanya akun admin dari env, **tanpa data karangan**).
3. Auth: login, sesi, penjaga peran, paksa ganti kata sandi, keluar.
4. Komponen dasar (`Button`, `Input`, `Select`, `Tabs`, `Dialog`, `Toast`) dan `DataGrid`.
5. Data Siswa & Guru.
6. Pengeluaran (paling sederhana; membentuk pola grid + ringkasan).
7. Pemasukan: Bantuan, Donatur, lalu Dari Siswa (grup kolom, jenis pemasukan, status lunas).
8. Dashboard: ringkasan dan grafik SVG.
9. Pengaturan: Ganti Kata Sandi, Mode, Kelola Akun.
10. Pemeriksaan akhir: daftar larangan DESIGN.md, kontras di kedua tema, keyboard, tampilan di lebar 375px dan 1280px.

## 9. Pertanyaan terbuka untuk pemilik (jangan ditebak)

Gunakan asumsi bawaan di bawah sampai pemilik menjawab, dan tandai dengan komentar `// ASUMSI:` di kode.

1. **"ST"** pada kolom Metode: diasumsikan *Setor Tunai* (TF = Transfer). Benar?
2. **Saldo awal / pindahan antar-tahun:** Total Saldo saat ini = Pemasukan − Pengeluaran pada tahun terpilih. Apakah saldo akhir tahun lalu perlu terbawa?
3. **"Tarik Data":** diasumsikan menerapkan filter dan memuat data. Apakah maksudnya juga mengunduh/ekspor?
4. **"Enter":** diasumsikan menyimpan baris yang sedang diedit. Benar?
5. **Akses siswa/guru:** diasumsikan hanya admin dan petugas yang login. Apakah siswa atau guru juga perlu melihat datanya (mengingat nama "Bank Saku Digital")?
6. **SPP beberapa bulan sekaligus:** diasumsikan satu pembayaran per bulan, tampil sebagai sub-baris dalam sel. Apakah ada pembayaran yang mencakup beberapa bulan?
7. **Total Pemasukan Per Tahun** di halaman Pemasukan diasumsikan mencakup siswa + bantuan + donatur (contoh spreadsheet hanya menjumlahkan jenis dari siswa).
8. **Kode UID:** formatnya (mis. `10-0001`) dibuat siapa dan apa artinya awalan `10`? Saat ini diperlakukan sebagai teks unik biasa.
9. **Siapa yang boleh mengubah/menghapus transaksi** milik petugas lain? Saat ini: petugas hanya boleh mengubah miliknya, admin boleh semua.

## 10. Aturan kerja untuk agen

- Kerjakan satu tahap pada satu waktu. Setelah tiap tahap, ringkas apa yang selesai, apa yang diuji, dan apa yang belum.
- Jangan menambah dependensi di luar bagian 2 tanpa alasan tertulis.
- Jangan membuat fitur di luar bagian 4. Jangan membuat data contoh di halaman produksi.
- Jangan mengubah `schema.prisma` tanpa migrasi dan catatan alasan. Jangan menjalankan `prisma migrate reset` pada database yang berisi data.
- Jangan menyalin komponen dari shadcn/ui atau template dashboard. Bangun dari token `DESIGN.md`.
- Bila ragu antara dua tafsir spreadsheet, pilih yang lebih sederhana dan tulis keraguannya di bagian 9.
- Jangan menulis klaim "sudah diuji" untuk hal yang belum benar-benar dijalankan.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
