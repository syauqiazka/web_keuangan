import { requireAuth } from "@/server/auth/guards";
import { getPengeluaranList, getJenisPengeluaranList } from "@/server/queries/pengeluaran";
import { getTahunAjaranList } from "@/server/queries/anggota";
import { buildBulanFilter } from "@/lib/dates";
import { PengeluaranClient } from "./PengeluaranClient";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function PengeluaranPage({ searchParams }: PageProps) {
  await requireAuth();

  const sp = await searchParams;
  const bulanNomor = sp.bulan ?? ""; // "01"–"12"
  const page = Math.max(1, parseInt(sp.halaman ?? "1", 10) || 1);
  const dari = sp.dari ?? "";
  const sampai = sp.sampai ?? "";
  const jenis = sp.jenis ?? "";

  const [tahunAjaranList, jenisList] = await Promise.all([
    getTahunAjaranList(),
    getJenisPengeluaranList(),
  ]);

  const activeTa = tahunAjaranList.find((t) => t.aktif) ?? tahunAjaranList[0];
  const tahunAjaranId = sp.tahunAjaran === "all" ? "" : (sp.tahunAjaran ?? activeTa?.id ?? "");

  const ta = tahunAjaranList.find((t) => t.id === tahunAjaranId);
  const bulanFilter = ta ? buildBulanFilter(ta, bulanNomor) : "";

  const { rows, total, ringkasan } = await getPengeluaranList({
    tahunAjaranId: tahunAjaranId || undefined,
    bulan: bulanFilter || undefined,
    dari: dari || undefined,
    sampai: sampai || undefined,
    jenis: jenis || undefined,
    page,
  });

  return (
    <PengeluaranClient
      rows={rows}
      total={total}
      ringkasan={ringkasan}
      tahunAjaranList={tahunAjaranList}
      tahunAjaranId={tahunAjaranId}
      bulan={bulanFilter}
      bulanNomor={bulanNomor}
      dari={dari}
      sampai={sampai}
      jenis={jenis}
      jenisList={jenisList}
      page={page}
    />
  );
}
