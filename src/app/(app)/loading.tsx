export default function AppLoading() {
  return (
    <div className="w-full space-y-6 page-transition">
      {/* Indikator Memuat di Bagian Atas */}
      <div className="flex items-center justify-between pb-5 border-b border-line">
        <div className="h-8 w-56 bg-panel animate-pulse rounded-[4px]" />
        <div className="text-[12px] font-mono text-text-3">Memuat data…</div>
      </div>

      {/* Placeholder Ringkasan / Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="h-28 bg-surface border border-line animate-pulse rounded-[8px] p-5 shadow-xs" />
        <div className="h-28 bg-surface border border-line animate-pulse rounded-[8px] p-5 shadow-xs" />
        <div className="h-28 bg-surface border border-line animate-pulse rounded-[8px] p-5 shadow-xs" />
      </div>

      {/* Placeholder Tabel Data */}
      <div className="w-full border border-line bg-surface rounded-[8px] shadow-xs overflow-hidden">
        <div className="h-10 bg-panel/60 border-b border-line px-4 flex items-center justify-between">
          <div className="h-3.5 w-20 bg-line rounded" />
          <div className="h-3.5 w-32 bg-line rounded" />
          <div className="h-3.5 w-24 bg-line rounded" />
        </div>
        <div className="divide-y divide-line">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-10 px-4 flex items-center justify-between">
              <div className="h-3 w-12 bg-panel rounded" />
              <div className="h-3 w-48 bg-panel rounded" />
              <div className="h-3 w-28 bg-panel rounded" />
              <div className="h-3 w-20 bg-panel rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
