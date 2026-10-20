/* Entry point — dijalankan terakhir (semua script memakai `defer`). */
(function (K) {
  'use strict';
  if (!window.lucide) console.warn('[Kontrol] Lucide tidak termuat — ikon tidak tampil. Periksa koneksi CDN.');
  if (!window.Chart) console.warn('[Kontrol] Chart.js tidak termuat — grafik dinonaktifkan.');
  K.boot();
})(window.K);
