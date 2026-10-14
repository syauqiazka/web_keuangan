import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { hitungStatusLunas } from "../src/lib/status-lunas";

describe("lib/status-lunas - hitungStatusLunas", () => {
  test("status lunas ketika pembayaran tepat sama dengan standar", () => {
    const res = hitungStatusLunas(200000, 200000);
    assert.equal(res.lunas, true);
    assert.equal(res.totalTerbayar, 200000);
    assert.equal(res.kekurangan, 0);
    assert.equal(res.teksKekurangan, null);
    assert.equal(res.isCicilan, false);
  });

  test("status lunas ketika pembayaran melebihi standar", () => {
    const res = hitungStatusLunas(250000, 200000);
    assert.equal(res.lunas, true);
    assert.equal(res.kekurangan, 0);
    assert.equal(res.teksKekurangan, null);
  });

  test("status belum lunas ketika pembayaran kurang dari standar", () => {
    const res = hitungStatusLunas(150000, 200000);
    assert.equal(res.lunas, false);
    assert.equal(res.totalTerbayar, 150000);
    assert.equal(res.kekurangan, 50000);
    assert.equal(res.teksKekurangan, "kurang Rp 50.000");
    assert.equal(res.isCicilan, false);
  });

  test("tanpa nominal standar (null) selalu dianggap lunas dan tidak pernah merah", () => {
    const res = hitungStatusLunas(150000, null);
    assert.equal(res.lunas, true);
    assert.equal(res.nominalStandar, null);
    assert.equal(res.kekurangan, 0);
    assert.equal(res.teksKekurangan, null);
  });

  test("cicilan: menjumlahkan beberapa pembayaran pada sel yang sama", () => {
    // Siswa membayar 100.000 lalu 50.000 untuk standar 200.000
    const cicilanKurang = hitungStatusLunas([100000, 50000], 200000);
    assert.equal(cicilanKurang.lunas, false);
    assert.equal(cicilanKurang.totalTerbayar, 150000);
    assert.equal(cicilanKurang.kekurangan, 50000);
    assert.equal(cicilanKurang.teksKekurangan, "kurang Rp 50.000");
    assert.equal(cicilanKurang.isCicilan, true);
    assert.equal(cicilanKurang.jumlahPembayaran, 2);

    // Tambah cicilan ke-3 sebesar 50.000 sehingga total 200.000 (lunas)
    const cicilanLunas = hitungStatusLunas([100000, 50000, 50000], 200000);
    assert.equal(cicilanLunas.lunas, true);
    assert.equal(cicilanLunas.totalTerbayar, 200000);
    assert.equal(cicilanLunas.kekurangan, 0);
    assert.equal(cicilanLunas.teksKekurangan, null);
    assert.equal(cicilanLunas.isCicilan, true);
    assert.equal(cicilanLunas.jumlahPembayaran, 3);
  });
});
