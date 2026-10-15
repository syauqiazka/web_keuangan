import { requireAuth } from "@/server/auth/guards";
import { getDashboardRingkasan, getGrafikBulanan } from "@/server/queries/dashboard";
import { GrafikBulananClient } from "@/components/charts/GrafikBulananClient";
import { DashboardClient } from "./DashboardClient";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  await requireAuth();

  const sp = await searchParams;

  const tahunSekarang = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
  ).getFullYear();

  const tahun = parseInt(sp.tahun ?? "", 10) || tahunSekarang;

  const tahunOptions = Array.from(
    { length: 5 },
    (_, i) => tahunSekarang - 2 + i
  );

  const [ringkasan, grafikData] = await Promise.all([
    getDashboardRingkasan(tahun),
    getGrafikBulanan(tahun),
  ]);

  return (
    <DashboardClient
      tahun={tahun}
      tahunOptions={tahunOptions}
      ringkasan={ringkasan}
      grafikData={grafikData}
      GrafikComponent={<GrafikBulananClient data={grafikData} tahun={tahun} />}
    />
  );
}
