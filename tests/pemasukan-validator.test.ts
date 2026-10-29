import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateNominalDanTanggal } from "../src/lib/validators";

describe("Validasi Ketat Nominal dan Tanggal (validateNominalDanTanggal)", () => {
  it("menerima nominal rupiah dan tanggal kalender yang valid", () => {
    const res = validateNominalDanTanggal("250.000", "26-10-2026");
    assert.equal(res.valid, true);
    if (res.valid) {
      assert.equal(res.nominal, 250000);
      assert.equal(res.tanggal.getUTCDate(), 26);
      assert.equal(res.tanggal.getUTCMonth(), 9); // Oktober = index 9
      assert.equal(res.tanggal.getUTCFullYear(), 2026);
    }
  });

  it("menerima format nominal dengan awalan Rp", () => {
    const res = validateNominalDanTanggal("Rp 1.500.000", "01-07-2026");
    assert.equal(res.valid, true);
    if (res.valid) {
      assert.equal(res.nominal, 1500000);
    }
  });

  it("menolak tanggal tidak valid dalam kalender seperti 31-02-2026", () => {
    const res = validateNominalDanTanggal("100.000", "31-02-2026");
    assert.equal(res.valid, false);
    if (!res.valid) {
      assert.match(res.error, /tidak valid/i);
    }
  });

  it("menolak tanggal 29 Februari pada tahun non-kabisat (29-02-2025)", () => {
    const res = validateNominalDanTanggal("100.000", "29-02-2025");
    assert.equal(res.valid, false);
    if (!res.valid) {
      assert.match(res.error, /tidak valid/i);
    }
  });

  it("menolak nominal 0 atau negatif", () => {
    const resZero = validateNominalDanTanggal("0", "15-05-2026");
    assert.equal(resZero.valid, false);

    const resNeg = validateNominalDanTanggal("-50.000", "15-05-2026");
    assert.equal(resNeg.valid, false);
    if (!resNeg.valid) {
      assert.match(resNeg.error, /negatif|tidak boleh/i);
    }
  });

  it("menolak desimal atau koma", () => {
    const res = validateNominalDanTanggal("100000,50", "15-05-2026");
    assert.equal(res.valid, false);
  });
});
