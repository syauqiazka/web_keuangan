/**
 * Format dan parsing uang rupiah sesuai aturan AGENTS.md Bagian 5.1:
 * - Nominal berupa Rupiah utuh tanpa desimal
 * - Format tampilan: "Rp 1.250.000" tanpa ",-"
 * - parseRupiah: menolak desimal, negatif, nol, dan lebih dari 15 digit
 */

export function formatRupiah(nominal: number): string {
  if (!Number.isFinite(nominal)) return "Rp 0";
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nominal);

  // Pastikan format "Rp X.XXX.XXX" tanpa ",-" dan spasi konsisten
  return formatted.replace(/^Rp\s*/, "Rp ").replace(/,00$/, "").trim();
}

export function parseRupiah(input: string): number {
  if (typeof input !== "string") {
    throw new Error("Input nominal harus berupa teks.");
  }

  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Nominal tidak boleh kosong.");
  }

  if (trimmed.startsWith("-") || trimmed.includes("-")) {
    throw new Error("Nominal tidak boleh negatif.");
  }

  // Bersihkan awalan Rp / rp dan spasi
  const withoutPrefix = trimmed.replace(/^rp\s*/i, "").trim();

  // Tolak desimal: tanda koma desimal atau titik yang bukan pemisah ribuan
  if (withoutPrefix.includes(",")) {
    throw new Error("Nominal harus berupa rupiah utuh tanpa desimal.");
  }

  // Jika ada titik desimal non-ribuan (misal: 1250.5)
  // Format ribuan Indonesia: kelompok 3 digit setelah titik
  const parts = withoutPrefix.split(".");
  if (parts.length > 1) {
    for (let i = 1; i < parts.length; i++) {
      if (parts[i].length !== 3) {
        throw new Error("Nominal tidak valid atau mengandung desimal.");
      }
    }
  }

  const digitsOnly = withoutPrefix.replace(/\./g, "");

  if (!/^\d+$/.test(digitsOnly)) {
    throw new Error("Nominal harus berupa angka valid.");
  }

  if (digitsOnly.length > 15) {
    throw new Error("Nominal tidak boleh lebih dari 15 digit.");
  }

  const value = Number(digitsOnly);

  if (value === 0) {
    throw new Error("Nominal harus lebih dari 0.");
  }

  if (!Number.isSafeInteger(value)) {
    throw new Error("Nominal melebihi batas angka aman.");
  }

  return value;
}
