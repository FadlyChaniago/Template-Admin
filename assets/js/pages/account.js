/* ==========================================================================
   Akun → User Profile, Account Settings, Upgrade Plan (billing)
   ========================================================================== */
(function (K) {
  'use strict';
  const { esc, num, idr } = K.util;
  const { icon } = K.ui;
  const S = K.store;

  /* ======================= USER PROFILE ======================= */
  K.page('profile', {
    render(view) {
      const me = K.currentUser();
      const role = K.lookup.role(me.roleId);
      const myTeams = S.find('teams', t => t.members.includes(me.id) || t.lead === me.id);
      const myAudit = S.find('auditLogs', l => l.actorId === me.id).slice(0, 6);
      view.innerHTML = `
        <section class="profile-head card card--flush">
          <div class="profile-head__cover" aria-hidden="true"></div>
          <div class="profile-head__body">
            <span class="avatar avatar--xl profile-head__avatar" data-c="blue">${esc(K.util.initials(me.name))}</span>
            <div class="flex-1" style="min-width:200px"><h1 id="page-title" tabindex="-1" style="font-size:24px;letter-spacing:-0.6px">${esc(me.name)}</h1><p class="text-secondary text-sm mt-1">${esc(me.title || role.name)} · ${esc(me.team)} · ${esc(me.location || 'Indonesia')}</p></div>
            <div class="btn-group"><a href="#/account" class="btn btn-secondary btn-sm">${icon('settings')}<span>Pengaturan akun</span></a></div>
          </div>
        </section>
        <div class="grid grid-main-side mt-4">
          <form class="card" id="pf-form" novalidate>
            <h2 class="card__title">Informasi pribadi</h2><p class="card__desc">Ditampilkan kepada anggota workspace lain.</p>
            <div class="form-grid mt-5">
              ${K.ui.field({ name: 'name', label: 'Nama lengkap', required: true, value: me.name })}
              ${K.ui.field({ name: 'title', label: 'Jabatan', value: me.title })}
              ${K.ui.field({ name: 'email', label: 'Email', type: 'email', value: me.email, help: 'Ubah email di Account Settings.', attrs: 'disabled' })}
              ${K.ui.field({ name: 'phone', label: 'Telepon', type: 'tel', value: me.phone, placeholder: '+62' })}
              ${K.ui.field({ name: 'location', label: 'Lokasi', value: me.location })}
              ${K.ui.field({ name: 'team', label: 'Tim', type: 'select', value: me.team, options: S.all('teams').map(t => [t.name, t.name]) })}
              ${K.ui.field({ name: 'bio', label: 'Bio', type: 'textarea', value: me.bio || 'Mengelola operasional workspace dan otomasi internal.', span: true, help: 'Maks 280 karakter.' })}
            </div>
            <div class="flex justify-between items-center mt-5 wrap gap-3"><span class="text-xs text-secondary">Bergabung ${K.util.date(me.createdAt)}</span><button type="submit" class="btn btn-primary btn-sm">${icon('save')}<span>Simpan profil</span></button></div>
          </form>
          <div class="stack">
            <article class="card"><h2 class="card__title">Ringkasan</h2>
              <div class="grid grid-2 mt-4" style="gap:12px">${[['Halaman ditulis', S.count('pages', p => p.authorId === me.id), 'file-text'], ['Laporan dimiliki', S.count('reports', r => r.ownerId === me.id), 'file-chart-column'], ['Tim', myTeams.length, 'users'], ['Izin peran', role.permissions.length, 'key-round']].map(([l, v, ic]) => `<div class="mini-stat"><span class="text-muted">${icon(ic, 'i-16')}</span><p class="stat-inline__value">${num(v)}</p><p class="text-xs text-secondary">${l}</p></div>`).join('')}</div></article>
            <article class="card"><h2 class="card__title">Tim saya</h2><div class="list mt-4">${myTeams.map(t => `<div class="list-item"><span class="avatar avatar--square" data-c="${t.color}">${esc(K.util.initials(t.name))}</span><div class="list-item__body"><p class="list-item__title">${esc(t.name)}</p><p class="list-item__sub">${t.members.length} anggota</p></div>${t.lead === me.id ? '<span class="badge badge--info">Lead</span>' : ''}</div>`).join('') || '<p class="text-secondary text-sm">Belum tergabung di tim.</p>'}</div></article>
            <article class="card"><h2 class="card__title">Aktivitas saya</h2><div class="timeline mt-4">${myAudit.map(l => `<div class="timeline-item"><span class="timeline-item__icon">${icon('history')}</span><div class="timeline-item__body"><p class="fw-500">${esc(l.label)}</p><p class="timeline-item__time">${esc(l.resource)} · ${K.util.ago(l.createdAt)}</p></div></div>`).join('') || '<p class="text-secondary text-sm">Belum ada aktivitas.</p>'}</div></article>
          </div>
        </div>`;
      view.querySelector('#pf-form').addEventListener('submit', e => {
        e.preventDefault();
        const d = K.util.formData(e.target);
        if (!d.name) { e.target.name.setAttribute('aria-invalid', 'true'); e.target.name.focus(); return; }
        if (d.bio.length > 280) { K.ui.toast('Bio terlalu panjang', `${d.bio.length}/280 karakter`, 'error'); return; }
        S.update('users', me.id, d);
        document.querySelectorAll('[data-me-name]').forEach(el => { el.textContent = d.name; });
        document.querySelectorAll('[data-me-avatar]').forEach(el => { el.textContent = K.util.initials(d.name); });
        K.ui.toast('Profil disimpan'); K.router.render();
      });
    },
  });

  /* ======================= ACCOUNT SETTINGS ======================= */
  K.page('account', {
    render(view) {
      const me = K.currentUser();
      view.innerHTML = `${K.ui.pageHead({ title: 'Account Settings', eyebrow: 'Akun', desc: 'Email, kata sandi, autentikasi dua faktor, dan preferensi pribadi.' })}
        <div class="stack">
          <form class="card" id="ac-email" novalidate>
            <div class="form-row"><div class="form-row__label"><span class="label">Alamat email</span><span class="help">Email login dan penerima notifikasi.</span></div>
              <div class="stack" style="gap:10px"><div class="flex items-center gap-2 wrap"><span class="fw-500">${esc(me.email)}</span><span class="badge badge--success">Terverifikasi</span></div>
              <div class="flex gap-2 wrap"><input class="input flex-1" type="email" name="email" placeholder="Email baru" aria-label="Email baru" style="min-width:200px" required><button type="submit" class="btn btn-secondary">Kirim verifikasi</button></div></div></div>
          </form>
          <form class="card" id="ac-pass" novalidate>
            <div class="form-row"><div class="form-row__label"><span class="label">Kata sandi</span><span class="help">Terakhir diubah 64 hari lalu. Minimal ${S.settings().passwordMinLength} karakter.</span></div>
              <div class="stack" style="gap:12px">
                ${K.ui.field({ name: 'current', label: 'Kata sandi saat ini', type: 'password', required: true, attrs: 'autocomplete="current-password"' })}
                <div class="field"><label class="label" for="f_new">Kata sandi baru<span class="req" aria-hidden="true">*</span></label><div class="input-icon"><input class="input" type="password" id="f_new" name="new" required autocomplete="new-password" aria-describedby="pw-meter-label" style="padding-right:44px"><span class="input-suffix">${K.ui.iconBtn('eye', 'Tampilkan kata sandi', 'data-peek')}</span></div>
                  <div class="pw-meter" aria-hidden="true"><span></span><span></span><span></span><span></span></div><p class="help" id="pw-meter-label">Gunakan kombinasi huruf besar, angka, dan simbol.</p></div>
                ${K.ui.field({ name: 'confirm', label: 'Ulangi kata sandi baru', type: 'password', required: true, attrs: 'autocomplete="new-password"' })}
                <div><button type="submit" class="btn btn-primary">${icon('lock')}<span>Ubah kata sandi</span></button></div>
              </div></div>
          </form>
          <article class="card">
            <div class="form-row"><div class="form-row__label"><span class="label">Autentikasi dua faktor (2FA)</span><span class="help">Lindungi akun dengan kode dari aplikasi authenticator.</span></div>
              <div id="ac-2fa"></div></div>
          </article>
          <article class="card">
            <div class="form-row"><div class="form-row__label"><span class="label">Akun terhubung</span><span class="help">Login cepat dengan penyedia identitas.</span></div>
              <div class="list">${[['Google Workspace', 'globe', true], ['Microsoft', 'square', false], ['GitHub', 'git-branch', false]].map(([n, ic, on]) => `<div class="list-item"><span class="icon-tile">${icon(ic)}</span><div class="list-item__body"><p class="list-item__title">${n}</p><p class="list-item__sub">${on ? esc(me.email) : 'Belum terhubung'}</p></div><button type="button" class="btn ${on ? 'btn-danger-ghost' : 'btn-secondary'} btn-sm" data-sso="${n}">${on ? 'Putuskan' : 'Hubungkan'}</button></div>`).join('')}</div></div>
          </article>
          <article class="card danger-zone">
            <div class="form-row"><div class="form-row__label"><span class="label">Hapus akun</span><span class="help">Akun Anda dihapus dari semua workspace. Konten tetap milik workspace.</span></div><div><button type="button" class="btn btn-danger btn-sm" id="ac-del">${icon('user-x')}<span>Hapus akun saya</span></button></div></div>
          </article>
        </div>`;
      const $ = q => view.querySelector(q);

      const draw2FA = () => {
        const on = K.currentUser().twoFA;
        $('#ac-2fa').innerHTML = on
          ? `<div class="flex items-center gap-3 wrap"><span class="icon-tile icon-tile--success">${icon('shield-check')}</span><div class="flex-1"><p class="fw-600">2FA aktif</p><p class="text-xs text-secondary">Aplikasi authenticator · 8 kode cadangan tersisa</p></div><button type="button" class="btn btn-secondary btn-sm" data-codes>Kode cadangan</button><button type="button" class="btn btn-danger-ghost btn-sm" data-2fa-off>Nonaktifkan</button></div>`
          : `<div class="flex items-center gap-3 wrap"><span class="icon-tile icon-tile--warning">${icon('shield-off')}</span><div class="flex-1"><p class="fw-600">2FA belum aktif</p><p class="text-xs text-secondary">Sangat disarankan untuk akun admin.</p></div><button type="button" class="btn btn-primary btn-sm" data-2fa-on>${icon('shield-check')}<span>Aktifkan 2FA</span></button></div>`;
      };
      const qr = () => {
        // Pola QR dekoratif (bukan QR sungguhan) — di produksi gunakan secret TOTP dari server
        const r = K.util.rng(42); let cells = '';
        const inFinder = (x, y) => (x < 8 && y < 8) || (x > 16 && y < 8) || (x < 8 && y > 16);
        for (let y = 0; y < 25; y++) for (let x = 0; x < 25; x++) if (!inFinder(x, y) && r() > 0.52) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
        const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
        return `<svg viewBox="-1 -1 27 27" class="qr" role="img" aria-label="Kode QR untuk aplikasi authenticator (contoh)"><rect x="-1" y="-1" width="27" height="27" fill="#fff"/><g fill="#0F172A">${cells}${finder(0, 0)}${finder(18, 0)}${finder(0, 18)}</g></svg>`;
      };
      const backupCodes = () => Array.from({ length: 8 }, () => [...crypto.getRandomValues(new Uint8Array(4))].map(b => b.toString(36).padStart(2, '0')).join('').slice(0, 4) + '-' + Math.floor(1000 + Math.random() * 9000));

      view.addEventListener('click', e => {
        if (e.target.closest('[data-2fa-on]')) K.ui.modal({
          title: 'Aktifkan 2FA', desc: 'Pindai kode QR lalu masukkan 6 digit dari aplikasi authenticator.',
          body: `<div class="flex gap-4 wrap items-center">${qr()}<div class="flex-1 stack" style="gap:10px;min-width:200px"><p class="text-sm">Atau masukkan kunci manual:</p><code class="inline-code" style="word-break:break-all">KNTR L4X2 9QWE 7MZP</code>${K.ui.field({ name: 'code', label: 'Kode verifikasi', required: true, placeholder: '123456', attrs: 'inputmode="numeric" pattern="\\d{6}" maxlength="6" autocomplete="one-time-code"' })}</div></div>`,
          submitLabel: 'Verifikasi & aktifkan',
          onSubmit: d => {
            if (!/^\d{6}$/.test(d.code)) { K.ui.toast('Kode harus 6 digit angka', '', 'error'); return false; }
            S.update('users', me.id, { twoFA: true }); S.audit('security.2fa_enabled', 'Mengaktifkan 2FA', me.name, 'info', 'Security'); draw2FA();
            setTimeout(() => showCodes(), 150);
          },
        });
        if (e.target.closest('[data-codes]')) showCodes();
        if (e.target.closest('[data-2fa-off]')) K.ui.confirm({ title: 'Nonaktifkan 2FA?', text: 'Akun Anda akan lebih rentan terhadap pengambilalihan.', confirmLabel: 'Nonaktifkan' }).then(ok => { if (ok) { S.update('users', me.id, { twoFA: false }); draw2FA(); K.ui.toast('2FA dinonaktifkan', '', 'warning'); } });
        const sso = e.target.closest('[data-sso]'); if (sso) K.ui.toast(sso.textContent.trim() === 'Hubungkan' ? 'Mengalihkan ke ' + sso.dataset.sso + '…' : sso.dataset.sso + ' diputus', 'Demo: alur OAuth disimulasikan.', 'info');
        const peek = e.target.closest('[data-peek]'); if (peek) { const i = $('#f_new'); i.type = i.type === 'password' ? 'text' : 'password'; }
      });
      function showCodes() {
        const codes = backupCodes();
        K.ui.modal({
          title: 'Kode cadangan', desc: 'Setiap kode hanya bisa dipakai sekali. Simpan di tempat aman.', size: 'sm',
          body: `<div class="backup-codes">${codes.map(c => `<code>${c}</code>`).join('')}</div>`,
          footer: `<button type="button" class="btn btn-secondary" data-dl>${icon('download')}<span>Unduh</span></button><button type="button" class="btn btn-primary" data-dismiss>Selesai</button>`,
          onOpen: dlg => dlg.querySelector('[data-dl]').addEventListener('click', () => K.util.downloadFile('kontrol-backup-codes.txt', codes.join('\n'))),
        });
      }

      // Indikator kekuatan kata sandi (heuristik sederhana)
      const meter = $('.pw-meter'), label = $('#pw-meter-label');
      $('#f_new').addEventListener('input', e => {
        const v = e.target.value; let sc = 0;
        if (v.length >= S.settings().passwordMinLength) sc++; if (/[A-Z]/.test(v) && /[a-z]/.test(v)) sc++; if (/\d/.test(v)) sc++; if (/[^A-Za-z0-9]/.test(v)) sc++;
        meter.dataset.score = v ? sc : 0;
        label.textContent = !v ? 'Gunakan kombinasi huruf besar, angka, dan simbol.' : ['Sangat lemah', 'Lemah', 'Cukup', 'Kuat', 'Sangat kuat'][sc];
      });
      $('#ac-pass').addEventListener('submit', e => {
        e.preventDefault(); const d = K.util.formData(e.target);
        if (!d.current) { e.target.current.focus(); K.ui.toast('Masukkan kata sandi saat ini', '', 'error'); return; }
        if (d.new.length < S.settings().passwordMinLength) { e.target.new.focus(); K.ui.toast('Kata sandi terlalu pendek', `Minimal ${S.settings().passwordMinLength} karakter.`, 'error'); return; }
        if (d.new !== d.confirm) { e.target.confirm.setAttribute('aria-invalid', 'true'); e.target.confirm.focus(); K.ui.toast('Konfirmasi tidak cocok', '', 'error'); return; }
        e.target.reset(); meter.dataset.score = 0; K.ui.toast('Kata sandi diubah', 'Sesi di perangkat lain telah dikeluarkan.');
      });
      $('#ac-email').addEventListener('submit', e => { e.preventDefault(); const v = e.target.email.value.trim(); if (!e.target.email.checkValidity() || !v) { K.ui.toast('Email tidak valid', '', 'error'); return; } K.ui.toast('Tautan verifikasi dikirim', v, 'info'); e.target.reset(); });
      $('#ac-del').addEventListener('click', () => K.ui.confirm({ title: 'Hapus akun Anda?', text: 'Sebagai Workspace Admin, Anda perlu mentransfer peran terlebih dahulu. (Demo — tidak ada yang dihapus.)', confirmLabel: 'Saya mengerti' }));
      draw2FA();
    },
  });

  /* ======================= UPGRADE PLAN / BILLING ======================= */
  K.page('billing', {
    render(view) {
      const s = S.settings();
      let annual = false;
      const plans = [
        { id: 'Starter', price: 450000, desc: 'Untuk tim kecil yang baru mulai.', features: ['10 pengguna', '10 GB penyimpanan', '100rb panggilan API/bulan', 'Dukungan email'], },
        { id: 'Professional', price: 1250000, desc: 'Untuk tim yang berkembang pesat.', features: ['50 pengguna', '100 GB penyimpanan', '1 juta panggilan API/bulan', 'Peran kustom & audit log 1 tahun', 'Dukungan prioritas'], popular: true },
        { id: 'Enterprise', price: 2850000, desc: 'Kontrol penuh & kepatuhan.', features: ['Pengguna tak terbatas', '1 TB penyimpanan', 'API tak terbatas', 'SSO SAML, SCIM, IP allowlist', 'Audit log 7 tahun', 'SLA 99,95% & CSM khusus'] },
      ];
      const invoices = Array.from({ length: 6 }, (_, i) => ({ id: `INV-2026-${String(10 - i).padStart(2, '0')}`, date: new Date(2026, 9 - i, 1).toISOString(), amount: i < 4 ? 4990000 : 3490000, status: i === 0 ? 'pending' : 'success' }));
      view.innerHTML = `${K.ui.pageHead({ title: 'Upgrade Plan', eyebrow: 'Billing', desc: 'Kelola paket langganan, pemakaian, dan tagihan workspace.' })}
        <div class="grid grid-main-side">
          <article class="card current-plan"><div class="card__head"><div><p class="text-xs text-secondary">Paket saat ini</p><h2 style="font-size:22px;letter-spacing:-0.5px;margin-top:4px">${esc(s.plan)}</h2><p class="card__desc">Ditagih bulanan · perpanjangan 1 Nov 2026</p></div><span class="badge badge--success">Aktif</span></div>
            <div class="grid grid-3 mt-5">${[['Kursi pengguna', s.seatsUsed, s.seatsTotal, ''], ['Penyimpanan', s.storageUsed, s.storageTotal, ' GB'], ['Panggilan API', s.apiCallsUsed / 1000, s.apiCallsTotal / 1000, 'rb']].map(([l, u, t, unit]) => { const p = (u / t) * 100; return `<div><p class="text-xs text-secondary">${l}</p><p class="fw-600 tabular mt-1">${num(u, unit === ' GB' ? 1 : 0)}${unit} <span class="text-secondary fw-500">/ ${num(t)}${unit}</span></p><div class="mt-2">${K.ui.progress(p, p > 80 ? 'warning' : '')}</div></div>`; }).join('')}</div></article>
          <article class="card"><h2 class="card__title">Metode pembayaran</h2>
            <div class="pay-card mt-4"><span class="pay-card__brand">VISA</span><p class="mono" style="letter-spacing:2px;margin-top:22px">•••• •••• •••• 4417</p><div class="flex justify-between mt-3 text-xs" style="opacity:.8"><span>${esc(K.currentUser().name.toUpperCase())}</span><span>09/28</span></div></div>
            <div class="flex gap-2 mt-4"><button type="button" class="btn btn-secondary btn-sm" id="bl-card">${icon('credit-card')}<span>Ganti kartu</span></button><button type="button" class="btn btn-ghost btn-sm" id="bl-addr">Alamat penagihan</button></div></article>
        </div>
        <div class="flex items-center justify-between wrap gap-3 mt-6"><h2 class="card__title" style="font-size:18px">Pilih paket</h2>
          <div class="segmented" role="group" aria-label="Siklus penagihan"><button type="button" data-cycle="m" aria-pressed="true">Bulanan</button><button type="button" data-cycle="y" aria-pressed="false">Tahunan <span class="badge badge--plain badge--success" style="margin-left:4px">-20%</span></button></div></div>
        <div class="grid grid-3 mt-4" id="bl-plans"></div>
        <article class="card card--flush mt-6"><div class="card__head"><div><h2 class="card__title">Riwayat tagihan</h2><p class="card__desc">Invoice tersedia dalam PDF untuk keperluan akuntansi.</p></div></div>
          <div class="table-wrap"><table class="table"><thead><tr><th scope="col">Invoice</th><th scope="col" class="hide-sm">Tanggal</th><th scope="col" class="num">Jumlah</th><th scope="col">Status</th><th scope="col" class="col-actions"><span class="sr-only">Aksi</span></th></tr></thead>
          <tbody>${invoices.map(v => `<tr><td class="mono fw-500">${v.id}</td><td class="hide-sm text-secondary">${K.util.date(v.date)}</td><td class="num">${idr(v.amount)}</td><td>${K.ui.badge(v.status, v.status === 'success' ? 'Lunas' : 'Menunggu')}</td><td class="col-actions">${K.ui.iconBtn('download', 'Unduh ' + v.id, `data-inv="${v.id}"`)}</td></tr>`).join('')}</tbody></table></div></article>`;
      const $ = q => view.querySelector(q);
      const drawPlans = () => {
        $('#bl-plans').innerHTML = plans.map(p => {
          const price = annual ? p.price * 12 * 0.8 : p.price, current = p.id === s.plan;
          return `<article class="card plan ${p.popular ? 'plan--popular' : ''}">${p.popular ? '<span class="plan__ribbon">Paling populer</span>' : ''}
            <h3 class="card__title">${p.id}</h3><p class="card__desc">${p.desc}</p>
            <p class="plan__price"><span class="tabular">${idr(price, { compact: true })}</span><small>/${annual ? 'tahun' : 'bulan'} per workspace</small></p>
            <ul class="plan__features">${p.features.map(f => `<li>${icon('check')}${f}</li>`).join('')}</ul>
            <button type="button" class="btn ${current ? 'btn-secondary' : p.popular ? 'btn-primary' : 'btn-secondary'} btn-block" data-plan="${p.id}" ${current ? 'disabled' : ''}>${current ? 'Paket saat ini' : plans.findIndex(x => x.id === p.id) > plans.findIndex(x => x.id === s.plan) ? 'Upgrade ke ' + p.id : 'Turun ke ' + p.id}</button></article>`;
        }).join('');
      };
      view.addEventListener('click', e => {
        const c = e.target.closest('[data-cycle]'); if (c) { annual = c.dataset.cycle === 'y'; view.querySelectorAll('[data-cycle]').forEach(x => x.setAttribute('aria-pressed', x === c)); drawPlans(); }
        const p = e.target.closest('[data-plan]');
        if (p) {
          const plan = plans.find(x => x.id === p.dataset.plan); const price = annual ? plan.price * 12 * 0.8 : plan.price;
          K.ui.modal({
            title: `Ganti ke ${plan.id}`, size: 'sm',
            body: `<dl class="dl"><dt>Paket</dt><dd>${plan.id}</dd><dt>Siklus</dt><dd>${annual ? 'Tahunan' : 'Bulanan'}</dd><dt>Biaya</dt><dd class="tabular">${idr(price)}</dd><dt>Prorata hari ini</dt><dd class="tabular">${idr(price * 0.36)}</dd></dl><p class="text-xs text-secondary">Ditagih ke Visa •••• 4417. Perubahan berlaku segera.</p>`,
            submitLabel: 'Konfirmasi',
            onSubmit: () => { S.saveSettings({ plan: plan.id }); S.audit('billing.plan_change', 'Mengubah paket', plan.id, 'warning', 'Billing'); K.ui.toast('Paket diperbarui', `Workspace kini memakai ${plan.id}.`); K.router.render(); },
          });
        }
        const inv = e.target.closest('[data-inv]'); if (inv) { K.util.downloadFile(inv.dataset.inv + '.txt', `Invoice ${inv.dataset.inv}\nKontrol Workspace\nData ilustratif.`); K.ui.toast('Invoice diunduh', inv.dataset.inv); }
      });
      $('#bl-card').addEventListener('click', () => K.ui.toast('Formulir kartu dibuka di halaman aman penyedia pembayaran', 'Data kartu tidak pernah melewati server Kontrol.', 'info', 5000));
      $('#bl-addr').addEventListener('click', () => K.ui.modal({ title: 'Alamat penagihan', body: `<div class="form-grid">${K.ui.field({ name: 'company', label: 'Nama perusahaan', value: 'PT Kontrol Digital Indonesia', span: true })}${K.ui.field({ name: 'npwp', label: 'NPWP', placeholder: '00.000.000.0-000.000' })}${K.ui.field({ name: 'city', label: 'Kota', value: 'Jakarta Selatan' })}${K.ui.field({ name: 'address', label: 'Alamat', type: 'textarea', span: true, value: 'Jl. Jenderal Sudirman Kav. 52-53' })}</div>`, onSubmit: () => K.ui.toast('Alamat penagihan disimpan') }));
      drawPlans();
    },
  });
})(window.K);
