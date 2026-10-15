import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { generateUID } from "../src/lib/uid";

describe("lib/uid - generateUID", () => {
  test("menghasilkan UID dengan prefix SW- untuk tipe SISWA", () => {
    const uid = generateUID("SISWA");
    assert.match(uid, /^SW-\d{4}$/);
  });

  test("menghasilkan UID dengan prefix GR- untuk tipe GURU", () => {
    const uid = generateUID("GURU");
    assert.match(uid, /^GR-\d{4}$/);
  });

  test("default ke SISWA jika parameter tidak diisi", () => {
    const uid = generateUID();
    assert.match(uid, /^SW-\d{4}$/);
  });
});
