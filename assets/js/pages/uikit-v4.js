/* ==========================================================================
   UI Kit (v4) → Modals & Drawers, Empty & Loading states, Timeline & Stepper
   ========================================================================== */
(function (K) {
  'use strict';
  const { esc } = K.util;
  const { icon } = K.ui;
  const code = c => `<div class="code mt-4">${esc(c.trim())}</div>`;

  /* ======================= MODALS & DRAWERS ======================= */
  K.page('ui-overlays', {
    render(view) {
      const variants = [
        ['sm', 'Modal kecil', 'Konfirmasi singkat', 'square'],
        ['', 'Modal standar', 'Form pendek (default)', 'app-window'],
        ['lg', 'Modal besar', 'Detail atau form dua kolom', 'panel-top'],
        ['long', 'Form panjang', 'Isi bisa di-scroll, header & footer tetap', 'scroll-text'],
        ['full', 'Fullscreen', 'Editor atau pratinjau dokumen', 'maximize'],
        ['drawer', 'Drawer kanan', 'Edit cepat tanpa pindah halaman', 'panel-right'],
        ['sheet', 'Bottom sheet', 'Aksi cepat di layar sentuh', 'panel-bottom'],
      ];
      view.innerHTML = `${K.ui.pageHead({ title: 'Modals & Drawers', eyebrow: 'UI Kit', desc: 'Semua memakai elemen <code class="inline-code">&lt;dialog&gt;</code> native: fokus terkunci di dalam, Esc menutup, fokus kembali ke tombol pemicu. Di layar &lt; 640px modal otomatis menjadi bottom sheet.' })}
        <div class="grid grid-4">${variants.map(([v, t, d, ic]) => `<button type="button" class="card card--hover" style="text-align:left" data-variant="${v}"><span class="icon-tile">${icon(ic)}</span><h2 class="card__title mt-4">${t}</h2><p class="card__desc">${d}</p></button>`).join('')}</div>
        <div class="grid grid-2 mt-4">
          <article class="card"><h2 class="card__title">Contoh: edit cepat dari tabel</h2><p class="card__desc">Klik baris untuk membuka drawer berisi form.</p>
            <div class="table-wrap mt-4" style="margin:0 -20px"><table class="table"><thead><tr><th scope="col">Pengguna</th><th scope="col" class="hide-sm">Tim</th><th scope="col">Status</th></tr></thead>
            <tbody>${K.store.all('users').slice(0, 5).map(u => `<tr data-user="${u.id}" style="cursor:pointer" tabindex="0"><td>${K.ui.person(u)}</td><td class="hide-sm text-secondary">${esc(u.team)}</td><td>${K.ui.badge(u.status)}</td></tr>`).join('')}</tbody></table></div></article>
          <article class="card"><h2 class="card__title">Cara pakai</h2>${code(`// Modal standar / sm / lg / full / sheet
K.ui.modal({ title: 'Judul', size: 'lg', body: '…', onSubmit: data => save(data) });

// Drawer kanan (alias modal size 'drawer')
K.ui.drawer({ title: 'Edit pengguna', body: form, onSubmit: d => K.api.patch('/users/' + id, d) });

// Konfirmasi (Promise<boolean>)
if (await K.ui.confirm({ title: 'Hapus?', text: 'Tidak bisa dibatalkan.' })) …`)}</article>
        </div>`;
      const longBody = () => `<div class="form-grid">${['Nama lengkap', 'Email', 'Telepon', 'Jabatan', 'Departemen', 'Lokasi kantor', 'Atasan langsung', 'Tanggal bergabung', 'NIK', 'NPWP', 'Bank', 'No. rekening'].map((l, i) => K.ui.field({ name: 'f' + i, label: l, type: l.startsWith('Tanggal') ? 'date' : 'text' })).join('')}${K.ui.field({ name: 'notes', label: 'Catatan', type: 'textarea', span: true })}${K.ui.field({ name: 'addr', label: 'Alamat lengkap', type: 'textarea', span: true })}</div>`;
      const open = v => {
        if (v === 'sm') return K.ui.confirm({ title: 'Arsipkan proyek?', text: 'Proyek dapat dipulihkan dalam 30 hari.', confirmLabel: 'Arsipkan', danger: false });
        if (v === 'drawer') return K.ui.drawer({ title: 'Filter lanjutan', desc: 'Drawer cocok untuk filter atau edit cepat.', body: `${K.ui.field({ name: 'status', label: 'Status', type: 'select', options: ['Semua', 'Aktif', 'Diundang'] })}${K.ui.field({ name: 'team', label: 'Tim', type: 'checkboxes', options: ['Engineering', 'Product', 'Design', 'Finance'], value: ['Engineering'] })}${K.ui.field({ name: 'from', label: 'Bergabung sejak', type: 'date' })}`, submitLabel: 'Terapkan', onSubmit: () => K.ui.toast('Filter diterapkan') });
        if (v === 'full') return K.ui.modal({ title: 'Pratinjau dokumen', size: 'full', body: `<div class="browser-frame" style="height:100%"><div class="browser-frame__bar"><span></span><span></span><span></span><p class="mono">laporan-q3-2026.pdf</p></div><article class="browser-frame__body" style="max-height:none"><h1 style="font-size:28px">Laporan Kuartal III 2026</h1><p class="text-secondary mt-2">Ringkasan eksekutif, kinerja produk, dan rencana Q4.</p>${'<p style="margin-top:14px;line-height:1.8">Konten dokumen panjang ditampilkan di sini. Mode fullscreen memaksimalkan ruang baca untuk editor, pratinjau PDF, atau dashboard detail.</p>'.repeat(6)}</article></div>`, footer: '<button type="button" class="btn btn-secondary" data-dismiss>Tutup</button>' });
        if (v === 'sheet') return K.ui.modal({ title: 'Aksi cepat', size: 'sheet', hideFooter: true, body: `<div class="list">${[['share-2', 'Bagikan'], ['copy', 'Duplikat'], ['download', 'Unduh'], ['archive', 'Arsipkan'], ['trash-2', 'Hapus']].map(([ic, l]) => `<button type="button" class="list-item sheet-item" data-dismiss>${icon(ic)}<span>${l}</span></button>`).join('')}</div>` });
        if (v === 'long') return K.ui.modal({ title: 'Data karyawan', desc: 'Header dan footer tetap terlihat saat isi di-scroll.', size: 'lg', body: longBody(), onSubmit: () => K.ui.toast('Data disimpan') });
        return K.ui.modal({ title: v === 'lg' ? 'Detail pesanan' : 'Tambah catatan', size: v, body: v === 'lg' ? `<div class="grid grid-2"><dl class="dl"><dt>Nomor</dt><dd>#ORD-2026-0091</dd><dt>Pelanggan</dt><dd>PT Nusantara Digital</dd><dt>Total</dt><dd>Rp12.500.000</dd></dl><div>${K.ui.field({ name: 'note', label: 'Catatan internal', type: 'textarea' })}</div></div>` : K.ui.field({ name: 'note', label: 'Catatan', type: 'textarea', required: true }), onSubmit: () => K.ui.toast('Tersimpan') });
      };
      view.addEventListener('click', e => {
        const b = e.target.closest('[data-variant]'); if (b) open(b.dataset.variant);
        const r = e.target.closest('[data-user]'); if (r) quickEdit(K.store.get('users', r.dataset.user));
      });
      view.addEventListener('keydown', e => { const r = e.target.closest('[data-user]'); if (r && e.key === 'Enter') quickEdit(K.store.get('users', r.dataset.user)); });
      function quickEdit(u) {
        K.ui.drawer({
          title: u.name, desc: esc(u.email),
          body: `<div class="flex items-center gap-3">${K.ui.avatar(u.name, 'lg')}<div><p class="fw-600">${esc(u.name)}</p>${K.ui.badge(u.status)}</div></div>
            <div class="stack" style="gap:14px">${K.ui.field({ name: 'name', label: 'Nama', required: true, value: u.name })}${K.ui.field({ name: 'team', label: 'Tim', type: 'select', value: u.team, options: K.store.all('teams').map(t => [t.name, t.name]) })}${K.ui.field({ name: 'status', label: 'Status', type: 'select', value: u.status, options: [['active', 'Aktif'], ['invited', 'Diundang'], ['suspended', 'Ditangguhkan']] })}</div>`,
          submitLabel: 'Simpan',
          onSubmit: d => {
            // Pola nyata: K.api.patch → di mode demo tersimpan ke K.store
            K.api.patch('/users/' + u.id, { name: d.name, team: d.team, status: d.status }).then(() => { K.ui.toast('Perubahan disimpan', d.name); K.router.render(); });
          },
        });
      }
    },
  });

  /* ======================= EMPTY & LOADING STATES ======================= */
  K.page('ui-states', {
    render(view) {
      const empties = [
        ['inbox', 'Belum ada data', 'Data akan muncul di sini setelah dibuat.', 'Buat data pertama', 'plus'],
        ['search-x', 'Tidak ada hasil', 'Tidak ada yang cocok dengan “laporan sla q5”. Coba kata kunci lain.', 'Reset filter', 'rotate-ccw'],
        ['shield-alert', 'Akses terbatas', 'Peran Anda tidak memiliki izin melihat data ini.', 'Minta akses', 'send'],
        ['cloud-off', 'Gagal memuat', 'Server tidak merespons. Periksa koneksi lalu coba lagi.', 'Coba lagi', 'refresh-cw'],
        ['circle-check', 'Semua beres!', 'Tidak ada tugas yang menunggu. Nikmati harimu.', '', ''],
        ['wifi-off', 'Anda sedang offline', 'Perubahan akan disinkronkan saat koneksi kembali.', 'Periksa ulang', 'wifi'],
      ];
      view.innerHTML = `${K.ui.pageHead({ title: 'Empty & Loading States', eyebrow: 'UI Kit', desc: 'Konsistensi saat data kosong, sedang dimuat, gagal, atau perangkat offline. Banner offline global muncul otomatis di atas konten.' })}
        <p class="section-label">Empty state</p>
        <div class="grid grid-3">${empties.map(([ic, t, d, a, aic], i) => `<article class="card" style="padding:0">${K.ui.empty({ icon: ic, title: t, text: d, action: a ? `<button type="button" class="btn ${i === 3 ? 'btn-primary' : 'btn-secondary'} btn-sm" data-empty="${i}">${icon(aic)}<span>${a}</span></button>` : '' })}</article>`).join('')}</div>

        <div class="flex items-center justify-between wrap gap-3 mt-6"><p class="section-label" style="margin:0">Skeleton per komponen</p><button type="button" class="btn btn-secondary btn-sm" id="st-reload">${icon('refresh-cw')}<span>Simulasikan muat ulang</span></button></div>
        <div class="grid grid-4 mt-3" id="st-kpis"></div>
        <div class="grid grid-main-side mt-4">
          <article class="card card--flush" id="st-table"></article>
          <article class="card" id="st-list"></article>
        </div>

        <p class="section-label mt-6">Loading inline & tombol</p>
        <article class="card"><div class="flex wrap items-center gap-3">
          <button type="button" class="btn btn-primary" id="st-btn">${icon('save')}<span>Simpan</span></button>
          <button type="button" class="btn btn-secondary" disabled>${icon('loader-circle', 'spin')}<span>Memproses…</span></button>
          <span class="flex items-center gap-2 text-sm text-secondary">${icon('loader-circle', 'spin i-16')} Memuat data…</span>
          <span class="dots-loader" role="status" aria-label="Memuat"><span></span><span></span><span></span></span>
          <div style="width:200px">${K.ui.progress(64)}</div>
          <div class="progress progress--indeterminate" style="width:200px" role="progressbar" aria-label="Memuat"><span></span></div>
        </div></article>

        <p class="section-label mt-6">Status koneksi</p>
        <article class="card flex wrap items-center justify-between gap-3"><div><p class="fw-600">Banner offline</p><p class="text-sm text-secondary">Muncul otomatis lewat event <code class="inline-code">online/offline</code>. Simulasikan di sini.</p></div>
          <div class="btn-group"><button type="button" class="btn btn-secondary btn-sm" data-net="off">${icon('wifi-off')}<span>Simulasikan offline</span></button><button type="button" class="btn btn-secondary btn-sm" data-net="on">${icon('wifi')}<span>Kembali online</span></button></div></article>
        ${code(`// Empty state
el.innerHTML = K.ui.empty({ icon: 'inbox', title: 'Belum ada data', text: '…', action: '<button …>' });

// Skeleton → data (pola fetch)
el.innerHTML = skeletonRows(5);
const { data } = await K.api.get('/users', { page: true }); // 404/5xx → halaman error
el.innerHTML = data.length ? render(data) : K.ui.empty({ … });`)}`;
      const $ = s => view.querySelector(s);
      const sk = (w, h = 12) => `<span class="skeleton" style="display:block;width:${w};height:${h}px"></span>`;
      const skeleton = () => {
        $('#st-kpis').innerHTML = Array.from({ length: 4 }, () => `<article class="card">${sk('40%')}<div class="mt-4">${sk('70%', 26)}</div><div class="mt-4">${sk('50%', 10)}</div></article>`).join('');
        $('#st-table').innerHTML = `<div class="card__head">${sk('140px', 14)}</div><div class="table-wrap"><table class="table"><tbody>${Array.from({ length: 5 }, () => `<tr class="skel-row"><td><div class="flex items-center gap-3"><span class="skeleton" style="width:32px;height:32px;border-radius:50%"></span><div class="flex-1 stack" style="gap:6px">${sk('60%')}${sk('40%', 10)}</div></div></td><td class="hide-sm">${sk('70%')}</td><td>${sk('56px', 18)}</td></tr>`).join('')}</tbody></table></div>`;
        $('#st-list').innerHTML = `${sk('50%', 14)}<div class="stack mt-5" style="gap:16px">${Array.from({ length: 4 }, () => `<div class="flex gap-3">${'<span class="skeleton" style="width:36px;height:36px;border-radius:8px;flex-shrink:0"></span>'}<div class="flex-1 stack" style="gap:6px">${sk('80%')}${sk('45%', 10)}</div></div>`).join('')}</div>`;
      };
      const real = () => {
        const u = K.store.all('users');
        $('#st-kpis').innerHTML = [K.ui.kpi({ label: 'Pengguna', value: u.length, icon: 'users' }), K.ui.kpi({ label: 'Tim', value: K.store.count('teams'), icon: 'users-round' }), K.ui.kpi({ label: 'Halaman', value: K.store.count('pages'), icon: 'file-text' }), K.ui.kpi({ label: 'Invoice', value: K.store.count('invoices'), icon: 'receipt-text' })].join('');
        $('#st-table').innerHTML = `<div class="card__head"><h2 class="card__title">Pengguna terbaru</h2></div><div class="table-wrap"><table class="table"><tbody>${u.slice(0, 5).map(x => `<tr><td>${K.ui.person(x)}</td><td class="hide-sm text-secondary">${esc(x.team)}</td><td>${K.ui.badge(x.status)}</td></tr>`).join('')}</tbody></table></div>`;
        $('#st-list').innerHTML = `<h2 class="card__title">Aktivitas</h2><div class="list mt-4">${K.store.all('activity').slice(0, 4).map(a => `<div class="list-item"><span class="icon-tile">${icon(a.icon)}</span><div class="list-item__body"><p class="list-item__title">${esc(K.lookup.user(a.userId).name)} ${esc(a.verb)}</p><p class="list-item__sub">${esc(a.target)}</p></div></div>`).join('')}</div>`;
      };
      let t1;
      const reload = () => { skeleton(); clearTimeout(t1); t1 = setTimeout(() => view.isConnected && real(), 1400); };
      reload();
      $('#st-reload').addEventListener('click', reload);
      $('#st-btn').addEventListener('click', e => { const b = e.currentTarget, h = b.innerHTML; b.disabled = true; b.innerHTML = `${icon('loader-circle', 'spin')}<span>Menyimpan…</span>`; setTimeout(() => { b.disabled = false; b.innerHTML = h; K.ui.toast('Tersimpan'); }, 1200); });
      view.addEventListener('click', e => {
        const n = e.target.closest('[data-net]');
        if (n) { const off = n.dataset.net === 'off'; const ban = document.getElementById('offline-banner'); ban.hidden = !off; if (!off) K.ui.toast(K.t('shell.online'), '', 'success', 2000); }
        const em = e.target.closest('[data-empty]'); if (em) K.ui.toast('Aksi empty state', em.textContent.trim(), 'info', 1600);
      });
      return () => { clearTimeout(t1); document.getElementById('offline-banner').hidden = navigator.onLine; };
    },
  });

  /* ======================= TIMELINE & STEPPER ======================= */
  K.page('ui-timeline', {
    render(view) {
      const flow = [['Dibuat', 'file-plus', 'Tiket dibuat oleh pelanggan via WhatsApp'], ['Ditugaskan', 'user-check', 'Diterima tim L1 — Rudi Firmansyah'], ['Diproses', 'wrench', 'Teknisi menuju lokasi'], ['Verifikasi', 'shield-check', 'Menunggu konfirmasi pelanggan'], ['Selesai', 'circle-check', 'Tiket ditutup']];
      let cur = 2;
      view.innerHTML = `${K.ui.pageHead({ title: 'Timeline & Stepper', eyebrow: 'UI Kit', desc: 'Menampilkan status proses dan riwayat kejadian — tiket, pengiriman, approval, deploy.' })}
        <article class="card"><div class="demo-head"><div><h2 class="card__title">Stepper status proses</h2><p class="card__desc">Contoh alur tiket insiden. Gunakan tombol untuk maju/mundur.</p></div>
          <div class="btn-group"><button type="button" class="btn btn-secondary btn-sm" data-step="-1">${icon('chevron-left')}<span>Mundur</span></button><button type="button" class="btn btn-primary btn-sm" data-step="1"><span>Lanjut</span>${icon('chevron-right')}</button></div></div>
          <ol class="process mt-6" id="tl-process" aria-label="Status tiket"></ol></article>

        <div class="grid grid-2 mt-4">
          <article class="card"><h2 class="card__title">Timeline vertikal</h2><p class="card__desc">Riwayat kejadian dengan ikon & warna status.</p>
            <div class="timeline timeline--rich mt-5">${[
              ['circle-check', 'success', 'Deploy Customer Portal v3.8.2 berhasil', 'oleh CI/CD · 2m 14d', '10:42'],
              ['git-merge', 'info', 'PR #482 digabung ke main', 'Fadly Ahmad · “Perbaiki filter tanggal”', '10:31'],
              ['triangle-alert', 'warning', 'Latensi API naik ke 640 ms', 'Alert otomatis · Billing Service', '09:58'],
              ['message-square', 'neutral', 'Komentar baru di tiket INC-2210', 'Dewi Lestari: “Sudah dicek di sisi bank.”', '09:20'],
              ['circle-x', 'danger', 'Job sinkronisasi gagal', 'Retry webhook — HTTP 503 (5×)', '08:47'],
            ].map(([ic, tone, title, sub, time]) => `<div class="timeline-item"><span class="timeline-item__icon tl-${tone}">${icon(ic)}</span><div class="timeline-item__body flex justify-between gap-3"><div><p class="fw-500">${title}</p><p class="text-xs text-secondary mt-1">${sub}</p></div><span class="text-xs text-muted tabular nowrap">${time}</span></div></div>`).join('')}</div></article>
          <article class="card"><h2 class="card__title">Timeline horizontal</h2><p class="card__desc">Roadmap atau milestone proyek.</p>
            <div class="htimeline mt-5" role="list">${[['Jul', 'Riset & desain', 'done'], ['Agu', 'MVP internal', 'done'], ['Sep', 'Beta 5 cabang', 'done'], ['Okt', 'Rollout nasional', 'current'], ['Nov', 'Integrasi bank', 'todo'], ['Des', 'Evaluasi & Q1 plan', 'todo']].map(([m, t, s]) => `<div class="htimeline__item is-${s}" role="listitem"><span class="htimeline__dot"></span><p class="text-xs text-secondary">${m} 2026</p><p class="fw-500 text-sm">${t}</p></div>`).join('')}</div>
            <h2 class="card__title mt-6">Pengiriman</h2>
            <div class="tracking mt-4">${[['Paket diterima', 'Jakarta Hub', '18 Okt 08:10', 1], ['Dalam perjalanan', 'Bandung Gateway', '19 Okt 14:32', 1], ['Dikirim kurir', 'Bandung Selatan', '20 Okt 09:05', 2], ['Diterima', '—', '—', 0]].map(([t, l, w, s]) => `<div class="tracking__row is-${['todo', 'done', 'current'][s]}"><span class="tracking__dot"></span><div class="flex-1"><p class="fw-500 text-sm">${t}</p><p class="text-xs text-secondary">${l}</p></div><span class="text-xs text-muted">${w}</span></div>`).join('')}</div></article>
        </div>
        ${code(`<ol class="process">
  <li class="process__step is-done">…</li>
  <li class="process__step is-current" aria-current="step">…</li>
  <li class="process__step">…</li>
</ol>`)}`;
      const draw = () => {
        view.querySelector('#tl-process').innerHTML = flow.map(([t, ic, d], i) => `<li class="process__step ${i < cur ? 'is-done' : i === cur ? 'is-current' : ''}" ${i === cur ? 'aria-current="step"' : ''}><span class="process__dot">${icon(i < cur ? 'check' : ic)}</span><p class="fw-600 text-sm mt-2">${t}</p><p class="text-xs text-secondary mt-1">${i <= cur ? d : 'Menunggu'}</p></li>`).join('');
      };
      view.addEventListener('click', e => { const b = e.target.closest('[data-step]'); if (b) { cur = Math.max(0, Math.min(flow.length - 1, cur + Number(b.dataset.step))); draw(); } });
      draw();
    },
  });
})(window.K);
