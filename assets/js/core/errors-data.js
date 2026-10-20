/* ==========================================================================
   K.errorsData — satu sumber data untuk halaman error 4xx & 5xx.
   Dipakai oleh halaman error di dalam aplikasi (#/error/500) DAN
   halaman standalone (error.html?code=500, 404.html).
   ========================================================================== */
window.K = window.K || {};
(function (K) {
  'use strict';
  K.errorsData = {
    400: { icon: 'file-x', tone: 'warning', title: 'Permintaan tidak valid', text: 'Server tidak dapat memproses permintaan karena format atau parameternya salah.', hint: 'Periksa kembali data yang dikirim, lalu coba lagi.' },
    401: { icon: 'lock-keyhole', tone: 'warning', title: 'Perlu masuk terlebih dahulu', text: 'Sesi Anda sudah berakhir atau Anda belum login.', hint: 'Masuk kembali untuk melanjutkan.', action: { label: 'Masuk', href: 'login.html', icon: 'log-in' } },
    403: { icon: 'shield-alert', tone: 'danger', title: 'Akses ditolak', text: 'Peran Anda tidak memiliki izin untuk membuka halaman ini.', hint: 'Hubungi admin workspace bila Anda membutuhkan akses.' },
    404: { icon: 'map-pin-off', tone: 'info', title: 'Halaman tidak ditemukan', text: 'Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.', hint: 'Periksa ejaan URL atau gunakan pencarian.' },
    405: { icon: 'ban', tone: 'warning', title: 'Metode tidak diizinkan', text: 'Metode HTTP yang digunakan tidak didukung oleh endpoint ini.', hint: 'Untuk developer: periksa GET/POST/PUT/DELETE pada route.' },
    408: { icon: 'timer-off', tone: 'warning', title: 'Waktu permintaan habis', text: 'Server menunggu terlalu lama untuk menerima permintaan Anda.', hint: 'Periksa koneksi internet lalu muat ulang halaman.' },
    419: { icon: 'clock-alert', tone: 'warning', title: 'Halaman kedaluwarsa', text: 'Token keamanan (CSRF) formulir sudah kedaluwarsa.', hint: 'Muat ulang halaman lalu kirim kembali formulir.' },
    422: { icon: 'file-warning', tone: 'warning', title: 'Data tidak dapat diproses', text: 'Data yang dikirim tidak lolos validasi.', hint: 'Perbaiki kolom yang ditandai lalu kirim ulang.' },
    429: { icon: 'gauge', tone: 'warning', title: 'Terlalu banyak permintaan', text: 'Anda mencapai batas jumlah permintaan dalam waktu singkat.', hint: 'Tunggu sebentar sebelum mencoba lagi.' },
    500: { icon: 'server-crash', tone: 'danger', title: 'Terjadi kesalahan pada server', text: 'Ada masalah tak terduga di sisi kami. Tim sudah menerima laporan otomatis.', hint: 'Coba lagi dalam beberapa menit.' },
    502: { icon: 'unplug', tone: 'danger', title: 'Bad gateway', text: 'Server perantara menerima respons tidak valid dari layanan hulu.', hint: 'Biasanya pulih sendiri dalam beberapa saat.' },
    503: { icon: 'construction', tone: 'danger', title: 'Layanan sedang dalam pemeliharaan', text: 'Kami sedang melakukan pemeliharaan terjadwal atau server sedang sibuk.', hint: 'Lihat status layanan untuk estimasi waktu pulih.', action: { label: 'Status layanan', href: 'index.html#/health', icon: 'activity' } },
    504: { icon: 'hourglass', tone: 'danger', title: 'Gateway timeout', text: 'Layanan hulu tidak merespons tepat waktu.', hint: 'Coba lagi beberapa saat lagi.' },
  };

  /** Render isi halaman error (dipakai in-app & standalone). base = prefix path aset. */
  K.renderError = function (code, { icon, inApp = false } = {}) {
    const e = K.errorsData[code] || K.errorsData[404];
    const c = K.errorsData[code] ? code : 404;
    const ic = name => icon ? icon(name) : `<i data-lucide="${name}"></i>`;
    // Terjemahan opsional (K.i18n): kunci err.<kode>.title/text/hint/action, fallback ke data ID
    const tr = (k, d) => { if (!K.t) return d; const v = K.t(k); return v === k ? d : v; };
    const home = inApp ? '#/dashboard' : 'index.html#/dashboard';
    const kind = c >= 500 ? tr('err.server', 'Kesalahan server') : tr('err.client', 'Kesalahan klien');
    const reqId = 'req_' + Math.random().toString(36).slice(2, 10);
    return `<div class="errpage errpage--${e.tone}">
      <div class="errpage__visual" aria-hidden="true"><span class="errpage__code">${c}</span><span class="errpage__icon">${ic(e.icon)}</span></div>
      <p class="eyebrow">${kind} · HTTP ${c}</p>
      <h1 ${inApp ? 'id="page-title" tabindex="-1"' : ''} class="errpage__title">${tr(`err.${c}.title`, e.title)}</h1>
      <p class="errpage__text">${tr(`err.${c}.text`, e.text)}</p>
      <p class="errpage__hint">${ic('lightbulb')}<span>${tr(`err.${c}.hint`, e.hint)}</span></p>
      <div class="errpage__actions">
        ${e.action ? `<a href="${e.action.href}" class="btn btn-primary">${ic(e.action.icon)}<span>${tr(`err.${c}.action`, e.action.label)}</span></a>` : ''}
        <a href="${home}" class="btn ${e.action ? 'btn-secondary' : 'btn-primary'}">${ic('house')}<span>${tr('err.home', 'Ke Dashboard')}</span></a>
        <button type="button" class="btn btn-secondary" data-err-back>${ic('undo-2')}<span>${tr('err.back', 'Kembali')}</span></button>
        ${c >= 500 || c === 408 || c === 429 ? `<button type="button" class="btn btn-ghost" data-err-reload>${ic('refresh-cw')}<span>${tr('err.retry', 'Coba lagi')}</span></button>` : ''}
      </div>
      <p class="errpage__meta">${tr('err.req', 'ID permintaan: {id} — sertakan saat menghubungi dukungan.').replace('{id}', `<code>${reqId}</code>`)}</p>
    </div>`;
  };

  /** Pasang handler tombol Kembali / Coba lagi. */
  K.bindError = function (root) {
    root.querySelector('[data-err-back]')?.addEventListener('click', () => (history.length > 1 ? history.back() : (location.href = 'index.html')));
    root.querySelector('[data-err-reload]')?.addEventListener('click', () => location.reload());
  };
})(window.K);
