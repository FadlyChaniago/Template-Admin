/* Halaman error: 404 (route tidak dikenal) & 403 (tidak punya izin) */
(function (K) {
  'use strict';
  const { icon } = K.ui;
  const tpl = (code, title, text) => `<div class="card" style="max-width:560px;margin:48px auto;text-align:center;padding:48px 24px">
    <div class="empty__icon" style="margin:0 auto 16px">${icon(code === 404 ? 'map-pin-off' : 'shield-alert')}</div>
    <p class="eyebrow">Error ${code}</p>
    <h1 id="page-title" tabindex="-1" style="font-size:24px;margin-top:12px;letter-spacing:-0.6px">${title}</h1>
    <p class="text-secondary mt-2">${text}</p>
    <div class="btn-group mt-6" style="justify-content:center"><a href="#/dashboard" class="btn btn-primary">${icon('house')}<span>Kembali ke Dashboard</span></a><button type="button" class="btn btn-secondary" onclick="K.openPalette()">${icon('search')}<span>Cari halaman</span></button></div>
  </div>`;
  K.page('404', { render: v => { v.innerHTML = tpl(404, 'Halaman tidak ditemukan', 'Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.'); } });
  K.page('403', { render: v => { v.innerHTML = tpl(403, 'Akses ditolak', 'Peran Anda tidak memiliki izin untuk membuka halaman ini. Hubungi admin workspace.'); } });
})(window.K);
