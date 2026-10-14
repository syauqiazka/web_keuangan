import { requireAuth } from "@/server/auth/guards";
import { getAnggotaList, getTahunAjaranList, getKelasList } from "@/server/queries/anggota";
import { DataSiswaGuruClient } from "./DataSiswaGuruClient";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function DataSiswaGuruPage({ searchParams }: PageProps) {
  await requireAuth();

  const sp = await searchParams;
  const tahunAjaranId = sp.tahunAjaran ?? "";
  const kelasId = sp.kelas ?? "";
  const page = Math.max(1, parseInt(sp.halaman ?? "1", 10) || 1);

  const [tahunAjaranList, kelasList, { rows, total }] = await Promise.all([
    getTahunAjaranList(),
    getKelasList(),
    getAnggotaList({ tahunAjaranId: tahunAjaranId || undefined, kelasId: kelasId || undefined, page }),
  ]);

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
