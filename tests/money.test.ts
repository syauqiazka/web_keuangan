import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseRupiah, formatRupiah } from "../src/lib/money";

describe("lib/money - parseRupiah", () => {
  test("menerima format angka dengan titik ribuan", () => {
    assert.equal(parseRupiah("1.250.000"), 1250000);
    assert.equal(parseRupiah("200.000"), 200000);
    assert.equal(parseRupiah("50.000"), 50000);
  });

  test("menerima format dengan awalan Rp atau rp", () => {
    assert.equal(parseRupiah("Rp 1.250.000"), 1250000);
    assert.equal(parseRupiah("Rp1.250.000"), 1250000);
    assert.equal(parseRupiah("rp 500.000"), 500000);
  });

  test("menerima angka polos tanpa titik", () => {
    assert.equal(parseRupiah("100000"), 100000);
    assert.equal(parseRupiah("5000"), 5000);
  });

  test("menolak input kosong atau spasi", () => {
    assert.throws(() => parseRupiah(""), /Nominal tidak boleh kosong/);
    assert.throws(() => parseRupiah("   "), /Nominal tidak boleh kosong/);
  });

  test("menolak angka 0", () => {
    assert.throws(() => parseRupiah("0"), /Nominal harus lebih dari 0/);
    assert.throws(() => parseRupiah("Rp 0"), /Nominal harus lebih dari 0/);
  });

  test("menolak nominal negatif", () => {
    assert.throws(() => parseRupiah("-100.000"), /Nominal tidak boleh negatif/);
    assert.throws(() => parseRupiah("Rp -50.000"), /Nominal tidak boleh negatif/);
  });

  test("menolak desimal dengan koma atau titik desimal", () => {
    assert.throws(() => parseRupiah("100.000,50"), /tanpa desimal/);
    assert.throws(() => parseRupiah("100,50"), /tanpa desimal/);
    assert.throws(() => parseRupiah("100.5"), /mengandung desimal/);
  });

  test("menolak angka lebih dari 15 digit", () => {
    assert.throws(() => parseRupiah("1.000.000.000.000.000.000"), /tidak boleh lebih dari 15 digit/);
    assert.throws(() => parseRupiah("1234567890123456"), /tidak boleh lebih dari 15 digit/);
  });

  test("menerima tepat 15 digit", () => {
    assert.equal(parseRupiah("999999999999999"), 999999999999999);
  });

  test("menolak karakter non-angka", () => {
    assert.throws(() => parseRupiah("abc"), /Nominal harus berupa angka valid/);
    assert.throws(() => parseRupiah("100k"), /Nominal harus berupa angka valid/);
  });
});

describe("lib/money - formatRupiah", () => {
  test("memformat angka ke standar 'Rp 1.250.000' tanpa ',-'", () => {
    assert.equal(formatRupiah(1250000), "Rp 1.250.000");
    assert.equal(formatRupiah(200000), "Rp 200.000");
    assert.equal(formatRupiah(50000), "Rp 50.000");
  });

  test("memformat angka 0", () => {
    assert.equal(formatRupiah(0), "Rp 0");
  });
});
