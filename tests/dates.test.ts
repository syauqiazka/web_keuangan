import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  createUTCDate,
  formatTanggalTabel,
  formatTanggalInput,
  formatBulanJudul,
  parseTanggalInput,
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
});
