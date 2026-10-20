/* ==========================================================================
   Applications → Applications, Integrations, API Management, Webhooks
   ========================================================================== */
(function (K) {
  'use strict';
  const { esc, num } = K.util;
  const { icon } = K.ui;
  const S = K.store;
  const randomHex = n => [...crypto.getRandomValues(new Uint8Array(n))].map(b => b.toString(16).padStart(2, '0')).join('');

  /* ======================= APPLICATIONS ======================= */
  K.page('applications', {
    render(view) {
      let env = 'all', q = '';
      const typeLabel = { web: 'Web', mobile: 'Mobile', service: 'Service' };
      const envTone = { production: 'success', staging: 'warning', development: 'neutral' };
      view.innerHTML = `${K.ui.pageHead({
        title: 'Applications', eyebrow: 'Applications', desc: 'Aplikasi dan layanan yang terhubung ke workspace, lengkap dengan status deploy dan kredensial.',
        actions: `<button type="button" class="btn btn-primary btn-sm" id="app-new">${icon('plus')}<span>Daftarkan aplikasi</span></button>`,
      })}
        <div class="grid grid-4" id="app-kpis"></div>
        <div class="flex wrap items-center justify-between gap-3 mt-6">
          <div class="tabs" role="tablist" aria-label="Environment" id="app-env">${[['all', 'Semua'], ['production', 'Production'], ['staging', 'Staging'], ['development', 'Development']].map(([k, l]) => `<button type="button" role="tab" class="tab" data-env="${k}" aria-selected="${k === env}">${l}</button>`).join('')}</div>
          <label class="input-icon" style="width:240px">${icon('search')}<input type="search" class="input input-sm" placeholder="Cari aplikasi…" aria-label="Cari aplikasi" id="app-q"></label>
        </div>
        <div class="grid grid-3 mt-4" id="app-grid"></div>`;
      const $ = s => view.querySelector(s);

      const kpis = () => {
        const a = S.all('applications');
        $('#app-kpis').innerHTML = [
          K.ui.kpi({ label: 'Aplikasi', value: num(a.length), icon: 'app-window', foot: `${a.filter(x => x.env === 'production').length} di production` }),
          K.ui.kpi({ label: 'Request (30 hari)', value: num(a.reduce((s, x) => s + x.requests, 0)), icon: 'arrow-left-right', trend: 14.3 }),
          K.ui.kpi({ label: 'Rata-rata uptime', value: `${num(a.reduce((s, x) => s + x.uptime, 0) / a.length, 2)}<small>%</small>`, icon: 'activity', foot: 'target SLA 99,9%' }),
          K.ui.kpi({ label: 'Perlu perhatian', value: num(a.filter(x => x.status !== 'healthy').length), icon: 'triangle-alert', foot: 'menurun atau dijeda' }),
        ].join('');
      };

      function draw() {
        let apps = S.all('applications');
        if (env !== 'all') apps = apps.filter(a => a.env === env);
        if (q) apps = apps.filter(a => (a.name + a.description).toLowerCase().includes(q));
        $('#app-grid').innerHTML = apps.length ? apps.map(a => `
          <article class="card card--hover app-card">
            <div class="flex items-start justify-between gap-3">
              <span class="icon-tile icon-tile--lg">${icon(a.icon)}</span>
              ${K.ui.badge(a.status)}
            </div>
            <h2 class="card__title mt-4">${esc(a.name)}</h2>
            <p class="card__desc">${esc(a.description)}</p>
            <div class="flex wrap gap-2 mt-4"><span class="chip">${esc(typeLabel[a.type])}</span><span class="badge badge--plain badge--${envTone[a.env]}">${esc(a.env)}</span><span class="chip mono">${esc(a.version)}</span></div>
            <div class="grid grid-2 mt-4" style="gap:8px"><div><p class="text-xs text-secondary">Uptime</p><p class="fw-600 tabular">${num(a.uptime, 2)}%</p></div><div><p class="text-xs text-secondary">Request/30h</p><p class="fw-600 tabular">${num(a.requests)}</p></div></div>
            <div class="card__foot"><span>Deploy ${K.util.ago(a.lastDeploy)}</span><span>${esc(a.ownerTeam)}</span></div>
            <button type="button" class="stretched" data-open="${a.id}" aria-label="Buka ${esc(a.name)}"></button>
          </article>`).join('') : `<div class="card" style="grid-column:1/-1">${K.ui.empty({ icon: 'app-window', title: 'Tidak ada aplikasi', text: 'Ubah filter atau daftarkan aplikasi baru.' })}</div>`;
      }

      function detail(a) {
        const deploys = Array.from({ length: 5 }, (_, i) => ({ v: a.version.replace(/\d+$/, n => Math.max(0, n - i)), when: new Date(new Date(a.lastDeploy).getTime() - i * 86400000 * 2.3).toISOString(), ok: i !== 2, by: K.lookup.user(S.all('users')[i + 2].id).name }));
        const m = K.ui.modal({
          title: a.name, desc: esc(a.description), size: 'lg',
          body: `<div class="tabs tabs--line" role="tablist" aria-label="Detail aplikasi">
              <button type="button" role="tab" class="tab" aria-selected="true" aria-controls="tp-ov" data-tab="ov">Ringkasan</button>
              <button type="button" role="tab" class="tab" aria-selected="false" aria-controls="tp-cred" data-tab="cred" tabindex="-1">Kredensial</button>
              <button type="button" role="tab" class="tab" aria-selected="false" aria-controls="tp-dep" data-tab="dep" tabindex="-1">Deployment</button></div>
            <div role="tabpanel" id="tp-ov"><dl class="dl"><dt>Status</dt><dd>${K.ui.badge(a.status)}</dd><dt>Environment</dt><dd>${esc(a.env)}</dd><dt>Versi</dt><dd class="mono">${esc(a.version)}</dd><dt>Tim pemilik</dt><dd>${esc(a.ownerTeam)}</dd><dt>Uptime 30 hari</dt><dd>${num(a.uptime, 2)}%</dd><dt>Request 30 hari</dt><dd>${num(a.requests)}</dd></dl>
              <div class="chart-box mt-5" style="height:120px"><canvas data-spark aria-label="Grafik request 14 hari" role="img"></canvas></div></div>
            <div role="tabpanel" id="tp-cred" hidden><div class="stack">
              <div class="field"><span class="label">Client ID</span><div class="input-group"><input class="input mono input-sm" readonly value="${esc(a.clientId)}" aria-label="Client ID"><button type="button" class="btn btn-secondary btn-sm" data-copy="${esc(a.clientId)}">${icon('copy')}</button></div></div>
              <div class="field"><span class="label">Client secret</span><div class="input-group"><input class="input mono input-sm" readonly type="password" value="kts_${randomHex(16)}" aria-label="Client secret" data-secret><button type="button" class="btn btn-secondary btn-sm" data-reveal aria-label="Tampilkan secret">${icon('eye')}</button></div><p class="help">Simpan di secret manager. Jangan commit ke repositori.</p></div>
              <div class="alert alert--warning">${icon('triangle-alert')}<div><p class="alert__title">Rotasi secret</p><p class="alert__text">Secret lama langsung tidak berlaku. Pastikan semua layanan sudah diperbarui.</p><button type="button" class="btn btn-secondary btn-sm mt-2" data-rotate>${icon('refresh-cw')}<span>Rotasi secret</span></button></div></div></div></div>
            <div role="tabpanel" id="tp-dep" hidden><div class="list">${deploys.map(d => `<div class="list-item"><span class="icon-tile ${d.ok ? 'icon-tile--success' : 'icon-tile--danger'}">${icon(d.ok ? 'check' : 'x')}</span><div class="list-item__body"><p class="list-item__title mono">${esc(d.v)}</p><p class="list-item__sub">oleh ${esc(d.by)} · ${d.ok ? 'berhasil' : 'gagal — rollback otomatis'}</p></div><span class="list-item__meta">${K.util.ago(d.when)}</span></div>`).join('')}</div></div>`,
          footer: `<button type="button" class="btn btn-danger-ghost" data-del style="margin-right:auto">${icon('trash-2')}<span>Hapus</span></button>
            <button type="button" class="btn btn-secondary" data-pause>${icon(a.status === 'paused' ? 'play' : 'pause')}<span>${a.status === 'paused' ? 'Lanjutkan' : 'Jeda'}</span></button>
            <button type="button" class="btn btn-primary" data-deploy>${icon('rocket')}<span>Deploy ulang</span></button>`,
          onOpen: dlg => {
            K.ui.tabs(dlg.querySelector('.modal__body'));
            const canvas = dlg.querySelector('[data-spark]');
            const ch = K.charts.bar(canvas, { labels: K.util.dayLabels(14), datasets: [{ label: 'Request', data: K.util.series(14, a.requests / 30, a.requests / 120, 0, a.id.length) }] });
            dlg.addEventListener('close', () => ch && ch.destroy());
            dlg.addEventListener('click', e => {
              const c = e.target.closest('[data-copy]'); if (c) K.util.copy(c.dataset.copy).then(() => K.ui.toast('Disalin ke clipboard'));
              if (e.target.closest('[data-reveal]')) { const s = dlg.querySelector('[data-secret]'); s.type = s.type === 'password' ? 'text' : 'password'; }
              if (e.target.closest('[data-rotate]')) K.ui.confirm({ title: 'Rotasi client secret?', text: 'Secret lama akan langsung dicabut.', confirmLabel: 'Rotasi' }).then(ok => { if (ok) { dlg.querySelector('[data-secret]').value = 'kts_' + randomHex(16); S.audit('app.rotate_secret', 'Merotasi client secret', a.name, 'warning', 'Application'); K.ui.toast('Secret dirotasi', 'Salin secret baru sekarang.', 'warning'); } });
              if (e.target.closest('[data-pause]')) { S.update('applications', a.id, { status: a.status === 'paused' ? 'healthy' : 'paused' }); m.close(); draw(); kpis(); K.ui.toast(a.status === 'paused' ? 'Aplikasi dijeda' : 'Aplikasi dilanjutkan', a.name); }
              if (e.target.closest('[data-deploy]')) {
                const b = e.target.closest('[data-deploy]'); b.disabled = true; b.innerHTML = `${icon('loader-circle', 'spin')}<span>Men-deploy…</span>`;
                setTimeout(() => { const v = a.version.replace(/(\d+)$/, n => +n + 1); S.update('applications', a.id, { version: v, lastDeploy: new Date().toISOString(), status: 'healthy' }); S.audit('app.deploy', 'Deploy aplikasi', a.name + ' ' + v, 'info', 'Application'); m.close(); draw(); K.ui.toast('Deploy berhasil', `${a.name} ${v}`); }, 1800);
              }
              if (e.target.closest('[data-del]')) { m.close(); K.ui.confirm({ title: `Hapus ${a.name}?`, text: 'Semua kredensial aplikasi ini akan dicabut.' }).then(ok => { if (ok) { S.remove('applications', a.id); draw(); kpis(); K.ui.toast('Aplikasi dihapus'); } }); }
            });
          },
        });
      }

      $('#app-new').addEventListener('click', () => K.ui.modal({
        title: 'Daftarkan aplikasi', desc: 'Kredensial OAuth dibuat otomatis setelah aplikasi terdaftar.',
        body: `<div class="form-grid">${K.ui.field({ name: 'name', label: 'Nama aplikasi', required: true, span: true })}
          ${K.ui.field({ name: 'description', label: 'Deskripsi', span: true })}
          ${K.ui.field({ name: 'type', label: 'Jenis', type: 'select', options: [['web', 'Web'], ['mobile', 'Mobile'], ['service', 'Service / backend']] })}
          ${K.ui.field({ name: 'env', label: 'Environment', type: 'select', options: [['development', 'Development'], ['staging', 'Staging'], ['production', 'Production']] })}
          ${K.ui.field({ name: 'ownerTeam', label: 'Tim pemilik', type: 'select', options: S.all('teams').map(t => [t.name, t.name]) })}
          ${K.ui.field({ name: 'redirect', label: 'Redirect URI', type: 'url', placeholder: 'https://app.contoh.id/callback' })}</div>`,
        submitLabel: 'Daftarkan',
        onSubmit: d => { const iconMap = { web: 'globe', mobile: 'smartphone', service: 'server' }; S.insert('applications', { name: d.name, description: d.description || '—', type: d.type, env: d.env, ownerTeam: d.ownerTeam, version: 'v0.1.0', status: 'healthy', icon: iconMap[d.type], lastDeploy: new Date().toISOString(), requests: 0, uptime: 100, clientId: 'kt_' + randomHex(6) }, { idPrefix: 'app', prepend: false }); draw(); kpis(); K.ui.toast('Aplikasi terdaftar', d.name); },
      }));
      view.addEventListener('click', e => {
        const t = e.target.closest('[data-env]'); if (t) { env = t.dataset.env; view.querySelectorAll('[data-env]').forEach(x => x.setAttribute('aria-selected', x === t)); draw(); }
        const o = e.target.closest('[data-open]'); if (o) detail(S.get('applications', o.dataset.open));
      });
      $('#app-q').addEventListener('input', K.util.debounce(e => { q = e.target.value.toLowerCase().trim(); draw(); }, 120));
      kpis(); draw();
    },
  });

  /* ======================= INTEGRATIONS ======================= */
  K.page('integrations', {
    render(view) {
      let cat = 'all', q = '', onlyConnected = false;
      const cats = [...new Set(S.all('integrations').map(i => i.category))];
      view.innerHTML = `${K.ui.pageHead({ title: 'Integrations', eyebrow: 'Applications', desc: 'Hubungkan Kontrol dengan layanan yang sudah Anda gunakan.' })}
        <div class="flex wrap items-center justify-between gap-3">
          <div class="tabs" role="tablist" aria-label="Kategori" id="int-cats">${[['all', 'Semua'], ...cats.map(c => [c, c])].map(([k, l]) => `<button type="button" role="tab" class="tab" data-cat="${esc(k)}" aria-selected="${k === cat}">${esc(l)}</button>`).join('')}</div>
          <div class="flex items-center gap-3 wrap">${K.ui.switchEl({ name: 'only', label: 'Hanya terhubung', id: 'int-only' })}<label class="input-icon" style="width:220px">${icon('search')}<input type="search" class="input input-sm" placeholder="Cari integrasi…" aria-label="Cari integrasi" id="int-q"></label></div>
        </div>
        <div class="grid grid-3 mt-4" id="int-grid"></div>
        <article class="card mt-4 flex items-center gap-4 wrap"><span class="icon-tile icon-tile--lg">${icon('puzzle')}</span><div class="flex-1"><h2 class="card__title">Tidak menemukan yang Anda cari?</h2><p class="card__desc">Gunakan API publik dan webhook untuk membangun integrasi kustom.</p></div><a href="#/api" class="btn btn-secondary btn-sm">Lihat API</a><a href="#/webhooks" class="btn btn-primary btn-sm">Atur webhook</a></article>`;
      const $ = s => view.querySelector(s);

      function draw() {
        let list = S.all('integrations');
        if (cat !== 'all') list = list.filter(i => i.category === cat);
        if (onlyConnected) list = list.filter(i => i.connected);
        if (q) list = list.filter(i => (i.name + i.description).toLowerCase().includes(q));
        $('#int-grid').innerHTML = list.length ? list.map(i => `
          <article class="card integ">
            <div class="flex items-center justify-between gap-2"><span class="avatar avatar--lg avatar--square" data-c="${i.tone}">${icon(i.icon)}</span>${i.connected ? '<span class="badge badge--success">Terhubung</span>' : '<span class="badge badge--neutral">Belum terhubung</span>'}</div>
            <h2 class="card__title mt-4">${esc(i.name)}</h2>
            <p class="text-xs text-muted mt-1">${esc(i.category)}</p>
            <p class="card__desc" style="min-height:34px">${esc(i.description)}</p>
            <div class="card__foot">${i.connected ? `<span>Sejak ${K.util.date(i.connectedAt)}</span><div class="btn-group"><button type="button" class="btn btn-ghost btn-sm" data-config="${i.id}">Atur</button><button type="button" class="btn btn-danger-ghost btn-sm" data-disconnect="${i.id}">Putuskan</button></div>` : `<span>Gratis</span><button type="button" class="btn btn-primary btn-sm" data-connect="${i.id}">${icon('plug')}<span>Hubungkan</span></button>`}</div>
          </article>`).join('') : `<div class="card" style="grid-column:1/-1">${K.ui.empty({ icon: 'plug', title: 'Tidak ada integrasi', text: 'Ubah filter pencarian.' })}</div>`;
      }

      function configure(i, connecting) {
        K.ui.modal({
          title: (connecting ? 'Hubungkan ' : 'Pengaturan ') + i.name, desc: esc(i.description),
          body: `${K.ui.field({ name: 'endpoint', label: 'Endpoint / workspace URL', type: 'url', required: true, value: i.endpoint || 'https://', placeholder: 'https://' })}
            <div class="field"><label class="label" for="f_token">Token akses</label><input class="input mono" id="f_token" name="token" type="password" autocomplete="off" placeholder="${i.connected ? '•••••••• (tersimpan)' : 'Tempel token di sini'}"><p class="help">Token dienkripsi di server dan tidak pernah ditampilkan ulang.</p></div>
            ${K.ui.field({ name: 'events', label: 'Kirim event', type: 'checkboxes', value: i.events || ['alert', 'report'], options: [['alert', 'Alert & insiden'], ['report', 'Laporan terjadwal'], ['user', 'Aktivitas pengguna'], ['deploy', 'Deploy aplikasi']] })}`,
          submitLabel: connecting ? 'Hubungkan' : 'Simpan',
          onSubmit: (d, form) => {
            S.update('integrations', i.id, { connected: true, connectedAt: i.connectedAt || new Date().toISOString(), endpoint: d.endpoint, events: K.ui.checkedValues(form, 'events') });
            S.audit('integration.connect', connecting ? 'Menghubungkan integrasi' : 'Mengubah integrasi', i.name, 'info', 'Integration');
            draw(); K.ui.toast(connecting ? 'Integrasi terhubung' : 'Pengaturan disimpan', i.name);
          },
        });
      }

      view.addEventListener('click', e => {
        const c = e.target.closest('[data-cat]'); if (c) { cat = c.dataset.cat; view.querySelectorAll('[data-cat]').forEach(x => x.setAttribute('aria-selected', x === c)); draw(); return; }
        const con = e.target.closest('[data-connect]'); if (con) configure(S.get('integrations', con.dataset.connect), true);
        const cfg = e.target.closest('[data-config]'); if (cfg) configure(S.get('integrations', cfg.dataset.config), false);
        const dis = e.target.closest('[data-disconnect]');
        if (dis) { const i = S.get('integrations', dis.dataset.disconnect); K.ui.confirm({ title: `Putuskan ${i.name}?`, text: 'Notifikasi dan sinkronisasi melalui integrasi ini akan berhenti.', confirmLabel: 'Putuskan' }).then(ok => { if (ok) { S.update('integrations', i.id, { connected: false, connectedAt: null }); draw(); K.ui.toast('Integrasi diputus', i.name, 'warning'); } }); }
      });
      $('#int-only').addEventListener('change', e => { onlyConnected = e.target.checked; draw(); });
      $('#int-q').addEventListener('input', K.util.debounce(e => { q = e.target.value.toLowerCase().trim(); draw(); }, 120));
      draw();
    },
  });

  /* ======================= API MANAGEMENT ======================= */
  K.page('api', {
    render(view, route) {
      const set = S.settings();
      view.innerHTML = `${K.ui.pageHead({
        title: 'API Management', eyebrow: 'Applications', desc: 'Kelola API key, pantau penggunaan, dan batas laju (rate limit).',
        actions: `<a href="#/docs" class="btn btn-secondary btn-sm">${icon('book-open')}<span>Referensi API</span></a><button type="button" class="btn btn-primary btn-sm" id="api-new">${icon('key-round')}<span>Buat API key</span></button>`,
      })}
        <div class="grid grid-4">
          ${K.ui.kpi({ label: 'Request hari ini', value: num(48213), icon: 'arrow-left-right', trend: 5.2, foot: 'vs kemarin' })}
          ${K.ui.kpi({ label: 'Error rate', value: '0,42<small>%</small>', icon: 'circle-alert', trend: -0.1, trendInvert: true, foot: '4xx + 5xx' })}
          ${K.ui.kpi({ label: 'Latensi p95', value: '182<small>ms</small>', icon: 'gauge', trend: -3.4, trendInvert: true, foot: 'vs kemarin' })}
          <article class="card kpi"><div class="kpi__head"><h2 class="kpi__label">Kuota bulanan</h2><span class="kpi__icon">${icon('database-zap')}</span></div><p class="kpi__value">${num((set.apiCallsUsed / set.apiCallsTotal) * 100, 0)}<small>%</small></p><div class="mt-4">${K.ui.progress((set.apiCallsUsed / set.apiCallsTotal) * 100, 'warning')}</div><p class="text-xs text-secondary mt-2">${num(set.apiCallsUsed)} / ${num(set.apiCallsTotal)} panggilan</p></article>
        </div>
        <div class="grid grid-main-side mt-4">
          <article class="card"><div class="card__head"><div><h2 class="card__title">Penggunaan API</h2><p class="card__desc">Request per hari berdasarkan kelas status</p></div>
            <div class="legend"><span class="legend__item"><span class="legend__swatch" style="background:var(--chart-c1)"></span>2xx</span><span class="legend__item"><span class="legend__swatch" style="background:var(--chart-c3)"></span>4xx</span><span class="legend__item"><span class="legend__swatch" style="background:var(--chart-c4)"></span>5xx</span></div></div>
            <div class="chart-box mt-5" style="height:240px"><canvas id="api-usage" role="img" aria-label="Penggunaan API per hari"></canvas></div></article>
          <article class="card"><h2 class="card__title">Contoh permintaan</h2><p class="card__desc">Autentikasi memakai header Bearer.</p>
            <div class="code mt-4">${K.ui.iconBtn('copy', 'Salin contoh', 'data-copy-code', 'code-copy')}<span class="c-c"># Daftar pengguna</span>
<span class="c-k">curl</span> https://api.kontrol.id/v2/users \\
  -H <span class="c-s">"Authorization: Bearer $KONTROL_API_KEY"</span> \\
  -H <span class="c-s">"Accept: application/json"</span></div>
            <p class="section-label mt-5">Batas laju</p>
            <dl class="dl"><dt>Per key</dt><dd>600 request / menit</dd><dt>Burst</dt><dd>100 request / detik</dd><dt>Payload maks</dt><dd>5 MB</dd></dl></article>
        </div>
        <div class="mt-4" id="api-table"></div>`;
      const $ = s => view.querySelector(s);
      const days = K.util.dayLabels(14);
      const ok = K.util.series(14, 46000, 6000, 300, 4);
      K.charts.bar($('#api-usage'), { labels: days, stacked: true, datasets: [{ label: '2xx', data: ok }, { label: '4xx', data: ok.map(v => Math.round(v * 0.006)), color: K.charts.palette()[2] }, { label: '5xx', data: ok.map((v, i) => Math.round(v * (i === 9 ? 0.012 : 0.0015))), color: K.charts.palette()[3] }] });
      $('[data-copy-code]').addEventListener('click', () => K.util.copy('curl https://api.kontrol.id/v2/users -H "Authorization: Bearer $KONTROL_API_KEY" -H "Accept: application/json"').then(() => K.ui.toast('Contoh disalin')));

      const table = new K.DataTable($('#api-table'), {
        title: 'API keys', rows: () => S.all('apiKeys'), pageSize: 8, exportName: 'api-keys',
        search: r => r.name + ' ' + r.prefix,
        tabs: { key: 'status', options: [['active', 'Aktif'], ['revoked', 'Dicabut']] },
        columns: [
          { key: 'name', label: 'Nama', sortable: true, render: r => `<div><p class="fw-500">${esc(r.name)}</p><p class="text-xs text-secondary">Dibuat ${K.util.date(r.createdAt)} oleh ${esc(K.lookup.user(r.createdBy).name)}</p></div>` },
          { key: 'prefix', label: 'Key', render: r => `<span class="inline-code">${esc(r.prefix)}••••••••</span>` },
          { key: 'scopes', label: 'Scope', className: 'hide-md', render: r => `<div class="chip-list">${r.scopes.slice(0, 2).map(s => `<span class="chip mono" style="font-size:10.5px">${esc(s)}</span>`).join('')}${r.scopes.length > 2 ? `<span class="chip">+${r.scopes.length - 2}</span>` : ''}</div>`, csv: r => r.scopes.join(' ') },
          { key: 'env', label: 'Env', className: 'hide-sm', render: r => `<span class="badge badge--plain ${r.env === 'live' ? 'badge--success' : 'badge--warning'}">${r.env}</span>` },
          { key: 'lastUsed', label: 'Terakhir dipakai', sortable: true, className: 'hide-lg nowrap', render: r => `<span class="text-secondary">${K.util.ago(r.lastUsed)}</span>` },
          { key: 'status', label: 'Status', render: r => K.ui.badge(r.status) },
        ],
        rowActions: r => r.status === 'active' ? `${K.ui.iconBtn('refresh-cw', 'Rotasi key', 'data-action="rotate"')}${K.ui.iconBtn('ban', 'Cabut key', 'data-action="revoke"', 'is-danger')}` : K.ui.iconBtn('trash-2', 'Hapus', 'data-action="delete"', 'is-danger'),
        onAction: (a, r) => {
          if (a === 'revoke') K.ui.confirm({ title: `Cabut ${r.name}?`, text: 'Semua request dengan key ini akan langsung ditolak (401).', confirmLabel: 'Cabut key' }).then(ok => { if (ok) { S.update('apiKeys', r.id, { status: 'revoked' }); S.audit('api_key.revoke', 'Mencabut API key', r.name, 'danger', 'API Key'); table.refresh(); K.ui.toast('API key dicabut', r.name, 'warning'); } });
          if (a === 'rotate') K.ui.confirm({ title: 'Rotasi API key?', text: 'Key lama dicabut dan key baru dibuat dengan scope yang sama.', confirmLabel: 'Rotasi', danger: false }).then(ok => { if (ok) { const secret = `kt_${r.env}_${randomHex(20)}`; S.update('apiKeys', r.id, { prefix: secret.slice(0, 12), createdAt: new Date().toISOString() }); table.refresh(); showSecret(secret); } });
          if (a === 'delete') { S.remove('apiKeys', r.id); table.refresh(); K.ui.toast('Key dihapus'); }
        },
      });

      function showSecret(secret) {
        K.ui.modal({
          title: 'Simpan API key Anda', size: 'sm',
          body: `<div class="alert alert--warning">${icon('triangle-alert')}<div><p class="alert__title">Hanya ditampilkan sekali</p><p class="alert__text">Salin dan simpan di tempat aman. Kami hanya menyimpan hash-nya.</p></div></div>
            <div class="input-group"><input class="input mono input-sm" readonly value="${esc(secret)}" aria-label="API key baru"><button type="button" class="btn btn-primary btn-sm" data-copy>${icon('copy')}<span>Salin</span></button></div>`,
          footer: '<button type="button" class="btn btn-secondary" data-dismiss>Saya sudah menyimpannya</button>',
          onOpen: dlg => dlg.querySelector('[data-copy]').addEventListener('click', () => K.util.copy(secret).then(() => K.ui.toast('API key disalin'))),
        });
      }

      function create() {
        K.ui.modal({
          title: 'Buat API key', desc: 'Berikan scope seminimal mungkin (prinsip least privilege).',
          body: `${K.ui.field({ name: 'name', label: 'Nama key', required: true, placeholder: 'mis. Server laporan' })}
            ${K.ui.field({ name: 'env', label: 'Environment', type: 'select', options: [['live', 'Live (production)'], ['test', 'Test (sandbox)']] })}
            ${K.ui.field({ name: 'scopes', label: 'Scope', type: 'checkboxes', value: ['users:read'], options: S.all('scopesAll').length ? S.all('scopesAll') : K.seed.scopesAll })}
            ${K.ui.field({ name: 'expiry', label: 'Kedaluwarsa', type: 'select', options: [['90', '90 hari'], ['180', '180 hari'], ['365', '1 tahun'], ['0', 'Tidak pernah (tidak disarankan)']] })}`,
          submitLabel: 'Buat key',
          onSubmit: (d, form) => {
            const scopes = K.ui.checkedValues(form, 'scopes');
            if (!scopes.length) { K.ui.toast('Pilih minimal satu scope', '', 'error'); return false; }
            const secret = `kt_${d.env}_${randomHex(20)}`;
            S.insert('apiKeys', { name: d.name, env: d.env, scopes, prefix: secret.slice(0, 12), lastUsed: new Date().toISOString(), status: 'active', createdBy: 'usr_me' }, { idPrefix: 'key' });
            S.audit('api_key.create', 'Membuat API key', d.name, 'warning', 'API Key');
            table.refresh(); setTimeout(() => showSecret(secret), 120);
          },
        });
      }
      $('#api-new').addEventListener('click', create);
      if (route.query.action === 'new') { history.replaceState(null, '', '#/api'); create(); }
    },
  });

  /* ======================= WEBHOOKS ======================= */
  K.page('webhooks', {
    render(view, route) {
      const deliveries = [];
      const r = K.util.rng(9);
      S.all('webhooks').filter(w => w.status !== 'disabled').forEach(w => {
        for (let i = 0; i < 4; i++) {
          const fail = w.status === 'failing' ? r() < 0.7 : r() < 0.06;
          deliveries.push({ id: 'dlv_' + w.id + i, webhookId: w.id, event: w.events[i % w.events.length], code: fail ? (r() < 0.5 ? 503 : 500) : 200, ms: Math.round(80 + r() * 500), at: new Date(K.NOW - (i * 47 + r() * 40) * 60000).toISOString() });
        }
      });
      deliveries.sort((a, b) => b.at.localeCompare(a.at));

      view.innerHTML = `${K.ui.pageHead({
        title: 'Webhooks', eyebrow: 'Applications', desc: 'Kirim event real-time ke endpoint HTTPS milik Anda. Setiap payload ditandatangani HMAC-SHA256.',
        actions: `<button type="button" class="btn btn-primary btn-sm" id="wh-new">${icon('plus')}<span>Tambah endpoint</span></button>`,
      })}
        <div id="wh-table"></div>
        <div class="grid grid-main-side mt-4">
          <article class="card card--flush"><div class="card__head"><div><h2 class="card__title">Pengiriman terbaru</h2><p class="card__desc">50 pengiriman terakhir dari semua endpoint</p></div></div>
            <div class="table-wrap"><table class="table"><thead><tr><th scope="col">Event</th><th scope="col" class="hide-sm">Endpoint</th><th scope="col">Respons</th><th scope="col" class="num hide-md">Durasi</th><th scope="col" class="hide-sm">Waktu</th><th scope="col" class="col-actions"><span class="sr-only">Aksi</span></th></tr></thead><tbody id="wh-dlv"></tbody></table></div></article>
          <article class="card"><h2 class="card__title">Verifikasi signature</h2><p class="card__desc">Validasi header <code class="inline-code">X-Kontrol-Signature</code> sebelum memproses payload.</p>
            <div class="code mt-4"><span class="c-c">// Node.js</span>
<span class="c-k">const</span> sig = crypto
  .createHmac(<span class="c-s">'sha256'</span>, secret)
  .update(rawBody)
  .digest(<span class="c-s">'hex'</span>);
<span class="c-k">if</span> (!crypto.timingSafeEqual(
  Buffer.from(sig), Buffer.from(header)
)) <span class="c-k">throw new</span> Error(<span class="c-s">'invalid'</span>);</div>
            <p class="text-xs text-secondary mt-3">Gagal dikirim akan dicoba ulang hingga 5 kali dengan exponential backoff.</p></article>
        </div>`;
      const $ = s => view.querySelector(s);

      const drawDeliveries = () => {
        $('#wh-dlv').innerHTML = deliveries.slice(0, 12).map(d => {
          const w = S.get('webhooks', d.webhookId);
          return `<tr><td><span class="mono text-xs">${esc(d.event)}</span></td><td class="hide-sm"><span class="truncate text-secondary" style="display:block;max-width:200px">${esc(w ? new URL(w.url).host : '—')}</span></td><td><span class="badge ${d.code < 300 ? 'badge--success' : 'badge--danger'}">${d.code}</span></td><td class="num hide-md">${d.ms} ms</td><td class="hide-sm text-secondary nowrap">${K.util.ago(d.at)}</td><td class="col-actions">${K.ui.iconBtn('file-json', 'Lihat payload', `data-dlv="${d.id}"`)}</td></tr>`;
        }).join('');
      };

      const table = new K.DataTable($('#wh-table'), {
        title: 'Endpoint', rows: () => S.all('webhooks'), pageSize: 6, search: r => r.url + ' ' + r.events.join(' '),
        tabs: { key: 'status', options: [['active', 'Aktif'], ['failing', 'Bermasalah'], ['disabled', 'Nonaktif']] },
        columns: [
          { key: 'url', label: 'URL', render: r => `<div><p class="mono text-xs fw-500 truncate" style="max-width:340px">${esc(r.url)}</p><p class="text-xs text-secondary">${r.events.length} event · dibuat ${K.util.date(r.createdAt)}</p></div>` },
          { key: 'events', label: 'Event', className: 'hide-md', render: r => `<div class="chip-list">${r.events.slice(0, 2).map(e => `<span class="chip mono" style="font-size:10.5px">${esc(e)}</span>`).join('')}${r.events.length > 2 ? `<span class="chip">+${r.events.length - 2}</span>` : ''}</div>`, csv: r => r.events.join(' ') },
          { key: 'successRate', label: 'Sukses 7h', sortable: true, className: 'hide-sm', render: r => r.status === 'disabled' ? '<span class="text-muted">—</span>' : `<div style="min-width:90px"><p class="text-xs fw-600 tabular">${num(r.successRate, 1)}%</p>${K.ui.progress(r.successRate, r.successRate > 95 ? 'success' : r.successRate > 80 ? 'warning' : 'danger')}</div>` },
          { key: 'status', label: 'Status', render: r => K.ui.badge(r.status) },
        ],
        rowActions: r => `${K.ui.iconBtn('send', 'Kirim tes', 'data-action="test"')}
          <div class="menu-anchor">${K.ui.iconBtn('ellipsis', 'Aksi lainnya', 'data-menu-toggle aria-expanded="false"')}<div class="menu" role="menu">
            <button type="button" class="menu__item" data-action="edit">${icon('pencil')}Edit</button>
            <button type="button" class="menu__item" data-action="secret">${icon('key-round')}Lihat signing secret</button>
            <button type="button" class="menu__item" data-action="toggle">${icon(r.status === 'disabled' ? 'play' : 'pause')}${r.status === 'disabled' ? 'Aktifkan' : 'Nonaktifkan'}</button>
            <div class="menu__sep"></div><button type="button" class="menu__item menu__item--danger" data-action="delete">${icon('trash-2')}Hapus</button></div></div>`,
        onAction: (a, w) => {
          if (a === 'test') {
            const ok = w.status !== 'failing';
            deliveries.unshift({ id: 'dlv_t' + Date.now(), webhookId: w.id, event: 'ping', code: ok ? 200 : 503, ms: Math.round(90 + Math.random() * 200), at: new Date().toISOString() });
            drawDeliveries();
            K.ui.toast(ok ? 'Tes berhasil — 200 OK' : 'Tes gagal — 503', w.url, ok ? 'success' : 'error');
          }
          if (a === 'edit') form(w);
          if (a === 'secret') K.ui.modal({ title: 'Signing secret', size: 'sm', body: `<div class="input-group"><input class="input mono input-sm" readonly value="${esc(w.secret)}" aria-label="Signing secret"><button type="button" class="btn btn-secondary btn-sm" data-copy>${icon('copy')}</button></div><button type="button" class="btn btn-secondary btn-sm" data-rot>${icon('refresh-cw')}<span>Rotasi secret</span></button>`, footer: '<button type="button" class="btn btn-secondary" data-dismiss>Tutup</button>',
            onOpen: dlg => { dlg.querySelector('[data-copy]').addEventListener('click', () => K.util.copy(dlg.querySelector('input').value).then(() => K.ui.toast('Secret disalin'))); dlg.querySelector('[data-rot]').addEventListener('click', () => { const s = 'whsec_' + randomHex(12); S.update('webhooks', w.id, { secret: s }); dlg.querySelector('input').value = s; K.ui.toast('Secret dirotasi', '', 'warning'); }); } });
          if (a === 'toggle') { S.update('webhooks', w.id, { status: w.status === 'disabled' ? 'active' : 'disabled' }); table.refresh(); K.ui.toast(w.status === 'disabled' ? 'Endpoint dinonaktifkan' : 'Endpoint diaktifkan'); }
          if (a === 'delete') K.ui.confirm({ title: 'Hapus endpoint?', text: w.url }).then(ok => { if (ok) { S.remove('webhooks', w.id); table.refresh(); K.ui.toast('Endpoint dihapus'); } });
        },
      });

      function form(w) {
        K.ui.modal({
          title: w ? 'Edit endpoint' : 'Tambah endpoint',
          body: `${K.ui.field({ name: 'url', label: 'URL endpoint', type: 'url', required: true, value: w?.url, placeholder: 'https://api.contoh.id/webhooks', attrs: 'pattern="https://.*"', help: 'Wajib HTTPS.' })}
            ${K.ui.field({ name: 'description', label: 'Deskripsi', value: w?.description })}
            ${K.ui.field({ name: 'events', label: 'Event yang dikirim', type: 'checkboxes', value: w?.events || ['user.created'], options: K.seed.webhookEvents })}`,
          submitLabel: w ? 'Simpan' : 'Tambah endpoint',
          onSubmit: (d, f) => {
            const events = K.ui.checkedValues(f, 'events');
            if (!events.length) { K.ui.toast('Pilih minimal satu event', '', 'error'); return false; }
            if (w) S.update('webhooks', w.id, { url: d.url, description: d.description, events });
            else { S.insert('webhooks', { url: d.url, description: d.description, events, status: 'active', successRate: 100, lastDelivery: null, secret: 'whsec_' + randomHex(12) }, { idPrefix: 'wh' }); S.audit('webhook.create', 'Membuat webhook', d.url, 'info', 'Webhook'); }
            table.refresh(); K.ui.toast(w ? 'Endpoint diperbarui' : 'Endpoint ditambahkan', d.url);
          },
        });
      }

      view.addEventListener('click', e => {
        const b = e.target.closest('[data-dlv]'); if (!b) return;
        const d = deliveries.find(x => x.id === b.dataset.dlv);
        const payload = JSON.stringify({ id: 'evt_' + d.id.slice(-6), type: d.event, created: d.at, data: { object: d.event.split('.')[0], id: 'obj_' + randomHex(4) } }, null, 2);
        K.ui.modal({ title: 'Payload pengiriman', desc: `<span class="mono">${esc(d.event)}</span> · HTTP ${d.code} · ${d.ms} ms`, body: `<p class="section-label">Request body</p><div class="code">${esc(payload)}</div><p class="section-label">Response</p><div class="code">${d.code < 300 ? '{"received": true}' : '&lt;html&gt;503 Service Unavailable&lt;/html&gt;'}</div>`, footer: `<button type="button" class="btn btn-secondary" data-dismiss>Tutup</button>${d.code >= 300 ? '<button type="button" class="btn btn-primary" data-dismiss onclick="K.ui.toast(\'Pengiriman dijadwalkan ulang\', \'\', \'info\')">Kirim ulang</button>' : ''}` });
      });
      $('#wh-new').addEventListener('click', () => form());
      drawDeliveries();
      if (route.query.action === 'new') { history.replaceState(null, '', '#/webhooks'); form(); }
    },
  });
})(window.K);
