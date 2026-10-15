/**
 * Generator Kode UID Otomatis
 * Sesuai kebutuhan pemilik: pengguna tidak perlu mengetik manual Kode UID.
 * Format:
 * Siswa -> SW-XXXX (contoh: SW-4821)
 * Guru  -> GR-XXXX (contoh: GR-1092)
 */

export function generateUID(tipe: "SISWA" | "GURU" = "SISWA"): string {
  const prefix = tipe === "GURU" ? "GR" : "SW";
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}
