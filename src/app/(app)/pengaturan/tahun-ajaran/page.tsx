import { requireAdmin } from "@/server/auth/guards";
import { getDaftarTahunAjaranLengkap, getDaftarKelasLengkap } from "@/server/queries/tahun-ajaran";
import { KelolaTahunAjaranClient } from "./KelolaTahunAjaranClient";

export default async function KelolaTahunAjaranPage() {
  await requireAdmin();

  const [tahunAjaranList, kelasList] = await Promise.all([
    getDaftarTahunAjaranLengkap(),
    getDaftarKelasLengkap(),
  ]);

  return (
    <KelolaTahunAjaranClient
      tahunAjaranList={tahunAjaranList}
      kelasList={kelasList}
    />
  );
}
