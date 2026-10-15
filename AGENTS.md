# AGENTS.md — Pencatatan Keuangan Sekolah | Bank Saku Digital

Aplikasi web internal untuk mencatat pemasukan dan pengeluaran sekolah. Pengguna: admin dan petugas sekolah. Bahasa antarmuka: Indonesia.

Baca file ini sampai selesai sebelum menulis kode. Baca `DESIGN.md` sebelum menyentuh UI apa pun.

## 1. Sumber kebenaran

| Urusan | File | Catatan |
|---|---|---|
| Tampilan, warna, font, komponen, larangan visual | `DESIGN.md` | Turunan dari Modern Treasury (Refero Styles). Patuhi daftar larangan di bagian 12. |
| Struktur data | `prisma/schema.prisma` | Sudah divalidasi dengan Prisma 7.10. Ubah hanya lewat migrasi dan sebutkan alasannya. |
| Fitur dan aturan bisnis | file ini, bagian 4 dan 5 | Berasal dari `Website.xlsx` dan penjelasan lisan pemilik (transkrip). Jika keduanya berbeda, pakai penjelasan pemilik dan catat perbedaannya di bagian 9. |
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

### 4.0 Pola kerja yang sama di semua halaman data (penjelasan pemilik)

Halaman Data Siswa & Guru, Pemasukan, dan Pengeluaran memakai pola yang sama:

1. **Pilih filter, lalu tekan Enter / Tarik Data.** Data muncul sebagai tabel. Tombol ini bernama **Enter** di Data Siswa & Guru dan **Tarik Data** di Pemasukan dan Pengeluaran; perilakunya sama (kirim filter, muat data). Tabel awalnya **hanya-baca**.
2. **Klik Input** untuk masuk mode edit. Sel menjadi bisa diubah dan tombol **Tambah Baris** (serta **Tambah Kolom** di Pemasukan > Dari Siswa) muncul. Tombol Input berubah menjadi **Batal**.
3. **Klik Simpan** untuk menyimpan semua perubahan sekaligus dalam satu transaksi database. Sebelum Simpan, tidak ada yang tertulis ke database. Peringatkan bila pengguna meninggalkan halaman dengan perubahan yang belum disimpan.
4. **Tabel harus bisa di-copy dan di-paste.** Alasan pemilik: guru/petugas menyalin data dari Excel. Gunakan elemen `<table>` asli supaya salin bawaan browser bekerja, dan tangani event `paste` (teks TSV dari Excel/Google Sheets) di mode edit: tempel dari sel yang terfokus mengisi ke bawah dan ke kanan, menambah baris bila kurang. Tiap sel divalidasi setelah paste; sel bermasalah ditandai, dan Simpan ditolak sampai diperbaiki. Paste aktif di Data Siswa & Guru, Bantuan, Donatur, dan Pengeluaran. Tidak perlu di Pemasukan > Dari Siswa.

### 4.1 Login
- Masuk dengan **Kode** dan **Kata sandi**. Akun dibuat oleh admin (catatan di sheet Dashboard). Tidak ada pendaftaran mandiri.
- Setelah admin membuat atau mengatur ulang akun, `wajibGantiPassword = true`: pengguna dipaksa ke dialog Ganti Kata Sandi sebelum bisa memakai halaman lain.

### 4.2 Dashboard
- Filter **Tahun** (tahun kalender): daftar pilihan berisi semua tahun dari transaksi tertua sampai tahun berjalan (contoh 2024, 2025, 2026). Klik tahun, angka dan grafik berganti.
- Tiga angka: **Total Saldo Dana Sekolah**, **Pemasukan**, **Pengeluaran** untuk tahun terpilih. Saldo = total pemasukan − total pengeluaran pada tahun itu (contoh: 1.067.000.000 − 700.000.000 = 367.000.000).
- Angka Pemasukan di sini **harus sama persis** dengan "Total Pemasukan Per Tahun" di halaman Pemasukan, dan Pengeluaran dengan "Total Pengeluaran Per Tahun" di halaman Pengeluaran. Gunakan satu fungsi query yang sama untuk keduanya; jangan menghitung dua kali di dua tempat.
- Grafik batang Januari–Desember: **hijau = Pemasukan, biru = Pengeluaran** (permintaan pemilik; warna persisnya di `DESIGN.md`). Pemasukan = pembayaran siswa + bantuan + donatur.
- Logo ditampilkan di header, bukan sebagai hiasan di badan halaman.

### 4.3 Data Siswa & Guru
- Filter: **Tahun Ajaran** dan **Kelas** (atau "Guru"), lalu tombol **Enter** (lihat 4.0). Contoh dari pemilik: tahun ajaran 2022, kelas 10.
- Tabel: **No, Nama, Kelas/Guru, Kode UID**. Satu kelas bisa sampai sekitar 50 siswa; tampilkan semuanya (tanpa paginasi) dan biarkan halaman bergulir ke bawah. Tinggi tampilan awal sekitar 20 baris.
- Data siswa ini adalah **sumber daftar nama di Pemasukan > Dari Siswa**: nama di sana terhubung otomatis ke sini, tidak diketik ulang.
- Mode edit mengikuti 4.0 (Input, Tambah Baris, Simpan, paste dari Excel). Kolom Kelas/Guru di mode edit berupa pilihan (kelas, atau Guru), bukan teks bebas.
- Model: `Anggota` (siswa atau guru, `uid` unik) dan `PenempatanKelas` (siswa di kelas X pada tahun ajaran Y). Guru tidak punya penempatan.

