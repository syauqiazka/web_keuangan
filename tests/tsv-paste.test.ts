import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseTsv, applyTsvPaste } from "../src/lib/tsv-paste";

describe("lib/tsv-paste - parseTsv", () => {
  test("mem-parse data 1 sel", () => {
    const res = parseTsv("Halo Dunia");
    assert.deepEqual(res, [["Halo Dunia"]]);
  });

  test("mem-parse matriks 2x3 dengan tab dan newline standar", () => {
    const raw = "Nama\tKelas\tUID\r\nBudi\t10-A\t10-001\r\nSiti\t10-B\t10-002";
    const res = parseTsv(raw);
    assert.deepEqual(res, [
      ["Nama", "Kelas", "UID"],
      ["Budi", "10-A", "10-001"],
      ["Siti", "10-B", "10-002"],
    ]);
  });

  test("menangani baris baru unix \\n", () => {
    const raw = "A\tB\nC\tD";
    const res = parseTsv(raw);
    assert.deepEqual(res, [
      ["A", "B"],
      ["C", "D"],
    ]);
  });

  test("menghapus trailing newline tanpa memotong isi sel kosong", () => {
    const raw = "1\t2\r\n3\t4\r\n\r\n";
    const res = parseTsv(raw);
    assert.deepEqual(res, [
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  test("unquote sel Excel yang menggunakan tanda kutip ganda", () => {
    const raw = '"Gaji Guru"\t"10.000.000"\r\n"ATK ""Sekolah"""\t"500.000"';
    const res = parseTsv(raw);
    assert.deepEqual(res, [
      ["Gaji Guru", "10.000.000"],
      ['ATK "Sekolah"', "500.000"],
    ]);
  });

  test("mengembalikan array kosong jika input kosong atau whitespace", () => {
    assert.deepEqual(parseTsv(""), []);
    assert.deepEqual(parseTsv("\r\n\n"), []);
  });
});

describe("lib/tsv-paste - applyTsvPaste", () => {
  interface Row {
    id: string;
    nama: string;
    kelas: string;
    uid: string;
  }

  const initial: Row[] = [
    { id: "1", nama: "Ahmad", kelas: "10-A", uid: "10-001" },
    { id: "2", nama: "Budi", kelas: "10-A", uid: "10-002" },
  ];

  test("menempel data dan memperbarui baris yang ada", () => {
    const tsv = "Budi Santoso\t10-B\t10-005";
    const result = applyTsvPaste(tsv, {
      currentData: initial,
      startRowIndex: 1,
      startColIndex: 1, // mulai dari kolom 'nama'
      columnKeys: ["id", "nama", "kelas", "uid"],
      createNewRow: () => ({ id: "new", nama: "", kelas: "", uid: "" }),
    });

    assert.equal(result.newData.length, 2);
    assert.equal(result.newData[1].nama, "Budi Santoso");
    assert.equal(result.newData[1].kelas, "10-B");
    assert.equal(result.newData[1].uid, "10-005");
    assert.equal(result.hasErrors, false);
  });

  test("menambah baris otomatis bila baris hasil paste melebihi data saat ini", () => {
    const tsv = "Cici\t10-A\t10-003\r\nDedi\t10-B\t10-004";
    const result = applyTsvPaste(tsv, {
      currentData: initial,
      startRowIndex: 2, // mulai setelah baris terakhir
      startColIndex: 1,
      columnKeys: ["id", "nama", "kelas", "uid"],
      createNewRow: () => ({ id: `row-${Math.random()}`, nama: "", kelas: "", uid: "" }),
    });

    assert.equal(result.newData.length, 4);
    assert.equal(result.newData[2].nama, "Cici");
    assert.equal(result.newData[3].nama, "Dedi");
    assert.equal(result.hasErrors, false);
  });

  test("menandai error jika validasi sel gagal", () => {
    const tsv = "\t10-A\t10-003"; // nama kosong
    const result = applyTsvPaste(tsv, {
      currentData: initial,
      startRowIndex: 0,
      startColIndex: 1,
      columnKeys: ["id", "nama", "kelas", "uid"],
      createNewRow: () => ({ id: "new", nama: "", kelas: "", uid: "" }),
      validators: {
        nama: (val) => (!val ? { valid: false, error: "Nama wajib diisi." } : { valid: true }),
      },
    });

    assert.equal(result.hasErrors, true);
    assert.equal(result.errors["0_nama"], "Nama wajib diisi.");
  });
});
