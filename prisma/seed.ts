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
}

main()
  .catch((err) => {
    console.error("Gagal menjalankan seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
