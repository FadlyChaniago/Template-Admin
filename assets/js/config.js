/* ==========================================================================
   K.config — SATU-SATUNYA file yang perlu diubah saat menyambung backend.
   Dimuat paling awal (setelah vendor). Bisa juga di-override dari server:
     <script>window.KONTROL_CONFIG = { dataMode: 'api', apiBaseUrl: '/api/v1' }</script>
   ========================================================================== */
window.K = window.K || {};
(function (K) {
  'use strict';
  const defaults = {
    appName: 'Kontrol',
    version: '4.0.0',

    /* 'demo' → data dari seed + localStorage (tanpa server)
       'api'  → semua K.api.* memanggil backend sungguhan */
    dataMode: 'demo',
    apiBaseUrl: '/api/v1',
    apiTimeoutMs: 15000,
    apiRetries: 2,               // hanya untuk GET saat error jaringan / 5xx
    demoLatencyMs: [180, 520],   // simulasi latensi mode demo

    /* Autentikasi
       - 'cookie' : sesi HttpOnly + CSRF (Laravel Sanctum SPA) → DISARANKAN
       - 'bearer' : token di header Authorization (API pihak ketiga / mobile) */
    authMode: 'cookie',
    csrfMeta: 'csrf-token',      // <meta name="csrf-token" content="…">
    getToken: () => null,        // untuk authMode 'bearer'
    loginUrl: 'login.html',
    lockUrl: 'lock-screen.html',

    /* Sesi idle: menit tanpa aktivitas → lock screen (0 = nonaktif).
       null = ikuti Security Settings → "Batas waktu sesi idle". */
    sessionIdleMinutes: null,
    sessionWarnSeconds: 60,

    /* Bahasa default (bisa diganti pengguna di Localization) */
    locale: 'id',

    /* Peta (Leaflet). Untuk jaringan tanpa internet ganti ke tile server internal. */
    map: {
      tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      center: [-2.5, 117.5], zoom: 5,
    },
  };
  K.config = Object.assign({}, defaults, window.KONTROL_CONFIG || {});
})(window.K);
