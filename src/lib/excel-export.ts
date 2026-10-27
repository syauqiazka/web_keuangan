import ExcelJS from "exceljs";

/**
 * Sanitasi nilai string untuk mencegah Excel Formula Injection.
 */
function sanitizeCellString(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Format tanggal ISO ke format DD/MM/YYYY yang ramah Excel.
 */
function formatDateId(isoDateStr?: string | null): string {
  if (!isoDateStr) return "—";
  try {
    const d = new Date(isoDateStr);
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return isoDateStr;
  }
}

/**
 * Format nama bulan dari ISO tanggal untuk bulan terbayar.
 */
const BULAN_NAMA = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function formatBulanTerbayar(isoDateStr?: string | null): string {
  if (!isoDateStr) return "—";
  try {
    const d = new Date(isoDateStr);
    const m = d.getUTCMonth();
    const y = d.getUTCFullYear();
    return `${BULAN_NAMA[m]} ${y}`;
  } catch {
    return isoDateStr;
  }
}

// ─── Export Pemasukan ─────────────────────────────────────────────

export interface ExportPemasukanItem {
  tanggal: string;
  bulanTerbayar?: string | null;
  tahunAjaranNama?: string;
  kelasNama?: string;
  nama: string; // nama siswa atau nama sumber dana
  uid?: string;
  jenisPembayaran: string; // SPP, BOSP, dll
  kategori: string; // Siswa / Bantuan / Donatur
  metode?: string; // TF / ST
  nominal: number;
  petugasNama: string;
  catatan?: string | null;
}

export async function generateExcelPemasukan(
  items: ExportPemasukanItem[],
  judulSheet: string = "Data Pemasukan"
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Bank Saku Digital";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(judulSheet, {
    views: [{ showGridLines: true }],
  });

  // Header kolom
  worksheet.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Tanggal", key: "tanggal", width: 14 },
    { header: "Bulan Terbayar", key: "bulanTerbayar", width: 18 },
    { header: "Tahun Ajaran", key: "tahunAjaran", width: 16 },
    { header: "Kelas", key: "kelas", width: 12 },
    { header: "Nama Siswa / Lembaga", key: "nama", width: 26 },
    { header: "Kode UID", key: "uid", width: 14 },
    { header: "Jenis Pemasukan", key: "jenis", width: 20 },
    { header: "Kategori", key: "kategori", width: 14 },
    { header: "Metode", key: "metode", width: 12 },
    { header: "Nominal (Rp)", key: "nominal", width: 18 },
    { header: "Petugas", key: "petugas", width: 16 },
    { header: "Catatan", key: "catatan", width: 24 },
  ];

  // Styling header row
  const headerRow = worksheet.getRow(1);
  headerRow.height = 26;
  headerRow.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF143D30" }, // Deep banking green
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  let totalNominal = 0;

  // Isi data
  items.forEach((item, index) => {
    const rowNumber = index + 1;
    totalNominal += item.nominal;

    const row = worksheet.addRow({
      no: rowNumber,
      tanggal: formatDateId(item.tanggal),
      bulanTerbayar: formatBulanTerbayar(item.bulanTerbayar),
      tahunAjaran: sanitizeCellString(item.tahunAjaranNama || "—"),
      kelas: sanitizeCellString(item.kelasNama || "—"),
      nama: sanitizeCellString(item.nama),
      uid: sanitizeCellString(item.uid || "—"),
      jenis: sanitizeCellString(item.jenisPembayaran),
      kategori: sanitizeCellString(item.kategori),
      metode: sanitizeCellString(item.metode || "—"),
      nominal: item.nominal,
      petugas: sanitizeCellString(item.petugasNama),
      catatan: sanitizeCellString(item.catatan || "—"),
    });

    row.height = 20;
    row.font = { name: "Arial", size: 9 };
    row.alignment = { vertical: "middle" };

    // Format nominal ke angka ribuan
    const nominalCell = row.getCell("nominal");
    nominalCell.numFmt = "#,##0";
    nominalCell.alignment = { vertical: "middle", horizontal: "right" };

    // Center alignment untuk kolom tertentu
    row.getCell("no").alignment = { vertical: "middle", horizontal: "center" };
    row.getCell("tanggal").alignment = { vertical: "middle", horizontal: "center" };
    row.getCell("metode").alignment = { vertical: "middle", horizontal: "center" };
    row.getCell("uid").alignment = { vertical: "middle", horizontal: "center" };

    // Zebra striping halus
    if (rowNumber % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF9FBF9" },
      };
    }
  });

  // Baris Total
  const totalRow = worksheet.addRow({
    no: "",
    tanggal: "",
    bulanTerbayar: "",
    tahunAjaran: "",
    kelas: "",
    nama: "",
    uid: "",
    jenis: "",
    kategori: "",
    metode: "TOTAL",
    nominal: totalNominal,
    petugas: "",
    catatan: "",
  });

  totalRow.height = 24;
  totalRow.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF143D30" } };
  totalRow.getCell("metode").alignment = { vertical: "middle", horizontal: "center" };

  const totalNominalCell = totalRow.getCell("nominal");
  totalNominalCell.numFmt = "#,##0";
  totalNominalCell.alignment = { vertical: "middle", horizontal: "right" };

  // Double bottom border untuk total accounting style
  totalRow.eachCell((cell) => {
    cell.border = {
      top: { style: "thin", color: { argb: "FF143D30" } },
      bottom: { style: "double", color: { argb: "FF143D30" } },
    };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// ─── Export Pengeluaran ───────────────────────────────────────────

export interface ExportPengeluaranItem {
  tanggal: string;
  tahunAjaranNama?: string;
  jenis: string;
  nominal: number;
  petugasNama: string;
  catatan?: string | null;
}

export async function generateExcelPengeluaran(
  items: ExportPengeluaranItem[],
  judulSheet: string = "Data Pengeluaran"
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Bank Saku Digital";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(judulSheet, {
    views: [{ showGridLines: true }],
  });

  worksheet.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Tanggal", key: "tanggal", width: 14 },
    { header: "Tahun Ajaran", key: "tahunAjaran", width: 16 },
    { header: "Jenis Pengeluaran", key: "jenis", width: 28 },
    { header: "Nominal (Rp)", key: "nominal", width: 18 },
    { header: "Petugas", key: "petugas", width: 18 },
    { header: "Catatan", key: "catatan", width: 28 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.height = 26;
  headerRow.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF9A2C20" }, // Brick red untuk pengeluaran
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  let totalNominal = 0;

  items.forEach((item, index) => {
    const rowNumber = index + 1;
    totalNominal += item.nominal;

    const row = worksheet.addRow({
      no: rowNumber,
      tanggal: formatDateId(item.tanggal),
      tahunAjaran: sanitizeCellString(item.tahunAjaranNama || "—"),
      jenis: sanitizeCellString(item.jenis),
      nominal: item.nominal,
      petugas: sanitizeCellString(item.petugasNama),
      catatan: sanitizeCellString(item.catatan || "—"),
    });

    row.height = 20;
    row.font = { name: "Arial", size: 9 };
    row.alignment = { vertical: "middle" };

    const nominalCell = row.getCell("nominal");
    nominalCell.numFmt = "#,##0";
    nominalCell.alignment = { vertical: "middle", horizontal: "right" };

    row.getCell("no").alignment = { vertical: "middle", horizontal: "center" };
    row.getCell("tanggal").alignment = { vertical: "middle", horizontal: "center" };

    if (rowNumber % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFDF8F8" },
      };
    }
  });

  // Baris Total
  const totalRow = worksheet.addRow({
    no: "",
    tanggal: "",
    tahunAjaran: "",
    jenis: "TOTAL PENGELUARAN",
    nominal: totalNominal,
    petugas: "",
    catatan: "",
  });

  totalRow.height = 24;
  totalRow.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF9A2C20" } };
  totalRow.getCell("jenis").alignment = { vertical: "middle", horizontal: "center" };

  const totalNominalCell = totalRow.getCell("nominal");
  totalNominalCell.numFmt = "#,##0";
  totalNominalCell.alignment = { vertical: "middle", horizontal: "right" };

  totalRow.eachCell((cell) => {
    cell.border = {
      top: { style: "thin", color: { argb: "FF9A2C20" } },
      bottom: { style: "double", color: { argb: "FF9A2C20" } },
    };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
