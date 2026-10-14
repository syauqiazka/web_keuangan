import { formatRupiah } from "./money";

export interface StatusLunasResult {
  lunas: boolean;
  totalTerbayar: number;
  nominalStandar: number | null;
  kekurangan: number;
  teksKekurangan: string | null;
  jumlahPembayaran: number;
  isCicilan: boolean;
}

/**
 * Menghitung status lunas sesuai aturan AGENTS.md Bagian 5.3:
 * - Belum lunas jika nominalStandar tidak null dan jumlah < nominalStandar
 * - Jika nominalStandar null, tidak pernah merah (selalu lunas = true)
 * - Menangani satu atau banyak pembayaran (cicilan)
 */
export function hitungStatusLunas(
  pembayaran: number[] | number,
  nominalStandar: number | null
): StatusLunasResult {
  const nominalList = Array.isArray(pembayaran) ? pembayaran : [pembayaran];
  const totalTerbayar = nominalList.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  const jumlahPembayaran = nominalList.length;
  const isCicilan = jumlahPembayaran > 1;

  if (nominalStandar === null || nominalStandar === undefined) {
    return {
      lunas: true,
      totalTerbayar,
      nominalStandar: null,
      kekurangan: 0,
      teksKekurangan: null,
      jumlahPembayaran,
      isCicilan,
    };
  }

  if (totalTerbayar >= nominalStandar) {
    return {
      lunas: true,
      totalTerbayar,
      nominalStandar,
      kekurangan: 0,
      teksKekurangan: null,
      jumlahPembayaran,
      isCicilan,
    };
  }

  const kekurangan = nominalStandar - totalTerbayar;
  return {
    lunas: false,
    totalTerbayar,
    nominalStandar,
    kekurangan,
    teksKekurangan: `kurang ${formatRupiah(kekurangan)}`,
    jumlahPembayaran,
    isCicilan,
  };
}
