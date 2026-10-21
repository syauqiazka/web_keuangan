import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, Peran, TemaTampilan } from "../src/generated/prisma/client";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DIRECT_URL atau DATABASE_URL belum diatur.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

async function main() {
  // 1. Akun Admin Utama
  const kode = process.env.SEED_ADMIN_KODE ?? "admin";
  const rawPassword = process.env.SEED_ADMIN_PASSWORD ?? "ganti-saya-sebelum-seed";

  const passwordHash = await hash(rawPassword);

  const admin = await prisma.pengguna.upsert({
    where: { kode },
    update: {},
    create: {
      kode,
      nama: "Administrator",
      passwordHash,
      peran: Peran.ADMIN,
      tema: TemaTampilan.SISTEM,
      wajibGantiPassword: true,
      aktif: true,
    },
  });
  console.log(`Akun admin berhasil disiapkan: ${admin.kode}`);

  // 2. Master Data Kelas (Kelas 10, Kelas 11, Kelas 12)
  const masterKelas = [
    { nama: "Kelas 10", urutan: 10 },
    { nama: "Kelas 11", urutan: 11 },
    { nama: "Kelas 12", urutan: 12 },
  ];

  for (const k of masterKelas) {
    const res = await prisma.kelas.upsert({
      where: { nama: k.nama },
      update: { urutan: k.urutan },
      create: { nama: k.nama, urutan: k.urutan },
    });
    console.log(`Master Kelas disiapkan: ${res.nama}`);
  }

  // 3. Master Data Tahun Ajaran (Idempoten)
  const existingTaCount = await prisma.tahunAjaran.count();
  let defaultTa = await prisma.tahunAjaran.findUnique({
    where: { nama: "2026/2027" },
  });

  if (!defaultTa) {
    defaultTa = await prisma.tahunAjaran.create({
      data: {
        nama: "2026/2027",
        mulai: new Date("2026-07-01T00:00:00.000Z"),
        selesai: new Date("2027-06-30T00:00:00.000Z"),
        aktif: existingTaCount === 0, // Aktifkan jika belum ada tahun ajaran lain
      },
    });
    console.log(`Tahun Ajaran disiapkan: ${defaultTa.nama} (Aktif: ${defaultTa.aktif})`);
  } else {
    console.log(`Tahun Ajaran "${defaultTa.nama}" sudah tersedia.`);
  }

  // 4. Default Jenis Pemasukan SPP untuk Tahun Ajaran tersebut (jika belum ada)
  if (defaultTa) {
    const existingSpp = await prisma.jenisPemasukan.findUnique({
      where: {
        tahunAjaranId_nama: {
          tahunAjaranId: defaultTa.id,
          nama: "SPP",
        },
      },
    });

    if (!existingSpp) {
      await prisma.jenisPemasukan.create({
        data: {
          tahunAjaranId: defaultTa.id,
          nama: "SPP",
          bulanan: true,
          urutan: 1,
          nominalStandar: 250000,
          aktif: true,
        },
      });
      console.log(`Jenis Pemasukan "SPP" disiapkan untuk ${defaultTa.nama}`);
    }
  }
}

main()
  .catch((err) => {
    console.error("Gagal menjalankan seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
