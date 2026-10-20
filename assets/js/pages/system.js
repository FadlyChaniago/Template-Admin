/* ==========================================================================
   System → Notifications, Tasks & Jobs, Audit Logs, System Health
   ========================================================================== */
(function (K) {
  'use strict';
  const { esc, num } = K.util;
  const { icon } = K.ui;
  const S = K.store;

  /* ======================= NOTIFICATIONS ======================= */
  K.page('notifications', {
    render(view) {
      let filter = 'all';
      const typeMeta = { report: ['file-chart-column', 'info', 'Laporan'], user: ['user-plus', 'success', 'Pengguna'], system: ['refresh-cw', 'info', 'Sistem'], security: ['shield-check', 'warning', 'Keamanan'], alert: ['triangle-alert', 'danger', 'Alert'], content: ['message-square', 'info', 'Konten'], billing: ['receipt', 'success', 'Tagihan'] };
      const prefs = K.prefs.get('kontrol:notif-prefs', { security: ['email', 'push', 'wa'], alert: ['email', 'push', 'wa'], report: ['email'], user: ['push'], content: ['push'], billing: ['email'], system: [] });
      view.innerHTML = `${K.ui.pageHead({
        title: 'Notifications', eyebrow: 'System', desc: 'Pusat pemberitahuan workspace dan preferensi kanal pengiriman.',
        actions: `<button type="button" class="btn btn-secondary btn-sm" id="nt-read">${icon('check-check')}<span>Tandai semua dibaca</span></button><button type="button" class="btn btn-ghost btn-sm" id="nt-clear">${icon('trash-2')}<span>Hapus yang dibaca</span></button>`,
      })}
      <div class="grid grid-main-side">
        <article class="card card--flush">
          <div class="card__head" style="padding-bottom:12px"><div class="tabs" role="tablist" aria-label="Filter notifikasi" id="nt-tabs"></div></div>
          <div id="nt-list"></div>
        </article>
        <article class="card">
          <h2 class="card__title">Preferensi kanal</h2><p class="card__desc">Pilih ke mana setiap jenis notifikasi dikirim.</p>
          <form id="nt-prefs" class="mt-4"><div class="table-wrap" style="margin:0 -20px"><table class="table"><thead><tr><th scope="col">Jenis</th><th scope="col" class="num">Email</th><th scope="col" class="num">Push</th><th scope="col" class="num">WhatsApp</th></tr></thead><tbody>
            ${Object.entries(typeMeta).map(([k, [, , l]]) => `<tr><td class="fw-500">${l}</td>${['email', 'push', 'wa'].map(c => `<td class="num"><input type="checkbox" name="${k}" value="${c}" aria-label="${l} via ${c}" ${(prefs[k] || []).includes(c) ? 'checked' : ''}></td>`).join('')}</tr>`).join('')}
          </tbody></table></div>
          <div class="mt-4">${K.ui.switchEl({ name: 'quiet', label: 'Mode senyap 22.00–07.00 WIB', checked: K.prefs.get('kontrol:quiet', true) })}</div>
          <button type="submit" class="btn btn-primary btn-sm mt-4">${icon('save')}<span>Simpan preferensi</span></button></form>
        </article>
      </div>`;
      const $ = s => view.querySelector(s);

      function draw() {
        const all = S.all('notifications');
        const unread = all.filter(n => !n.read).length;
        $('#nt-tabs').innerHTML = [['all', 'Semua', all.length], ['unread', 'Belum dibaca', unread], ['alert', 'Alert', all.filter(n => n.type === 'alert').length], ['security', 'Keamanan', all.filter(n => n.type === 'security').length]]
          .map(([k, l, c]) => `<button type="button" role="tab" class="tab" data-f="${k}" aria-selected="${k === filter}">${l} <span class="count-pill">${c}</span></button>`).join('');
        const list = all.filter(n => filter === 'all' || (filter === 'unread' ? !n.read : n.type === filter));
        $('#nt-list').innerHTML = list.length ? `<ul class="notif-list">${list.map(n => {
          const [ic, tone, label] = typeMeta[n.type] || ['bell', 'info', 'Info'];
          return `<li class="notif-row ${n.read ? '' : 'is-unread'}"><span class="icon-tile icon-tile--${tone}">${icon(ic)}</span>
            <div class="flex-1"><p class="fw-600">${esc(n.title)}</p><p class="text-sm text-secondary mt-1">${esc(n.text)}</p><p class="text-xs text-muted mt-2">${label} · ${K.util.ago(n.createdAt)}</p></div>
            <div class="row-actions">${K.ui.iconBtn(n.read ? 'mail' : 'mail-open', n.read ? 'Tandai belum dibaca' : 'Tandai dibaca', `data-toggle="${n.id}"`)}${K.ui.iconBtn('x', 'Hapus notifikasi', `data-del="${n.id}"`, 'is-danger')}</div></li>`;
        }).join('')}</ul>` : K.ui.empty({ icon: 'bell-off', title: 'Tidak ada notifikasi', text: 'Anda sudah membaca semuanya.' });
      }
      view.addEventListener('click', e => {
        const f = e.target.closest('[data-f]'); if (f) { filter = f.dataset.f; draw(); return; }
        const t = e.target.closest('[data-toggle]'); if (t) { const n = S.get('notifications', t.dataset.toggle); S.update('notifications', n.id, { read: !n.read }); draw(); }
        const d = e.target.closest('[data-del]'); if (d) { S.remove('notifications', d.dataset.del); draw(); K.ui.toast('Notifikasi dihapus'); }
      });
      $('#nt-read').addEventListener('click', () => { S.updateWhere('notifications', () => true, { read: true }); draw(); K.ui.toast('Semua ditandai dibaca'); });
      $('#nt-clear').addEventListener('click', () => { const ids = S.find('notifications', n => n.read).map(n => n.id); S.remove('notifications', ids); draw(); K.ui.toast(`${ids.length} notifikasi dihapus`); });
      $('#nt-prefs').addEventListener('submit', e => {
        e.preventDefault();
        const out = {}; Object.keys(typeMeta).forEach(k => { out[k] = K.ui.checkedValues(e.target, k); });
        K.prefs.set('kontrol:notif-prefs', out); K.prefs.set('kontrol:quiet', e.target.quiet.checked);
        K.ui.toast('Preferensi notifikasi disimpan');
      });
      draw();
    },
  });

  /* ======================= TASKS & JOBS ======================= */
  const cronHuman = c => ({
    '0 2 * * *': 'Setiap hari 02.00', '0 8 * * 1': 'Senin 08.00', '0 1 * * *': 'Setiap hari 01.00', '30 3 * * *': 'Setiap hari 03.30',
    '*/30 * * * *': 'Setiap 30 menit', '* * * * *': 'Setiap menit', '0 0 * * 0': 'Minggu 00.00', '0 */6 * * *': 'Setiap 6 jam',
    '*/5 * * * *': 'Setiap 5 menit', '0 */4 * * *': 'Setiap 4 jam', '0 4 1 * *': 'Tanggal 1, 04.00', '0 5 * * *': 'Setiap hari 05.00', '0 * * * *': 'Setiap jam',
    manual: 'Manual', event: 'Dipicu event',
  }[c] || c);
  const dur = s => s == null ? '—' : s < 60 ? s + 'd' : Math.floor(s / 60) + 'm ' + (s % 60) + 'd';

  K.page('tasks', {
    render(view) {
      view.innerHTML = `${K.ui.pageHead({
        title: 'Tasks & Jobs', eyebrow: 'System', desc: 'Pantau background job, antrean, dan tugas terjadwal (cron).',
        actions: `<button type="button" class="btn btn-primary btn-sm" id="tk-new">${icon('plus')}<span>Job terjadwal baru</span></button>`,
      })}<div class="grid grid-4" id="tk-kpis"></div>
        <div class="grid grid-main-side mt-4">
          <article class="card"><div class="card__head"><div><h2 class="card__title">Throughput antrean</h2><p class="card__desc">Job diproses per jam (24 jam terakhir)</p></div></div><div class="chart-box mt-5" style="height:200px"><canvas id="tk-chart" role="img" aria-label="Throughput job per jam"></canvas></div></article>
          <article class="card"><h2 class="card__title">Worker</h2><p class="card__desc">Status proses pekerja</p><div class="list mt-4" id="tk-workers"></div></article>
        </div>
        <div class="mt-4" id="tk-table"></div>`;
      const $ = s => view.querySelector(s);

      const kpis = () => {
        const t = S.all('tasks');
        $('#tk-kpis').innerHTML = [
          K.ui.kpi({ label: 'Sedang berjalan', value: num(t.filter(x => x.status === 'running').length), icon: 'loader', foot: 'diperbarui langsung' }),
          K.ui.kpi({ label: 'Dalam antrean', value: num(t.filter(x => x.status === 'queued').length), icon: 'list-ordered', foot: 'menunggu worker' }),
          K.ui.kpi({ label: 'Gagal (24 jam)', value: num(t.filter(x => x.status === 'failed').length), icon: 'circle-x', foot: 'perlu tindakan' }),
          K.ui.kpi({ label: 'Tingkat sukses', value: '98,6<small>%</small>', icon: 'circle-check', trend: 0.4, foot: '7 hari' }),
        ].join('');
      };
      const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0') + ':00');
      K.charts.bar($('#tk-chart'), { labels: hours, datasets: [{ label: 'Job', data: K.util.series(24, 320, 120, 0, 5), color: K.charts.token('--chart-1') }] });
      $('#tk-workers').innerHTML = [['worker-default-1', 'Antrean default', 82], ['worker-default-2', 'Antrean default', 64], ['worker-notif-1', 'Notifikasi', 91], ['worker-etl-1', 'ETL & laporan', 37]].map(([n, q, c]) => `<div class="list-item"><span class="icon-tile icon-tile--success">${icon('cpu')}</span><div class="list-item__body"><p class="list-item__title mono text-sm">${n}</p><p class="list-item__sub">${q} · CPU ${c}%</p><div class="mt-2">${K.ui.progress(c, c > 85 ? 'warning' : '')}</div></div></div>`).join('');

      const table = new K.DataTable($('#tk-table'), {
        title: 'Semua job', rows: () => S.all('tasks'), pageSize: 10, search: r => r.name + ' ' + r.type,
        tabs: { key: 'status', options: [['running', 'Berjalan'], ['queued', 'Antre'], ['scheduled', 'Terjadwal'], ['failed', 'Gagal'], ['paused', 'Dijeda'], ['success', 'Berhasil']] },
        selects: [{ key: 'type', label: 'Semua tipe', options: [...new Set(S.all('tasks').map(t => t.type))].map(t => [t, t]) }],
        columns: [
          { key: 'name', label: 'Job', sortable: true, render: r => `<div><p class="fw-500">${esc(r.name)}</p><p class="text-xs text-secondary">${esc(r.type)} · <span class="mono">${esc(r.id)}</span></p></div>` },
          { key: 'schedule', label: 'Jadwal', className: 'hide-md', render: r => `<p class="text-sm">${esc(cronHuman(r.schedule))}</p>${/^[\d*]/.test(r.schedule) ? `<p class="mono text-xs text-muted">${esc(r.schedule)}</p>` : ''}` },
          { key: 'progress', label: 'Progres', render: r => r.status === 'running' ? `<div style="min-width:110px"><p class="text-xs tabular fw-600" data-prog-label="${r.id}">${r.progress}%</p><div data-prog="${r.id}">${K.ui.progress(r.progress)}</div></div>` : r.status === 'success' ? `<span class="text-xs text-secondary">Selesai · ${dur(r.duration)}</span>` : r.status === 'failed' ? `<span class="text-xs text-danger">${r.attempts}× percobaan</span>` : '<span class="text-muted">—</span>' },
          { key: 'lastRun', label: 'Terakhir', sortable: true, className: 'hide-lg nowrap', render: r => `<span class="text-secondary">${K.util.ago(r.lastRun)}</span>` },
          { key: 'nextRun', label: 'Berikutnya', className: 'hide-sm nowrap', render: r => r.nextRun ? `<span class="text-secondary">${K.util.time(r.nextRun)}</span>` : '<span class="text-muted">—</span>' },
          { key: 'status', label: 'Status', render: r => K.ui.badge(r.status) },
        ],
        rowActions: r => `${r.status === 'failed' ? K.ui.iconBtn('rotate-ccw', 'Coba lagi', 'data-action="retry"') : K.ui.iconBtn('play', 'Jalankan sekarang', `data-action="run" ${r.status === 'running' ? 'disabled' : ''}`)}
          ${K.ui.iconBtn(r.status === 'paused' ? 'circle-play' : 'circle-pause', r.status === 'paused' ? 'Lanjutkan' : 'Jeda', 'data-action="pause"')}${K.ui.iconBtn('scroll-text', 'Lihat log', 'data-action="logs"')}`,
        onAction: (a, r) => {
          if (a === 'run' || a === 'retry') { S.update('tasks', r.id, { status: 'running', progress: 0, lastRun: new Date().toISOString(), lastError: null }); table.refresh(); kpis(); K.ui.toast(a === 'retry' ? 'Job dicoba ulang' : 'Job dijalankan', r.name, 'info'); }
          if (a === 'pause') { S.update('tasks', r.id, { status: r.status === 'paused' ? 'scheduled' : 'paused', nextRun: r.status === 'paused' ? new Date(Date.now() + 3600e3).toISOString() : null }); table.refresh(); kpis(); K.ui.toast(r.status === 'paused' ? 'Job dijeda' : 'Job dilanjutkan', r.name); }
          if (a === 'logs') logs(r);
        },
      });

      function logs(r) {
        const t0 = new Date(r.lastRun).getTime();
        const lines = [['INFO', 'Job dimulai oleh scheduler'], ['INFO', 'Mengambil lock terdistribusi job:' + r.id], ['INFO', 'Memproses batch 1/4'], ['INFO', 'Memproses batch 2/4'],
          ...(r.status === 'failed' ? [['WARN', 'Percobaan 4 gagal, backoff 16s'], ['ERROR', r.lastError]] : [['INFO', 'Memproses batch 3/4'], ['INFO', 'Memproses batch 4/4'], ['INFO', 'Selesai, lock dilepas']])];
        K.ui.modal({
          title: 'Log job', desc: esc(r.name), size: 'lg',
          body: `<div class="code" style="max-height:360px">${lines.map(([lv, msg], i) => `<span class="c-c">${new Date(t0 + i * 4100).toISOString().slice(11, 19)}</span> <span class="${lv === 'ERROR' ? 'c-n' : lv === 'WARN' ? 'c-n' : 'c-k'}">${lv.padEnd(5)}</span> ${esc(msg)}`).join('\n')}</div>`,
          footer: `<button type="button" class="btn btn-secondary" data-dismiss>Tutup</button>`,
        });
      }

      $('#tk-new').addEventListener('click', () => K.ui.modal({
        title: 'Job terjadwal baru',
        body: `${K.ui.field({ name: 'name', label: 'Nama job', required: true })}
          ${K.ui.field({ name: 'type', label: 'Tipe', type: 'select', options: ['ETL', 'Report', 'Maintenance', 'Export', 'Queue', 'Analytics', 'Integration'] })}
          ${K.ui.field({ name: 'schedule', label: 'Ekspresi cron', required: true, value: '0 6 * * *', help: 'Format: menit jam tanggal bulan hari. Contoh: 0 6 * * * = setiap hari 06.00 WIB.', attrs: 'spellcheck="false" style="font-family:var(--font-mono)"' })}
          ${K.ui.field({ name: 'command', label: 'Perintah / handler', placeholder: 'app.jobs.sync_daily' })}`,
        submitLabel: 'Buat job',
        onSubmit: d => {
          if (d.schedule.split(/\s+/).length !== 5) { K.ui.toast('Ekspresi cron tidak valid', 'Harus 5 bagian.', 'error'); return false; }
          S.insert('tasks', { name: d.name, type: d.type, schedule: d.schedule, status: 'scheduled', progress: 0, lastRun: new Date().toISOString(), nextRun: new Date(Date.now() + 6 * 3600e3).toISOString(), duration: null, attempts: 0, owner: 'usr_me' }, { idPrefix: 'job' });
          table.refresh(); kpis(); K.ui.toast('Job dibuat', d.name);
        },
      }));

      // Simulasi progres langsung untuk job yang berjalan
      const timer = setInterval(() => {
        S.all('tasks').filter(t => t.status === 'running').forEach(t => {
          const p = Math.min(100, t.progress + Math.ceil(Math.random() * 6));
          if (p >= 100) { S.update('tasks', t.id, { status: 'success', progress: 100, duration: 60 + Math.round(Math.random() * 300) }); table.refresh(); kpis(); K.ui.toast('Job selesai', t.name); }
          else {
            t.progress = p;
            const bar = view.querySelector(`[data-prog="${t.id}"] .progress > span`), lbl = view.querySelector(`[data-prog-label="${t.id}"]`);
            if (bar) bar.style.width = p + '%'; if (lbl) lbl.textContent = p + '%';
          }
        });
      }, 1500);
      kpis();
      return () => clearInterval(timer);
    },
  });

  /* ======================= AUDIT LOGS ======================= */
  K.page('audit', {
    render(view) {
      view.innerHTML = `${K.ui.pageHead({
        title: 'Audit Logs', eyebrow: 'System', desc: 'Jejak tak terubah dari setiap aksi penting di workspace. Disimpan 365 hari.',
      })}
        <div class="grid grid-4" id="au-kpis"></div>
        <div class="mt-4" id="au-table"></div>`;
      const $ = s => view.querySelector(s);
      const logs = S.all('auditLogs');
      $('#au-kpis').innerHTML = [
        K.ui.kpi({ label: 'Event (30 hari)', value: num(logs.length), icon: 'scroll-text', foot: 'tercatat' }),
        K.ui.kpi({ label: 'Aksi kritis', value: num(logs.filter(l => l.severity === 'danger').length), icon: 'octagon-alert', foot: 'hapus / cabut / tangguhkan' }),
        K.ui.kpi({ label: 'Login gagal', value: num(logs.filter(l => l.action === 'user.login_failed').length), icon: 'lock', foot: 'pantau brute force' }),
        K.ui.kpi({ label: 'Aktor unik', value: num(new Set(logs.map(l => l.actorId)).size), icon: 'users', foot: 'pengguna & API' }),
      ].join('');

      new K.DataTable($('#au-table'), {
        title: 'Riwayat audit', rows: () => S.all('auditLogs'), pageSize: 12, exportName: 'audit-log',
        search: r => `${r.label} ${r.action} ${r.resource} ${r.ip} ${K.lookup.user(r.actorId).name}`,
        searchPlaceholder: 'Cari aksi, aktor, IP…',
        tabs: { key: 'severity', options: [['info', 'Info'], ['warning', 'Peringatan'], ['danger', 'Kritis']] },
        selects: [
          { key: 'resourceType', label: 'Semua sumber daya', options: [...new Set(logs.map(l => l.resourceType))].sort().map(t => [t, t]) },
          { key: 'actorId', label: 'Semua aktor', options: [...new Set(logs.map(l => l.actorId))].map(id => [id, K.lookup.user(id).name]).sort((a, b) => a[1].localeCompare(b[1])) },
        ],
        defaultSort: { key: 'createdAt', dir: 'desc' },
        columns: [
          { key: 'createdAt', label: 'Waktu', sortable: true, className: 'nowrap', render: r => `<p class="text-sm">${K.util.date(r.createdAt, { day: '2-digit', month: 'short' })}</p><p class="text-xs text-muted">${K.util.time(r.createdAt)}</p>`, csv: r => r.createdAt },
          { key: 'actorId', label: 'Aktor', className: 'hide-sm', render: r => K.ui.person(K.lookup.user(r.actorId), ''), csv: r => K.lookup.user(r.actorId).name },
          { key: 'label', label: 'Aksi', render: r => `<p class="fw-500">${esc(r.label)}</p><p class="mono text-xs text-secondary">${esc(r.action)}</p>` },
          { key: 'resource', label: 'Sumber daya', className: 'hide-md', render: r => `<span class="text-xs text-muted">${esc(r.resourceType)}</span><p class="truncate" style="max-width:200px">${esc(r.resource)}</p>` },
          { key: 'ip', label: 'IP', className: 'hide-lg', render: r => `<span class="mono text-xs">${esc(r.ip)}</span>` },
          { key: 'severity', label: 'Tingkat', render: r => K.ui.badge(r.severity) },
        ],
        rowActions: () => K.ui.iconBtn('braces', 'Lihat detail', 'data-action="view"'),
        onAction: (a, r) => a === 'view' && K.ui.modal({
          title: r.label, desc: `<span class="mono">${esc(r.id)}</span>`, size: 'lg',
          body: `<dl class="dl"><dt>Aktor</dt><dd>${esc(K.lookup.user(r.actorId).name)} (${esc(K.lookup.user(r.actorId).email)})</dd><dt>Waktu</dt><dd>${K.util.dateTime(r.createdAt)}</dd><dt>IP</dt><dd class="mono">${esc(r.ip)}</dd><dt>User agent</dt><dd>${esc(r.userAgent)}</dd><dt>Tingkat</dt><dd>${K.ui.badge(r.severity)}</dd></dl>
            <p class="section-label">Payload event</p><div class="code">${esc(JSON.stringify({ id: r.id, action: r.action, actor: { id: r.actorId }, target: { type: r.resourceType, name: r.resource }, context: { ip: r.ip, user_agent: r.userAgent }, occurred_at: r.createdAt }, null, 2))}</div>`,
          footer: '<button type="button" class="btn btn-secondary" data-dismiss>Tutup</button>',
        }),
      });
    },
  });

  /* ======================= SYSTEM HEALTH ======================= */
  K.page('health', {
    render(view) {
      const services = [
        ['API Gateway', 'operational', 99.99, 42], ['Web Dashboard', 'operational', 99.98, 118], ['Database (PostgreSQL)', 'operational', 99.995, 6],
        ['Background Workers', 'operational', 99.94, null], ['Notification Hub', 'operational', 99.91, 210], ['Billing Service', 'degraded', 98.72, 640],
        ['Object Storage', 'operational', 99.999, 88], ['Search Index', 'operational', 99.96, 31],
      ];
      view.innerHTML = `${K.ui.pageHead({
        title: 'System Health', eyebrow: 'System', desc: 'Status layanan, pemakaian sumber daya, dan riwayat insiden.',
        actions: `<span class="text-xs text-secondary" id="hl-updated"></span><button type="button" class="btn btn-secondary btn-sm" id="hl-refresh">${icon('refresh-cw')}<span>Muat ulang</span></button>`,
      })}
        <div class="health-banner">${icon('triangle-alert')}<div><p class="fw-600">Sebagian layanan mengalami penurunan performa</p><p class="text-sm">Billing Service merespons lebih lambat dari biasanya. Tim sedang menyelidiki — tidak ada data yang hilang.</p></div></div>
        <div class="grid grid-4 mt-4" id="hl-res"></div>
        <div class="grid grid-main-side mt-4">
          <article class="card"><div class="card__head"><div><h2 class="card__title">Status layanan</h2><p class="card__desc">Uptime 90 hari terakhir</p></div><div class="legend"><span class="legend__item"><span class="legend__swatch" style="background:var(--success)"></span>Normal</span><span class="legend__item"><span class="legend__swatch" style="background:var(--warning)"></span>Menurun</span><span class="legend__item"><span class="legend__swatch" style="background:var(--danger)"></span>Gangguan</span></div></div>
            <div class="stack mt-5" style="gap:18px">${services.map(([n, st, up, ms], si) => {
              const r = K.util.rng(si + 3);
              const bars = Array.from({ length: 90 }, (_, i) => { const x = r(); const s = st === 'degraded' && i > 86 ? 'w' : x > 0.985 ? 'd' : x > 0.96 ? 'w' : 'ok'; return `<span class="uptime__bar uptime__bar--${s}" title="${K.util.date(K.NOW - (89 - i) * 86400000)}: ${s === 'ok' ? 'normal' : s === 'w' ? 'menurun' : 'gangguan'}"></span>`; }).join('');
              return `<div><div class="flex items-center justify-between gap-2 wrap"><p class="fw-500 flex items-center gap-2">${n}</p><span class="flex items-center gap-3 text-xs text-secondary">${ms ? `<span class="tabular">${ms} ms</span>` : ''}<span class="tabular">${num(up, 2)}%</span>${K.ui.badge(st)}</span></div><div class="uptime mt-2" aria-label="Uptime ${n} 90 hari: ${num(up, 2)}%" role="img">${bars}</div></div>`;
            }).join('')}<div class="flex justify-between text-xs text-muted"><span>90 hari lalu</span><span>Hari ini</span></div></div>
          </article>
          <div class="stack">
            <article class="card"><div class="card__head"><div><h2 class="card__title">Waktu respons API</h2><p class="card__desc">p50 &amp; p95, 24 jam</p></div></div><div class="chart-box mt-4" style="height:160px"><canvas id="hl-latency" role="img" aria-label="Waktu respons API"></canvas></div></article>
            <article class="card"><h2 class="card__title">Riwayat insiden</h2><div class="timeline mt-4">
              ${[['triangle-alert', 'warning', 'Billing Service lambat', 'Investigasi · dimulai 45 menit lalu'], ['circle-check', 'success', 'Gangguan pengiriman WhatsApp', 'Terselesaikan · 12 Okt, durasi 38 menit'], ['circle-check', 'success', 'Pemeliharaan database terjadwal', 'Selesai · 5 Okt, 02.00–02.20 WIB'], ['circle-check', 'success', 'Latensi tinggi region Jakarta', 'Terselesaikan · 28 Sep, durasi 14 menit']].map(([ic, tone, t, s]) => `<div class="timeline-item"><span class="timeline-item__icon" style="color:var(--${tone})">${icon(ic)}</span><div class="timeline-item__body"><p class="fw-500">${t}</p><p class="timeline-item__time">${s}</p></div></div>`).join('')}
            </div></article>
          </div>
        </div>`;
      const $ = s => view.querySelector(s);

      const res = { cpu: K.util.series(30, 42, 10, 0, 1), mem: K.util.series(30, 63, 4, 0, 2), disk: K.util.series(30, 71, 1, 0, 3), net: K.util.series(30, 120, 40, 0, 4) };
      const meta = [['cpu', 'CPU', 'cpu', '%', 85], ['mem', 'Memori', 'memory-stick', '%', 85], ['disk', 'Disk', 'hard-drive', '%', 90], ['net', 'Jaringan', 'network', ' Mbps', 1e9]];
      $('#hl-res').innerHTML = meta.map(([k, l, ic]) => `<article class="card kpi"><div class="kpi__head"><h2 class="kpi__label">${l}</h2><span class="kpi__icon">${icon(ic)}</span></div><p class="kpi__value" data-val="${k}"></p><div class="chart-box mt-3" style="height:44px"><canvas data-spark="${k}" aria-hidden="true"></canvas></div></article>`).join('');
      const sparks = {};
      const paint = () => {
        meta.forEach(([k, , , unit, warn]) => {
          const v = res[k][res[k].length - 1];
          const el = view.querySelector(`[data-val="${k}"]`);
          el.innerHTML = `${num(v)}<small>${unit}</small>`;
          el.style.color = v > warn ? 'var(--warning)' : '';
          if (sparks[k]) { sparks[k].data.datasets[0].data = res[k]; sparks[k].update('none'); }
          else sparks[k] = K.charts.sparkline(view.querySelector(`[data-spark="${k}"]`), res[k]);
        });
        $('#hl-updated').textContent = 'Diperbarui ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':');
      };
      const hrs = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0') + ':00');
      const p50 = K.util.series(24, 70, 14, 0, 8);
      K.charts.line($('#hl-latency'), { labels: hrs, datasets: [{ label: 'p50', data: p50 }, { label: 'p95', data: p50.map((v, i) => v * 2.4 + (i > 21 ? 160 : 0)), dashed: true }], yFormat: v => v + ' ms', tooltipFormat: v => Math.round(v) + ' ms' });

      const tick = () => {
        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
        res.cpu.push(clamp(res.cpu.at(-1) + (Math.random() - 0.5) * 14, 8, 96)); res.cpu.shift();
        res.mem.push(clamp(res.mem.at(-1) + (Math.random() - 0.5) * 3, 40, 92)); res.mem.shift();
        res.disk.push(clamp(res.disk.at(-1) + (Math.random() - 0.45) * 0.4, 60, 95)); res.disk.shift();
        res.net.push(clamp(res.net.at(-1) + (Math.random() - 0.5) * 50, 20, 400)); res.net.shift();
        paint();
      };
      paint();
      const timer = setInterval(tick, 3000);
      $('#hl-refresh').addEventListener('click', () => { tick(); K.ui.toast('Status diperbarui', '', 'info', 1800); });
      return () => clearInterval(timer);
    },
  });
})(window.K);
