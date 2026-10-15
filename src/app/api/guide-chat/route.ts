import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/server/auth/session";

// Skema validasi pesan masuk
const chatRequestSchema = z.object({
  message: z.string().trim().min(1, "Pesan tidak boleh kosong").max(300, "Pesan maksimal 300 karakter"),
  currentPath: z.string().default("/dashboard"),
});

// Sederhana In-Memory Rate Limiting per User (15 req/menit)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRecord = rateLimitMap.get(userId);

  if (!userRecord || now > userRecord.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + 60 * 1000 });
    return true;
  }

  if (userRecord.count >= 15) {
    return false;
  }

  userRecord.count += 1;
  return true;
}

// Basis Pengetahuan Internal Khusus Bank Saku Digital
const APP_KNOWLEDGE = `
Anda adalah Turguide Virtual resmi untuk sistem internal "Bank Saku Digital" (Pencatatan Keuangan Sekolah).
Tugas Anda: Membantu petugas dan admin memahami cara menggunakan aplikasi ini.
Batasan Ketat:
- Anda TIDAK BOLEH mengarang saldo, transaksi fiktif, atau mengklaim telah mengubah/mengeksekusi transaksi keuangan.
- Semua data keuangan hanya dapat diubah oleh pengguna melalui formulir/tabel di layar.
- Jika pengguna bertanya di luar operasional aplikasi ini, jelaskan dengan sopan bahwa Anda hanya berfokus pada panduan Bank Saku Digital.

Pengetahuan Sistem:
1. Dashboard:
   - Total Saldo Dana Sekolah = Total Pemasukan Tahunan dikurangi Total Pengeluaran Tahunan.
   - Grafik batang bulanan: Hijau = Pemasukan, Biru = Pengeluaran.
2. Data Siswa & Guru:
   - Pilih Tahun Ajaran dan Kelas/Guru, lalu klik 'Enter' untuk menarik data.
   - Kolom: No, Nama, Kelas/Guru, Kode UID.
   - Mode edit dibuka dengan mengklik tombol 'Input'.
   - Salin-tempel (Paste) dari Excel/Google Sheets aktif di tabel ini.
   - Perubahan disimpan sekaligus ke server dengan tombol 'Simpan'.
3. Pemasukan:
   - Ada 3 Tab sumber: Dari Siswa, Bantuan (BOSP, BPMU, PIP), Donatur (OTA, hibah, infak).
   - Filter: Tahun Ajaran, Kelas, Bulan + tombol 'Tarik Data'.
   - Tab Dari Siswa: SPP memiliki 4 sub-kolom (Tanggal, Bulan Terbayar, Metode, Petugas). Jenis lain memiliki 3 sub-kolom (Tanggal, Metode, Petugas).
   - Metode: 'TF' = Transfer, 'ST' = Setor Tunai.
   - Status Nominal: Jika nominal berwarna MERAH, berarti pembayaran siswa tersebut belum lunas dibandingkan nominal standar.
   - Tombol 'Tambah Kolom' (pada mode Input) untuk menambah pos pembayaran baru.
4. Pengeluaran:
   - Filter: Tahun Ajaran & Bulan + tombol 'Tarik Data'.
   - Kolom: No, Tanggal, Jenis Pengeluaran, Nominal, Petugas.
   - Mode edit via tombol 'Input', lalu 'Simpan' untuk mengirim transaksi.
5. Pengaturan:
   - Ganti Kata Sandi (minimal 8 karakter).
   - Mode Tampilan: Terang (siang) dan Gelap.
   - Kelola Akun: Khusus peran ADMIN untuk membuat akun baru, reset kata sandi, atau nonaktifkan akun petugas.
`;

