export interface CekHapusAkunParams {
  currentUserId: string;
  targetUser: {
    id: string;
    peran: "ADMIN" | "PETUGAS";
    aktif: boolean;
  };
  jumlahAdminAktif: number;
  totalTransaksi: number;
}

export interface CekHapusAkunResult {
  dapatDihapus: boolean;
  alasan?: string;
}

/**
 * Aturan bisnis keamanan penghapusan akun pengguna:
 * 1. Dilarang menghapus akun yang sedang digunakan untuk login (diri sendiri).
 * 2. Dilarang menghapus akun target jika ia adalah satu-satunya admin yang masih berstatus aktif.
 * 3. Dilarang menghapus akun jika memiliki riwayat pencatatan transaksi (SPP, bantuan, donatur, pengeluaran),
 *    termasuk transaksi yang telah di-soft-delete (deletedAt != null) demi menjaga integritas audit.
 */
export function canDeleteAccount(params: CekHapusAkunParams): CekHapusAkunResult {
  const { currentUserId, targetUser, jumlahAdminAktif, totalTransaksi } = params;

  // Aturan 1: Tidak boleh menghapus diri sendiri
  if (targetUser.id === currentUserId) {
    return {
      dapatDihapus: false,
      alasan: "Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.",
    };
  }

  // Aturan 2: Tidak boleh menghapus admin aktif terakhir
  if (targetUser.peran === "ADMIN" && targetUser.aktif && jumlahAdminAktif <= 1) {
    return {
      dapatDihapus: false,
      alasan: "Tidak dapat menghapus satu-satunya akun Admin aktif dalam sistem.",
    };
  }

  // Aturan 3: Tidak boleh jika punya riwayat transaksi (audit trail)
  if (totalTransaksi > 0) {
    return {
      dapatDihapus: false,
      alasan: `Akun memiliki ${totalTransaksi} riwayat pencatatan transaksi keuangan. Akun yang memiliki transaksi tidak dapat dihapus permanen guna menjaga integritas audit. Gunakan opsi Nonaktifkan.`,
    };
  }

  return {
    dapatDihapus: true,
  };
}
