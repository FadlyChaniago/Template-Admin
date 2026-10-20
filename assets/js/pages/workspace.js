/* ==========================================================================
   Workspace → Analytics, Reports, Activity Log
   ========================================================================== */
(function (K) {
  'use strict';
  const { esc, num, idr } = K.util;
  const { icon } = K.ui;

  /* ======================= ANALYTICS ======================= */
  K.page('analytics', {
    render(view) {
      let range = 30;
      view.innerHTML = `
        ${K.ui.pageHead({
          title: 'Analytics', eyebrow: 'Workspace',
          desc: 'Analisis trafik, sumber akuisisi, perangkat, dan konversi pengunjung.',
          actions: `<div class="segmented" role="group" aria-label="Rentang waktu">${[7, 30, 90].map(d => `<button type="button" data-range="${d}" aria-pressed="${d === range}">${d} hari</button>`).join('')}</div>
            <button type="button" class="btn btn-secondary btn-sm" id="an-export">${icon('download')}<span>Ekspor</span></button>`,
        })}
        <div class="grid grid-4" id="an-kpis"></div>
        <div class="grid grid-main-side mt-4">
          <article class="card">
            <div class="card__head"><div><h2 class="card__title">Sesi &amp; pengunjung</h2><p class="card__desc" id="an-range-label"></p></div>
              <div class="legend"><span class="legend__item"><span class="legend__line" style="background:var(--chart-1)"></span>Sesi</span><span class="legend__item"><span class="legend__line" style="background:var(--chart-2)"></span>Pengunjung unik</span></div></div>
            <div class="chart-box mt-5" style="height:260px"><canvas id="an-traffic" role="img" aria-label="Grafik sesi dan pengunjung"></canvas></div>
          </article>
          <article class="card">
            <div class="card__head"><div><h2 class="card__title">Perangkat</h2><p class="card__desc">Proporsi sesi per perangkat</p></div></div>
            <div class="chart-box mt-5" style="height:170px"><canvas id="an-device" role="img" aria-label="Proporsi perangkat"></canvas></div>
            <div class="stack mt-5" style="gap:10px" id="an-device-legend"></div>
          </article>
        </div>
        <div class="grid grid-2 mt-4">
          <article class="card">
            <div class="card__head"><div><h2 class="card__title">Sumber trafik</h2><p class="card__desc">Sesi berdasarkan kanal akuisisi</p></div></div>
            <div class="chart-box mt-5" style="height:240px"><canvas id="an-channels" role="img" aria-label="Sesi per kanal"></canvas></div>
          </article>
          <article class="card">
            <div class="card__head"><div><h2 class="card__title">Corong konversi</h2><p class="card__desc">Dari kunjungan hingga pembayaran</p></div></div>
            <div class="card__body stack" style="gap:14px" id="an-funnel"></div>
          </article>
        </div>
        <div class="grid grid-main-side mt-4">
          <article class="card card--flush">
            <div class="card__head"><div><h2 class="card__title">Halaman teratas</h2><p class="card__desc">Berdasarkan jumlah tampilan</p></div></div>
            <div class="table-wrap"><table class="table"><thead><tr><th scope="col">Halaman</th><th scope="col" class="num">Tampilan</th><th scope="col" class="num hide-sm">Rata-rata waktu</th><th scope="col" class="num hide-md">Bounce</th></tr></thead><tbody id="an-pages"></tbody></table></div>
          </article>
          <article class="card">
            <div class="card__head"><div><h2 class="card__title">Kota teratas</h2><p class="card__desc">Lokasi pengunjung</p></div></div>
            <div class="card__body stack" style="gap:14px" id="an-geo"></div>
          </article>
        </div>
        <article class="card mt-4">
          <div class="card__head"><div><h2 class="card__title">Retensi kohort</h2><p class="card__desc">Persentase pengguna yang kembali per minggu sejak bergabung</p></div></div>
          <div class="table-wrap mt-5"><table class="table cohort" id="an-cohort"></table></div>
        </article>`;
      const $ = s => view.querySelector(s);

      function draw() {
        const f = range / 30;
        const sessions = K.util.series(range, 4200, 900, 12, range);
        const visitors = sessions.map((v, i) => Math.round(v * (0.68 + ((i * 7) % 5) / 100)));
        const totalS = sessions.reduce((a, b) => a + b, 0);
        $('#an-range-label').textContent = `${range} hari terakhir · ${num(totalS)} sesi`;
        $('#an-kpis').innerHTML = [
          K.ui.kpi({ label: 'Total sesi', value: num(totalS), icon: 'mouse-pointer-click', trend: 9.4, foot: 'vs periode lalu' }),
          K.ui.kpi({ label: 'Tampilan halaman', value: num(Math.round(totalS * 3.1)), icon: 'eye', trend: 11.2, foot: 'vs periode lalu' }),
          K.ui.kpi({ label: 'Bounce rate', value: `${num(38.4 - f, 1)}<small>%</small>`, icon: 'log-out', trend: -2.1, trendInvert: true, foot: 'lebih rendah lebih baik' }),
          K.ui.kpi({ label: 'Rata-rata durasi', value: '3m 42d', icon: 'timer', trend: 4.6, foot: 'vs periode lalu' }),
        ].join('');

        K.charts.destroyAll();
        K.charts.line($('#an-traffic'), { labels: K.util.dayLabels(range), datasets: [{ label: 'Sesi', data: sessions }, { label: 'Pengunjung unik', data: visitors, dashed: true }] });

        const devices = [['Desktop', 54], ['Mobile', 39], ['Tablet', 7]];
        const pal = K.charts.palette();
        K.charts.doughnut($('#an-device'), { labels: devices.map(d => d[0]), data: devices.map(d => d[1]), tooltipFormat: v => v + '%' });
        $('#an-device-legend').innerHTML = devices.map(([n, v], i) => `<div class="flex items-center justify-between text-sm"><span class="legend__item"><span class="legend__swatch" style="background:${pal[i]}"></span>${n}</span><span class="fw-600 tabular">${v}%</span></div>`).join('');

        const ch = ['Organik', 'Langsung', 'Referral', 'Sosial', 'Email', 'Berbayar'];
        const chVals = [41, 24, 12, 10, 8, 5].map(p => Math.round((p / 100) * totalS));
        K.charts.bar($('#an-channels'), { labels: ch, datasets: [{ label: 'Sesi', data: chVals, color: K.charts.token('--chart-1') }], horizontal: true });

        const funnel = [['Kunjungan', totalS], ['Lihat harga', Math.round(totalS * 0.34)], ['Mulai daftar', Math.round(totalS * 0.12)], ['Checkout', Math.round(totalS * 0.058)], ['Pembayaran berhasil', Math.round(totalS * 0.0362)]];
        $('#an-funnel').innerHTML = funnel.map(([l, v], i) => `<div><div class="flex justify-between text-sm"><span class="fw-500">${i + 1}. ${l}</span><span class="tabular"><span class="fw-600">${num(v)}</span> <span class="text-secondary text-xs">${num((v / totalS) * 100, 1)}%</span></span></div><div class="mt-2">${K.ui.progress((v / totalS) * 100)}</div>${i ? `<p class="text-xs text-muted mt-1">${num((v / funnel[i - 1][1]) * 100, 1)}% dari langkah sebelumnya</p>` : ''}</div>`).join('');

        const pages = [['/beranda', 0.31, '1m 52d', 41], ['/harga', 0.18, '2m 40d', 33], ['/fitur/laporan', 0.12, '3m 05d', 28], ['/blog/rilis-oktober-2026', 0.09, '4m 18d', 22], ['/docs/memulai', 0.07, '5m 31d', 19], ['/kontak', 0.04, '1m 12d', 52]];
        $('#an-pages').innerHTML = pages.map(([p, share, t, b]) => `<tr><td><span class="mono text-sm">${p}</span></td><td class="num fw-500">${num(Math.round(totalS * 3.1 * share))}</td><td class="num hide-sm text-secondary">${t}</td><td class="num hide-md">${b}%</td></tr>`).join('');

        const geo = [['Jakarta', 34], ['Surabaya', 14], ['Bandung', 12], ['Medan', 8], ['Yogyakarta', 7], ['Makassar', 5]];
        $('#an-geo').innerHTML = geo.map(([c, p]) => `<div><div class="flex justify-between text-sm"><span class="fw-500">${c}</span><span class="tabular text-secondary">${p}%</span></div><div class="mt-2">${K.ui.progress(p * 2.5)}</div></div>`).join('');

        const weeks = ['Minggu 0', 'Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4', 'Minggu 5'];
        const cohorts = ['8 Sep', '15 Sep', '22 Sep', '29 Sep', '6 Okt', '13 Okt'];
        const r = K.util.rng(range);
        $('#an-cohort').innerHTML = `<thead><tr><th scope="col">Kohort</th><th scope="col" class="num">Pengguna</th>${weeks.map(w => `<th scope="col" class="num">${w}</th>`).join('')}</tr></thead><tbody>${cohorts.map((c, i) => {
          let v = 100;
          return `<tr><td class="fw-500 nowrap">${c}</td><td class="num">${num(380 + Math.round(r() * 220))}</td>${weeks.map((_, w) => {
            if (w > cohorts.length - 1 - i) return '<td></td>';
            if (w) v = Math.max(8, v * (0.55 + r() * 0.25));
            return `<td class="num"><span class="cohort-cell" style="--a:${(v / 100).toFixed(2)}">${num(v, 0)}%</span></td>`;
          }).join('')}</tr>`;
        }).join('')}</tbody>`;
      }

      view.querySelectorAll('[data-range]').forEach(b => b.addEventListener('click', () => {
        range = Number(b.dataset.range);
        view.querySelectorAll('[data-range]').forEach(x => x.setAttribute('aria-pressed', x === b));
        draw();
      }));
      $('#an-export').addEventListener('click', () => {
        K.util.downloadFile(`analytics-${range}hari.csv`, '﻿Tanggal,Sesi\n' + K.util.dayLabels(range).map((d, i) => `${d},${K.util.series(range, 4200, 900, 12, range)[i]}`).join('\n'), 'text/csv');
        K.ui.toast('Data analytics diekspor');
      });
      draw();
    },
  });

  /* ======================= REPORTS ======================= */
  const reportForm = (r = {}) => `<div class="form-grid">
    ${K.ui.field({ name: 'name', label: 'Nama laporan', required: true, value: r.name, placeholder: 'mis. Pendapatan per Produk', span: true })}
    ${K.ui.field({ name: 'category', label: 'Kategori', type: 'select', value: r.category, options: ['Keuangan', 'Pengguna', 'Marketing', 'Produk', 'Operasional', 'Developer', 'Keamanan', 'Eksekutif'] })}
    ${K.ui.field({ name: 'format', label: 'Format', type: 'select', value: r.format || 'PDF', options: ['PDF', 'XLSX', 'CSV'] })}
    ${K.ui.field({ name: 'schedule', label: 'Jadwal', type: 'select', value: r.schedule || 'Mingguan', options: ['Sekali', 'Harian', 'Mingguan', 'Bulanan', 'Kuartalan'] })}
    ${K.ui.field({ name: 'recipients', label: 'Penerima email', value: r.recipients || 'fadly@kontrol.id', help: 'Pisahkan dengan koma.' })}
  </div>`;

  K.page('reports', {
    render(view, route) {
      const all = () => K.store.all('reports');
      view.innerHTML = `${K.ui.pageHead({
        title: 'Reports', eyebrow: 'Workspace', desc: 'Buat, jadwalkan, dan unduh laporan bisnis Anda.',
        actions: `<button type="button" class="btn btn-primary btn-sm" id="rp-new">${icon('plus')}<span>Laporan baru</span></button>`,
      })}
        <div class="grid grid-4" id="rp-stats"></div>
        <p class="section-label mt-6">Template cepat</p>
        <div class="grid grid-4" id="rp-templates"></div>
        <div class="mt-6" id="rp-table"></div>`;
      const $ = s => view.querySelector(s);

      const stats = () => {
        const a = all();
        $('#rp-stats').innerHTML = [
          K.ui.kpi({ label: 'Total laporan', value: num(a.length), icon: 'files', foot: 'tersimpan di workspace' }),
          K.ui.kpi({ label: 'Terjadwal', value: num(a.filter(r => r.schedule !== 'Sekali').length), icon: 'calendar-clock', foot: 'berjalan otomatis' }),
          K.ui.kpi({ label: 'Dibuat bulan ini', value: '46', icon: 'file-check', trend: 15, foot: 'vs bulan lalu' }),
          K.ui.kpi({ label: 'Gagal', value: num(a.filter(r => r.status === 'failed').length), icon: 'file-x', foot: 'perlu ditinjau' }),
        ].join('');
      };

      const templates = [['Pendapatan', 'wallet', 'Keuangan'], ['Pertumbuhan pengguna', 'trending-up', 'Pengguna'], ['Kinerja kampanye', 'megaphone', 'Marketing'], ['Ringkasan eksekutif', 'presentation', 'Eksekutif']];
      $('#rp-templates').innerHTML = templates.map(([n, ic, cat]) => `<button type="button" class="card card--hover" style="text-align:left;display:flex;gap:12px;align-items:center" data-template="${esc(n)}" data-cat="${cat}"><span class="icon-tile">${icon(ic)}</span><span class="flex-1"><span class="fw-600" style="display:block">${n}</span><span class="text-xs text-secondary">${cat}</span></span>${icon('plus', 'text-muted')}</button>`).join('');

      const fmtIcon = { PDF: 'file-text', XLSX: 'file-spreadsheet', CSV: 'file-code' };
      const table = new K.DataTable($('#rp-table'), {
        title: 'Semua laporan', rows: all, pageSize: 8, selectable: true, exportName: 'daftar-laporan',
        search: r => r.name + ' ' + r.category,
        tabs: { key: 'status', options: [['ready', 'Siap'], ['generating', 'Diproses'], ['scheduled', 'Terjadwal'], ['failed', 'Gagal']] },
        selects: [{ key: 'category', label: 'Semua kategori', options: [...new Set(K.store.all('reports').map(r => r.category))].map(c => [c, c]) }],
        columns: [
          { key: 'name', label: 'Laporan', sortable: true, render: r => `<div class="flex items-center gap-3"><span class="icon-tile">${icon(fmtIcon[r.format] || 'file')}</span><div><p class="fw-500">${esc(r.name)} ${r.favorite ? icon('star', 'star-on') : ''}</p><p class="text-xs text-secondary">${esc(r.category)} · ${esc(r.format)}</p></div></div>` },
          { key: 'schedule', label: 'Jadwal', className: 'hide-md', render: r => `<span class="chip">${esc(r.schedule)}</span>` },
          { key: 'ownerId', label: 'Pemilik', className: 'hide-lg', render: r => K.ui.person(K.lookup.user(r.ownerId), ''), csv: r => K.lookup.user(r.ownerId).name },
          { key: 'lastGenerated', label: 'Terakhir dibuat', sortable: true, className: 'hide-sm nowrap', sortValue: r => r.lastGenerated || '', render: r => r.lastGenerated ? `<span class="text-secondary">${K.util.ago(r.lastGenerated)}</span>` : '<span class="text-muted">—</span>' },
          { key: 'status', label: 'Status', render: r => K.ui.badge(r.status) },
        ],
        rowActions: r => `${K.ui.iconBtn('download', 'Unduh', `data-action="download" ${r.status !== 'ready' ? 'disabled' : ''}`)}${K.ui.iconBtn('play', 'Jalankan sekarang', 'data-action="run"')}
          <div class="menu-anchor">${K.ui.iconBtn('ellipsis', 'Aksi lainnya', 'data-menu-toggle aria-expanded="false"')}<div class="menu" role="menu">
            <button type="button" class="menu__item" data-action="fav">${icon('star')}${r.favorite ? 'Hapus dari favorit' : 'Jadikan favorit'}</button>
            <button type="button" class="menu__item" data-action="edit">${icon('pencil')}Edit</button>
            <button type="button" class="menu__item" data-action="dup">${icon('copy')}Duplikat</button>
            <div class="menu__sep"></div>
            <button type="button" class="menu__item menu__item--danger" data-action="delete">${icon('trash-2')}Hapus</button></div></div>`,
        bulkActions: [{ label: 'Hapus', icon: 'trash-2', variant: 'danger', handler: ids => K.ui.confirm({ title: `Hapus ${ids.length} laporan?`, text: 'Laporan yang dihapus tidak dapat dipulihkan.' }).then(ok => { if (ok) { K.store.remove('reports', ids); stats(); K.ui.toast(`${ids.length} laporan dihapus`); } return ok; }) }],
        onAction: (a, r) => {
          if (a === 'download') {
            K.util.downloadFile(K.util.slugify(r.name) + '.csv', '﻿Laporan,' + r.name + '\nDibuat,' + K.util.dateTime(r.lastGenerated) + '\nCatatan,Data ilustratif\n', 'text/csv');
            K.ui.toast('Laporan diunduh', r.name);
          } else if (a === 'run') {
            K.store.update('reports', r.id, { status: 'generating' }); table.refresh();
            K.ui.toast('Laporan sedang dibuat', r.name, 'info');
            setTimeout(() => { K.store.update('reports', r.id, { status: 'ready', lastGenerated: new Date().toISOString() }); table.refresh(); stats(); K.ui.toast('Laporan siap', r.name); }, 2200);
          } else if (a === 'fav') { K.store.update('reports', r.id, { favorite: !r.favorite }); table.refresh(); }
          else if (a === 'edit') openForm(r);
          else if (a === 'dup') { K.store.insert('reports', { ...r, id: undefined, name: r.name + ' (salinan)', status: 'scheduled', lastGenerated: null, favorite: false }, { idPrefix: 'rpt' }); table.refresh(); stats(); K.ui.toast('Laporan diduplikat'); }
          else if (a === 'delete') K.ui.confirm({ title: 'Hapus laporan?', text: `"${r.name}" akan dihapus permanen.` }).then(ok => { if (ok) { K.store.remove('reports', r.id); table.refresh(); stats(); K.ui.toast('Laporan dihapus'); } });
        },
      });

      function openForm(r, preset = {}) {
        K.ui.modal({
          title: r ? 'Edit laporan' : 'Laporan baru', desc: 'Atur isi, format, dan jadwal pengiriman.',
          body: reportForm(r || preset), submitLabel: r ? 'Simpan perubahan' : 'Buat laporan',
          onSubmit: d => {
            if (r) K.store.update('reports', r.id, d);
            else K.store.insert('reports', { ...d, status: 'scheduled', ownerId: 'usr_me', lastGenerated: null, size: 0, favorite: false }, { idPrefix: 'rpt' });
            K.store.audit('report.save', r ? 'Memperbarui laporan' : 'Membuat laporan', d.name, 'info', 'Report');
            table.refresh(); stats(); K.ui.toast(r ? 'Laporan diperbarui' : 'Laporan dibuat', d.name);
          },
        });
      }

      $('#rp-new').addEventListener('click', () => openForm());
      $('#rp-templates').addEventListener('click', e => { const b = e.target.closest('[data-template]'); b && openForm(null, { name: 'Laporan ' + b.dataset.template, category: b.dataset.cat }); });
      stats();
      if (route.query.action === 'new') { history.replaceState(null, '', '#/reports'); openForm(); }
    },
  });

  /* ======================= ACTIVITY LOG ======================= */
  K.page('activity', {
    render(view) {
      let filter = 'all', q = '', limit = 15;
      const types = [['all', 'Semua', 'list'], ['content', 'Konten', 'file-text'], ['report', 'Laporan', 'chart-column'], ['team', 'Tim', 'users'], ['app', 'Aplikasi', 'app-window'], ['task', 'Tugas', 'circle-check'], ['user', 'Profil', 'user']];
      view.innerHTML = `${K.ui.pageHead({ title: 'Activity Log', eyebrow: 'Workspace', desc: 'Linimasa aktivitas anggota tim di seluruh workspace.' })}
        <div class="grid grid-side-main">
          <aside class="stack">
            <article class="card"><h2 class="card__title">Ringkasan 7 hari</h2>
              <div class="stat-inline mt-4"><div><p class="stat-inline__label">Aktivitas</p><p class="stat-inline__value">${num(K.store.count('activity'))}</p></div><div><p class="stat-inline__label">Kontributor</p><p class="stat-inline__value">${new Set(K.store.all('activity').map(a => a.userId)).size}</p></div></div>
              <div class="chart-box mt-4" style="height:120px"><canvas id="act-chart" role="img" aria-label="Aktivitas per hari"></canvas></div>
            </article>
            <article class="card"><h2 class="card__title">Kontributor teratas</h2><div class="list mt-4" id="act-top"></div></article>
          </aside>
          <article class="card">
            <div class="flex wrap items-center justify-between gap-3">
              <div class="tabs" role="tablist" aria-label="Filter aktivitas" id="act-tabs">${types.map(([k, l, ic]) => `<button type="button" role="tab" class="tab" data-type="${k}" aria-selected="${k === filter}">${icon(ic)}${l}</button>`).join('')}</div>
              <label class="input-icon" style="width:220px">${icon('search')}<input type="search" class="input input-sm" placeholder="Cari aktivitas…" aria-label="Cari aktivitas" id="act-q"></label>
            </div>
            <div class="mt-5" id="act-list"></div>
            <div class="mt-4" style="text-align:center" id="act-more"></div>
          </article>
        </div>`;
      const $ = s => view.querySelector(s);

      const days = K.util.dayLabels(7);
      K.charts.bar($('#act-chart'), { labels: days, datasets: [{ label: 'Aktivitas', data: K.util.series(7, 18, 8, 1, 3), color: K.charts.token('--chart-1') }] });

      const byUser = {};
      K.store.all('activity').forEach(a => { byUser[a.userId] = (byUser[a.userId] || 0) + 1; });
      $('#act-top').innerHTML = Object.entries(byUser).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, c]) => `<div class="list-item">${K.ui.person(K.lookup.user(id), K.lookup.user(id).team)}<span class="count-pill">${c}</span></div>`).join('');

      function draw() {
        let items = K.store.all('activity');
        if (filter !== 'all') items = items.filter(a => a.type === filter);
        if (q) items = items.filter(a => (K.lookup.user(a.userId).name + ' ' + a.verb + ' ' + a.target).toLowerCase().includes(q));
        const shown = items.slice(0, limit);
        let lastDay = '';
        $('#act-list').innerHTML = shown.length ? shown.map(a => {
          const u = K.lookup.user(a.userId);
          const day = K.util.date(a.createdAt, { weekday: 'long', day: 'numeric', month: 'long' });
          const head = day !== lastDay ? `<p class="section-label" style="margin-top:${lastDay ? 20 : 0}px">${day}</p>` : ''; lastDay = day;
          return `${head}<div class="timeline-item"><span class="timeline-item__icon">${icon(a.icon)}</span><div class="timeline-item__body flex wrap justify-between gap-2"><p>${K.ui.avatar(u.name, 'sm').replace('class="avatar', 'style="display:inline-grid;vertical-align:middle;margin-right:6px" class="avatar')}<span class="fw-600">${esc(u.name)}</span> <span class="text-secondary">${esc(a.verb)}</span> <span class="fw-500">${esc(a.target)}</span></p><span class="text-xs text-muted nowrap">${K.util.time(a.createdAt)}</span></div></div>`;
        }).join('') : K.ui.empty({ icon: 'activity', title: 'Tidak ada aktivitas', text: 'Coba filter lain.' });
        $('#act-more').innerHTML = items.length > limit ? `<button type="button" class="btn btn-secondary btn-sm" id="act-load">Muat lebih banyak (${items.length - limit})</button>` : '';
        $('#act-load')?.addEventListener('click', () => { limit += 15; draw(); });
      }
      $('#act-tabs').addEventListener('click', e => {
        const b = e.target.closest('[data-type]'); if (!b) return;
        filter = b.dataset.type; limit = 15;
        view.querySelectorAll('[data-type]').forEach(x => x.setAttribute('aria-selected', x === b));
        draw();
      });
      $('#act-q').addEventListener('input', K.util.debounce(e => { q = e.target.value.toLowerCase().trim(); draw(); }, 150));
      draw();
    },
  });
})(window.K);
