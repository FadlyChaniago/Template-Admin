/* ==========================================================================
   Support → Help Center, Documentation, Feedback
   ========================================================================== */
(function (K) {
  'use strict';
  const { esc, num } = K.util;
  const { icon } = K.ui;
  const S = K.store;

  /* ======================= HELP CENTER ======================= */
  const articles = [
    ['Memulai', 'rocket', 'Mengundang anggota pertama ke workspace', 'Buka Users → Undang pengguna, masukkan email dan pilih peran. Undangan berlaku 7 hari.'],
    ['Memulai', 'rocket', 'Memahami struktur menu dan navigasi', 'Sidebar dikelompokkan per domain: Workspace, Management, Content, Applications, System, Preferences, dan Support.'],
    ['Akun & keamanan', 'shield-check', 'Mengaktifkan autentikasi dua faktor', 'Buka Account Settings → Keamanan → Aktifkan 2FA, lalu pindai kode QR dengan aplikasi authenticator.'],
    ['Akun & keamanan', 'shield-check', 'Membuat peran kustom dengan izin terbatas', 'Di Roles & Permissions, buat peran baru, salin izin dari peran dasar, lalu centang izin per modul.'],
    ['Billing', 'credit-card', 'Mengubah paket dan siklus penagihan', 'Buka Upgrade Plan, pilih paket, lalu pilih bulanan atau tahunan (hemat 20%).'],
    ['Integrasi', 'plug', 'Menghubungkan notifikasi WhatsApp', 'Buka Integrations → WhatsApp Business → Hubungkan, lalu masukkan token WhatsApp Cloud API.'],
    ['API', 'code-xml', 'Membuat dan merotasi API key', 'Buka API Management → Buat API key. Key hanya ditampilkan sekali; simpan di secret manager.'],
    ['Konten', 'file-text', 'Menjadwalkan publikasi halaman', 'Saat menyunting halaman, pilih status Terjadwal lalu tentukan tanggal terbit.'],
  ];
  const faqs = [
    ['Apakah data saya dienkripsi?', 'Ya. Data dienkripsi saat transit (TLS 1.3) dan saat disimpan (AES-256). Token integrasi disimpan terenkripsi terpisah.'],
    ['Bagaimana cara membatasi akses berdasarkan IP?', 'Buka Security Settings dan isi IP allowlist dengan notasi CIDR, satu per baris.'],
    ['Apakah menyembunyikan menu sama dengan membatasi akses?', 'Tidak. Visibilitas menu hanya kenyamanan antarmuka. Setiap endpoint wajib memeriksa izin di server.'],
    ['Berapa lama audit log disimpan?', 'Audit log disimpan 365 hari pada paket Professional dan 7 tahun pada Enterprise.'],
    ['Bisakah saya mengekspor seluruh data?', 'Bisa. Buka General Settings → Data & ekspor → Ekspor seluruh data (JSON).'],
  ];

  K.page('help', {
    render(view) {
      const cats = [...new Map(articles.map(a => [a[0], a[1]])).entries()];
      view.innerHTML = `
        <section class="help-hero">
          <p class="eyebrow">Support</p>
          <h1 id="page-title" tabindex="-1">Ada yang bisa kami bantu?</h1>
          <p class="text-secondary mt-2">Cari panduan, jawaban, atau hubungi tim dukungan kami.</p>
          <label class="input-icon help-hero__search">${icon('search')}<input type="search" class="input" placeholder="mis. cara mengaktifkan 2FA" aria-label="Cari artikel bantuan" id="hp-q"></label>
          <div id="hp-results" class="help-results" hidden></div>
        </section>
        <div class="grid grid-3 mt-6">${cats.map(([c, ic]) => `<button type="button" class="card card--hover" style="text-align:left" data-cat="${esc(c)}"><span class="icon-tile">${icon(ic)}</span><h2 class="card__title mt-4">${esc(c)}</h2><p class="card__desc">${articles.filter(a => a[0] === c).length} artikel</p></button>`).join('')}
          <a href="#/docs" class="card card--hover" style="text-decoration:none;color:inherit"><span class="icon-tile">${icon('book-open')}</span><h2 class="card__title mt-4">Dokumentasi API</h2><p class="card__desc">Referensi teknis lengkap</p></a></div>
        <div class="grid grid-main-side mt-6">
          <article class="card"><h2 class="card__title">Pertanyaan umum</h2><div class="faq mt-4">${faqs.map(([q, a], i) => `<details ${i === 0 ? 'open' : ''}><summary>${esc(q)}${icon('chevron-down')}</summary><p>${esc(a)}</p></details>`).join('')}</div></article>
          <div class="stack">
            <article class="card"><h2 class="card__title">Hubungi dukungan</h2><p class="card__desc">Rata-rata waktu respons: 2 jam kerja.</p>
              <form class="stack mt-4" id="hp-form" novalidate style="gap:12px">
                ${K.ui.field({ name: 'subject', label: 'Subjek', required: true })}
                ${K.ui.field({ name: 'priority', label: 'Prioritas', type: 'select', options: [['low', 'Rendah'], ['normal', 'Normal'], ['high', 'Tinggi — memengaruhi produksi']], value: 'normal' })}
                ${K.ui.field({ name: 'message', label: 'Pesan', type: 'textarea', required: true })}
                <button type="submit" class="btn btn-primary">${icon('send')}<span>Kirim tiket</span></button>
              </form></article>
            <article class="card flex items-center gap-3"><span class="icon-tile icon-tile--success">${icon('activity')}</span><div class="flex-1"><p class="fw-600">Status layanan</p><p class="text-xs text-secondary">Lihat status &amp; insiden terkini</p></div><a href="#/health" class="btn btn-secondary btn-sm">Buka</a></article>
          </div>
        </div>`;
      const $ = q => view.querySelector(q);
      const showArticle = a => K.ui.modal({ title: a[2], desc: esc(a[0]), body: `<p style="line-height:1.7">${esc(a[3])}</p><div class="alert alert--info">${icon('lightbulb')}<div><p class="alert__title">Tips</p><p class="alert__text">Tekan <kbd>Ctrl</kbd> + <kbd>K</kbd> untuk langsung membuka halaman terkait.</p></div></div><div class="flex items-center gap-2 text-sm"><span class="text-secondary">Apakah artikel ini membantu?</span><button type="button" class="btn btn-secondary btn-sm" data-dismiss onclick="K.ui.toast('Terima kasih atas masukannya')">${icon('thumbs-up')}<span>Ya</span></button><button type="button" class="btn btn-secondary btn-sm" data-dismiss onclick="K.ui.toast('Terima kasih, kami akan memperbaikinya')">${icon('thumbs-down')}<span>Tidak</span></button></div>`, footer: '<button type="button" class="btn btn-secondary" data-dismiss>Tutup</button>' });
      const results = list => {
        const box = $('#hp-results'); box.hidden = false;
        box.innerHTML = list.length ? list.map(a => `<button type="button" class="help-result" data-article="${articles.indexOf(a)}">${icon(a[1])}<span class="flex-1"><span class="fw-500" style="display:block">${esc(a[2])}</span><span class="text-xs text-secondary">${esc(a[0])}</span></span>${icon('chevron-right', 'text-muted')}</button>`).join('') : `<p class="text-secondary text-sm" style="padding:12px">Tidak ada artikel yang cocok. Coba kirim tiket dukungan.</p>`;
      };
      $('#hp-q').addEventListener('input', K.util.debounce(e => {
        const q = e.target.value.toLowerCase().trim();
        if (!q) { $('#hp-results').hidden = true; return; }
        results(articles.filter(a => (a[2] + a[3] + a[0]).toLowerCase().includes(q)));
      }, 150));
      view.addEventListener('click', e => {
        const c = e.target.closest('[data-cat]'); if (c) { $('#hp-q').value = ''; results(articles.filter(a => a[0] === c.dataset.cat)); $('#hp-q').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        const a = e.target.closest('[data-article]'); if (a) showArticle(articles[+a.dataset.article]);
      });
      $('#hp-form').addEventListener('submit', e => {
        e.preventDefault();
        const f = e.target; const bad = [...f.querySelectorAll('[required]')].find(x => !x.value.trim());
        f.querySelectorAll('[required]').forEach(x => x.setAttribute('aria-invalid', !x.value.trim()));
        if (bad) { bad.focus(); K.ui.toast('Lengkapi subjek dan pesan', '', 'error'); return; }
        K.ui.toast('Tiket #' + (4800 + Math.floor(Math.random() * 99)) + ' dibuat', 'Kami akan membalas ke ' + K.currentUser().email);
        f.reset();
      });
    },
  });

  /* ======================= DOCUMENTATION ======================= */
  K.page('docs', {
    render(view) {
      const sections = [
        ['intro', 'Pengantar', `<p>API Kontrol adalah REST API berbasis JSON. Semua request memakai HTTPS ke base URL berikut:</p><div class="code">https://api.kontrol.id/v2</div><p>Respons selalu berupa JSON dengan header <code class="inline-code">Content-Type: application/json</code>. Tanggal memakai format ISO 8601 (UTC).</p>`],
        ['auth', 'Autentikasi', `<p>Sertakan API key di header <code class="inline-code">Authorization</code>. Buat key di halaman <a href="#/api">API Management</a>.</p><div class="code"><span class="c-k">curl</span> https://api.kontrol.id/v2/me \\\n  -H <span class="c-s">"Authorization: Bearer kt_live_xxxxxxxx"</span></div><div class="alert alert--warning">${icon('triangle-alert')}<div><p class="alert__title">Jangan expose key di frontend</p><p class="alert__text">Panggil API dari server Anda. Key di browser dapat dicuri.</p></div></div>`],
        ['pagination', 'Paginasi', `<p>Endpoint daftar memakai cursor pagination. Gunakan <code class="inline-code">limit</code> (maks 100) dan <code class="inline-code">cursor</code> dari respons sebelumnya.</p><div class="code">{\n  <span class="c-s">"data"</span>: [ ... ],\n  <span class="c-s">"next_cursor"</span>: <span class="c-s">"eyJpZCI6InVzcl8wMzgifQ"</span>,\n  <span class="c-s">"has_more"</span>: <span class="c-k">true</span>\n}</div><p>Cursor lebih stabil daripada offset ketika data berubah di tengah paginasi.</p>`],
        ['users', 'Users API', `<table class="table"><thead><tr><th scope="col">Metode</th><th scope="col">Endpoint</th><th scope="col">Keterangan</th></tr></thead><tbody>${[['GET', '/users', 'Daftar pengguna'], ['POST', '/users', 'Undang pengguna'], ['GET', '/users/{id}', 'Detail pengguna'], ['PATCH', '/users/{id}', 'Ubah peran / status'], ['DELETE', '/users/{id}', 'Hapus pengguna']].map(([m, p, d]) => `<tr><td><span class="method method--${m.toLowerCase()}">${m}</span></td><td class="mono text-xs">${p}</td><td>${d}</td></tr>`).join('')}</tbody></table><div class="code"><span class="c-k">POST</span> /v2/users\n{\n  <span class="c-s">"email"</span>: <span class="c-s">"rina@perusahaan.id"</span>,\n  <span class="c-s">"role"</span>: <span class="c-s">"editor"</span>,\n  <span class="c-s">"team"</span>: <span class="c-s">"Marketing"</span>\n}</div>`],
        ['webhooks', 'Webhooks', `<p>Kontrol mengirim event via HTTP POST. Verifikasi header <code class="inline-code">X-Kontrol-Signature</code> (HMAC-SHA256 dari raw body). Balas dengan status 2xx dalam 10 detik.</p><p>Event tersedia: ${K.seed.webhookEvents.map(e => `<code class="inline-code">${e}</code>`).join(' ')}</p><p>Gunakan <strong>idempotency</strong>: simpan <code class="inline-code">event.id</code> agar pengiriman ulang tidak diproses dua kali.</p>`],
        ['errors', 'Kode error', `<table class="table"><thead><tr><th scope="col">Status</th><th scope="col">Arti</th></tr></thead><tbody>${[['400', 'Request tidak valid — periksa field'], ['401', 'API key tidak ada / tidak valid'], ['403', 'Key tidak punya scope yang dibutuhkan'], ['404', 'Resource tidak ditemukan'], ['409', 'Konflik, mis. email sudah terdaftar'], ['422', 'Validasi gagal'], ['429', 'Rate limit terlampaui'], ['5xx', 'Kesalahan server — aman untuk dicoba ulang']].map(([c, d]) => `<tr><td class="mono fw-600">${c}</td><td>${d}</td></tr>`).join('')}</tbody></table>`],
        ['ratelimit', 'Rate limit', `<p>Batas 600 request/menit per key. Header respons:</p><div class="code">X-RateLimit-Limit: 600\nX-RateLimit-Remaining: 587\nX-RateLimit-Reset: 1792478460</div><p>Saat menerima <code class="inline-code">429</code>, tunggu sesuai <code class="inline-code">Retry-After</code> lalu gunakan exponential backoff dengan jitter.</p>`],
      ];
      view.innerHTML = `${K.ui.pageHead({ title: 'Documentation', eyebrow: 'Support', desc: 'Referensi API v2, autentikasi, webhook, dan praktik terbaik integrasi.', actions: `<span class="badge badge--info">API v2.4</span><button type="button" class="btn btn-secondary btn-sm" id="dc-dl">${icon('download')}<span>OpenAPI spec</span></button>` })}
        <div class="docs-layout">
          <nav class="docs-toc" aria-label="Daftar isi"><p class="section-label">Daftar isi</p>${sections.map(([id, t]) => `<a href="#doc-${id}" data-toc="${id}">${t}</a>`).join('')}</nav>
          <select class="select docs-toc-mobile" aria-label="Lompat ke bagian">${sections.map(([id, t]) => `<option value="${id}">${t}</option>`).join('')}</select>
          <article class="card docs-body">${sections.map(([id, t, html]) => `<section id="doc-${id}" class="docs-section"><h2>${t}</h2>${html}</section>`).join('')}
            <div class="card__foot"><span>Terakhir diperbarui 14 Okt 2026</span><a href="#/feedback">Saran untuk dokumentasi?</a></div></article>
        </div>`;
      const go = id => view.querySelector('#doc-' + id).scrollIntoView({ behavior: 'smooth', block: 'start' });
      view.querySelectorAll('[data-toc]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); go(a.dataset.toc); }));
      view.querySelector('.docs-toc-mobile').addEventListener('change', e => go(e.target.value));
      view.querySelector('#dc-dl').addEventListener('click', () => { K.util.downloadFile('kontrol-openapi.json', JSON.stringify({ openapi: '3.1.0', info: { title: 'Kontrol API', version: '2.4.0' }, servers: [{ url: 'https://api.kontrol.id/v2' }], paths: { '/users': { get: { summary: 'Daftar pengguna' }, post: { summary: 'Undang pengguna' } } } }, null, 2), 'application/json'); K.ui.toast('Spesifikasi OpenAPI diunduh'); });
      view.querySelectorAll('.docs-body .code').forEach(c => { c.insertAdjacentHTML('afterbegin', K.ui.iconBtn('copy', 'Salin kode', 'data-copy-code', 'code-copy')); });
      view.addEventListener('click', e => { const b = e.target.closest('[data-copy-code]'); if (b) K.util.copy(b.parentElement.innerText.trim()).then(() => K.ui.toast('Kode disalin', '', 'success', 1500)); });
      // Scrollspy: tandai bagian yang sedang terlihat
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { const id = en.target.id.replace('doc-', ''); view.querySelectorAll('[data-toc]').forEach(a => a.toggleAttribute('aria-current', a.dataset.toc === id)); view.querySelector('.docs-toc-mobile').value = id; } });
      }, { rootMargin: '-90px 0px -65% 0px' });
      view.querySelectorAll('.docs-section').forEach(s => io.observe(s));
      return () => io.disconnect();
    },
  });

  /* ======================= FEEDBACK ======================= */
  K.page('feedback', {
    render(view) {
      const voted = new Set(K.prefs.get('kontrol:votes', []));
      const typeMeta = { idea: ['lightbulb', 'Ide'], bug: ['bug', 'Bug'], question: ['circle-help', 'Pertanyaan'] };
      view.innerHTML = `${K.ui.pageHead({ title: 'Feedback', eyebrow: 'Support', desc: 'Bantu kami membangun Kontrol yang lebih baik. Setiap masukan dibaca oleh tim produk.' })}
        <div class="grid grid-main-side">
          <form class="card" id="fb-form" novalidate>
            <h2 class="card__title">Kirim masukan</h2>
            <div class="choice-grid mt-4" role="radiogroup" aria-label="Jenis masukan">${Object.entries(typeMeta).map(([k, [ic, l]], i) => `<label class="choice"><input type="radio" name="type" value="${k}" ${i === 0 ? 'checked' : ''}><span class="icon-tile">${icon(ic)}</span><span class="choice__title">${l}</span></label>`).join('')}</div>
            <div class="stack mt-4" style="gap:14px">
              ${K.ui.field({ name: 'title', label: 'Judul', required: true, placeholder: 'Ringkas dalam satu kalimat' })}
              ${K.ui.field({ name: 'detail', label: 'Detail', type: 'textarea', required: true, placeholder: 'Apa yang terjadi? Apa yang Anda harapkan?' })}
              <fieldset class="field" style="border:0;padding:0;margin:0"><legend class="label" style="margin-bottom:6px">Seberapa puas Anda dengan Kontrol?</legend><div class="rating" role="radiogroup">${['Sangat tidak puas', 'Tidak puas', 'Biasa', 'Puas', 'Sangat puas'].map((l, i) => `<label title="${l}"><input type="radio" name="rating" value="${i + 1}" ${i === 3 ? 'checked' : ''} aria-label="${l}"><span>${['😞', '🙁', '😐', '🙂', '😍'][i]}</span></label>`).join('')}</div></fieldset>
              <label class="check"><input type="checkbox" name="contact" checked> Boleh dihubungi untuk tindak lanjut</label>
              <button type="submit" class="btn btn-primary">${icon('send')}<span>Kirim masukan</span></button>
            </div>
          </form>
          <article class="card card--flush"><div class="card__head"><div><h2 class="card__title">Papan masukan</h2><p class="card__desc">Dukung ide yang Anda inginkan.</p></div></div><ul class="fb-list" id="fb-list"></ul></article>
        </div>`;
      const $ = q => view.querySelector(q);
      const draw = () => {
        $('#fb-list').innerHTML = [...S.all('feedback')].sort((a, b) => b.votes - a.votes).map(f => `<li class="fb-item">
          <button type="button" class="vote ${voted.has(f.id) ? 'is-voted' : ''}" data-vote="${f.id}" aria-pressed="${voted.has(f.id)}" aria-label="Dukung: ${esc(f.title)}">${icon('chevron-up')}<span>${f.votes}</span></button>
          <div class="flex-1"><p class="fw-500">${esc(f.title)}</p><p class="text-xs text-secondary mt-1 flex items-center gap-2">${icon(typeMeta[f.type][0], 'i-12')}${typeMeta[f.type][1]} · ${K.util.ago(f.createdAt)}</p></div>${K.ui.badge(f.status)}</li>`).join('');
      };
      view.addEventListener('click', e => {
        const v = e.target.closest('[data-vote]'); if (!v) return;
        const f = S.get('feedback', v.dataset.vote);
        if (voted.has(f.id)) { voted.delete(f.id); S.update('feedback', f.id, { votes: f.votes - 1 }); } else { voted.add(f.id); S.update('feedback', f.id, { votes: f.votes + 1 }); }
        K.prefs.set('kontrol:votes', [...voted]); draw();
      });
      $('#fb-form').addEventListener('submit', e => {
        e.preventDefault();
        const f = e.target, d = K.util.formData(f);
        const bad = ['title', 'detail'].find(n => !d[n]);
        ['title', 'detail'].forEach(n => f[n].setAttribute('aria-invalid', !d[n]));
        if (bad) { f[bad].focus(); K.ui.toast('Lengkapi judul dan detail', '', 'error'); return; }
        S.insert('feedback', { type: d.type, title: d.title, status: d.type === 'question' ? 'pending' : 'planned', votes: 1 }, { idPrefix: 'fb' });
        f.reset(); draw(); K.ui.toast('Terima kasih!', 'Masukan Anda sudah kami terima.');
      });
      draw();
    },
  });
})(window.K);
