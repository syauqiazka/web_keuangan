import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { generateExcelPemasukan, generateExcelPengeluaran } from "../src/lib/excel-export";
import ExcelJS from "exceljs";

describe("Excel Export Generator (.xlsx)", () => {
  test("menghasilkan buffer Excel pemasukan yang valid dengan baris total", async () => {
    const mockItems = [
      {
        tanggal: "2026-10-05T00:00:00.000Z",
        bulanTerbayar: "2026-10-01T00:00:00.000Z",
        tahunAjaranNama: "2026/2027",
        kelasNama: "10-A",
        nama: "Ahmad Siswa",
        uid: "10-0001",
        jenisPembayaran: "SPP",
        kategori: "Siswa",
        metode: "TF",
        nominal: 250000,
        petugasNama: "Bu Resa",
        catatan: "Lunas",
      },
      {
        tanggal: "2026-10-10T00:00:00.000Z",
        tahunAjaranNama: "2026/2027",
        nama: "BOSP Tahap 2",
        jenisPembayaran: "BOSP",
        kategori: "Bantuan Lembaga",
        nominal: 50000000,
        petugasNama: "Pak Fajar",
      },
    ];

    const buffer = await generateExcelPemasukan(mockItems, "Pemasukan Test");
    assert.ok(buffer instanceof Buffer, "Output harus berupa Buffer");
    assert.ok(buffer.length > 0, "Buffer tidak boleh kosong");

    // Baca kembali buffer dengan ExcelJS untuk memastikan struktur file valid
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

    const worksheet = workbook.getWorksheet("Pemasukan Test");
    assert.ok(worksheet, "Worksheet harus ditemukan");
    assert.equal(worksheet.rowCount, 4); // 1 header + 2 data + 1 total

    // Cek cell nilai total (kolom ke-11: nominal)
    const totalRow = worksheet.getRow(4);
    const totalVal = totalRow.getCell(11).value;
    assert.equal(totalVal, 50250000, "Nilai total harus sesuai penjumlahan semua nominal");
  });

  test("menghasilkan buffer Excel pengeluaran yang valid", async () => {
    const mockPengeluaran = [
      {
        tanggal: "2026-10-13T00:00:00.000Z",
        tahunAjaranNama: "2026/2027",
        jenis: "Gaji Guru",
        nominal: 15000000,
        petugasNama: "Bu Resa",
        catatan: "Bulan Oktober",
      },
      {
        tanggal: "2026-10-14T00:00:00.000Z",
        tahunAjaranNama: "2026/2027",
        jenis: "Beli Kertas & Tinta",
        nominal: 1200000,
        petugasNama: "Bu Resa",
      },
    ];

    const buffer = await generateExcelPengeluaran(mockPengeluaran, "Pengeluaran Test");
    assert.ok(buffer instanceof Buffer);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

    const worksheet = workbook.getWorksheet("Pengeluaran Test");
    assert.ok(worksheet);
    assert.equal(worksheet.rowCount, 4); // 1 header + 2 data + 1 total

    // Cek cell nilai total (kolom ke-5: nominal)
    const totalRow = worksheet.getRow(4);
    const totalVal = totalRow.getCell(5).value;
    assert.equal(totalVal, 16200000);
  });
});
