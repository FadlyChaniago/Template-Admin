/* ==========================================================================
   Halaman error di dalam aplikasi
   - 404: route tidak dikenal      - 403: tidak punya izin
   - #/error/{kode}: pratinjau kode 4xx/5xx mana pun (mis. #/error/503)
   Markup & data dibagi dengan error.html lewat core/errors-data.js
   ========================================================================== */
(function (K) {
  'use strict';
  const show = code => (view) => { view.innerHTML = K.renderError(code, { icon: K.ui.icon, inApp: true }); K.bindError(view); };
  K.page('404', { render: show(404) });
  K.page('403', { render: show(403) });
  K.page('error', { render: (view, route) => show(Number(route.params[0]) || 500)(view) });
})(window.K);
