import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/guards";
import { db } from "@/lib/db";
import { generateExcelPengeluaran, type ExportPengeluaranItem } from "@/lib/excel-export";
import { getPengeluaranList } from "@/server/queries/pengeluaran";
import { buildBulanFilter } from "@/lib/dates";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const tahunAjaranId = searchParams.get("tahunAjaran") || "";
    const bulanNomor = searchParams.get("bulan") || "";
    const dari = searchParams.get("dari") || "";
    const sampai = searchParams.get("sampai") || "";
    const jenis = searchParams.get("jenis") || "";

    let taName = "Semua";
    let bulanFilter = "";

    if (tahunAjaranId) {
      const ta = await db.tahunAjaran.findUnique({ where: { id: tahunAjaranId } });
      if (ta) {
        taName = ta.nama;
        bulanFilter = buildBulanFilter(ta, bulanNomor);
      }
    }

    const { rows } = await getPengeluaranList({
      tahunAjaranId: tahunAjaranId || undefined,
      bulan: bulanFilter || undefined,
      dari: dari || undefined,
      sampai: sampai || undefined,
      jenis: jenis || undefined,
      exportAll: true,
    });

    const exportItems: ExportPengeluaranItem[] = rows.map((r) => ({
      tanggal: r.tanggal,
      tahunAjaranNama: taName,
      jenis: r.jenis,
      nominal: r.nominal,
      petugasNama: r.petugasNama,
      catatan: r.catatan,
    }));

    const buffer = await generateExcelPengeluaran(exportItems, "Pengeluaran Sekolah");

    let filename = "pengeluaran";
    if (dari && sampai) {
      filename += `_${dari}_sd_${sampai}`;
    } else if (bulanFilter) {
      filename += `_${bulanFilter}`;
    } else if (bulanNomor) {
      filename += `_bulan_${bulanNomor}`;
    }
    filename += ".xlsx";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting pengeluaran to excel:", error);
    return NextResponse.json({ error: "Gagal mengekspor data pengeluaran ke Excel." }, { status: 500 });
  }
}
