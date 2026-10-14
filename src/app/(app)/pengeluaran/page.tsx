import { requireAuth } from "@/server/auth/guards";
import { getPengeluaranList } from "@/server/queries/pengeluaran";
import { getTahunAjaranList } from "@/server/queries/anggota";
import { PengeluaranClient } from "./PengeluaranClient";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function PengeluaranPage({ searchParams }: PageProps) {
  await requireAuth();

  const sp = await searchParams;
  const tahunAjaranId = sp.tahunAjaran ?? "";
  const bulanNomor = sp.bulan ?? ""; // "01"–"12"
  const page = Math.max(1, parseInt(sp.halaman ?? "1", 10) || 1);

  // Bangun string bulan "YYYY-MM" jika ada filter bulan + tahun ajaran
  // Untuk filter ringkasan bulan ini, pakai tahun dari TahunAjaran atau tahun sekarang
  let bulanFilter = "";
  if (bulanNomor) {
    // Jika ada tahun ajaran, ambil tahun mulai TahunAjaran; jika tidak, pakai tahun sekarang
    const tahunAjaranList = await getTahunAjaranList();
    const ta = tahunAjaranList.find((t) => t.id === tahunAjaranId);
    let tahun: number;
    if (ta) {
      tahun = new Date(ta.mulai).getFullYear();
    } else {
      // Gunakan zona Asia/Jakarta untuk menghitung "tahun ini"
      tahun = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
      ).getFullYear();
    }
    bulanFilter = `${tahun}-${bulanNomor.padStart(2, "0")}`;
  }

  const [tahunAjaranList, { rows, total, ringkasan }] = await Promise.all([
    getTahunAjaranList(),
    getPengeluaranList({
      tahunAjaranId: tahunAjaranId || undefined,
      bulan: bulanFilter || undefined,
      page,
    }),
  ]);

  return (
    <PengeluaranClient
      rows={rows}
      total={total}
      ringkasan={ringkasan}
      tahunAjaranList={tahunAjaranList}
      tahunAjaranId={tahunAjaranId}
      bulan={bulanFilter}
      page={page}
    />
  );
}
