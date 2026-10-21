import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  createUTCDate,
  formatTanggalTabel,
  formatTanggalInput,
  formatBulanJudul,
  parseTanggalInput,
  resolveTahunKalender,
  buildBulanFilter,
} from "../src/lib/dates";

describe("lib/dates - Tanggal & Kalender", () => {
  test("createUTCDate dan formatTanggalTabel", () => {
    const d = createUTCDate(2026, 10, 13);
    assert.equal(formatTanggalTabel(d), "13 Okt 2026");
  });

  test("formatTanggalInput menghasilkan format dd-mm-yyyy", () => {
    const d = createUTCDate(2026, 10, 13);
    assert.equal(formatTanggalInput(d), "13-10-2026");
  });

  test("formatBulanJudul", () => {
    const d = createUTCDate(2026, 10, 13);
    assert.equal(formatBulanJudul(d), "Oktober 2026");
  });

  test("parseTanggalInput menerima dd-mm-yyyy valid", () => {
    const d = parseTanggalInput("13-10-2026");
    assert.equal(d.getUTCDate(), 13);
    assert.equal(d.getUTCMonth(), 9); // Oktober adalah indeks 9
    assert.equal(d.getUTCFullYear(), 2026);
  });

  test("parseTanggalInput menolak format yang salah atau tanggal invalid", () => {
    assert.throws(() => parseTanggalInput("2026-10-13"), /Format tanggal harus dd-mm-yyyy/);
    assert.throws(() => parseTanggalInput("32-01-2026"), /Tanggal tidak valid/);
    assert.throws(() => parseTanggalInput("13-13-2026"), /Bulan tidak valid/);
  });

  test("resolveTahunKalender dan buildBulanFilter menangani pergantian tahun ajaran", () => {
    // TA 2025/2026: Juli 2025 s.d. Juni 2026
    const ta = {
      mulai: "2025-07-01T00:00:00.000Z",
      selesai: "2026-06-30T00:00:00.000Z",
    };

    // Bulan 10 (Oktober) harus memakai tahun 2025
    assert.equal(resolveTahunKalender(ta, 10), 2025);
    assert.equal(buildBulanFilter(ta, "10"), "2025-10");

    // Bulan 12 (Desember) harus memakai tahun 2025
    assert.equal(resolveTahunKalender(ta, 12), 2025);
    assert.equal(buildBulanFilter(ta, "12"), "2025-12");

    // Bulan 01 (Januari) harus memakai tahun 2026 (bukan 2025!)
    assert.equal(resolveTahunKalender(ta, 1), 2026);
    assert.equal(buildBulanFilter(ta, "01"), "2026-01");

    // Bulan 06 (Juni) harus memakai tahun 2026
    assert.equal(resolveTahunKalender(ta, 6), 2026);
    assert.equal(buildBulanFilter(ta, "06"), "2026-06");
  });

  test("resolveTahunKalender pada tahun ajaran satu tahun kalender", () => {
    const taSatuTahun = {
      mulai: "2026-01-01T00:00:00.000Z",
      selesai: "2026-12-31T00:00:00.000Z",
    };
    assert.equal(resolveTahunKalender(taSatuTahun, 3), 2026);
    assert.equal(resolveTahunKalender(taSatuTahun, 10), 2026);
    assert.equal(buildBulanFilter(taSatuTahun, "03"), "2026-03");
  });
});

