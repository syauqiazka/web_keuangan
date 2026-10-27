import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/guards";
import { db } from "@/lib/db";
import { generateExcelPemasukan, type ExportPemasukanItem } from "@/lib/excel-export";
import { buildBulanFilter } from "@/lib/dates";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const tahunAjaranId = searchParams.get("tahunAjaran") === "all" ? "" : searchParams.get("tahunAjaran") || "";
    const kelasId = searchParams.get("kelas") || "";
    const bulanNomor = searchParams.get("bulan") || "";
    const dari = searchParams.get("dari") || "";
    const sampai = searchParams.get("sampai") || "";
    const jenisId = searchParams.get("jenis") || "";
    const tab = searchParams.get("tab") || "dari-siswa";

    // Lookup data referensi tahun ajaran
    let taName = "Semua";
    let taMulai: Date | undefined;
    let taSelesai: Date | undefined;

    if (tahunAjaranId) {
      const ta = await db.tahunAjaran.findUnique({ where: { id: tahunAjaranId } });
      if (ta) {
        taName = ta.nama;
        taMulai = ta.mulai;
        const sel = new Date(ta.selesai);
        taSelesai = new Date(Date.UTC(sel.getUTCFullYear(), sel.getUTCMonth(), sel.getUTCDate(), 23, 59, 59, 999));
      }
    }

    const bulanFilter = taMulai && taSelesai ? buildBulanFilter({ mulai: taMulai, selesai: taSelesai }, bulanNomor) : "";

    // Parse rentang tanggal
    let rangeStart: Date | undefined;
    let rangeEnd: Date | undefined;

    if (dari && /^\d{4}-\d{2}-\d{2}$/.test(dari)) {
      const [y, m, d] = dari.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        rangeStart = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
      }
    }
    if (sampai && /^\d{4}-\d{2}-\d{2}$/.test(sampai)) {
      const [y, m, d] = sampai.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        rangeEnd = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
      }
    }

    const cocokDenganBulan = (tanggal: Date | null | undefined) => {
      if (!bulanFilter && !bulanNomor) return true;
      if (!tanggal) return false;
      const month = tanggal.getUTCMonth() + 1;
      const year = tanggal.getUTCFullYear();
      if (bulanFilter && /^\d{4}-\d{2}$/.test(bulanFilter)) {
        const [filterYear, filterMonth] = bulanFilter.split("-").map(Number);
        return year === filterYear && month === filterMonth;
      }
      if (bulanNomor) return month === Number(bulanNomor);
      return true;
    };

    const cocokDenganRange = (tanggal: Date | null | undefined) => {
      if (!rangeStart && !rangeEnd) return true;
      if (!tanggal) return false;
      if (rangeStart && tanggal < rangeStart) return false;
      if (rangeEnd && tanggal > rangeEnd) return false;
      return true;
    };

    const exportItems: ExportPemasukanItem[] = [];

    // ── Tab: Dari Siswa ──
    if (tab === "dari-siswa" || tab === "semua") {
      const penempatanWhere = {
        ...(tahunAjaranId ? { tahunAjaranId } : {}),
        ...(kelasId ? { kelasId } : {}),
      };

      const pembayaranSiswaList = await db.pembayaranSiswa.findMany({
        where: {
          deletedAt: null,
          penempatan: penempatanWhere,
          ...(jenisId ? { jenisPemasukanId: jenisId } : {}),
        },
        include: {
          penempatan: {
            include: {
              anggota: true,
              kelas: true,
              tahunAjaran: true,
            },
          },
          jenisPemasukan: true,
          petugas: true,
        },
        orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
      });

      for (const p of pembayaranSiswaList) {
        const bulanMatch = p.jenisPemasukan.bulanan
          ? cocokDenganBulan(p.bulanTerbayar)
          : cocokDenganBulan(p.tanggal);
        const rangeMatch = cocokDenganRange(p.tanggal);

        if (bulanMatch && rangeMatch) {
          exportItems.push({
            tanggal: p.tanggal.toISOString(),
            bulanTerbayar: p.bulanTerbayar ? p.bulanTerbayar.toISOString() : null,
            tahunAjaranNama: p.penempatan.tahunAjaran.nama,
            kelasNama: p.penempatan.kelas.nama,
            nama: p.penempatan.anggota.nama,
            uid: p.penempatan.anggota.uid,
            jenisPembayaran: p.jenisPemasukan.nama,
            kategori: "Siswa",
            metode: p.metode === "TRANSFER" ? "TF" : "ST",
            nominal: Number(p.nominal),
            petugasNama: p.petugas.nama,
            catatan: p.catatan,
          });
        }
      }
    }

    // ── Tab: Bantuan ──
    if (tab === "bantuan" || tab === "semua") {
      let bStart = taMulai;
      let bEnd = taSelesai;
      if (rangeStart) bStart = bStart ? new Date(Math.max(bStart.getTime(), rangeStart.getTime())) : rangeStart;
      if (rangeEnd) bEnd = bEnd ? new Date(Math.min(bEnd.getTime(), rangeEnd.getTime())) : rangeEnd;

      const bantuanList = await db.pemasukanDana.findMany({
        where: {
          deletedAt: null,
          sumberDana: {
            kategori: "BANTUAN",
            ...(jenisId ? { id: jenisId } : {}),
          },
          ...(bStart && bEnd
            ? { tanggal: { gte: bStart, lte: bEnd } }
            : bStart
            ? { tanggal: { gte: bStart } }
            : bEnd
            ? { tanggal: { lte: bEnd } }
            : {}),
        },
        include: { sumberDana: true, petugas: true },
        orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
      });

      for (const b of bantuanList) {
        if (cocokDenganBulan(b.tanggal) && cocokDenganRange(b.tanggal)) {
          exportItems.push({
            tanggal: b.tanggal.toISOString(),
            tahunAjaranNama: taName,
            nama: b.sumberDana.nama,
            jenisPembayaran: b.sumberDana.nama,
            kategori: "Bantuan Lembaga",
            nominal: Number(b.nominal),
            petugasNama: b.petugas.nama,
            catatan: b.catatan,
          });
        }
      }
    }

    // ── Tab: Donatur ──
    if (tab === "donatur" || tab === "semua") {
      let dStart = taMulai;
      let dEnd = taSelesai;
      if (rangeStart) dStart = dStart ? new Date(Math.max(dStart.getTime(), rangeStart.getTime())) : rangeStart;
      if (rangeEnd) dEnd = dEnd ? new Date(Math.min(dEnd.getTime(), rangeEnd.getTime())) : rangeEnd;

      const donaturList = await db.pemasukanDana.findMany({
        where: {
          deletedAt: null,
          sumberDana: {
            kategori: "DONATUR",
            ...(jenisId ? { id: jenisId } : {}),
          },
          ...(dStart && dEnd
            ? { tanggal: { gte: dStart, lte: dEnd } }
            : dStart
            ? { tanggal: { gte: dStart } }
            : dEnd
            ? { tanggal: { lte: dEnd } }
            : {}),
        },
        include: { sumberDana: true, petugas: true },
        orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
      });

      for (const d of donaturList) {
        if (cocokDenganBulan(d.tanggal) && cocokDenganRange(d.tanggal)) {
          exportItems.push({
            tanggal: d.tanggal.toISOString(),
            tahunAjaranNama: taName,
            nama: d.sumberDana.nama,
            jenisPembayaran: d.sumberDana.nama,
            kategori: "Donatur & Hibah",
            nominal: Number(d.nominal),
            petugasNama: d.petugas.nama,
            catatan: d.catatan,
          });
        }
      }
    }

    const titlePrefix = tab === "dari-siswa" ? "Pemasukan Siswa" : tab === "bantuan" ? "Pemasukan Bantuan" : "Pemasukan Donatur";
    const buffer = await generateExcelPemasukan(exportItems, titlePrefix);

    let filename = `pemasukan_${tab}`;
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
    console.error("Error exporting pemasukan to excel:", error);
    return NextResponse.json({ error: "Gagal mengekspor data pemasukan ke Excel." }, { status: 500 });
  }
}
