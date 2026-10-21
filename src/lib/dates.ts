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

/**
 * Menentukan tahun kalender untuk bulan tertentu (1-12) dalam rentang Tahun Ajaran.
 * Sesuai aturan kalender pendidikan Indonesia:
 * - Tahun Ajaran sering melintasi 2 tahun kalender (misal Juli 2025 s.d. Juni 2026).
 * - Bulan >= bulan mulai (misal Juli s.d. Desember) memakai tahun mulai (2025).
 * - Bulan < bulan mulai (misal Januari s.d. Juni) memakai tahun selesai (2026).
 * Jika Tahun Ajaran berada dalam satu tahun kalender yang sama, tahun tersebut dipakai.
 * Jika tidak ada Tahun Ajaran yang diberikan, gunakan tahun kalender saat ini (zona Asia/Jakarta).
 */
export function resolveTahunKalender(
  ta: { mulai: Date | string; selesai: Date | string } | null | undefined,
  bulanNomor: number | string
): number {
  const m = typeof bulanNomor === "string" ? parseInt(bulanNomor, 10) : bulanNomor;
  if (!ta) {
    return new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    ).getFullYear();
  }
  const mulai = typeof ta.mulai === "string" ? new Date(ta.mulai) : ta.mulai;
  const selesai = typeof ta.selesai === "string" ? new Date(ta.selesai) : ta.selesai;
  const startYear = mulai.getUTCFullYear();
  const startMonth = mulai.getUTCMonth() + 1; // 1-12
  const endYear = selesai.getUTCFullYear();

  if (startYear === endYear) return startYear;

  // Jika nomor bulan >= bulan mulai (contoh: Juli-Desember), gunakan tahun mulai
  if (m >= startMonth) {
    return startYear;
  }
  // Nomor bulan < bulan mulai (contoh: Januari-Juni), gunakan tahun selesai
  return endYear;
}

/**
 * Membangun filter bulan berformat "YYYY-MM" berdasarkan nomor bulan dan Tahun Ajaran.
 */
export function buildBulanFilter(
  ta: { mulai: Date | string; selesai: Date | string } | null | undefined,
  bulanNomor: string | number | null | undefined
): string {
  if (!bulanNomor) return "";
  const m = typeof bulanNomor === "string" ? parseInt(bulanNomor, 10) : bulanNomor;
  if (isNaN(m) || m < 1 || m > 12) return "";
  const year = resolveTahunKalender(ta, m);
  return `${year}-${String(m).padStart(2, "0")}`;
}

