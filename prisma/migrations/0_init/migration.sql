-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Peran" AS ENUM ('ADMIN', 'PETUGAS');

-- CreateEnum
CREATE TYPE "TemaTampilan" AS ENUM ('TERANG', 'GELAP', 'SISTEM');

-- CreateEnum
CREATE TYPE "TipeAnggota" AS ENUM ('SISWA', 'GURU');

-- CreateEnum
CREATE TYPE "MetodeBayar" AS ENUM ('TRANSFER', 'SETOR_TUNAI');

-- CreateEnum
CREATE TYPE "KategoriSumberDana" AS ENUM ('BANTUAN', 'DONATUR');

-- CreateTable
CREATE TABLE "pengguna" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "peran" "Peran" NOT NULL DEFAULT 'PETUGAS',
    "tema" "TemaTampilan" NOT NULL DEFAULT 'SISTEM',
    "wajibGantiPassword" BOOLEAN NOT NULL DEFAULT true,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "gagalLogin" INTEGER NOT NULL DEFAULT 0,
    "terkunciSampai" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengguna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesi" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "penggunaId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tahun_ajaran" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "mulai" DATE NOT NULL,
    "selesai" DATE NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tahun_ajaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelas" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anggota" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tipe" "TipeAnggota" NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anggota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penempatan_kelas" (
    "id" TEXT NOT NULL,
    "anggotaId" TEXT NOT NULL,
    "tahunAjaranId" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,

    CONSTRAINT "penempatan_kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jenis_pemasukan" (
    "id" TEXT NOT NULL,
    "tahunAjaranId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "bulanan" BOOLEAN NOT NULL DEFAULT false,
    "nominalStandar" DECIMAL(15,0),
    "aktif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "jenis_pemasukan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pembayaran_siswa" (
    "id" TEXT NOT NULL,
    "penempatanId" TEXT NOT NULL,
    "jenisPemasukanId" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "bulanTerbayar" DATE,
    "metode" "MetodeBayar" NOT NULL,
    "nominal" DECIMAL(15,0) NOT NULL,
    "petugasId" TEXT NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "pembayaran_siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sumber_dana" (
    "id" TEXT NOT NULL,
    "kategori" "KategoriSumberDana" NOT NULL,
    "nama" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sumber_dana_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pemasukan_dana" (
    "id" TEXT NOT NULL,
    "sumberDanaId" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "nominal" DECIMAL(15,0) NOT NULL,
    "petugasId" TEXT NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "pemasukan_dana_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengeluaran" (
    "id" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "jenis" TEXT NOT NULL,
    "nominal" DECIMAL(15,0) NOT NULL,
    "petugasId" TEXT NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "pengeluaran_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pengguna_kode_key" ON "pengguna"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "sesi_tokenHash_key" ON "sesi"("tokenHash");

-- CreateIndex
CREATE INDEX "sesi_penggunaId_idx" ON "sesi"("penggunaId");

-- CreateIndex
CREATE INDEX "sesi_expiresAt_idx" ON "sesi"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "tahun_ajaran_nama_key" ON "tahun_ajaran"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "kelas_nama_key" ON "kelas"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "anggota_uid_key" ON "anggota"("uid");

-- CreateIndex
CREATE INDEX "anggota_tipe_aktif_idx" ON "anggota"("tipe", "aktif");

-- CreateIndex
CREATE INDEX "penempatan_kelas_tahunAjaranId_kelasId_idx" ON "penempatan_kelas"("tahunAjaranId", "kelasId");

-- CreateIndex
CREATE UNIQUE INDEX "penempatan_kelas_anggotaId_tahunAjaranId_key" ON "penempatan_kelas"("anggotaId", "tahunAjaranId");

-- CreateIndex
CREATE UNIQUE INDEX "jenis_pemasukan_tahunAjaranId_nama_key" ON "jenis_pemasukan"("tahunAjaranId", "nama");

-- CreateIndex
CREATE INDEX "pembayaran_siswa_penempatanId_jenisPemasukanId_idx" ON "pembayaran_siswa"("penempatanId", "jenisPemasukanId");

-- CreateIndex
CREATE INDEX "pembayaran_siswa_jenisPemasukanId_idx" ON "pembayaran_siswa"("jenisPemasukanId");

-- CreateIndex
CREATE INDEX "pembayaran_siswa_tanggal_idx" ON "pembayaran_siswa"("tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "sumber_dana_kategori_nama_key" ON "sumber_dana"("kategori", "nama");

-- CreateIndex
CREATE INDEX "pemasukan_dana_sumberDanaId_idx" ON "pemasukan_dana"("sumberDanaId");

-- CreateIndex
CREATE INDEX "pemasukan_dana_tanggal_idx" ON "pemasukan_dana"("tanggal");

-- CreateIndex
CREATE INDEX "pengeluaran_tanggal_idx" ON "pengeluaran"("tanggal");

-- AddForeignKey
ALTER TABLE "sesi" ADD CONSTRAINT "sesi_penggunaId_fkey" FOREIGN KEY ("penggunaId") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penempatan_kelas" ADD CONSTRAINT "penempatan_kelas_anggotaId_fkey" FOREIGN KEY ("anggotaId") REFERENCES "anggota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penempatan_kelas" ADD CONSTRAINT "penempatan_kelas_tahunAjaranId_fkey" FOREIGN KEY ("tahunAjaranId") REFERENCES "tahun_ajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penempatan_kelas" ADD CONSTRAINT "penempatan_kelas_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jenis_pemasukan" ADD CONSTRAINT "jenis_pemasukan_tahunAjaranId_fkey" FOREIGN KEY ("tahunAjaranId") REFERENCES "tahun_ajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran_siswa" ADD CONSTRAINT "pembayaran_siswa_penempatanId_fkey" FOREIGN KEY ("penempatanId") REFERENCES "penempatan_kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran_siswa" ADD CONSTRAINT "pembayaran_siswa_jenisPemasukanId_fkey" FOREIGN KEY ("jenisPemasukanId") REFERENCES "jenis_pemasukan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran_siswa" ADD CONSTRAINT "pembayaran_siswa_petugasId_fkey" FOREIGN KEY ("petugasId") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemasukan_dana" ADD CONSTRAINT "pemasukan_dana_sumberDanaId_fkey" FOREIGN KEY ("sumberDanaId") REFERENCES "sumber_dana"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemasukan_dana" ADD CONSTRAINT "pemasukan_dana_petugasId_fkey" FOREIGN KEY ("petugasId") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengeluaran" ADD CONSTRAINT "pengeluaran_petugasId_fkey" FOREIGN KEY ("petugasId") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
