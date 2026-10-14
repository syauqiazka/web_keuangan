/**
 * Format dan parsing tanggal sesuai AGENTS.md Bagian 5.2 dan DESIGN.md Bagian 11:
 * - Menggunakan UTC agar tanggal tidak bergeser hari
 * - Format input: "dd-mm-yyyy"
 * - Format tabel: "13 Okt 2026"
 * - Format bulan penuh: "Oktober 2026"
 */

const NAMA_BULAN_SINGKAT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const NAMA_BULAN_PANJANG = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/**
 * Membuat object Date UTC dari tahun, bulan (1-12), dan hari (1-31).
 */
export function createUTCDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Format Date ke format tabel: "13 Okt 2026"
 */
export function formatTanggalTabel(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  const day = d.getUTCDate();
  const month = NAMA_BULAN_SINGKAT[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format Date ke format input spreadsheet: "dd-mm-yyyy"
 */
export function formatTanggalInput(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Format Date ke judul bulan: "Oktober 2026"
 */
export function formatBulanJudul(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  const month = NAMA_BULAN_PANJANG[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${month} ${year}`;
}

/**
 * Parse teks input "dd-mm-yyyy" menjadi Date UTC
 */
export function parseTanggalInput(input: string): Date {
  const match = input.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!match) {
    throw new Error("Format tanggal harus dd-mm-yyyy.");
  }
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (month < 1 || month > 12) {
    throw new Error("Bulan tidak valid (1-12).");
  }

  const d = createUTCDate(year, month, day);
  if (d.getUTCDate() !== day || d.getUTCMonth() !== month - 1 || d.getUTCFullYear() !== year) {
    throw new Error("Tanggal tidak valid dalam kalender.");
  }

  return d;
}
