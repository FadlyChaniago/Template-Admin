/* ==========================================================================
   K.util — helper murni tanpa efek samping (format, escape, waktu, dll)
   Semua modul memakai namespace global `K` agar bisa dibuka langsung
   lewat file:// tanpa bundler / ES module.
   ========================================================================== */
window.K = window.K || {};

(function (K) {
  'use strict';

  const LOCALE = 'id-ID';
  const TZ = 'Asia/Jakarta';

  const util = {
    /** Escape string untuk disisipkan ke HTML — WAJIB untuk semua data dinamis. */
    esc(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    idr(n, { compact = false } = {}) {
      if (compact) {
        const abs = Math.abs(n);
        if (abs >= 1e9) return 'Rp' + util.num(n / 1e9, 2) + ' M';
        if (abs >= 1e6) return 'Rp' + util.num(n / 1e6, 2) + ' jt';
        if (abs >= 1e3) return 'Rp' + util.num(n / 1e3, 1) + ' rb';
      }
      return 'Rp' + Math.round(n).toLocaleString(LOCALE);
    },

    num(n, digits = 0) {
      return Number(n).toLocaleString(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits });
    },

    pct(n, digits = 1) { return util.num(n, digits) + '%'; },

    bytes(b) {
      if (b < 1024) return b + ' B';
      const u = ['KB', 'MB', 'GB', 'TB']; let i = -1;
      do { b /= 1024; i++; } while (b >= 1024 && i < u.length - 1);
      return util.num(b, b < 10 ? 1 : 0) + ' ' + u[i];
    },

    date(d, opts = { day: '2-digit', month: 'short', year: 'numeric' }) {
      return new Date(d).toLocaleDateString(LOCALE, { timeZone: TZ, ...opts });
    },

    time(d) {
      return new Date(d).toLocaleTimeString(LOCALE, { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).replace('.', ':') + ' WIB';
    },

    dateTime(d) { return util.date(d) + ', ' + util.time(d); },

    /** "5 menit lalu" relatif terhadap waktu demo agar data selalu terasa segar. */
    ago(d) {
      const diff = (K.NOW - new Date(d).getTime()) / 1000;
      if (diff < 60) return 'baru saja';
      if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
      if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
      if (diff < 86400 * 30) return Math.floor(diff / 86400) + ' hari lalu';
      return util.date(d);
    },

    initials(name) {
      return String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    },

    /** Warna avatar deterministik berdasarkan nama. */
    tone(seed) {
      const tones = ['blue', 'emerald', 'amber', 'rose', 'violet', 'sky'];
      let h = 0; for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
      return tones[h % tones.length];
    },

    uid(prefix = 'id') { return prefix + '_' + Math.random().toString(36).slice(2, 9); },

    slugify(s) {
      return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    },

    debounce(fn, ms = 200) {
      let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
    },

    /** Seeded PRNG (mulberry32) — data grafik stabil di setiap reload. */
    rng(seed = 1) {
      return function () {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },

    series(len, base, spread, trend = 0, seed = 7) {
      const r = util.rng(seed); const out = []; let v = base;
      for (let i = 0; i < len; i++) { v = Math.max(0, v + (r() - 0.45) * spread + trend); out.push(Math.round(v)); }
      return out;
    },

    /** Label tanggal harian mundur dari tanggal demo. */
    dayLabels(n, end = K.NOW) {
      const out = [];
      for (let i = n - 1; i >= 0; i--) out.push(util.date(end - i * 86400000, { day: '2-digit', month: 'short' }));
      return out;
    },

    downloadFile(filename, content, mime = 'text/plain') {
      const blob = new Blob([content], { type: mime + ';charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 500);
    },

    toCSV(rows, columns) {
      const q = v => {
        const s = String(v ?? '');
        return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      };
      const head = columns.map(c => q(c.label)).join(',');
      const body = rows.map(r => columns.map(c => q(typeof c.csv === 'function' ? c.csv(r) : r[c.key])).join(','));
      return [head, ...body].join('\n');
    },

    async copy(text) {
      try { await navigator.clipboard.writeText(text); return true; }
      catch {
        const ta = Object.assign(document.createElement('textarea'), { value: text });
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        const ok = document.execCommand('copy'); ta.remove(); return ok;
      }
    },

    /** Ambil semua field form menjadi object (checkbox → boolean). */
    formData(form) {
      const out = {};
      for (const el of form.elements) {
        if (!el.name || el.disabled) continue;
        if (el.type === 'checkbox') out[el.name] = el.checked;
        else if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; }
        else if (el.multiple) out[el.name] = [...el.selectedOptions].map(o => o.value);
        else out[el.name] = el.value.trim();
      }
      return out;
    },

    $(sel, root = document) { return root.querySelector(sel); },
    $$(sel, root = document) { return [...root.querySelectorAll(sel)]; },
  };

  K.util = util;
  /** Waktu "sekarang" untuk data demo: 20 Okt 2026 11:30 WIB. */
  K.NOW = new Date('2026-10-20T11:30:00+07:00').getTime();
})(window.K);
