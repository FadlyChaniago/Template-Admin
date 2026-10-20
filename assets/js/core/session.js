/* ==========================================================================
   K.session — kunci layar otomatis saat tidak ada aktivitas.
   Batas idle: K.config.sessionIdleMinutes, atau (bila null) Security Settings
   → "Batas waktu sesi idle". Peringatan muncul K.config.sessionWarnSeconds
   sebelum terkunci. Aktivitas di tab lain ikut dihitung (via localStorage).
   Catatan: ini kenyamanan UI. Masa berlaku sesi tetap WAJIB ditegakkan server.
   ========================================================================== */
(function (K) {
  'use strict';
  const KEY = 'kontrol:lastActivity';
  let timer = null, warnDlg = null, countdown = null;

  const idleMs = () => {
    const m = K.config.sessionIdleMinutes ?? Number(K.store.settings().sessionTimeout || 0);
    return Math.max(0, m) * 60000;
  };
  const now = () => Date.now();
  const last = () => { try { return Number(localStorage.getItem(KEY)) || now(); } catch { return now(); } };
  const touch = K.util.debounce(() => { try { localStorage.setItem(KEY, String(now())); } catch { /* abaikan */ } schedule(); }, 800);

  function lock() {
    clearTimeout(timer); clearInterval(countdown);
    location.href = `${K.config.lockUrl}?next=${encodeURIComponent(location.hash || '#/dashboard')}`;
  }

  function warn() {
    if (warnDlg) return;
    let s = K.config.sessionWarnSeconds;
    const m = K.ui.modal({
      title: K.t('session.title'), size: 'sm',
      body: `<div class="session-warn"><div class="score__ring" data-tone="ok" style="--p:100" data-ring><span data-sec>${s}</span></div><p class="text-secondary" data-text>${K.util.esc(K.t('session.text', { s }))}</p></div>`,
      footer: `<button type="button" class="btn btn-secondary" data-lock>${K.ui.icon('lock')}<span>${K.util.esc(K.t('session.lock'))}</span></button><button type="button" class="btn btn-primary" data-stay>${K.util.esc(K.t('session.stay'))}</button>`,
      onOpen: dlg => {
        dlg.querySelector('[data-stay]').addEventListener('click', () => { dlg.close(); touch(); });
        dlg.querySelector('[data-lock]').addEventListener('click', lock);
        dlg.querySelector('[data-stay]').focus();
      },
    });
    warnDlg = m.dialog;
    warnDlg.addEventListener('close', () => { warnDlg = null; clearInterval(countdown); try { localStorage.setItem(KEY, String(now())); } catch { /* abaikan */ } schedule(); });
    const total = s;
    countdown = setInterval(() => {
      s--;
      if (!warnDlg) return clearInterval(countdown);
      warnDlg.querySelector('[data-sec]').textContent = s;
      warnDlg.querySelector('[data-ring]').style.setProperty('--p', Math.round((s / total) * 100));
      warnDlg.querySelector('[data-text]').textContent = K.t('session.text', { s });
      if (s <= 0) lock();
    }, 1000);
  }

  function schedule() {
    clearTimeout(timer);
    const limit = idleMs(); if (!limit) return;
    const remaining = last() + limit - now();
    const warnAt = remaining - K.config.sessionWarnSeconds * 1000;
    if (remaining <= 0) return lock();
    timer = setTimeout(() => {
      // Periksa ulang: mungkin ada aktivitas di tab lain
      if (last() + limit - now() > K.config.sessionWarnSeconds * 1000 + 500) return schedule();
      warn();
    }, Math.max(0, warnAt));
  }

  K.session = {
    start() {
      try { localStorage.setItem(KEY, String(now())); } catch { /* abaikan */ }
      ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(ev => addEventListener(ev, () => { if (!warnDlg) touch(); }, { passive: true }));
      addEventListener('storage', e => { if (e.key === KEY && warnDlg) warnDlg.close(); });
      K.store.on('change', ({ collection }) => { if (collection === 'settings') schedule(); });
      schedule();
    },
    /** Untuk demo/tes: tampilkan peringatan sekarang. */
    preview: warn,
    lock,
  };
})(window.K);
