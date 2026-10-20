/* ==========================================================================
   K.i18n — terjemahan antarmuka (ID/EN).

     K.t('nav.users')                       → "Users" / "Pengguna"
     K.t('table.showing', { from, to, total })
   HTML statis: data-i18n="key", data-i18n-placeholder="key", data-i18n-aria="key"
   Kamus ada di assets/js/i18n/{id,en}.js. Kunci yang belum diterjemahkan
   jatuh ke Bahasa Indonesia, lalu ke kunci itu sendiri (mudah dideteksi).
   Menambah bahasa: buat file i18n/xx.js → K.i18n.add('xx', {...}) + opsi di Localization.
   ========================================================================== */
window.K = window.K || {};
(function (K) {
  'use strict';
  const dict = {};
  const KEY = 'kontrol:locale';
  let lang = 'id';
  try { lang = JSON.parse(localStorage.getItem(KEY)) || (K.config && K.config.locale) || 'id'; } catch { /* default */ }

  const i18n = {
    add(code, entries) { dict[code] = Object.assign(dict[code] || {}, entries); },
    get lang() { return lang; },
    available() { return Object.keys(dict); },
    t(key, vars) {
      let s = (dict[lang] && dict[lang][key]) ?? (dict.id && dict.id[key]) ?? key;
      if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
      return s;
    },
    /** Terapkan ke elemen statis yang memakai atribut data-i18n*. */
    apply(root = document) {
      root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = i18n.t(el.dataset.i18n); });
      root.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = i18n.t(el.dataset.i18nPlaceholder); });
      root.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', i18n.t(el.dataset.i18nAria)); });
      root.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = i18n.t(el.dataset.i18nTitle); });
      document.documentElement.lang = lang;
    },
    set(code) {
      lang = dict[code] ? code : 'id';
      try { localStorage.setItem(KEY, JSON.stringify(lang)); } catch { /* abaikan */ }
      i18n.apply();
      document.dispatchEvent(new CustomEvent('k:locale', { detail: lang }));
    },
  };
  K.i18n = i18n;
  K.t = i18n.t;
})(window.K);
