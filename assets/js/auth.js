/* ==========================================================================
   auth.js — perilaku bersama halaman autentikasi standalone
   (login, register, forgot/reset password, verify email, 2FA, lock screen).
   Tidak membutuhkan app shell; hanya Lucide + core/validate.js.
   Ganti blok "SIMULASI" dengan fetch() ke endpoint backend Anda.
   ========================================================================== */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const icons = () => window.lucide && lucide.createIcons({ attrs: { 'stroke-width': 1.8 } });

  /* ---------- Tema ---------- */
  const themeBtn = $('[data-theme-toggle]');
  const paintTheme = () => { if (themeBtn) { themeBtn.innerHTML = `<i data-lucide="${root.dataset.theme === 'dark' ? 'sun' : 'moon'}"></i>`; themeBtn.setAttribute('aria-label', root.dataset.theme === 'dark' ? 'Gunakan tema terang' : 'Gunakan tema gelap'); icons(); } };
  themeBtn?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('kontrol:theme', JSON.stringify(root.dataset.theme)); } catch (e) { /* abaikan */ }
    paintTheme();
  });

  /* ---------- Tampilkan / sembunyikan kata sandi ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-peek]'); if (!b) return;
    const i = $(b.dataset.peek); i.type = i.type === 'password' ? 'text' : 'password';
    b.innerHTML = `<i data-lucide="${i.type === 'password' ? 'eye' : 'eye-off'}"></i>`; b.setAttribute('aria-label', i.type === 'password' ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi'); icons();
  });

  /* ---------- Meter kekuatan kata sandi ---------- */
  $$('[data-strength]').forEach(input => {
    const meter = $(input.dataset.strength), label = $(input.dataset.strength + '-label');
    input.addEventListener('input', () => {
      const v = input.value; let s = 0;
      if (v.length >= 8) s++; if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++; if (/\d/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v)) s++;
      meter.dataset.score = v ? s : 0;
      if (label) label.textContent = v ? ['Sangat lemah', 'Lemah', 'Cukup', 'Kuat', 'Sangat kuat'][s] : 'Minimal 8 karakter, kombinasikan huruf besar, angka & simbol.';
    });
  });

  /* ---------- OTP 6 digit ---------- */
  const otp = $('.otp');
  if (otp) {
    const boxes = $$('input', otp), hidden = $('[name="code"]');
    const sync = () => { hidden.value = boxes.map(b => b.value).join(''); };
    boxes.forEach((b, i) => {
      b.addEventListener('input', () => { b.value = b.value.replace(/\D/g, '').slice(-1); sync(); if (b.value && boxes[i + 1]) boxes[i + 1].focus(); if (hidden.value.length === boxes.length) b.form.requestSubmit(); });
      b.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && !b.value && boxes[i - 1]) boxes[i - 1].focus();
        if (e.key === 'ArrowLeft' && boxes[i - 1]) boxes[i - 1].focus();
        if (e.key === 'ArrowRight' && boxes[i + 1]) boxes[i + 1].focus();
      });
      b.addEventListener('paste', e => {
        const d = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, boxes.length);
        if (!d) return; e.preventDefault(); d.split('').forEach((c, j) => { boxes[j].value = c; }); sync();
        (boxes[d.length] || boxes[boxes.length - 1]).focus(); if (d.length === boxes.length) b.form.requestSubmit();
      });
    });
  }

  /* ---------- Kirim ulang dengan cooldown ---------- */
  $$('[data-resend]').forEach(btn => btn.addEventListener('click', () => {
    let s = Number(btn.dataset.resend) || 30; const label = btn.textContent;
    btn.disabled = true; note('Kode/tautan baru telah dikirim.', 'success');
    const t = setInterval(() => { btn.textContent = `Kirim ulang dalam ${s--}d`; if (s < 0) { clearInterval(t); btn.disabled = false; btn.textContent = label; } }, 1000);
  }));

  /* ---------- Jam (lock screen) ---------- */
  const clock = $('[data-clock]');
  if (clock) { const tick = () => { const d = new Date(); clock.textContent = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':'); $('[data-date]').textContent = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }); }; tick(); setInterval(tick, 10000); }

  /* ---------- Pesan status di form ---------- */
  function note(text, tone = 'danger') {
    const el = $('[data-note]'); if (!el) return;
    el.hidden = false; el.className = `alert alert--${tone}`; el.querySelector('.alert__text').textContent = text;
  }

  /* ---------- Submit form ---------- */
  $$('form[data-auth]').forEach(form => {
    K.validate.attach(form);
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!K.validate.form(form)) return;
      const btn = $('[type=submit]', form), label = btn.innerHTML;
      btn.disabled = true; btn.textContent = 'Memproses…';
      // ====== SIMULASI — ganti dengan fetch('/api/…') ======
      setTimeout(() => {
        btn.disabled = false; btn.innerHTML = label; icons();
        const a = form.dataset.auth;
        if (a === 'otp' && form.code.value !== '123456') { note('Kode salah atau sudah kedaluwarsa. Gunakan 123456 untuk demo.'); $$('.otp input').forEach(i => { i.value = ''; i.setAttribute('aria-invalid', 'true'); }); $('.otp input').focus(); return; }
        if (a === 'register' && form.email.value.toLowerCase() === 'fadly@kontrol.id') { K.validate.setErrors(form, { email: 'Email sudah terdaftar. Coba masuk.' }); return; }
        const success = $('[data-success]');
        if (success) { form.hidden = true; success.hidden = false; const em = $('[data-email-out]'); if (em && form.email) em.textContent = form.email.value; success.querySelector('a, button')?.focus(); return; }
        location.href = form.dataset.next || 'index.html';
      }, 700);
    });
  });

  paintTheme();
  icons();
})();
