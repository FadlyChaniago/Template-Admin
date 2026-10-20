/* ==========================================================================
   Preferences → General Settings, Appearance, Localization, Security Settings
   ========================================================================== */
(function (K) {
  'use strict';
  const { esc, num } = K.util;
  const { icon } = K.ui;
  const S = K.store;

  /** Pasang deteksi "ada perubahan belum disimpan" pada form. */
  function dirtyTracker(form, bar) {
    const snap = () => JSON.stringify(K.util.formData(form));
    let base = snap();
    const check = () => { bar.hidden = snap() === base; };
    form.addEventListener('input', check); form.addEventListener('change', check);
    return { reset() { base = snap(); check(); } };
  }
  const saveBar = id => `<div class="save-bar" id="${id}" hidden><span>${icon('circle-alert')}${esc(K.t('settings.unsaved'))}</span><div class="btn-group"><button type="reset" class="btn btn-ghost btn-sm">${esc(K.t('settings.discard'))}</button><button type="submit" class="btn btn-primary btn-sm" data-perm="settings.update" data-perm-mode="disable">${icon('save')}<span>${esc(K.t('settings.saveChanges'))}</span></button></div></div>`;

  /* ======================= GENERAL SETTINGS ======================= */
  K.page('settings', {
    render(view) {
      const s = S.settings();
      view.innerHTML = `${K.ui.pageHead({ title: K.navLabel('settings'), eyebrow: 'Preferences', desc: esc(K.t('settings.desc')) })}
        <div class="settings-layout">
          <nav class="settings-nav" aria-label="Bagian pengaturan">
            <a href="#sec-workspace" data-scroll>${icon('building-2')}${esc(K.t('settings.nav.workspace'))}</a><a href="#sec-email" data-scroll>${icon('mail')}${esc(K.t('settings.nav.email'))}</a>
            <a href="#sec-data" data-scroll>${icon('database')}${esc(K.t('settings.nav.data'))}</a><a href="#sec-danger" data-scroll>${icon('triangle-alert')}${esc(K.t('settings.nav.danger'))}</a>
          </nav>
          <div class="stack">
            <form class="card" id="st-form" novalidate>
              <section id="sec-workspace">
                <h2 class="card__title">${esc(K.t('settings.workspace'))}</h2><p class="card__desc">${esc(K.t('settings.workspaceDesc'))}</p>
                <div class="mt-5">
                  <div class="form-row"><div class="form-row__label"><span class="label">Logo</span><span class="help">PNG atau SVG persegi, minimal 256px.</span></div>
                    <div class="flex items-center gap-4 wrap"><span class="brand-mark" style="width:56px;height:56px;border-radius:14px" id="st-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:30px;height:30px"><path d="M6 5v14M10 12l8-7M10 12l8 7"/></svg></span>
                    <label class="btn btn-secondary btn-sm" style="cursor:pointer">${icon('upload')}<span>Ganti logo</span><input type="file" accept="image/*" class="sr-only" id="st-logo-input"></label><button type="button" class="btn btn-ghost btn-sm" id="st-logo-reset">Hapus</button></div></div>
                  <div class="form-row"><div class="form-row__label"><label class="label" for="f_workspaceName">Nama workspace</label></div><input class="input" id="f_workspaceName" name="workspaceName" value="${esc(s.workspaceName)}" required></div>
                  <div class="form-row"><div class="form-row__label"><label class="label" for="f_workspaceUrl">URL workspace</label><span class="help">Mengubah URL akan memutus tautan lama.</span></div><div class="flex"><span class="input-addon">app.kontrol.id/</span><input class="input" id="f_workspaceUrl" name="workspaceUrl" value="${esc(s.workspaceUrl)}" required pattern="[a-z0-9\\-]+"></div></div>
                  <div class="form-row"><div class="form-row__label"><label class="label" for="f_supportEmail">Email dukungan</label><span class="help">Ditampilkan di email transaksional.</span></div><input class="input" type="email" id="f_supportEmail" name="supportEmail" value="${esc(s.supportEmail)}" required></div>
                  <div class="form-row"><div class="form-row__label"><label class="label" for="f_industry">Industri</label></div><select class="select" id="f_industry" name="industry">${['Teknologi', 'Keuangan', 'Ritel', 'Logistik', 'Pendidikan', 'Kesehatan', 'Pemerintahan', 'Lainnya'].map(o => `<option ${o === s.industry ? 'selected' : ''}>${o}</option>`).join('')}</select></div>
                </div>
              </section>
              <section id="sec-email" class="mt-6" style="border-top:1px solid var(--border);padding-top:24px">
                <h2 class="card__title">Email workspace</h2><p class="card__desc">Ringkasan dan pembaruan yang dikirim ke admin.</p>
                <div class="stack mt-5" style="gap:16px">
                  ${[['emailDigest', 'Ringkasan harian', 'Aktivitas penting dalam 24 jam terakhir.'], ['weeklyReport', 'Laporan mingguan', 'Metrik utama setiap Senin pagi.'], ['productUpdates', 'Pembaruan produk', 'Fitur baru dan catatan rilis.'], ['securityAlerts', 'Peringatan keamanan', 'Login mencurigakan dan perubahan izin (disarankan aktif).']].map(([n, l, h]) => `<div class="flex items-center justify-between gap-4"><div><p class="fw-500">${l}</p><p class="text-xs text-secondary">${h}</p></div>${K.ui.switchEl({ name: n, checked: s[n], ariaLabel: l })}</div>`).join('')}
                </div>
              </section>
              ${saveBar('st-save')}
            </form>
            <article class="card" id="sec-data"><h2 class="card__title">Data &amp; ekspor</h2><p class="card__desc">Unduh salinan seluruh data workspace atau pulihkan data demo.</p>
              <div class="list mt-4">
                <div class="list-item"><span class="icon-tile">${icon('file-json')}</span><div class="list-item__body"><p class="list-item__title">Ekspor seluruh data (JSON)</p><p class="list-item__sub">Pengguna, konten, pengaturan, dan log.</p></div><button type="button" class="btn btn-secondary btn-sm" id="st-export">${icon('download')}<span>Ekspor</span></button></div>
                <div class="list-item"><span class="icon-tile">${icon('rotate-ccw')}</span><div class="list-item__body"><p class="list-item__title">Pulihkan data demo</p><p class="list-item__sub">Mengembalikan semua data ke kondisi awal (localStorage dibersihkan).</p></div><button type="button" class="btn btn-secondary btn-sm" id="st-reset">${icon('rotate-ccw')}<span>Pulihkan</span></button></div>
              </div></article>
            <article class="card danger-zone" id="sec-danger"><h2 class="card__title">Zona berbahaya</h2><p class="card__desc">Tindakan berikut tidak dapat dibatalkan.</p>
              <div class="list mt-4">
                <div class="list-item"><div class="list-item__body"><p class="list-item__title">Transfer kepemilikan</p><p class="list-item__sub">Pindahkan peran Owner ke anggota lain.</p></div><button type="button" class="btn btn-secondary btn-sm" id="st-transfer">Transfer</button></div>
                <div class="list-item"><div class="list-item__body"><p class="list-item__title">Hapus workspace</p><p class="list-item__sub">Semua data dihapus permanen setelah 30 hari.</p></div><button type="button" class="btn btn-danger btn-sm" id="st-delete">${icon('trash-2')}<span>Hapus workspace</span></button></div>
              </div></article>
          </div>
        </div>`;
      const $ = q => view.querySelector(q);
      const form = $('#st-form');
      const dirty = dirtyTracker(form, $('#st-save'));
      form.addEventListener('reset', () => setTimeout(() => dirty.reset(), 0));
      form.addEventListener('submit', e => {
        e.preventDefault();
        const bad = [...form.querySelectorAll('[required]')].find(el => !el.checkValidity());
        form.querySelectorAll('[required]').forEach(el => el.setAttribute('aria-invalid', !el.checkValidity()));
        if (bad) { bad.focus(); K.ui.toast('Periksa kembali isian', bad.validationMessage, 'error'); return; }
        S.saveSettings(K.util.formData(form)); S.audit('settings.update', 'Mengubah pengaturan umum', 'Workspace', 'warning');
        dirty.reset(); K.ui.toast(K.t('settings.saved'));
      });
      $('#st-logo-input').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; $('#st-logo').innerHTML = `<img src="${URL.createObjectURL(f)}" alt="Logo workspace" style="width:100%;height:100%;object-fit:cover;border-radius:14px">`; $('#st-logo').style.background = 'transparent'; K.ui.toast('Logo diperbarui', 'Pratinjau lokal (demo).'); });
      $('#st-logo-reset').addEventListener('click', () => K.router.render());
      view.querySelectorAll('[data-scroll]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); view.querySelector(a.getAttribute('href')).scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
      $('#st-export').addEventListener('click', () => {
        const dump = {}; ['users', 'teams', 'organizations', 'roles', 'pages', 'categories', 'tags', 'applications', 'webhooks', 'reports', 'auditLogs'].forEach(k => { dump[k] = S.all(k); });
        dump.settings = S.settings();
        K.util.downloadFile(`kontrol-export-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(dump, null, 2), 'application/json');
        K.ui.toast('Ekspor selesai', 'File JSON telah diunduh.');
      });
      $('#st-reset').addEventListener('click', () => K.ui.confirm({ title: 'Pulihkan data demo?', text: 'Semua perubahan yang Anda buat akan hilang.', confirmLabel: 'Pulihkan' }).then(ok => { if (ok) { S.reset(); K.ui.toast('Data demo dipulihkan'); K.router.render(); } }));
      $('#st-transfer').addEventListener('click', () => K.ui.modal({
        title: 'Transfer kepemilikan', desc: 'Anda akan menjadi Workspace Admin setelah transfer.',
        body: K.ui.field({ name: 'to', label: 'Owner baru', type: 'select', options: S.find('users', u => u.status === 'active' && u.id !== 'usr_me').map(u => [u.id, `${u.name} — ${u.email}`]) }),
        submitLabel: 'Transfer', danger: true, onSubmit: d => K.ui.toast('Permintaan transfer dikirim', 'Menunggu konfirmasi dari ' + K.lookup.user(d.to).name, 'info'),
      }));
      $('#st-delete').addEventListener('click', () => K.ui.modal({
        title: 'Hapus workspace?', size: 'sm',
        body: `<p class="text-secondary text-sm">Ketik <strong>${esc(s.workspaceName)}</strong> untuk konfirmasi.</p><input class="input" name="confirm" aria-label="Ketik nama workspace" autocomplete="off">`,
        submitLabel: 'Hapus permanen', danger: true,
        onOpen: dlg => { const btn = dlg.querySelector('[type=submit]'); btn.disabled = true; dlg.querySelector('[name=confirm]').addEventListener('input', e => { btn.disabled = e.target.value !== s.workspaceName; }); },
        onSubmit: () => K.ui.toast('Demo: workspace tidak benar-benar dihapus', 'Di produksi, aksi ini memerlukan verifikasi ulang & 2FA.', 'warning', 5000),
      }));
    },
  });

  /* ======================= APPEARANCE ======================= */
  K.page('appearance', {
    render(view) {
      const theme = K.theme.pref();
      const density = K.prefs.get('kontrol:density', 'default');
      const sidebar = K.prefs.get('kontrol:sidebar', 'expanded');
      const preview = mode => `<span class="theme-preview theme-preview--${mode}" aria-hidden="true"><span class="tp-side"></span><span class="tp-main"><span class="tp-bar"></span><span class="tp-card"></span><span class="tp-card tp-card--sm"></span></span></span>`;
      view.innerHTML = `${K.ui.pageHead({ title: 'Appearance', eyebrow: 'Preferences', desc: 'Sesuaikan tampilan antarmuka. Disimpan di browser ini dan langsung diterapkan.' })}
        <div class="stack">
          <article class="card"><h2 class="card__title">Tema</h2><p class="card__desc">Mode gelap memakai palet khusus, bukan sekadar inversi warna.</p>
            <div class="choice-grid mt-5" role="radiogroup" aria-label="Tema">${[['light', 'Terang', 'Latar putih, kontras tinggi'], ['dark', 'Gelap', 'Nyaman untuk malam hari'], ['system', 'Ikuti sistem', 'Mengikuti pengaturan OS']].map(([v, l, d]) => `<label class="choice"><input type="radio" name="theme" value="${v}" ${theme === v ? 'checked' : ''}>${v === 'system' ? `<span class="theme-split">${preview('light')}${preview('dark')}</span>` : preview(v)}<span class="choice__title">${l}</span><span class="choice__desc">${d}</span></label>`).join('')}</div>
          </article>
          <article class="card"><h2 class="card__title">Kepadatan</h2><p class="card__desc">Atur ukuran teks dan jarak antar elemen.</p>
            <div class="choice-grid mt-5" role="radiogroup" aria-label="Kepadatan">${[['compact', 'Rapat', 'Lebih banyak data per layar', 'rows-4'], ['default', 'Standar', 'Seimbang (disarankan)', 'rows-3'], ['comfortable', 'Lega', 'Teks lebih besar', 'rows-2']].map(([v, l, d, ic]) => `<label class="choice"><input type="radio" name="density" value="${v}" ${density === v ? 'checked' : ''}><span class="icon-tile">${icon(ic)}</span><span class="choice__title">${l}</span><span class="choice__desc">${d}</span></label>`).join('')}</div>
          </article>
          <article class="card"><h2 class="card__title">Tata letak navigasi</h2><p class="card__desc">Pilih menu di sisi kiri atau di bagian atas (desktop). Di layar kecil keduanya memakai drawer.</p>
            <div class="choice-grid mt-5" role="radiogroup" aria-label="Tata letak navigasi">${[['sidebar', 'Sidebar kiri', 'Cocok untuk banyak modul'], ['topnav', 'Navigasi atas', 'Area konten lebih lebar']].map(([v, l, d]) => `<label class="choice"><input type="radio" name="layout" value="${v}" ${K.layout.get() === v ? 'checked' : ''}><span class="layout-preview layout-preview--${v}" aria-hidden="true"><span class="lp-nav"></span><span class="lp-body"><span></span><span></span></span></span><span class="choice__title">${l}</span><span class="choice__desc">${d}</span></label>`).join('')}</div>
          </article>
          <article class="card"><h2 class="card__title">Sidebar</h2><p class="card__desc">Kondisi default sidebar di layar desktop (≥1024px).</p>
            <div class="choice-grid mt-5" role="radiogroup" aria-label="Sidebar">${[['expanded', 'Terbuka', 'Label menu terlihat (256px)', 'panel-left-open'], ['collapsed', 'Ciut', 'Hanya ikon (72px) + tooltip', 'panel-left-close']].map(([v, l, d, ic]) => `<label class="choice"><input type="radio" name="sidebar" value="${v}" ${sidebar === v ? 'checked' : ''}><span class="icon-tile">${icon(ic)}</span><span class="choice__title">${l}</span><span class="choice__desc">${d}</span></label>`).join('')}</div>
          </article>
          <article class="card"><h2 class="card__title">Pintasan keyboard</h2><p class="card__desc">Navigasi lebih cepat tanpa mouse.</p>
            <dl class="dl mt-4"><dt><kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>K</kbd></dt><dd>Buka pencarian &amp; perintah</dd><dt><kbd>/</kbd></dt><dd>Buka pencarian</dd><dt><kbd>Esc</kbd></dt><dd>Tutup dialog, menu, atau drawer</dd><dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>Pindah tab di dalam grup tab</dd></dl>
          </article>
        </div>`;
      view.addEventListener('change', e => {
        const t = e.target;
        if (t.name === 'theme') { K.theme.set(t.value); K.ui.toast('Tema diterapkan', t.parentElement.querySelector('.choice__title').textContent, 'success', 1800); }
        if (t.name === 'density') { K.prefs.set('kontrol:density', t.value); document.documentElement.dataset.density = t.value; K.ui.toast('Kepadatan diterapkan', '', 'success', 1800); }
        if (t.name === 'layout') { K.layout.set(t.value); K.ui.toast('Tata letak diterapkan', t.value === 'topnav' ? 'Navigasi atas' : 'Sidebar kiri', 'success', 1800); }
        if (t.name === 'sidebar') { K.prefs.set('kontrol:sidebar', t.value); const app = document.getElementById('app'); if (app.dataset.sidebar !== t.value) document.getElementById('sidebar-toggle').click(); }
      });
    },
  });

  /* ======================= LOCALIZATION ======================= */
  K.page('localization', {
    render(view) {
      const s = S.settings();
      const tz = [['Asia/Jakarta', 'WIB — Asia/Jakarta (UTC+7)'], ['Asia/Makassar', 'WITA — Asia/Makassar (UTC+8)'], ['Asia/Jayapura', 'WIT — Asia/Jayapura (UTC+9)'], ['Asia/Singapore', 'Asia/Singapore (UTC+8)'], ['UTC', 'UTC']];
      view.innerHTML = `${K.ui.pageHead({ title: 'Localization', eyebrow: 'Preferences', desc: 'Bahasa, zona waktu, mata uang, dan format tampilan data.' })}
        <div class="grid grid-main-side">
          <form class="card" id="lc-form" novalidate>
            <h2 class="card__title">Regional</h2><p class="card__desc">Berlaku untuk seluruh anggota workspace.</p>
            <div class="form-grid mt-5">
              ${K.ui.field({ name: 'language', label: 'Bahasa antarmuka', type: 'select', value: K.i18n.lang, options: [['id', 'Bahasa Indonesia'], ['en', 'English']], help: 'Berlaku untuk browser ini. Cakupan terjemahan: shell, komponen inti, Dashboard, Users, Settings, halaman error.' })}
              ${K.ui.field({ name: 'timezone', label: 'Zona waktu', type: 'select', value: s.timezone, options: tz })}
              ${K.ui.field({ name: 'currency', label: 'Mata uang', type: 'select', value: s.currency, options: [['IDR', 'IDR — Rupiah'], ['USD', 'USD — US Dollar'], ['SGD', 'SGD — Singapore Dollar'], ['MYR', 'MYR — Ringgit']] })}
              ${K.ui.field({ name: 'numberFormat', label: 'Format angka', type: 'select', value: s.numberFormat, options: [['id-ID', '1.234.567,89'], ['en-US', '1,234,567.89']] })}
              ${K.ui.field({ name: 'dateFormat', label: 'Format tanggal', type: 'select', value: s.dateFormat, options: [['DD/MM/YYYY', 'DD/MM/YYYY'], ['YYYY-MM-DD', 'YYYY-MM-DD (ISO)'], ['D MMM YYYY', 'D MMM YYYY']] })}
              ${K.ui.field({ name: 'timeFormat', label: 'Format waktu', type: 'select', value: s.timeFormat, options: [['24h', '24 jam (14:30)'], ['12h', '12 jam (2:30 PM)']] })}
              ${K.ui.field({ name: 'weekStart', label: 'Awal minggu', type: 'select', value: s.weekStart, options: [['monday', 'Senin'], ['sunday', 'Minggu']] })}
            </div>
            ${saveBar('lc-save')}
          </form>
          <article class="card"><h2 class="card__title">Pratinjau</h2><p class="card__desc">Tampilan data dengan pengaturan saat ini.</p><dl class="dl mt-5" id="lc-preview"></dl>
            <div class="alert alert--info mt-5">${icon('languages')}<div><p class="alert__title">Terjemahan</p><p class="alert__text">String antarmuka disiapkan untuk i18n. Tambahkan berkas bahasa di <code class="inline-code">assets/js/i18n/</code> saat diperlukan.</p></div></div></article>
        </div>`;
      const $ = q => view.querySelector(q);
      const form = $('#lc-form');
      const preview = () => {
        const d = K.util.formData(form);
        const now = new Date(K.NOW);
        const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: d.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now).map(p => [p.type, p.value]));
        const date = d.dateFormat === 'YYYY-MM-DD' ? `${parts.year}-${parts.month}-${parts.day}` : d.dateFormat === 'DD/MM/YYYY' ? `${parts.day}/${parts.month}/${parts.year}` : now.toLocaleDateString(d.language === 'en' ? 'en-GB' : 'id-ID', { timeZone: d.timezone, day: 'numeric', month: 'short', year: 'numeric' });
        const time = now.toLocaleTimeString(d.timeFormat === '12h' ? 'en-US' : 'en-GB', { timeZone: d.timezone, hour: '2-digit', minute: '2-digit', hour12: d.timeFormat === '12h' });
        const money = new Intl.NumberFormat(d.numberFormat, { style: 'currency', currency: d.currency, maximumFractionDigits: d.currency === 'IDR' ? 0 : 2 }).format(d.currency === 'IDR' ? 128450000 : 8234.5);
        $('#lc-preview').innerHTML = `<dt>Tanggal</dt><dd>${esc(date)}</dd><dt>Waktu</dt><dd>${esc(time)}</dd><dt>Mata uang</dt><dd class="tabular">${esc(money)}</dd><dt>Angka</dt><dd class="tabular">${esc(new Intl.NumberFormat(d.numberFormat, { minimumFractionDigits: 2 }).format(1234567.89))}</dd><dt>Persentase</dt><dd class="tabular">${esc(new Intl.NumberFormat(d.numberFormat, { style: 'percent', minimumFractionDigits: 1 }).format(0.0362))}</dd><dt>Awal minggu</dt><dd>${d.weekStart === 'monday' ? 'Senin' : 'Minggu'}</dd>`;
      };
      const dirty = dirtyTracker(form, $('#lc-save'));
      form.addEventListener('change', preview);
      form.addEventListener('reset', () => setTimeout(() => { dirty.reset(); preview(); }, 0));
      form.addEventListener('submit', e => { e.preventDefault(); const d = K.util.formData(form); S.saveSettings(d); S.audit('settings.update', 'Mengubah lokalisasi', 'Localization', 'info'); dirty.reset(); K.ui.toast(d.language === 'en' ? 'Regional settings saved' : 'Pengaturan regional disimpan'); if (d.language !== K.i18n.lang) setTimeout(() => K.i18n.set(d.language), 300); });
      preview();
    },
  });

  /* ======================= SECURITY SETTINGS ======================= */
  K.page('security', {
    render(view) {
      const s = S.settings();
      const users = S.all('users');
      const twofaPct = Math.round((users.filter(u => u.twoFA).length / users.length) * 100);
      const score = () => {
        const v = S.settings();
        let sc = 40; if (v.enforce2FA) sc += 25; if (v.passwordMinLength >= 12) sc += 10; if (v.requireSymbols) sc += 5; if (v.sessionTimeout <= 60) sc += 10; if (v.ipAllowlist) sc += 5; if (v.ssoEnabled) sc += 5; return Math.min(100, sc);
      };
      view.innerHTML = `${K.ui.pageHead({ title: 'Security Settings', eyebrow: 'Preferences', desc: 'Kebijakan autentikasi, sesi, dan kontrol akses jaringan.' })}
        <div class="grid grid-main-side">
          <form class="card" id="sc-form" novalidate>
            <h2 class="card__title">Kebijakan autentikasi</h2><p class="card__desc">Berlaku untuk semua anggota workspace.</p>
            <div class="mt-5">
              <div class="form-row"><div class="form-row__label"><span class="label">Wajibkan 2FA</span><span class="help">Anggota tanpa 2FA diminta mengaktifkannya saat login berikutnya. Cakupan saat ini ${twofaPct}%.</span></div>${K.ui.switchEl({ name: 'enforce2FA', checked: s.enforce2FA, label: 'Aktif untuk semua peran' })}</div>
              <div class="form-row"><div class="form-row__label"><label class="label" for="f_passwordMinLength">Panjang kata sandi minimum</label><span class="help">NIST menyarankan minimal 8; kami sarankan 12+.</span></div><div><input class="range" type="range" min="8" max="24" id="f_passwordMinLength" name="passwordMinLength" value="${s.passwordMinLength}"><p class="text-sm fw-600 mt-1"><span data-pwlen>${s.passwordMinLength}</span> karakter</p></div></div>
              <div class="form-row"><div class="form-row__label"><span class="label">Kompleksitas</span></div>${K.ui.switchEl({ name: 'requireSymbols', checked: s.requireSymbols, label: 'Wajib angka & simbol' })}</div>
              <div class="form-row"><div class="form-row__label"><label class="label" for="f_sessionTimeout">Batas waktu sesi idle</label><span class="help">Setelah idle, layar dikunci (peringatan 60 detik sebelumnya).</span></div><div><select class="select" id="f_sessionTimeout" name="sessionTimeout">${[[15, '15 menit'], [30, '30 menit'], [60, '1 jam'], [240, '4 jam'], [1440, '24 jam']].map(([v, l]) => `<option value="${v}" ${+s.sessionTimeout === v ? 'selected' : ''}>${l}</option>`).join('')}</select><button type="button" class="btn btn-ghost btn-sm mt-2" onclick="K.session.preview()">${icon('timer')}<span>Coba peringatan sesi</span></button></div></div>
              <div class="form-row"><div class="form-row__label"><label class="label" for="f_ipAllowlist">IP allowlist</label><span class="help">Satu CIDR per baris. Kosongkan untuk mengizinkan semua IP.</span></div><textarea class="textarea mono" id="f_ipAllowlist" name="ipAllowlist" placeholder="103.28.12.0/24&#10;36.84.51.207/32" style="min-height:84px">${esc(s.ipAllowlist)}</textarea></div>
              <div class="form-row"><div class="form-row__label"><span class="label">Single Sign-On (SAML / OIDC)</span><span class="help">Gunakan IdP perusahaan Anda.</span></div><div class="stack" style="gap:10px">${K.ui.switchEl({ name: 'ssoEnabled', checked: s.ssoEnabled, label: 'Aktifkan SSO' })}<input class="input" name="ssoUrl" type="url" placeholder="https://idp.perusahaan.id/saml/metadata" value="${esc(s.ssoUrl || '')}" aria-label="URL metadata IdP"></div></div>
            </div>
            ${saveBar('sc-save')}
          </form>
          <div class="stack">
            <article class="card"><h2 class="card__title">Skor keamanan</h2><p class="card__desc">Berdasarkan kebijakan aktif.</p>
              <div class="score mt-4"><div class="score__ring" id="sc-ring"><span id="sc-val"></span></div><ul class="score__list text-sm" id="sc-tips"></ul></div></article>
            <article class="card"><div class="card__head"><div><h2 class="card__title">Sesi aktif</h2><p class="card__desc">Perangkat yang sedang login ke akun Anda.</p></div><button type="button" class="btn btn-danger-ghost btn-sm" id="sc-revoke-all">Keluar dari semua</button></div><div class="list mt-4" id="sc-sessions"></div></article>
          </div>
        </div>`;
      const $ = q => view.querySelector(q);
      const form = $('#sc-form');
      const drawScore = () => {
        const v = score(), st = S.settings();
        $('#sc-ring').style.setProperty('--p', v);
        $('#sc-ring').dataset.tone = v >= 80 ? 'good' : v >= 60 ? 'ok' : 'bad';
        $('#sc-val').innerHTML = `${v}<small>/100</small>`;
        $('#sc-tips').innerHTML = [[st.enforce2FA, 'Wajibkan 2FA'], [st.passwordMinLength >= 12, 'Kata sandi ≥ 12 karakter'], [st.sessionTimeout <= 60, 'Sesi idle ≤ 1 jam'], [!!st.ipAllowlist, 'IP allowlist dikonfigurasi'], [st.ssoEnabled, 'SSO aktif']].map(([ok, t]) => `<li>${icon(ok ? 'circle-check' : 'circle', ok ? 'text-success' : 'text-muted')}<span class="${ok ? '' : 'text-secondary'}">${t}</span></li>`).join('');
      };
      const drawSessions = () => {
        $('#sc-sessions').innerHTML = S.all('sessions').map(x => `<div class="list-item"><span class="icon-tile">${icon(x.icon)}</span><div class="list-item__body"><p class="list-item__title">${esc(x.device)} ${x.current ? '<span class="badge badge--success" style="margin-left:4px">Sesi ini</span>' : ''}</p><p class="list-item__sub">${esc(x.location)} · ${esc(x.ip)} · ${x.current ? 'aktif sekarang' : K.util.ago(x.lastActive)}</p></div>${x.current ? '' : `<button type="button" class="btn btn-danger-ghost btn-sm" data-revoke="${x.id}">Cabut</button>`}</div>`).join('');
      };
      const dirty = dirtyTracker(form, $('#sc-save'));
      form.passwordMinLength.addEventListener('input', e => { view.querySelector('[data-pwlen]').textContent = e.target.value; });
      form.addEventListener('reset', () => setTimeout(() => { dirty.reset(); view.querySelector('[data-pwlen]').textContent = form.passwordMinLength.value; }, 0));
      form.addEventListener('submit', e => {
        e.preventDefault();
        const d = K.util.formData(form);
        const bad = d.ipAllowlist.split('\n').map(l => l.trim()).filter(Boolean).find(l => !/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(l));
        if (bad) { form.ipAllowlist.setAttribute('aria-invalid', 'true'); K.ui.toast('Format IP tidak valid', bad, 'error'); return; }
        form.ipAllowlist.removeAttribute('aria-invalid');
        if (d.ssoEnabled && !/^https:\/\//.test(d.ssoUrl)) { K.ui.toast('URL metadata IdP wajib HTTPS', '', 'error'); form.ssoUrl.focus(); return; }
        S.saveSettings({ ...d, passwordMinLength: +d.passwordMinLength, sessionTimeout: +d.sessionTimeout });
        S.audit('settings.update', 'Mengubah kebijakan keamanan', 'Security', 'warning', 'Security');
        dirty.reset(); drawScore(); K.ui.toast('Kebijakan keamanan disimpan');
      });
      view.addEventListener('click', e => {
        const r = e.target.closest('[data-revoke]'); if (r) { S.remove('sessions', r.dataset.revoke); drawSessions(); K.ui.toast('Sesi dicabut', '', 'warning'); }
      });
      $('#sc-revoke-all').addEventListener('click', () => K.ui.confirm({ title: 'Keluar dari semua perangkat lain?', confirmLabel: 'Keluar dari semua' }).then(ok => { if (ok) { S.remove('sessions', S.find('sessions', x => !x.current).map(x => x.id)); drawSessions(); K.ui.toast('Semua sesi lain dicabut', '', 'warning'); } }));
      drawScore(); drawSessions();
    },
  });
})(window.K);
