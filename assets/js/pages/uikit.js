/* ==========================================================================
   UI Kit → Toasts & Alerts, Icons, Charts, Tables & Pagination, Error Pages
   Halaman referensi komponen: setiap contoh disertai potongan kode yang
   bisa langsung disalin ke modul lain.
   ========================================================================== */
(function (K) {
  'use strict';
  const { esc, num, idr } = K.util;
  const { icon } = K.ui;

  /** Kartu demo dengan tombol "Kode" untuk menampilkan snippet. */
  const demo = (title, desc, body, code) => `<article class="card">
    <div class="demo-head"><div><h2 class="card__title">${title}</h2>${desc ? `<p class="card__desc">${desc}</p>` : ''}</div>
      ${code ? `<button type="button" class="btn btn-ghost btn-sm demo-code-toggle" data-code-toggle aria-expanded="false">${icon('code-xml')}<span>Kode</span></button>` : ''}</div>
    <div class="card__body">${body}</div>
    ${code ? `<div class="demo-code" hidden><div class="code">${K.ui.iconBtn('copy', 'Salin kode', 'data-copy-snippet', 'code-copy')}${esc(code.trim())}</div></div>` : ''}
  </article>`;

  function bindDemo(view) {
    view.addEventListener('click', e => {
      const t = e.target.closest('[data-code-toggle]');
      if (t) { const box = t.closest('.card').querySelector('.demo-code'); box.hidden = !box.hidden; t.setAttribute('aria-expanded', !box.hidden); }
      const c = e.target.closest('[data-copy-snippet]');
      if (c) K.util.copy(c.parentElement.innerText.trim()).then(() => K.ui.toast('Kode disalin', '', 'success', 1500));
    });
  }

  /* ======================= TOASTS & ALERTS ======================= */
  K.page('ui-toasts', {
    render(view) {
      const pos = K.prefs.get('kontrol:toast-pos', 'bottom-right');
      view.innerHTML = `${K.ui.pageHead({ title: 'Toasts & Alerts', eyebrow: 'UI Kit', desc: 'Notifikasi sementara (toast), pesan inline (alert), badge status, dan dialog konfirmasi.' })}
        <div class="stack">
          ${demo('Varian toast', 'Muncul sementara, otomatis hilang, berhenti saat di-hover.', `<div class="btn-group">
              <button type="button" class="btn btn-secondary" data-t="success">${icon('circle-check')}<span>Success</span></button>
              <button type="button" class="btn btn-secondary" data-t="error">${icon('circle-alert')}<span>Error</span></button>
              <button type="button" class="btn btn-secondary" data-t="warning">${icon('triangle-alert')}<span>Warning</span></button>
              <button type="button" class="btn btn-secondary" data-t="info">${icon('info')}<span>Info</span></button>
              <button type="button" class="btn btn-secondary" data-t="action">${icon('undo-2')}<span>Dengan aksi (Undo)</span></button>
              <button type="button" class="btn btn-secondary" data-t="sticky">${icon('pin')}<span>Tidak hilang otomatis</span></button></div>`,
            `// K.ui.toast(judul, teks, tipe, timeoutMs, opsi)
K.ui.toast('Data tersimpan', 'Perubahan berhasil disimpan.');
K.ui.toast('Gagal menyimpan', 'Server merespons 500.', 'error');
K.ui.toast('3 item dihapus', '', 'success', 6000, {
  action: { label: 'Urungkan', onClick: () => restore() },
});
K.ui.toast('Sinkronisasi berjalan', '', 'info', 0); // 0 = tidak hilang`)}
          ${demo('Posisi toast', 'Disimpan di browser ini dan berlaku di seluruh aplikasi.', `<div class="segmented" role="group" aria-label="Posisi toast">${[['top-right', 'Kanan atas'], ['top-center', 'Tengah atas'], ['bottom-right', 'Kanan bawah'], ['bottom-center', 'Tengah bawah'], ['bottom-left', 'Kiri bawah']].map(([v, l]) => `<button type="button" data-pos="${v}" aria-pressed="${v === pos}">${l}</button>`).join('')}</div>`,
            `document.getElementById('toast-region').dataset.pos = 'top-right';`)}
          <div class="grid grid-2">
            ${demo('Alert inline', 'Pesan yang tetap di halaman.', `<div class="alert-stack">
              <div class="alert alert--info">${icon('info')}<div><p class="alert__title">Info</p><p class="alert__text">Versi baru tersedia. Muat ulang untuk memperbarui.</p></div></div>
              <div class="alert alert--success">${icon('circle-check')}<div><p class="alert__title">Berhasil</p><p class="alert__text">Integrasi WhatsApp terhubung.</p></div></div>
              <div class="alert alert--warning">${icon('triangle-alert')}<div><p class="alert__title">Perhatian</p><p class="alert__text">Kuota API mencapai 80%.</p></div></div>
              <div class="alert alert--danger">${icon('circle-alert')}<div><p class="alert__title">Gagal</p><p class="alert__text">Pembayaran ditolak bank penerbit.</p></div></div>
              <div class="alert">${icon('bell')}<div><p class="alert__title">Netral</p><p class="alert__text">Tidak ada perubahan sejak sinkronisasi terakhir.</p></div></div></div>`,
              `<div class="alert alert--warning">
  <svg>…</svg>
  <div><p class="alert__title">Perhatian</p>
  <p class="alert__text">Kuota API mencapai 80%.</p></div>
</div>`)}
            <div class="stack">
              ${demo('Badge status', 'Selalu gabungkan warna dengan teks (bukan warna saja).', `<div class="chip-list">${['active', 'pending', 'failed', 'running', 'draft', 'scheduled', 'suspended', 'archived'].map(s => K.ui.badge(s)).join('')}</div>`, `K.ui.badge('active')          // → Aktif (hijau)
K.ui.badge('failed', 'Ditolak') // label kustom`)}
              ${demo('Dialog konfirmasi', 'Memakai elemen <code class="inline-code">&lt;dialog&gt;</code> native.', `<div class="btn-group"><button type="button" class="btn btn-danger" data-confirm>${icon('trash-2')}<span>Hapus item</span></button><button type="button" class="btn btn-secondary" data-modal>${icon('square-pen')}<span>Modal form</span></button></div>`,
                `const ok = await K.ui.confirm({ title: 'Hapus item?', text: 'Tidak dapat dibatalkan.' });
if (ok) { /* hapus */ }

K.ui.modal({
  title: 'Tambah data',
  body: K.ui.field({ name: 'name', label: 'Nama', required: true }),
  onSubmit: data => save(data), // return false untuk menahan modal
});`)}
              ${demo('Progress & skeleton', '', `<div class="stack" style="gap:12px">${K.ui.progress(72)}${K.ui.progress(45, 'success')}${K.ui.progress(88, 'warning')}${K.ui.progress(23, 'danger')}<div class="flex items-center gap-3"><span class="skeleton" style="width:40px;height:40px;border-radius:50%"></span><div class="flex-1 stack" style="gap:8px"><span class="skeleton" style="height:12px;width:60%"></span><span class="skeleton" style="height:10px;width:40%"></span></div></div></div>`, `K.ui.progress(72)            // biru
K.ui.progress(88, 'warning') // success | warning | danger
<span class="skeleton" style="height:12px;width:60%"></span>`)}
            </div>
          </div>
        </div>`;
      bindDemo(view);
      const region = document.getElementById('toast-region');
      view.addEventListener('click', e => {
        const t = e.target.closest('[data-t]');
        if (t) {
          const k = t.dataset.t;
          if (k === 'success') K.ui.toast('Data tersimpan', 'Perubahan berhasil disimpan.');
          if (k === 'error') K.ui.toast('Gagal menyimpan', 'Server merespons 500. Coba lagi.', 'error');
          if (k === 'warning') K.ui.toast('Kuota hampir habis', 'Penyimpanan terpakai 92%.', 'warning');
          if (k === 'info') K.ui.toast('Pembaruan tersedia', 'Versi 2.1 siap dipasang.', 'info');
          if (k === 'action') K.ui.toast('3 item dihapus', 'Item dipindahkan ke tempat sampah.', 'success', 6000, { action: { label: 'Urungkan', onClick: () => K.ui.toast('Penghapusan dibatalkan', '', 'info', 2000) } });
          if (k === 'sticky') K.ui.toast('Sinkronisasi berjalan', 'Tutup manual dengan tombol ×.', 'info', 0);
        }
        const p = e.target.closest('[data-pos]');
        if (p) { region.dataset.pos = p.dataset.pos; K.prefs.set('kontrol:toast-pos', p.dataset.pos); view.querySelectorAll('[data-pos]').forEach(x => x.setAttribute('aria-pressed', x === p)); K.ui.toast('Posisi diubah', p.textContent, 'info', 2000); }
        if (e.target.closest('[data-confirm]')) K.ui.confirm({ title: 'Hapus item ini?', text: 'Tindakan ini tidak dapat dibatalkan.' }).then(ok => K.ui.toast(ok ? 'Item dihapus' : 'Dibatalkan', '', ok ? 'success' : 'info', 2000));
        if (e.target.closest('[data-modal]')) K.ui.modal({ title: 'Tambah kontak', body: `<div class="form-grid">${K.ui.field({ name: 'name', label: 'Nama', required: true })}${K.ui.field({ name: 'email', label: 'Email', type: 'email', required: true })}${K.ui.field({ name: 'note', label: 'Catatan', type: 'textarea', span: true })}</div>`, onSubmit: d => K.ui.toast('Kontak ditambahkan', d.name) });
      });
    },
  });

  /* ======================= ICONS ======================= */
  K.page('ui-icons', {
    render(view) {
      const lib = (window.lucide && window.lucide.icons) || {};
      const kebab = n => n.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Za-z])(\d)/g, '$1-$2').toLowerCase();
      // Hanya nama kanonik (lucide juga mengekspor alias lama)
      const all = [...new Set(Object.keys(lib).map(kebab))].filter(n => lib[n.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase())]).sort();
      let q = '', limit = 240, size = 24;
      view.innerHTML = `${K.ui.pageHead({
        title: 'Icons', eyebrow: 'UI Kit', desc: `${num(all.length)} ikon <a href="https://lucide.dev/icons" target="_blank" rel="noopener">Lucide</a> v1.59 — klik ikon untuk menyalin namanya.`,
      })}
        <article class="card">
          <div class="flex wrap items-center justify-between gap-3">
            <label class="input-icon" style="width:min(360px,100%)">${icon('search')}<input type="search" class="input" placeholder="Cari ikon… (mis. user, chart, arrow)" aria-label="Cari ikon" id="ic-q"></label>
            <div class="flex items-center gap-3 wrap"><label class="text-sm text-secondary flex items-center gap-2" for="ic-size">Ukuran <input type="range" id="ic-size" min="16" max="40" step="2" value="24" class="range" style="width:120px"> <span class="tabular fw-600" id="ic-size-v">24px</span></label>
              <select class="select select-sm" id="ic-copy" style="width:auto" aria-label="Format salin"><option value="name">Salin nama</option><option value="js">Salin K.ui.icon()</option><option value="html">Salin &lt;i data-lucide&gt;</option></select></div>
          </div>
          <p class="text-xs text-secondary mt-4" id="ic-count"></p>
          <div class="icon-grid mt-3" id="ic-grid"></div>
          <div class="mt-4" style="text-align:center" id="ic-more"></div>
        </article>
        <div class="mt-4">${demo('Cara pakai', 'Dua cara: string SVG dari helper (disarankan) atau atribut data-lucide.', '<p class="text-sm text-secondary">Helper <code class="inline-code">K.ui.icon()</code> menghasilkan SVG inline yang sudah memakai stroke 1.8 dan <code class="inline-code">aria-hidden</code>.</p>', `// Di JavaScript (template string)
el.innerHTML = K.ui.icon('bell') + 'Notifikasi';
K.ui.icon('trash-2', 'i-16'); // dengan class tambahan

<!-- Di HTML statis -->
<i data-lucide="bell"></i>
<script>lucide.createIcons();</script>`)}</div>`;
      bindDemo(view);
      const $ = s => view.querySelector(s);
      const draw = () => {
        const list = q ? all.filter(n => n.includes(q)) : all;
        $('#ic-count').textContent = `${num(list.length)} ikon${q ? ` cocok dengan "${q}"` : ''}`;
        $('#ic-grid').innerHTML = list.slice(0, limit).map(n => `<button type="button" class="icon-cell" data-icon-name="${n}" title="${n}">${icon(n)}<span>${n}</span></button>`).join('') || `<div style="grid-column:1/-1">${K.ui.empty({ icon: 'search-x', title: 'Ikon tidak ditemukan' })}</div>`;
        $('#ic-more').innerHTML = list.length > limit ? `<button type="button" class="btn btn-secondary btn-sm" id="ic-load">Tampilkan lebih banyak (${num(list.length - limit)})</button>` : '';
        $('#ic-load')?.addEventListener('click', () => { limit += 240; draw(); });
      };
      $('#ic-q').addEventListener('input', K.util.debounce(e => { q = e.target.value.toLowerCase().trim().replace(/\s+/g, '-'); limit = 240; draw(); }, 150));
      $('#ic-size').addEventListener('input', e => { size = e.target.value; $('#ic-grid').style.setProperty('--icon-size', size + 'px'); $('#ic-size-v').textContent = size + 'px'; });
      $('#ic-grid').addEventListener('click', e => {
        const b = e.target.closest('[data-icon-name]'); if (!b) return;
        const n = b.dataset.iconName, fmt = $('#ic-copy').value;
        const text = fmt === 'js' ? `K.ui.icon('${n}')` : fmt === 'html' ? `<i data-lucide="${n}"></i>` : n;
        K.util.copy(text).then(() => K.ui.toast('Disalin', text, 'success', 1600));
      });
      draw();
    },
  });

  /* ======================= CHARTS ======================= */
  K.page('ui-charts', {
    render(view) {
      const months = ['Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt'];
      const box = (id, h = 240) => `<div class="chart-box" style="height:${h}px"><canvas id="${id}" role="img" aria-label="Contoh grafik"></canvas></div>`;
      view.innerHTML = `${K.ui.pageHead({ title: 'Charts', eyebrow: 'UI Kit', desc: 'Galeri Chart.js 4 yang otomatis mengikuti tema terang/gelap. Ganti tema untuk melihat warnanya berubah.' })}
        <div class="grid grid-2">
          ${demo('Line / area', 'Tren waktu dengan pembanding periode lalu.', box('c-line'), `K.charts.line(canvas, {
  labels: ['Mei', 'Jun', 'Jul'],
  datasets: [
    { label: 'Periode ini', data: [12, 19, 15] },
    { label: 'Periode lalu', data: [10, 14, 13], dashed: true },
  ],
  yFormat: v => v + ' jt',
});`)}
          ${demo('Bar', 'Perbandingan antar kategori.', box('c-bar'), `K.charts.bar(canvas, {
  labels: ['Mei', 'Jun', 'Jul'],
  datasets: [{ label: 'Pengguna baru', data: [120, 180, 150] }],
});`)}
          ${demo('Stacked bar', 'Komposisi per periode.', box('c-stack'), `K.charts.bar(canvas, { labels, stacked: true, datasets: [
  { label: 'Web', data: [...] }, { label: 'Mobile', data: [...] },
]});`)}
          ${demo('Horizontal bar', 'Peringkat dengan label panjang.', box('c-hbar'), `K.charts.bar(canvas, { labels, datasets, horizontal: true });`)}
          ${demo('Doughnut', 'Proporsi (maks 5–6 kategori).', box('c-dough', 220), `K.charts.doughnut(canvas, {
  labels: ['QRIS', 'VA', 'Kartu'],
  data: [45, 30, 25],
});`)}
          ${demo('Pie', 'Alternatif doughnut tanpa lubang.', box('c-pie', 220), `K.charts.doughnut(canvas, { labels, data, cutout: 0 });`)}
          ${demo('Radar', 'Perbandingan multi-dimensi.', box('c-radar', 260), `K.charts.custom(canvas, { type: 'radar', data: {...}, options: {...} });`)}
          ${demo('Polar area', 'Besaran per kategori melingkar.', box('c-polar', 260), `K.charts.custom(canvas, { type: 'polarArea', data: {...} });`)}
          ${demo('Scatter', 'Korelasi dua variabel.', box('c-scatter'), `K.charts.custom(canvas, { type: 'scatter', data: { datasets: [{ data: [{x: 1, y: 2}] }] } });`)}
          ${demo('Mixed bar + line', 'Volume (bar) dan rasio (line) dalam satu grafik dengan dua sumbu.', box('c-mixed'), `K.charts.custom(canvas, { type: 'bar', data: { labels, datasets: [
  { type: 'bar', label: 'Transaksi', data: [...], yAxisID: 'y' },
  { type: 'line', label: 'Konversi %', data: [...], yAxisID: 'y1' },
]}});`)}
        </div>
        <div class="grid grid-4 mt-4">${['Pendapatan', 'Pengguna', 'Error rate', 'Latensi'].map((l, i) => `<article class="card"><p class="kpi__label">${l}</p><p class="kpi__value" style="font-size:22px">${['Rp128 jt', '12.856', '0,42%', '182 ms'][i]}</p><div class="chart-box mt-3" style="height:48px"><canvas id="c-spark-${i}" aria-hidden="true"></canvas></div></article>`).join('')}</div>
        <div class="mt-4">${demo('Sparkline', 'Tren mini di kartu KPI, tanpa sumbu & tooltip.', '', `K.charts.sparkline(canvas, [3, 5, 4, 8, 7, 9]);`)}</div>`;
      bindDemo(view);
      const $ = s => view.querySelector(s);
      const T = K.charts.token, pal = K.charts.palette();
      const grid = { color: T('--chart-grid') };
      K.charts.line($('#c-line'), { labels: months, datasets: [{ label: 'Periode ini', data: [92, 104, 98, 121, 114, 128] }, { label: 'Periode lalu', data: [80, 88, 95, 99, 105, 112], dashed: true }], yFormat: v => v + ' jt', tooltipFormat: v => idr(v * 1e6) });
      K.charts.bar($('#c-bar'), { labels: months, datasets: [{ label: 'Pengguna baru', data: [420, 510, 488, 602, 655, 712], color: T('--chart-1') }] });
      K.charts.bar($('#c-stack'), { labels: months, stacked: true, datasets: [{ label: 'Web', data: [220, 260, 240, 300, 310, 340] }, { label: 'Mobile', data: [150, 190, 200, 230, 260, 290] }, { label: 'API', data: [50, 60, 48, 72, 85, 82] }] });
      K.charts.bar($('#c-hbar'), { labels: ['Customer Portal', 'Mobile App', 'Partner API', 'Billing Service', 'Data Pipeline'], horizontal: true, datasets: [{ label: 'Request (rb)', data: [2400, 1820, 960, 620, 410], color: T('--chart-1') }] });
      K.charts.doughnut($('#c-dough'), { labels: ['QRIS', 'Virtual Account', 'Kartu Kredit', 'E-Wallet'], data: [45, 22, 18, 15], tooltipFormat: v => v + '%' });
      K.charts.doughnut($('#c-pie'), { labels: ['Desktop', 'Mobile', 'Tablet'], data: [54, 39, 7], cutout: 0, tooltipFormat: v => v + '%' });
      K.charts.custom($('#c-radar'), {
        type: 'radar',
        data: { labels: ['Kecepatan', 'Keandalan', 'Keamanan', 'Kemudahan', 'Dukungan', 'Harga'], datasets: [
          { label: 'Kontrol', data: [86, 92, 95, 80, 78, 70], borderColor: pal[0], backgroundColor: pal[0] + '33', pointBackgroundColor: pal[0] },
          { label: 'Rata-rata industri', data: [70, 75, 72, 74, 68, 76], borderColor: pal[2], backgroundColor: pal[2] + '22', pointBackgroundColor: pal[2] }] },
        options: { scales: { r: { grid, angleLines: grid, pointLabels: { color: T('--text-secondary'), font: { size: 11 } }, ticks: { display: false }, suggestedMin: 40, suggestedMax: 100 } }, plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true } } } },
      });
      K.charts.custom($('#c-polar'), {
        type: 'polarArea',
        data: { labels: ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Makassar'], datasets: [{ data: [34, 14, 12, 8, 5], backgroundColor: pal.slice(0, 5).map(c => c + 'B3'), borderColor: T('--bg-panel'), borderWidth: 2 }] },
        options: { scales: { r: { grid, angleLines: grid, ticks: { display: false } } }, plugins: { legend: { display: true, position: 'right', labels: { boxWidth: 10, boxHeight: 10 } } } },
      });
      const r = K.util.rng(7);
      K.charts.custom($('#c-scatter'), {
        type: 'scatter',
        data: { datasets: [{ label: 'Sesi vs konversi', data: Array.from({ length: 60 }, () => { const x = 1 + r() * 9; return { x: +x.toFixed(2), y: +(x * 0.42 + r() * 1.6).toFixed(2) }; }), backgroundColor: pal[0] + 'AA', pointRadius: 4, pointHoverRadius: 6 }] },
        options: { scales: { x: { grid: { display: false }, title: { display: true, text: 'Durasi sesi (menit)' } }, y: { grid, border: { display: false }, title: { display: true, text: 'Konversi (%)' } } } },
      });
      K.charts.custom($('#c-mixed'), {
        type: 'bar',
        data: { labels: months, datasets: [
          { type: 'bar', label: 'Transaksi', data: [1410, 1520, 1610, 1702, 1760, 1842], backgroundColor: T('--chart-2'), borderRadius: 4, yAxisID: 'y', order: 2 },
          { type: 'line', label: 'Konversi %', data: [3.2, 3.4, 3.64, 3.66, 3.58, 3.62], borderColor: pal[0], backgroundColor: pal[0], tension: 0.35, pointRadius: 3, yAxisID: 'y1', order: 1 }] },
        options: { interaction: { mode: 'index', intersect: false }, scales: { x: { grid: { display: false } }, y: { grid, border: { display: false } }, y1: { position: 'right', grid: { display: false }, border: { display: false }, ticks: { callback: v => v + '%' } } } },
      });
      [[3, 5, 4, 8, 7, 9, 12], [5, 6, 6, 7, 8, 9, 10], [6, 4, 5, 3, 4, 2, 2], [190, 182, 200, 176, 185, 170, 182]].forEach((d, i) => K.charts.sparkline($('#c-spark-' + i), d, i === 2 ? T('--success') : undefined));
    },
  });

  /* ======================= TABLES & PAGINATION ======================= */
  K.page('ui-tables', {
    render(view) {
      const tx = K.store.all('transactions');
      const rows = tx.slice(0, 5);
      const basic = cls => `<div class="table-wrap"><table class="table ${cls}"><thead><tr><th scope="col">ID</th><th scope="col">Pelanggan</th><th scope="col" class="hide-sm">Metode</th><th scope="col" class="num">Jumlah</th><th scope="col">Status</th></tr></thead>
        <tbody>${rows.map(t => `<tr><td class="mono text-xs">${esc(t.id)}</td><td>${esc(t.customer)}</td><td class="hide-sm text-secondary">${esc(t.method)}</td><td class="num">${idr(t.amount)}</td><td>${K.ui.badge(t.status)}</td></tr>`).join('')}</tbody>
        <tfoot><tr><td colspan="3">Total</td><td class="num">${idr(rows.reduce((s, t) => s + t.amount, 0))}</td><td></td></tr></tfoot></table></div>`;

      view.innerHTML = `${K.ui.pageHead({ title: 'Tables & Pagination', eyebrow: 'UI Kit', desc: 'Tabel HTML sederhana, varian gaya, paginasi client-side & server-side, serta komponen DataTable lengkap.' })}
        <div class="stack">
          <article class="card card--flush"><div class="card__head"><div><h2 class="card__title">Tabel dasar</h2><p class="card__desc">Markup <code class="inline-code">&lt;table class="table"&gt;</code> + kolom angka rata kanan + <code class="inline-code">tfoot</code>.</p></div>
            <div class="segmented" role="group" aria-label="Varian tabel">${[['', 'Default'], ['table--striped', 'Striped'], ['table--bordered', 'Bordered'], ['table--compact', 'Compact']].map(([c, l], i) => `<button type="button" data-variant="${c}" aria-pressed="${i === 0}">${l}</button>`).join('')}</div></div>
            <div id="tb-basic">${basic('')}</div></article>

          <article class="card"><div class="demo-head"><div><h2 class="card__title">Varian paginasi</h2><p class="card__desc">Komponen <code class="inline-code">.pagination</code> dapat dipakai terpisah dari tabel.</p></div></div>
            <div class="card__body" id="pg-variants"></div></article>

          <article class="card card--flush"><div class="card__head"><div><h2 class="card__title">Paginasi client-side</h2><p class="card__desc">Semua data sudah di browser; cocok untuk &lt; 1.000 baris.</p></div>
            <label class="flex items-center gap-2 text-sm text-secondary">Baris per halaman <select class="select select-sm" style="width:auto" id="cs-size"><option>5</option><option selected>10</option><option>25</option></select></label></div>
            <div class="table-wrap"><table class="table table--striped"><thead><tr><th scope="col">#</th><th scope="col">Pelanggan</th><th scope="col" class="hide-md">Produk</th><th scope="col" class="hide-sm">Tanggal</th><th scope="col" class="num">Jumlah</th></tr></thead><tbody id="cs-body"></tbody></table></div>
            <div class="dt-foot"><p id="cs-info"></p><nav class="pagination" aria-label="Paginasi client-side" id="cs-pager"></nav></div></article>

          <article class="card card--flush"><div class="card__head"><div><h2 class="card__title">Paginasi server-side (simulasi)</h2><p class="card__desc">Memuat per halaman dari API dengan skeleton loading — pola yang dipakai saat terhubung backend.</p></div>
            <span class="badge badge--info" id="ss-latency">—</span></div>
            <div class="table-wrap"><table class="table"><thead><tr><th scope="col">Waktu</th><th scope="col">Aktor</th><th scope="col">Aksi</th><th scope="col" class="hide-md">IP</th></tr></thead><tbody id="ss-body"></tbody></table></div>
            <div class="dt-foot"><p id="ss-info"></p><div class="flex gap-2"><button type="button" class="btn btn-secondary btn-sm" id="ss-prev">${icon('chevron-left')}<span>Sebelumnya</span></button><button type="button" class="btn btn-secondary btn-sm" id="ss-next"><span>Berikutnya</span>${icon('chevron-right')}</button></div></div>
            <div style="padding:0 20px 20px"><div class="code">${esc(`// Contoh integrasi (cursor pagination)
const res = await fetch('/api/audit-logs?limit=8&cursor=' + cursor);
const { data, next_cursor, has_more } = await res.json();`)}</div></div></article>

          ${demo('DataTable (komponen lengkap)', 'Cari, filter tab, sort, pilih massal, ekspor CSV — dipakai di modul Users, Pages, Audit, dll.', '<div id="tb-dt" style="margin:0 -20px -20px"></div>', `new K.DataTable(el, {
  title: 'Transaksi',
  rows: () => K.store.all('transactions'),
  pageSize: 5, selectable: true, exportName: 'transaksi',
  search: r => r.customer + ' ' + r.id,
  tabs: { key: 'status', options: [['success', 'Berhasil'], ['failed', 'Gagal']] },
  columns: [
    { key: 'customer', label: 'Pelanggan', sortable: true },
    { key: 'amount', label: 'Jumlah', sortable: true, className: 'num',
      render: r => K.util.idr(r.amount) },
  ],
});`)}
        </div>`;
      bindDemo(view);
      const $ = s => view.querySelector(s);

      // Varian tabel
      view.querySelectorAll('[data-variant]').forEach(b => b.addEventListener('click', () => {
        view.querySelectorAll('[data-variant]').forEach(x => x.setAttribute('aria-pressed', x === b));
        $('#tb-basic').innerHTML = basic(b.dataset.variant);
      }));

      // Komponen paginasi reusable (fungsi murni → string HTML)
      const pager = (cur, total, { extra = '', compact = false } = {}) => {
        const btn = p => `<button type="button" data-page="${p}" ${p === cur ? 'aria-current="page"' : ''} aria-label="Halaman ${p}">${p}</button>`;
        const set = compact ? [cur] : [...new Set([1, total, cur - 1, cur, cur + 1].filter(p => p >= 1 && p <= total))].sort((a, b) => a - b);
        let prev = 0; const mid = set.map(p => { const gap = p - prev > 1 && !compact ? '<span class="pg-gap">…</span>' : ''; prev = p; return gap + btn(p); }).join('');
        return `<nav class="pagination ${extra}" aria-label="Paginasi"><button type="button" class="pg-edge" data-page="${cur - 1}" ${cur <= 1 ? 'disabled' : ''} aria-label="Sebelumnya">${icon('chevron-left')}</button>${mid}<button type="button" class="pg-edge" data-page="${cur + 1}" ${cur >= total ? 'disabled' : ''} aria-label="Berikutnya">${icon('chevron-right')}</button></nav>`;
      };
      const variants = { a: 3, b: 7, c: 1, d: 12 };
      const drawVariants = () => {
        $('#pg-variants').innerHTML = `
          <div class="pager-demo" data-v="a"><span class="text-sm fw-500">Bernomor + elipsis</span>${pager(variants.a, 20)}</div>
          <div class="pager-demo" data-v="b"><span class="text-sm fw-500">Pill</span>${pager(variants.b, 10, { extra: 'pagination--pill' })}</div>
          <div class="pager-demo" data-v="c"><span class="text-sm fw-500">Outline</span>${pager(variants.c, 5, { extra: 'pagination--outline' })}</div>
          <div class="pager-demo" data-v="d"><span class="text-sm fw-500">Ringkas (mobile)</span><div class="flex items-center gap-2">${pager(variants.d, 24, { compact: true })}<span class="text-xs text-secondary">dari 24</span></div></div>
          <div class="pager-demo"><span class="text-sm fw-500">Muat lebih banyak</span><button type="button" class="btn btn-secondary btn-sm" data-loadmore>${icon('chevrons-down')}<span>Muat 20 lagi</span></button></div>
          <div class="pager-demo"><span class="text-sm fw-500">Lompat ke halaman</span><form class="flex items-center gap-2" data-jump><span class="text-sm text-secondary">Halaman</span><input class="input input-sm" type="number" min="1" max="20" value="${variants.a}" style="width:72px" aria-label="Nomor halaman"><span class="text-sm text-secondary">dari 20</span><button type="submit" class="btn btn-secondary btn-sm">Buka</button></form></div>`;
      };
      $('#pg-variants').addEventListener('click', e => {
        const b = e.target.closest('[data-page]'); const row = e.target.closest('[data-v]');
        if (b && row && !b.disabled) { const max = { a: 20, b: 10, c: 5, d: 24 }[row.dataset.v]; variants[row.dataset.v] = Math.min(max, Math.max(1, +b.dataset.page)); drawVariants(); }
        if (e.target.closest('[data-loadmore]')) K.ui.toast('20 item dimuat', '', 'info', 1500);
      });
      $('#pg-variants').addEventListener('submit', e => { e.preventDefault(); const v = +e.target.querySelector('input').value; if (v >= 1 && v <= 20) { variants.a = v; drawVariants(); } else K.ui.toast('Halaman 1–20', '', 'error', 1800); });
      drawVariants();

      // Client-side pagination
      let csPage = 1, csSize = 10;
      const drawCS = () => {
        const total = Math.ceil(tx.length / csSize); csPage = Math.min(csPage, total);
        const start = (csPage - 1) * csSize, slice = tx.slice(start, start + csSize);
        $('#cs-body').innerHTML = slice.map((t, i) => `<tr><td class="text-muted tabular">${start + i + 1}</td><td>${esc(t.customer)}</td><td class="hide-md text-secondary">${esc(K.lookup.product(t.productId).name)}</td><td class="hide-sm text-secondary nowrap">${K.util.date(t.createdAt)}</td><td class="num">${idr(t.amount)}</td></tr>`).join('');
        $('#cs-info').textContent = `Menampilkan ${start + 1}–${start + slice.length} dari ${tx.length}`;
        $('#cs-pager').outerHTML = pager(csPage, total).replace('<nav class="pagination ', '<nav id="cs-pager" class="pagination ');
      };
      view.addEventListener('click', e => { const b = e.target.closest('#cs-pager [data-page]'); if (b && !b.disabled) { csPage = +b.dataset.page; drawCS(); } });
      $('#cs-size').addEventListener('change', e => { csSize = +e.target.value; csPage = 1; drawCS(); });
      drawCS();

      // Server-side (simulasi fetch dengan latensi)
      const logs = K.store.all('auditLogs'); const SIZE = 8; let ssPage = 1, alive = true;
      const fakeFetch = page => new Promise(res => { const ms = 350 + Math.round(Math.random() * 500); setTimeout(() => res({ data: logs.slice((page - 1) * SIZE, page * SIZE), total: logs.length, ms }), ms); });
      const loadSS = async () => {
        $('#ss-body').innerHTML = Array.from({ length: SIZE }, () => `<tr class="skel-row">${[30, 45, 60, 25].map((w, i) => `<td class="${i === 3 ? 'hide-md' : ''}"><span class="skeleton" style="width:${w}%;display:block"></span></td>`).join('')}</tr>`).join('');
        $('#ss-prev').disabled = $('#ss-next').disabled = true;
        const { data, total, ms } = await fakeFetch(ssPage);
        if (!alive || !view.isConnected) return;
        $('#ss-body').innerHTML = data.map(l => `<tr><td class="nowrap text-secondary">${K.util.ago(l.createdAt)}</td><td>${esc(K.lookup.user(l.actorId).name)}</td><td>${esc(l.label)}</td><td class="hide-md mono text-xs">${esc(l.ip)}</td></tr>`).join('');
        const pages = Math.ceil(total / SIZE);
        $('#ss-info').textContent = `Halaman ${ssPage} dari ${pages} · ${total} baris di server`;
        $('#ss-latency').textContent = ms + ' ms';
        $('#ss-prev').disabled = ssPage <= 1; $('#ss-next').disabled = ssPage >= pages;
      };
      $('#ss-prev').addEventListener('click', () => { ssPage--; loadSS(); });
      $('#ss-next').addEventListener('click', () => { ssPage++; loadSS(); });
      loadSS();

      new K.DataTable($('#tb-dt'), {
        title: 'Transaksi', rows: () => K.store.all('transactions'), pageSize: 5, selectable: true, exportName: 'transaksi-demo',
        search: r => r.customer + ' ' + r.id,
        tabs: { key: 'status', options: [['success', 'Berhasil'], ['pending', 'Pending'], ['failed', 'Gagal']] },
        columns: [
          { key: 'customer', label: 'Pelanggan', sortable: true, render: r => K.ui.person({ name: r.customer, email: r.email }) },
          { key: 'method', label: 'Metode', className: 'hide-md' },
          { key: 'amount', label: 'Jumlah', sortable: true, className: 'num', render: r => idr(r.amount) },
          { key: 'status', label: 'Status', render: r => K.ui.badge(r.status) },
        ],
        bulkActions: [{ label: 'Tandai ditinjau', icon: 'check', handler: ids => K.ui.toast(`${ids.length} transaksi ditandai`) }],
      });
      return () => { alive = false; };
    },
  });

  /* ======================= ERROR PAGES ======================= */
  K.page('ui-errors', {
    render(view) {
      const codes = Object.keys(K.errorsData).map(Number);
      const card = c => { const e = K.errorsData[c]; return `<article class="card err-card errpage--${e.tone}">
        <div class="err-card__top"><span class="err-card__code">${c}</span><span class="icon-tile">${icon(e.icon)}</span></div>
        <div><p class="fw-600">${esc(e.title)}</p><p class="text-xs text-secondary mt-1">${esc(e.text)}</p></div>
        <div class="err-card__links"><a href="#/error/${c}" class="btn btn-secondary btn-sm">${icon('eye')}<span>Pratinjau</span></a><a href="error.html?code=${c}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">${icon('external-link')}<span>Standalone</span></a></div></article>`; };
      view.innerHTML = `${K.ui.pageHead({ title: 'Error Pages', eyebrow: 'UI Kit', desc: 'Halaman error 4xx & 5xx dengan ikon, pesan yang jelas, dan langkah selanjutnya. Tersedia versi di dalam aplikasi dan versi standalone untuk web server.' })}
        <p class="section-label">4xx — kesalahan klien</p><div class="err-grid">${codes.filter(c => c < 500).map(card).join('')}</div>
        <p class="section-label mt-6">5xx — kesalahan server</p><div class="err-grid">${codes.filter(c => c >= 500).map(card).join('')}</div>
        <div class="grid grid-2 mt-6">
          ${demo('Pasang di Nginx', 'Arahkan error server ke halaman standalone.', '<p class="text-sm text-secondary"><code class="inline-code">error.html</code> membaca kode dari query string, <code class="inline-code">404.html</code> otomatis dipakai GitHub Pages.</p>', `error_page 404 /404.html;
error_page 500 502 503 504 /error.html?code=$status;`)}
          ${demo('Pasang di Laravel', 'Salin markup ke view error bawaan Laravel.', '<p class="text-sm text-secondary">Laravel otomatis memakai <code class="inline-code">resources/views/errors/{kode}.blade.php</code>.</p>', `resources/views/errors/
├── 403.blade.php
├── 404.blade.php
├── 419.blade.php   // CSRF token expired
├── 429.blade.php
├── 500.blade.php
└── 503.blade.php   // php artisan down`)}
        </div>`;
      bindDemo(view);
    },
  });
})(window.K);
