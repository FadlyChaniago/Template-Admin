/* ==========================================================================
   Overview → Dashboard
   ========================================================================== */
(function (K) {
  'use strict';
  const { esc, idr, num } = K.util;
  const { icon } = K.ui;

  /** Periode demo. Nilai Oktober sesuai spesifikasi desain. */
  const PERIODS = {
    oct: { label: '1–20 Okt 2026', revenue: 128450000, tx: 1842, users: 12856, conv: 3.62, trend: [12.8, 8.2, 6.4, -0.4], days: 20, seed: 11 },
    sep: { label: 'September 2026', revenue: 113870000, tx: 1702, users: 12083, conv: 3.66, trend: [9.1, 5.7, 4.9, 0.6], days: 30, seed: 22 },
    aug: { label: 'Agustus 2026', revenue: 104380000, tx: 1610, users: 11519, conv: 3.64, trend: [4.3, 3.1, 3.8, -0.2], days: 31, seed: 33 },
  };

  function dailySeries(total, days, seed) {
    const raw = K.util.series(days, 100, 38, 2.2, seed).map(v => Math.max(40, v));
    const sum = raw.reduce((a, b) => a + b, 0);
    return raw.map(v => Math.round((v / sum) * total));
  }

  function bucket(data, labels, size) {
    const out = [], lab = [];
    for (let i = 0; i < data.length; i += size) {
      out.push(data.slice(i, i + size).reduce((a, b) => a + b, 0));
      lab.push(size === 7 ? 'Minggu ' + (i / 7 + 1) : labels[i]);
    }
    return { data: out, labels: lab };
  }

  K.page('dashboard', {
    render(view) {
      const me = K.currentUser();
      let periodKey = 'oct';
      let interval = 'daily';

      view.innerHTML = `
        ${K.ui.pageHead({
          title: 'Dashboard', eyebrow: 'Overview',
          desc: `Selamat datang kembali, ${esc(me.name.split(' ')[0])}. Berikut ringkasan workspace Anda.`,
          actions: `<label class="input-icon">${icon('calendar')}<select class="select select-sm" style="padding-left:34px;width:auto" id="dash-period" aria-label="Periode laporan">
              ${Object.entries(PERIODS).map(([k, p]) => `<option value="${k}">${p.label}</option>`).join('')}</select></label>
            <button type="button" class="btn btn-primary btn-sm" id="dash-export">${icon('download')}<span>Ekspor laporan</span></button>`,
        })}
        <div class="grid grid-4" id="dash-kpis"></div>

        <div class="grid grid-main-side mt-4">
          <article class="card" id="analytics-card">
            <div class="card__head">
              <div><h2 class="card__title">Ringkasan pendapatan</h2><p class="card__desc">Perbandingan kinerja dengan periode sebelumnya</p></div>
              <div class="segmented" role="group" aria-label="Interval grafik">
                <button type="button" data-interval="daily" aria-pressed="true">Harian</button>
                <button type="button" data-interval="weekly" aria-pressed="false">Mingguan</button>
              </div>
            </div>
            <div class="flex wrap items-center justify-between gap-3 mt-5">
              <div class="flex items-center gap-3 wrap"><p class="tabular" style="font-size:25px;font-weight:600;letter-spacing:-0.8px;line-height:1" id="rev-total"></p><span id="rev-trend"></span></div>
              <div class="legend"><span class="legend__item"><span class="legend__line" style="background:var(--chart-1)"></span>Periode ini</span><span class="legend__item"><span class="legend__line" style="background:var(--chart-2)"></span>Periode lalu</span></div>
            </div>
            <div class="chart-box mt-5" style="height:240px"><canvas id="rev-chart" role="img" aria-label="Grafik pendapatan periode ini dibanding periode lalu"></canvas></div>
          </article>

          <article class="card" style="display:flex;flex-direction:column">
            <div class="card__head">
              <div><h2 class="card__title">Produk teratas</h2><p class="card__desc">Berdasarkan pendapatan periode ini</p></div>
              <span class="count-pill">4 produk</span>
            </div>
            <div class="card__body stack" id="top-products" style="gap:18px;flex:1"></div>
          </article>
        </div>

        <div class="grid grid-main-side mt-4">
          <section id="dash-tx" aria-label="Transaksi terbaru"></section>
          <div class="stack">
            <article class="card">
              <div class="card__head"><div><h2 class="card__title">Metode pembayaran</h2><p class="card__desc">Distribusi transaksi berhasil</p></div></div>
              <div class="flex items-center gap-4 mt-5 wrap">
                <div class="chart-box" style="width:140px;height:140px;flex-shrink:0"><canvas id="pay-chart" role="img" aria-label="Distribusi metode pembayaran"></canvas></div>
                <div class="stack flex-1" style="gap:10px;min-width:140px" id="pay-legend"></div>
              </div>
            </article>
            <article class="card">
              <div class="card__head"><div><h2 class="card__title">Aktivitas tim</h2><p class="card__desc">Pembaruan terbaru di workspace</p></div><a href="#/activity" class="btn btn-ghost btn-sm">Semua</a></div>
              <div class="card__body timeline" id="dash-activity"></div>
            </article>
          </div>
        </div>`;

      const $ = s => view.querySelector(s);

      function renderKPIs() {
        const p = PERIODS[periodKey];
        $('#dash-kpis').innerHTML = [
          K.ui.kpi({ label: 'Total pendapatan', value: idr(p.revenue, { compact: true }), title: idr(p.revenue), icon: 'wallet', trend: p.trend[0] }),
          K.ui.kpi({ label: 'Total transaksi', value: num(p.tx), icon: 'receipt', trend: p.trend[1] }),
          K.ui.kpi({ label: 'Pengguna aktif', value: num(p.users), icon: 'users', trend: p.trend[2] }),
          K.ui.kpi({ label: 'Tingkat konversi', value: `${num(p.conv, 2)}<small>%</small>`, icon: 'percent', trend: p.trend[3] }),
        ].join('');
      }

      function renderChart() {
        const p = PERIODS[periodKey];
        const cur = dailySeries(p.revenue, p.days, p.seed);
        const prev = dailySeries(p.revenue / (1 + p.trend[0] / 100), p.days, p.seed + 5);
        const end = periodKey === 'oct' ? K.NOW : periodKey === 'sep' ? new Date('2026-09-30T12:00:00+07:00').getTime() : new Date('2026-08-31T12:00:00+07:00').getTime();
        let labels = K.util.dayLabels(p.days, end);
        let a = cur, b = prev;
        if (interval === 'weekly') { const x = bucket(cur, labels, 7), y = bucket(prev, labels, 7); a = x.data; b = y.data; labels = x.labels; }
        $('#rev-total').textContent = idr(p.revenue);
        $('#rev-trend').innerHTML = K.ui.trend(p.trend[0]);
        K.charts.destroyAll(); // grafik di halaman ini dibuat ulang bersama
        K.charts.line($('#rev-chart'), {
          labels,
          datasets: [{ label: 'Periode ini', data: a }, { label: 'Periode lalu', data: b, dashed: true }],
          yFormat: v => num(v / 1e6) + ' jt', tooltipFormat: v => idr(v),
        });
        renderPayments();
      }

      function renderProducts() {
        const products = K.store.all('products');
        const total = products.reduce((s, p) => s + p.revenue, 0);
        const max = Math.max(...products.map(p => p.revenue));
        const scale = PERIODS[periodKey].revenue / total;
        $('#top-products').innerHTML = products.map(p => `
          <div class="flex items-center gap-3">
            <span class="icon-tile">${icon(p.icon)}</span>
            <div class="flex-1">
              <div class="flex wrap items-center justify-between gap-2 text-sm"><p class="fw-500">${esc(p.name)}</p><p class="fw-600 tabular">${idr(p.revenue * scale)}</p></div>
              <div class="mt-2">${K.ui.progress((p.revenue / max) * 83)}</div>
              <p class="mt-1 text-xs text-secondary flex justify-between"><span>${num(Math.round(p.sold * scale))} terjual</span><span class="tabular">${num((p.revenue / total) * 100, 1)}%</span></p>
            </div>
          </div>`).join('');
      }

      function renderPayments() {
        const ok = K.store.find('transactions', t => t.status === 'success');
        const methods = ['QRIS', 'Virtual Account', 'Kartu Kredit', 'E-Wallet'];
        const counts = methods.map(m => ok.filter(t => t.method === m).length);
        const pal = K.charts.palette();
        K.charts.doughnut($('#pay-chart'), { labels: methods, data: counts, tooltipFormat: v => v + ' transaksi' });
        const tot = counts.reduce((a, b) => a + b, 0) || 1;
        $('#pay-legend').innerHTML = methods.map((m, i) => `<div class="flex items-center justify-between gap-2 text-sm"><span class="legend__item"><span class="legend__swatch" style="background:${pal[i]}"></span>${m}</span><span class="tabular fw-600">${num((counts[i] / tot) * 100, 0)}%</span></div>`).join('');
      }

      function renderActivity() {
        $('#dash-activity').innerHTML = K.store.all('activity').slice(0, 5).map(a => {
          const u = K.lookup.user(a.userId);
          return `<div class="timeline-item"><span class="timeline-item__icon">${icon(a.icon)}</span><div class="timeline-item__body"><p><span class="fw-600">${esc(u.name)}</span> <span class="text-secondary">${esc(a.verb)}</span> <span class="fw-500">${esc(a.target)}</span></p><p class="timeline-item__time">${K.util.ago(a.createdAt)}</p></div></div>`;
        }).join('');
      }

      // Tabel transaksi terbaru memakai DataTable reusable
      const tx = new K.DataTable($('#dash-tx'), {
        title: 'Transaksi terbaru', desc: 'Pantau aktivitas dan status transaksi terbaru Anda.',
        rows: () => K.store.all('transactions'), pageSize: 6, searchPlaceholder: 'Cari transaksi…',
        search: r => `${r.id} ${r.customer} ${r.email} ${K.lookup.product(r.productId).name}`,
        tabs: { key: 'status', options: [['success', 'Berhasil'], ['pending', 'Pending'], ['failed', 'Gagal']] },
        exportName: 'transaksi',
        columns: [
          { key: 'id', label: 'ID Transaksi', className: 'hide-lg nowrap', render: r => `<span class="text-secondary fw-500">${esc(r.id)}</span>` },
          { key: 'customer', label: 'Pelanggan', sortable: true, render: r => K.ui.person({ name: r.customer, email: r.email }) },
          { key: 'productId', label: 'Produk', className: 'hide-md nowrap', render: r => `<span class="text-secondary">${esc(K.lookup.product(r.productId).name)}</span>`, csv: r => K.lookup.product(r.productId).name },
          { key: 'createdAt', label: 'Tanggal', sortable: true, className: 'hide-lg nowrap', render: r => `<span class="text-secondary">${K.util.date(r.createdAt)}</span><span class="text-xs text-muted" style="display:block">${K.util.time(r.createdAt)}</span>` },
          { key: 'amount', label: 'Jumlah', sortable: true, className: 'num nowrap fw-500', render: r => idr(r.amount) },
          { key: 'status', label: 'Status', render: r => K.ui.badge(r.status) },
        ],
        rowActions: () => K.ui.iconBtn('eye', 'Lihat detail', 'data-action="view"'),
        onAction: (a, r) => a === 'view' && showTx(r),
      });

      function showTx(r) {
        const p = K.lookup.product(r.productId);
        K.ui.modal({
          title: 'Detail transaksi', desc: esc(r.id),
          body: `<div class="flex items-center justify-between gap-3">${K.ui.person({ name: r.customer, email: r.email })}${K.ui.badge(r.status)}</div>
            <dl class="dl"><dt>Produk</dt><dd>${esc(p.name)}</dd><dt>Jumlah</dt><dd class="tabular">${idr(r.amount)}</dd><dt>Metode</dt><dd>${esc(r.method)}</dd><dt>Waktu</dt><dd>${K.util.dateTime(r.createdAt)}</dd></dl>
            ${r.status === 'failed' ? `<div class="alert alert--danger">${icon('circle-alert')}<div><p class="alert__title">Pembayaran ditolak</p><p class="alert__text">Bank penerbit menolak transaksi (kode 05). Pelanggan dapat mencoba metode lain.</p></div></div>` : ''}`,
          footer: `<button type="button" class="btn btn-secondary" data-dismiss>Tutup</button>${r.status === 'pending' ? `<button type="button" class="btn btn-primary" data-confirm-tx>Tandai berhasil</button>` : ''}`,
          onOpen: dlg => dlg.querySelector('[data-confirm-tx]')?.addEventListener('click', () => {
            K.store.update('transactions', r.id, { status: 'success' });
            K.store.audit('transaction.update', 'Mengonfirmasi transaksi', r.id, 'warning', 'Transaction');
            K.ui.toast('Transaksi dikonfirmasi', r.id + ' ditandai berhasil.');
            dlg.close(); tx.refresh(); renderPayments();
          }),
        });
      }

      $('#dash-period').addEventListener('change', e => { periodKey = e.target.value; renderKPIs(); renderProducts(); renderChart(); });
      view.querySelectorAll('[data-interval]').forEach(b => b.addEventListener('click', () => {
        interval = b.dataset.interval;
        view.querySelectorAll('[data-interval]').forEach(x => x.setAttribute('aria-pressed', x === b));
        renderChart();
      }));
      $('#dash-export').addEventListener('click', () => {
        const p = PERIODS[periodKey];
        const rows = [['Metrik', 'Nilai'], ['Periode', p.label], ['Total pendapatan', p.revenue], ['Total transaksi', p.tx], ['Pengguna aktif', p.users], ['Tingkat konversi (%)', p.conv]];
        K.util.downloadFile(`ringkasan-dashboard-${periodKey}.csv`, '﻿' + rows.map(r => r.join(',')).join('\n'), 'text/csv');
        K.ui.toast('Laporan diekspor', 'Ringkasan ' + p.label + ' telah diunduh.');
      });

      renderKPIs(); renderProducts(); renderChart(); renderActivity();
    },
  });
})(window.K);
