/**
 * guide-tutorials.ts — Definisi panduan kontekstual per halaman aktual Bank Saku Digital
 */

import { PageTutorial } from "./guide-types";

export const PAGE_TUTORIALS: Record<string, PageTutorial> = {
  "/dashboard": {
    pageId: "dashboard",
    pageTitle: "Dashboard Keuangan",
    route: "/dashboard",
    summary: "Ringkasan saldo sekolah, total arus kas tahunan, dan grafik perbandingan bulanan.",
    steps: [
      {
        id: "dash-1",
        title: "Total Saldo Dana Sekolah",
        description:
          "Menampilkan saldo bersih tahun terpilih yang dihitung dari total akumulasi pemasukan dikurangi total pengeluaran.",
        tip: "Saldo ini dihitung langsung dari basis data tanpa tabel perantara.",
      },
      {
        id: "dash-2",
        title: "Filter Tahun Kalender",
        description:
          "Gunakan dropdown tahun di pojok kanan atas untuk mengganti periode pembukuan. Angka ringkasan dan grafik akan otomatis diperbarui.",
      },
      {
        id: "dash-3",
        title: "Pemasukan & Pengeluaran Tahunan",
        description:
          "Kartu ringkasan pemasukan mencakup seluruh pembayaran siswa, bantuan, dan donatur. Angka ini selalu sinkron dengan halaman Pemasukan dan Pengeluaran.",
      },
      {
        id: "dash-4",
        title: "Grafik Batang Bulanan",
        description:
          "Grafik batang Januari hingga Desember membandingkan arus kas: batang hijau adalah Pemasukan, dan batang biru adalah Pengeluaran.",
      },
    ],
  },
  "/data-siswa-guru": {
    pageId: "data-siswa-guru",
    pageTitle: "Data Siswa & Guru",
    route: "/data-siswa-guru",
    summary: "Manajemen anggota sekolah dan sumber nama siswa untuk pencatatan pembayaran.",
    steps: [
      {
        id: "dsg-1",
        title: "Filter & Tombol Enter",
        description:
          "Pilih Tahun Ajaran dan Kelas (atau Guru), kemudian klik tombol Enter untuk memuat data tabel secara hanya-baca.",
      },
      {
        id: "dsg-2",
        title: "Kode UID Otomatis",
        description:
          "Setiap siswa dan guru memiliki Kode UID unik. Kolom ini terhubung langsung ke modul pembayaran siswa.",
      },
      {
        id: "dsg-3",
        title: "Mode Input & Paste Excel",
        description:
          "Klik tombol 'Input' untuk masuk ke mode edit. Anda dapat mengetik manual, menambah baris, atau menyalin (Ctrl+C) data dari spreadsheet Excel lalu menempelkannya (Ctrl+V) langsung ke tabel.",
        tip: "Validasi dilakukan otomatis per sel sebelum data diizinkan disimpan.",
      },
      {
        id: "dsg-4",
        title: "Simpan Transaksi",
        description:
          "Setelah selesai mengedit, klik tombol 'Simpan' untuk mengirim seluruh perubahan dalam satu transaksi aman ke basis data.",
      },
    ],
  },
  "/pemasukan": {
    pageId: "pemasukan",
    pageTitle: "Pencatatan Pemasukan",
    route: "/pemasukan",
    summary: "Pencatatan pembayaran siswa, dana bantuan pemerintah, dan sumbangan donatur.",
    steps: [
      {
        id: "pem-1",
        title: "Tiga Sumber Pemasukan",
        description:
          "Gunakan tab di bagian atas untuk memilih sumber dana: 'Dari Siswa', 'Bantuan' (BOSP, BPMU, PIP), atau 'Donatur' (OTA, hibah, infak).",
      },
      {
        id: "pem-2",
        title: "Tarik Data & Ringkasan",
        description:
          "Pilih Tahun Ajaran, Kelas, dan Bulan, lalu klik 'Tarik Data'. Ringkasan atas menampilkan Total Pemasukan Tahunan (seluruh sekolah) dan Jumlah Bulan Ini.",
      },
      {
        id: "pem-3",
        title: "Struktur Kolom Siswa",
        description:
          "SPP memiliki 4 sub-kolom: Tanggal, Bulan Terbayar, Metode (Transfer/Setor Tunai), dan Petugas. Jenis lain memiliki 3 sub-kolom. Nominal berstatus kurang lunas ditandai warna merah.",
      },
      {
        id: "pem-4",
        title: "Tambah Kolom Pembayaran",
        description:
          "Saat mode Input aktif, Anda dapat mengklik tombol 'Tambah Kolom' untuk menambahkan pos pembayaran baru (misalnya Uang Gedung atau Ujian).",
      },
    ],
  },
  "/pengeluaran": {
    pageId: "pengeluaran",
    pageTitle: "Pencatatan Pengeluaran",
    route: "/pengeluaran",
    summary: "Pencatatan belanja operasional sekolah, gaji, logistik, dan kebutuhan sarana.",
    steps: [
      {
        id: "peng-1",
        title: "Filter Periode & Tarik Data",
        description:
          "Pilih Tahun Ajaran dan Bulan pengeluaran, kemudian klik 'Tarik Data' untuk menampilkan daftar pengeluaran.",
      },
      {
        id: "peng-2",
        title: "Ringkasan Pengeluaran",
        description:
          "Dua kartu ringkasan di atas menampilkan total kumulatif pengeluaran pada bulan terpilih dan total tahunan sekolah.",
      },
      {
        id: "peng-3",
        title: "Input & Paste Excel",
        description:
          "Klik tombol 'Input' untuk memasukkan tanggal, jenis pengeluaran, nominal, dan nama petugas. Mendukung penempelan banyak baris dari Excel.",
      },
      {
        id: "peng-4",
        title: "Penyimpanan Sekaligus",
        description:
          "Tekan tombol 'Simpan' untuk memproses seluruh baris baru ke server. Perubahan belum disimpan jika tombol masih berwarna peringatan.",
      },
    ],
  },
  "/pengaturan": {
    pageId: "pengaturan",
    pageTitle: "Pengaturan & Keamanan",
    route: "/pengaturan",
    summary: "Manajemen akun, kata sandi, dan preferensi tema tampilan aplikasi.",
    steps: [
      {
        id: "peng-1",
        title: "Ganti Kata Sandi",
        description:
          "Perbarui kata sandi akun Anda secara berkala (minimal 8 karakter) untuk menjaga keamanan pencatatan kas sekolah.",
      },
      {
        id: "peng-2",
        title: "Mode Terang & Gelap",
        description:
          "Pilih tema tampilan yang nyaman untuk mata: Terang (siang) atau Gelap. Pilihan tersimpan di preferensi pengguna dan cookie.",
      },
      {
        id: "peng-3",
        title: "Kelola Akun (Admin)",
        description:
          "Bagi pengguna dengan peran ADMIN, tersedia menu Kelola Akun untuk membuat akun petugas baru, mereset sandi, dan menonaktifkan akses.",
      },
    ],
  },
};

export function getTutorialForPath(pathname: string): PageTutorial {
  // Cocokkan rute yang diawali
  for (const [route, tutorial] of Object.entries(PAGE_TUTORIALS)) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      return tutorial;
    }
  }
  // Default ke dashboard
  return PAGE_TUTORIALS["/dashboard"];
}
