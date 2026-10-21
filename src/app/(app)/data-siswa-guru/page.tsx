import { requireAuth } from "@/server/auth/guards";
import { getAnggotaList, getTahunAjaranList, getKelasList } from "@/server/queries/anggota";
import { DataSiswaGuruClient } from "./DataSiswaGuruClient";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function DataSiswaGuruPage({ searchParams }: PageProps) {
  await requireAuth();

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.halaman ?? "1", 10) || 1);

  const [tahunAjaranList, kelasList] = await Promise.all([
    getTahunAjaranList(),
    getKelasList(),
  ]);

  const activeTa = tahunAjaranList.find((t) => t.aktif) ?? tahunAjaranList[0];
  const tahunAjaranId = sp.tahunAjaran ?? activeTa?.id ?? "";
  const kelasId = sp.kelas ?? "";

  const { rows, total } = await getAnggotaList({
    tahunAjaranId: tahunAjaranId || undefined,
    kelasId: kelasId || undefined,
    page,
  });

  return (
    <DataSiswaGuruClient
      rows={rows}
      total={total}
      tahunAjaranList={tahunAjaranList}
      kelasList={kelasList}
      tahunAjaranId={tahunAjaranId}
      kelasId={kelasId}
      page={page}
    />
  );
}