function getKnowledgeResponse(message: string, currentPath: string): string {
  const query = message.toLowerCase();

  if (query.includes("st") || query.includes("tf") || query.includes("metode")) {
    return "Pada kolom Metode, 'TF' adalah singkatan dari Transfer (via bank), sedangkan 'ST' adalah Setor Tunai langsung ke kasir/petugas sekolah.";
  }

  if (query.includes("merah") || query.includes("kurang") || query.includes("lunas")) {
    return "Nominal berwarna merah menandakan pembayaran siswa belum lunas (jumlah terbayar lebih kecil dari nominal standar yang ditetapkan). Tulisan 'kurang Rp...' akan tampil menyertai nominal.";
  }

  if (query.includes("paste") || query.includes("excel") || query.includes("salin") || query.includes("tempel")) {
    return "Untuk menempel data dari Excel: Klik tombol 'Input' agar masuk ke mode edit, salin (Ctrl+C) data kolom dari Excel, lalu klik sel pertama di tabel dan tekan Ctrl+V. Baris akan otomatis terisi dan divalidasi!";
  }

  if (query.includes("spp") || query.includes("bulan terbayar")) {
    return "SPP adalah pos pembayaran bulanan dengan 4 sub-kolom: Tanggal Transaksi, Bulan Terbayar, Metode, dan Petugas. Pos lainnya (seperti Daftar Ulang) memiliki 3 sub-kolom.";
  }

  if (query.includes("saldo") || query.includes("rumus") || query.includes("hitung")) {
    return "Total Saldo Dana Sekolah dihitung dari akumulasi seluruh Pemasukan (Siswa + Bantuan + Donatur) dikurangi total Pengeluaran pada tahun kalender yang dipilih.";
  }

  if (query.includes("simpan") || query.includes("batal") || query.includes("input")) {
    return "Tabel awalnya bersifat hanya-baca. Klik tombol 'Input' untuk mulai mengedit atau menambah baris. Klik 'Simpan' untuk mengirim seluruh perubahan sekaligus dalam satu transaksi database.";
  }

  if (query.includes("grafik") || query.includes("warna")) {
    return "Pada grafik batang bulanan di Dashboard: Batang Hijau mewakili Pemasukan, dan Batang Biru mewakili Pengeluaran.";
  }

  if (query.includes("tambah kolom")) {
    return "Tombol 'Tambah Kolom' tersedia di halaman Pemasukan > Dari Siswa saat mode Input aktif. Gunakan ini untuk menambah pos biaya baru seperti Uang Ujian atau Uang Gedung.";
  }

  if (query.includes("akun") || query.includes("admin") || query.includes("petugas")) {
    return "Pembuatan dan pengaturan akun petugas dilakukan oleh ADMIN melalui menu Pengaturan > Kelola Akun. Petugas biasa hanya dapat mengganti kata sandi miliknya.";
  }

  return `Saya asisten navigasi Bank Saku Digital untuk halaman ${currentPath}. Anda dapat menanyakan cara pengisian tabel, arti singkatan TF/ST, penempelan dari Excel, atau rumus saldo sekolah.`;
}

export async function POST(req: NextRequest) {
  // 1. Verifikasi Autentikasi Sesi
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sesi tidak valid atau telah berakhir. Silakan masuk kembali." },
      { status: 401 }
    );
  }

  // 2. Rate Limiting
  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Silakan tunggu 1 menit sebelum bertanya lagi." },
      { status: 429 }
    );
  }

  // 3. Validasi Request Body
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format data tidak valid." }, { status: 400 });
  }

  const parseResult = chatRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.issues[0]?.message || "Input tidak valid." },
      { status: 400 }
    );
  }

  const { message, currentPath } = parseResult.data;

  // 4. Integrasi LLM Eksternal (Gemini / OpenAI jika API key dikonfigurasi di server)
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (geminiApiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `${APP_KNOWLEDGE}\n\nPengguna sedang di halaman: ${currentPath}.\nPeran pengguna: ${user.peran}.\nPertanyaan: ${message}\n\nBerikan jawaban pendek, akurat, dan sopan dalam bahasa Indonesia (maksimal 3 kalimat):`,
                  },
                ],
              },
            ],
            generationConfig: {
              maxOutputTokens: 150,
              temperature: 0.3,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text =
          data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
          getKnowledgeResponse(message, currentPath);
        return NextResponse.json({ reply: text });
      }
    } catch (err) {
      console.warn("Gagal menghubungi Gemini API, beralih ke engine internal:", err);
    }
  }

  if (openaiApiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: `${APP_KNOWLEDGE}\nJawaban maksimal 3 kalimat.` },
            { role: "user", content: `Halaman saat ini: ${currentPath}. Pertanyaan: ${message}` },
          ],
          max_tokens: 150,
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text =
          data.choices?.[0]?.message?.content?.trim() ||
          getKnowledgeResponse(message, currentPath);
        return NextResponse.json({ reply: text });
      }
    } catch (err) {
      console.warn("Gagal menghubungi OpenAI API, beralih ke engine internal:", err);
    }
  }

  // 5. Fallback Internal Knowledge Engine
  const reply = getKnowledgeResponse(message, currentPath);
  return NextResponse.json({ reply });
}