### 4.4 Pemasukan
Pemasukan sekolah punya tiga sumber, masing-masing satu tab: **Dari Siswa**, **Bantuan**, **Donatur**.

Filter: **Tahun Ajaran**, **Kelas**, **Bulan**, tombol **Tarik Data**. Di atas tabel ada dua ringkasan:
- **Total Pemasukan Per Tahun**: jumlah semua sumber pada tahun terpilih, **seluruh kelas** (kelas 10, 11, 12, masing-masing A/B/C, dikumulatifkan). Sama dengan angka Pemasukan di Dashboard. Disertai rincian per jenis, contoh dari pemilik: SPP 700 juta, Daftar Ulang 67 juta, Uang Gedung 300 juta, ditambah Bantuan dan Donatur.
- **Jumlah Pemasukan Bulan Ini** (nama label mengikuti bulan terpilih): jumlah semua sumber pada bulan dan tahun terpilih, kumulatif SPP, Daftar Ulang, dan seterusnya. Contoh pemilik: Tahun 2026, bulan Oktober, Tarik Data, jumlah muncul.
Filter **Kelas** hanya menentukan baris yang tampil di tabel Dari Siswa; ringkasan di atas tidak ikut berubah karenanya.

**Dari Siswa**
- Kolom tetap **No, Nama Siswa, Kode UID** (terhubung ke Data Siswa), lalu satu **grup kolom per jenis pemasukan**.
- **SPP selalu grup pertama dan satu-satunya yang bulanan**, dengan **empat** sub-kolom: Tanggal Transaksi, **Bulan Terbayar** (mis. Januari atau Februari), Metode (TF/ST), Petugas. Nominal ditampilkan di atas sub-kolom.
- Jenis lain (Daftar Ulang, Ujian, Uang Gedung, Uang Pangkal Praktik, ...) selalu **tiga** sub-kolom: Tanggal Transaksi, Metode, Petugas.
- **Tambah Kolom** (mode edit) menambah jenis pemasukan baru di sebelah kanan, sesuai kebutuhan sekolah. Dialognya meminta Nama dan (opsional) nominal standar. Jenis baru selalu tidak bulanan (tiga sub-kolom). Model: `JenisPemasukan`, per tahun ajaran. **Tambah Baris** menambah pembayaran.
- **Nominal berwarna merah bila belum lunas** (contoh: Daftar Ulang 150.000 dari standar 200.000). Lihat aturan di 5.3.

**Bantuan**
- Kolom: **No, Jenis Bantuan, Tanggal, Nominal, Petugas**. Contoh jenis menurut pemilik: BOSP, BPMU, PIP. Model: `PemasukanDana` dengan `SumberDana.kategori = BANTUAN`.

**Donatur**
- Kolom: **No, Jenis/Nama Donatur, Tanggal, Nominal, Petugas**. Contoh menurut pemilik: OTA, hibah (dana hibah), sedekah, infak; spreadsheet juga memuat nama orang (Haji Isam). Model sama dengan kategori `DONATUR`.
- Pada Bantuan dan Donatur, kolom pertama berupa pilihan dari `SumberDana` dengan opsi menambah nama baru, supaya ejaan tidak pecah.

### 4.5 Pengeluaran
- Filter: **Tahun Ajaran**, **Bulan**, tombol **Tarik Data**.
- Ringkasan: **Jumlah Pengeluaran Bulan Ini** dan **Total Pengeluaran Per Tahun**.
- **Total Pengeluaran Per Tahun** sama persis dengan angka Pengeluaran di Dashboard. **Jumlah Pengeluaran Bulan Ini** adalah kumulatif semua pengeluaran pada bulan terpilih.
- Tabel: **No, Tanggal, Jenis Pengeluaran, Nominal, Petugas** (contoh: 13-10-2026, Gaji Guru, 100.000.000, Bu Resa).
- Mode edit mengikuti 4.0 (Input, Tambah Baris, Simpan, paste dari Excel).

### 4.6 Pengaturan
1. **Ganti Kata Sandi**
2. **Log Out** (tampil sebagai "Keluar")
3. **Mode**: dua pilihan saja, **Terang** (siang) dan **Gelap**, sesuai penjelasan pemilik. Simpan ke `Pengguna.tema` dan cookie `tema` supaya tidak berkedip saat dimuat.

### 4.7 Tambahan di luar spreadsheet (satu-satunya)
Spreadsheet menyatakan akun dibuat oleh admin tetapi tidak punya layar untuk itu. Bangun halaman minimal **Kelola Akun** di bawah Pengaturan, hanya untuk `ADMIN`: daftar akun, buat akun (Kode, Nama, Peran, kata sandi awal), atur ulang kata sandi, nonaktifkan. Akun admin pertama dibuat oleh `prisma/seed.ts` dari `SEED_ADMIN_*`.

