# Direktori Model Live2D Cubism — VTuber Turguide

Direktori ini disiapkan untuk memuat model Live2D Cubism 4 (.model3.json).

## Struktur File yang Diharapkan

Letakkan aset model yang telah diekspor dari Live2D Cubism Editor ke direktori ini:

```
public/
  live2d/
    guide/
      guide.model3.json      (Manifest model utama)
      guide.moc3             (Binary model Cubism 4)
      guide.physics3.json    (Fisika model opsional)
      textures/
        texture_00.png       (Texture atlas)
      motions/
        idle.motion3.json
        speak.motion3.json
        greet.motion3.json
      expressions/
        happy.exp3.json
```

## Live2D Cubism Core SDK

Sesuai ketentuan lisensi resmi Live2D Inc., library Cubism Core berpemilik tidak didistribusikan langsung di dalam repository publik tanpa lisensi.
Untuk mengaktifkan rendering model Live2D secara penuh:

1. Unduh **Live2D Cubism SDK for Web** dari situs resmi: [https://www.live2d.com/en/sdk/about/](https://www.live2d.com/en/sdk/about/)
2. Salin file `live2dcubismcore.min.js` ke direktori `public/live2d/live2dcubismcore.min.js`.
3. Komponen `VtuberCanvas` secara otomatis mendeteksi keberadaan file ini dan memuatnya saat runtime.

## Fallback UI Otomatis

Bila model atau Cubism Core belum diletakkan di direktori ini, sistem Turguide **tetap berfungsi 100%** menggunakan Interactive Vector Avatar Engine (fallback mode) dengan animasi pernapasan, kedip mata, dan sinkronisasi gerakan mulut saat berbicara.
