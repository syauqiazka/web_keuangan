import { z } from "zod";

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
