import { requireAuth } from "@/server/auth/guards";
import { getDashboardRingkasan, getGrafikBulanan } from "@/server/queries/dashboard";
import { GrafikBulanan } from "@/components/charts/GrafikBulanan";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  await requireAuth();

  const sp = await searchParams;

  // Tahun default: tahun sekarang (zona Asia/Jakarta)
  const tahunSekarang = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
  ).getFullYear();

  const tahun = parseInt(sp.tahun ?? "", 10) || tahunSekarang;

  // Bangun opsi tahun: 3 tahun ke belakang sampai tahun sekarang + 1
  const tahunOptions = Array.from(
    { length: 5 },
    (_, i) => tahunSekarang - 2 + i
  );

  const [ringkasan, grafikData] = await Promise.all([
    getDashboardRingkasan(tahun),
    getGrafikBulanan(tahun),
  ]);

  return (
    <div className="space-y-8">
      {/* Header + filter tahun */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <h1 className="text-[32px] font-[400] font-display text-text leading-[1.25]">
          Dashboard
        </h1>
        <form method="GET" action="/dashboard">
          <label className="flex items-center gap-2 text-[14px] text-text-2">
            Tahun
            <select
              name="tahun"
              defaultValue={String(tahun)}
              onChange={undefined}
              className="bg-canvas border border-line-strong text-text text-[14px] px-2 py-1 rounded-none focus:outline-2 focus:outline-accent focus:outline-offset-2"
            >
              {tahunOptions.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-3 py-1 text-[13px] font-[500] text-text border border-line-strong hover:bg-panel"
            >
              Terapkan
            </button>
          </label>
        </form>
      </div>

      {/* Tiga blok ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Saldo – Ice Panel (tanpa border, tanpa bayangan) */}
        <div className="sm:col-span-1 bg-panel p-6 rounded-[8px]">
          <div className="text-[12px] font-[500] font-mono text-label uppercase tracking-[0.08em] mb-2">
            Total Saldo Dana Sekolah
          </div>
          <div className="text-[47px] font-[450] font-display text-text leading-[1.25] num">
            {ringkasan.totalSaldoFormatted}
          </div>
          <div className="mt-1 text-[13px] text-text-3 font-[360]">
            Tahun {tahun}
          </div>
        </div>

        {/* Pemasukan */}
        <div className="bg-canvas p-6 border border-line rounded-[8px]">
          <div className="text-[12px] font-[500] font-mono text-label uppercase tracking-[0.08em] mb-2">
            Pemasukan
          </div>
          <div className="text-[32px] font-[400] font-display text-text leading-[1.25] num">
            {ringkasan.totalPemasukanFormatted}
          </div>
          <div className="mt-1 text-[13px] text-text-3 font-[360]">
            Tahun {tahun}
          </div>
        </div>

        {/* Pengeluaran */}
        <div className="bg-canvas p-6 border border-line rounded-[8px]">
          <div className="text-[12px] font-[500] font-mono text-label uppercase tracking-[0.08em] mb-2">
            Pengeluaran
          </div>
          <div className="text-[32px] font-[400] font-display text-text leading-[1.25] num">
            {ringkasan.totalPengeluaranFormatted}
          </div>
          <div className="mt-1 text-[13px] text-text-3 font-[360]">
            Tahun {tahun}
          </div>
        </div>
      </div>

      {/* Grafik bulanan */}
      <div>
        <h2 className="text-[21px] font-[400] font-display text-text leading-[1.3] mb-4">
          Pemasukan vs Pengeluaran — {tahun}
        </h2>
        <GrafikBulanan data={grafikData} tahun={tahun} />
      </div>
    </div>
  );
}
