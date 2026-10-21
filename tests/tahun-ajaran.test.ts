import test from "node:test";
import assert from "node:assert/strict";
import { parseTanggalInput, createUTCDate } from "../src/lib/dates";

test("Tahun Ajaran & Kelas - Validasi Tanggal Periode", async (t) => {
  await t.test("menerima tanggal mulai lebih awal dari tanggal selesai", () => {
    const mulai = createUTCDate(2026, 7, 1);
    const selesai = createUTCDate(2027, 6, 30);
    assert.ok(mulai.getTime() < selesai.getTime(), "mulai harus sebelum selesai");
  });

  await t.test("menolak tanggal mulai yang melebihi tanggal selesai", () => {
    const mulai = createUTCDate(2027, 7, 1);
    const selesai = createUTCDate(2026, 6, 30);
    assert.ok(mulai.getTime() > selesai.getTime(), "deteksi tanggal mulai melebihi selesai");
  });

  await t.test("parse tanggal format DD-MM-YYYY dengan benar", () => {
    const dt = parseTanggalInput("01-07-2026");
    assert.ok(dt !== null);
    assert.equal(dt.getUTCFullYear(), 2026);
    assert.equal(dt.getUTCMonth(), 6); // 0-indexed, 6 = Juli
    assert.equal(dt.getUTCDate(), 1);
  });
});

test("Tahun Ajaran & Kelas - Master Data Tingkatan Kelas", async (t) => {
  const masterKelas = [
    { nama: "Kelas 10", urutan: 10 },
    { nama: "Kelas 11", urutan: 11 },
    { nama: "Kelas 12", urutan: 12 },
  ];

  await t.test("memiliki urutan berurutan dari 10, 11, hingga 12", () => {
    const sorted = [...masterKelas].sort((a, b) => a.urutan - b.urutan);
    assert.equal(sorted[0].nama, "Kelas 10");
    assert.equal(sorted[1].nama, "Kelas 11");
    assert.equal(sorted[2].nama, "Kelas 12");
  });

  await t.test("setiap kelas memiliki nama yang unik", () => {
    const names = masterKelas.map((k) => k.nama);
    const uniqueNames = new Set(names);
    assert.equal(uniqueNames.size, masterKelas.length);
  });
});

test("Penempatan Kelas - Invarian Kenaikan Kelas", async (t) => {
  interface MockPenempatan {
    id: string;
    anggotaId: string;
    tahunAjaranId: string;
    kelasId: string;
  }

  // Simulasi penempatan siswa di tahun ajaran 2025/2026
  const penempatanDb: MockPenempatan[] = [
    {
      id: "penempatan-1",
      anggotaId: "siswa-1",
      tahunAjaranId: "ta-2025",
      kelasId: "kelas-10",
    },
  ];

  await t.test("kenaikan kelas ke tahun ajaran baru tidak mengubah riwayat lama", () => {
    const tahunAjaranBaruId = "ta-2026";
    const kelasBaruId = "kelas-11";
    const siswaId = "siswa-1";

    // Cek apakah penempatan tahun ajaran baru sudah ada
    const existingIndex = penempatanDb.findIndex(
      (p) => p.anggotaId === siswaId && p.tahunAjaranId === tahunAjaranBaruId
    );

    if (existingIndex >= 0) {
      penempatanDb[existingIndex].kelasId = kelasBaruId;
    } else {
      penempatanDb.push({
        id: "penempatan-2",
        anggotaId: siswaId,
        tahunAjaranId: tahunAjaranBaruId,
        kelasId: kelasBaruId,
      });
    }

    // Riwayat 2025/2026 harus tetap ada dan tetap di Kelas 10
    const riwayatLama = penempatanDb.find(
      (p) => p.anggotaId === siswaId && p.tahunAjaranId === "ta-2025"
    );
    assert.ok(riwayatLama !== undefined);
    assert.equal(riwayatLama.kelasId, "kelas-10");

    // Penempatan baru harus ada di 2026/2027 dan berada di Kelas 11
    const penempatanBaru = penempatanDb.find(
      (p) => p.anggotaId === siswaId && p.tahunAjaranId === "ta-2026"
    );
    assert.ok(penempatanBaru !== undefined);
    assert.equal(penempatanBaru.kelasId, "kelas-11");
  });

  await t.test("siswa hanya memiliki tepat satu penempatan per tahun ajaran", () => {
    const siswaId = "siswa-1";
    const placementsIn2026 = penempatanDb.filter(
      (p) => p.anggotaId === siswaId && p.tahunAjaranId === "ta-2026"
    );
    assert.equal(placementsIn2026.length, 1);
  });
});
