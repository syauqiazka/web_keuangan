import { z } from "zod";
import { parseRupiah } from "@/lib/money";
import { parseTanggalInput } from "@/lib/dates";

export const loginSchema = z.object({
  kode: z.string().min(1, "Kode harus diisi."),
  password: z.string().min(1, "Kata sandi harus diisi."),
});

export const gantiPasswordSchema = z
  .object({
    passwordLama: z.string().min(1, "Kata sandi saat ini harus diisi."),
    passwordBaru: z.string().min(8, "Kata sandi baru minimal 8 karakter."),
    konfirmasiPassword: z.string().min(1, "Konfirmasi kata sandi harus diisi."),
  })
  .refine((data) => data.passwordBaru === data.konfirmasiPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["konfirmasiPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type GantiPasswordInput = z.infer<typeof gantiPasswordSchema>;

/**
 * Helper murni untuk validasi ketat nominal rupiah dan tanggal transaksi DD-MM-YYYY
 */
export function validateNominalDanTanggal(
  nominalStr: unknown,
  tanggalStr: unknown
):
  | { valid: true; nominal: number; tanggal: Date }
  | { valid: false; error: string } {
  if (typeof tanggalStr !== "string" || !tanggalStr.trim()) {
    return { valid: false, error: "Tanggal transaksi harus diisi." };
  }

  let tanggal: Date;
  try {
    tanggal = parseTanggalInput(tanggalStr);
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Format tanggal tidak valid. Gunakan format DD-MM-YYYY.",
    };
  }

  if (typeof nominalStr !== "string" && typeof nominalStr !== "number") {
    return { valid: false, error: "Nominal pembayaran harus diisi." };
  }

  let nominal: number;
  try {
    nominal = typeof nominalStr === "number" ? nominalStr : parseRupiah(nominalStr);
    if (nominal <= 0) {
      return { valid: false, error: "Nominal pembayaran harus lebih dari 0." };
    }
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Nominal tidak valid.",
    };
  }

  return { valid: true, nominal, tanggal };
}