### 4.8 Jangan dibangun (tidak ada di spreadsheet)
Pencarian global, ekspor Excel/PDF, unggah berkas Excel (yang diminta pemilik hanya **paste** dari clipboard, lihat 4.0), notifikasi, kategori pengeluaran, laporan cetak, portal untuk siswa/orang tua, tabungan siswa. Jika tampaknya perlu, tulis sebagai saran ke pemilik, jangan dikerjakan.

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
- Total tahunan dan bulanan **tidak** difilter kelas. Dashboard, halaman Pemasukan, dan halaman Pengeluaran memakai fungsi query yang sama (`getTotalPemasukan`, `getTotalPengeluaran`), supaya angkanya tidak pernah berbeda.
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
- Alur Tarik Data / Enter, Input, Simpan, dan paste mengikuti bagian 4.0. Di dalam sel: Tab/Shift+Tab pindah sel ke samping, Enter pindah ke sel di bawahnya, Esc membatalkan perubahan sel, Tambah Baris memindahkan fokus ke sel pertama baris baru. Enter di dalam sel **tidak** menyimpan. Detail visual di `DESIGN.md` bagian 7.
- Simpan mengirim semua baris yang berubah ke satu Server Action dan menulisnya dalam satu transaksi. Jika ada baris yang gagal validasi, tidak ada yang tersimpan dan galat dikembalikan per baris/sel.
- Data Siswa & Guru tidak dipaginasi (sudah difilter per kelas). Tabel pembayaran dan transaksi yang besar dipaginasi di server (50 baris per halaman).
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

Sudah dijawab lewat penjelasan pemilik (jangan ditanyakan lagi): arti Enter/Tarik Data/Input/Simpan (4.0), total pemasukan mencakup semua sumber dan sama dengan Dashboard (4.2, 4.4), SPP empat kolom dan jenis lain tiga (4.4), mode hanya terang/gelap (4.6), tabel harus bisa copy-paste (4.0), warna grafik hijau dan biru (4.2).

1. **"ST"** pada kolom Metode: diasumsikan *Setor Tunai* (TF = Transfer). Benar?
2. **Saldo awal / pindahan antar-tahun:** Total Saldo = pemasukan − pengeluaran pada tahun terpilih, sesuai penjelasan pemilik. Apakah saldo akhir tahun lalu perlu terbawa ke tahun berikutnya?
3. **Akses siswa/guru:** diasumsikan hanya admin dan petugas yang login. Apakah siswa atau guru juga perlu melihat datanya (mengingat nama "Bank Saku Digital")?
4. **SPP beberapa bulan sekaligus:** diasumsikan satu pembayaran per bulan, tampil sebagai sub-baris dalam sel. Apakah ada pembayaran yang mencakup beberapa bulan?
5. **Kode UID:** pemilik bilang "kita akan kasih kode UID" dan menyebut isinya "ada tiga" (kalimat kurang jelas di transkrip). Apa format dan artinya? Saat ini diperlakukan sebagai teks unik biasa, dan contoh `10-0001` di spreadsheet tidak diurai.
6. **Filter Kelas pada ringkasan Pemasukan:** diasumsikan ringkasan (tahunan dan bulanan) selalu seluruh sekolah, dan filter Kelas hanya mengatur baris tabel. Benar? (Pemilik menyebut "kelasnya kebalik" tanpa penjelasan.)
7. **Ringkasan "Jumlah Pemasukan Bulan Ini"** diasumsikan mencakup Bantuan dan Donatur, bukan hanya SPP dan jenis dari siswa ("SPP, daftar ulang dan sebagainya"). Benar?
8. **Siapa yang boleh mengubah/menghapus transaksi** milik petugas lain? Saat ini: petugas hanya boleh mengubah miliknya, admin boleh semua.
9. **Daftar Tahun di Dashboard:** diasumsikan dari tahun transaksi tertua sampai tahun berjalan. Perlu tahun masa depan juga (pemilik menyebut "2025, 2026, 2027 dan seterusnya")?

## 10. Aturan kerja untuk agen

- Kerjakan satu tahap pada satu waktu. Setelah tiap tahap, ringkas apa yang selesai, apa yang diuji, dan apa yang belum.
- Jangan menambah dependensi di luar bagian 2 tanpa alasan tertulis.
- Jangan membuat fitur di luar bagian 4. Jangan membuat data contoh di halaman produksi.
- Jangan mengubah `schema.prisma` tanpa migrasi dan catatan alasan. Jangan menjalankan `prisma migrate reset` pada database yang berisi data.
- Jangan menyalin komponen dari shadcn/ui atau template dashboard. Bangun dari token `DESIGN.md`.
- Bila ragu antara dua tafsir spreadsheet, pilih yang lebih sederhana dan tulis keraguannya di bagian 9.
- Jangan menulis klaim "sudah diuji" untuk hal yang belum benar-benar dijalankan.