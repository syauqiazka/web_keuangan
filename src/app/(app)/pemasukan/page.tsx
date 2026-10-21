import { requireAuth } from "@/server/auth/guards";
import {
  getPembayaranSiswaGrid,
  getPemasukanDanaList,
  getSumberDanaList,
  getRingkasanPemasukan,
} from "@/server/queries/pemasukan";
import { getTahunAjaranList, getKelasList } from "@/server/queries/anggota";
import { buildBulanFilter } from "@/lib/dates";
import { PemasukanClient } from "@/app/(app)/pemasukan/PemasukanClient";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function PemasukanPage({ searchParams }: PageProps) {
  await requireAuth();

  const sp = await searchParams;
  const tahunAjaranId = sp.tahunAjaran ?? "";
  const kelasId = sp.kelas ?? "";
  const bulanNomor = sp.bulan ?? "";
  const tab = (sp.tab ?? "dari-siswa") as "dari-siswa" | "bantuan" | "donatur";

  const [tahunAjaranList, kelasList] = await Promise.all([
    getTahunAjaranList(),
    getKelasList(),
  ]);

  const ta = tahunAjaranList.find((t) => t.id === tahunAjaranId);
  const bulanFilter = buildBulanFilter(ta, bulanNomor);

  const ringkasan = await getRingkasanPemasukan({
    tahunAjaranId: tahunAjaranId || undefined,
    bulan: bulanFilter || undefined,
  });


  // Data spesifik per tab
  const [siswaData, bantuanRows, donaturRows, bantuanSumber, donaturSumber] =
    await Promise.all([
      tahunAjaranId
        ? getPembayaranSiswaGrid({
            tahunAjaranId,
            kelasId: kelasId || undefined,
          })
        : Promise.resolve({ jenisOptions: [], siswaRows: [] }),
      getPemasukanDanaList({
        kategori: "BANTUAN",
        tahunAjaranId: tahunAjaranId || undefined,
        bulan: bulanFilter || undefined,
      }),
      getPemasukanDanaList({
        kategori: "DONATUR",
        tahunAjaranId: tahunAjaranId || undefined,
        bulan: bulanFilter || undefined,
      }),
      getSumberDanaList("BANTUAN"),
      getSumberDanaList("DONATUR"),
    ]);

  return (
    <PemasukanClient
      tahunAjaranList={tahunAjaranList}
      kelasList={kelasList}
      tahunAjaranId={tahunAjaranId}
      kelasId={kelasId}
      bulan={bulanFilter}
      tab={tab}
      ringkasan={ringkasan}
      siswaData={siswaData}
      bantuanRows={bantuanRows}
      donaturRows={donaturRows}
      bantuanSumber={bantuanSumber}
      donaturSumber={donaturSumber}
    />
  );
}
