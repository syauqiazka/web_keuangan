import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canDeleteAccount } from "../src/lib/akun-rules";

describe("Aturan Keamanan Penghapusan Akun Pengguna (canDeleteAccount)", () => {
  const currentUserAdminId = "usr-admin-1";

  it("kasus 1: menolak penghapusan akun milik diri sendiri yang sedang login", () => {
    const res = canDeleteAccount({
      currentUserId: currentUserAdminId,
      targetUser: {
        id: currentUserAdminId,
        peran: "ADMIN",
        aktif: true,
      },
      jumlahAdminAktif: 2,
      totalTransaksi: 0,
    });

    assert.equal(res.dapatDihapus, false);
    assert.match(res.alasan ?? "", /tidak dapat menghapus akun Anda sendiri/i);
  });

  it("kasus 2: menolak penghapusan admin aktif terakhir dalam sistem", () => {
    const res = canDeleteAccount({
      currentUserId: currentUserAdminId,
      targetUser: {
        id: "usr-admin-2",
        peran: "ADMIN",
        aktif: true,
      },
      jumlahAdminAktif: 1, // Hanya ada 1 admin aktif tersisa
      totalTransaksi: 0,
    });

    assert.equal(res.dapatDihapus, false);
    assert.match(res.alasan ?? "", /satu-satunya akun Admin aktif/i);
  });

  it("kasus 3: menolak penghapusan akun yang memiliki riwayat transaksi (termasuk soft-delete)", () => {
    const res = canDeleteAccount({
      currentUserId: currentUserAdminId,
      targetUser: {
        id: "usr-petugas-1",
        peran: "PETUGAS",
        aktif: true,
      },
      jumlahAdminAktif: 2,
      totalTransaksi: 5, // Memiliki 5 transaksi
    });

    assert.equal(res.dapatDihapus, false);
    assert.match(res.alasan ?? "", /5 riwayat pencatatan transaksi keuangan/i);
    assert.match(res.alasan ?? "", /Gunakan opsi Nonaktifkan/i);
  });

  it("kasus 4: mengizinkan penghapusan akun petugas bersih tanpa riwayat transaksi", () => {
    const res = canDeleteAccount({
      currentUserId: currentUserAdminId,
      targetUser: {
        id: "usr-petugas-clean",
        peran: "PETUGAS",
        aktif: true,
      },
      jumlahAdminAktif: 2,
      totalTransaksi: 0,
    });

    assert.equal(res.dapatDihapus, true);
    assert.equal(res.alasan, undefined);
  });

  it("kasus 5: mengizinkan penghapusan akun admin nonaktif atau admin kedua tanpa transaksi", () => {
    const res = canDeleteAccount({
      currentUserId: currentUserAdminId,
      targetUser: {
        id: "usr-admin-2",
        peran: "ADMIN",
        aktif: true,
      },
      jumlahAdminAktif: 2, // Masih ada admin aktif lainnya
      totalTransaksi: 0,
    });

    assert.equal(res.dapatDihapus, true);
    assert.equal(res.alasan, undefined);
  });
});
