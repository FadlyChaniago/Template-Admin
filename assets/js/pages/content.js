/* ==========================================================================
   Content → Pages, Media Library, Categories, Tags
   ========================================================================== */
(function (K) {
  'use strict';
  const { esc, num } = K.util;
  const { icon } = K.ui;
  const S = K.store;

  const catChip = id => { const c = K.lookup.category(id); return c ? `<span class="chip"><span class="chip__swatch" style="background:var(--av-${c.color}-fg)"></span>${esc(c.name)}</span>` : '<span class="text-muted">—</span>'; };
  const pageCount = catId => S.count('pages', p => p.categoryId === catId);
  const tagCount = tagId => S.count('pages', p => (p.tags || []).includes(tagId));

  /* ======================= PAGES ======================= */
  K.page('pages', {
    render(view, route) {
      view.innerHTML = `${K.ui.pageHead({
        title: 'Pages', eyebrow: 'Content', desc: 'Buat, sunting, dan terbitkan halaman situs atau basis pengetahuan.',
        actions: `<button type="button" class="btn btn-primary btn-sm" id="pg-new">${icon('file-plus')}<span>Halaman baru</span></button>`,
      })}<div class="grid grid-4" id="pg-kpis"></div><div class="mt-4" id="pg-table"></div>`;
      const $ = s => view.querySelector(s);
      const kpis = () => {
        const p = S.all('pages');
        $('#pg-kpis').innerHTML = [
          K.ui.kpi({ label: 'Total halaman', value: num(p.length), icon: 'files', foot: 'di semua status' }),
          K.ui.kpi({ label: 'Terbit', value: num(p.filter(x => x.status === 'published').length), icon: 'globe', foot: 'dapat diakses publik' }),
          K.ui.kpi({ label: 'Draf & terjadwal', value: num(p.filter(x => ['draft', 'scheduled'].includes(x.status)).length), icon: 'pen-line', foot: 'menunggu terbit' }),
          K.ui.kpi({ label: 'Total tampilan', value: num(p.reduce((s, x) => s + (x.views || 0), 0)), icon: 'eye', trend: 11.2 }),
        ].join('');
      };

      const table = new K.DataTable($('#pg-table'), {
        title: 'Semua halaman', rows: () => S.all('pages'), selectable: true, pageSize: 10, exportName: 'halaman',
        search: r => r.title + ' ' + r.slug,
        tabs: { key: 'status', options: [['published', 'Terbit'], ['draft', 'Draf'], ['scheduled', 'Terjadwal'], ['archived', 'Arsip']] },
        selects: [{ key: 'categoryId', label: 'Semua kategori', options: S.all('categories').map(c => [c.id, c.name]) }],
        defaultSort: { key: 'updatedAt', dir: 'desc' },
        columns: [
          { key: 'title', label: 'Judul', sortable: true, render: r => `<div><p class="fw-500">${esc(r.title)}</p><p class="text-xs text-secondary mono">${esc(r.slug)}</p></div>` },
          { key: 'categoryId', label: 'Kategori', className: 'hide-md', render: r => catChip(r.categoryId), csv: r => K.lookup.category(r.categoryId)?.name || '' },
          { key: 'authorId', label: 'Penulis', className: 'hide-lg', render: r => K.ui.person(K.lookup.user(r.authorId), ''), csv: r => K.lookup.user(r.authorId).name },
          { key: 'views', label: 'Tampilan', sortable: true, className: 'num hide-sm', render: r => r.views ? num(r.views) : '<span class="text-muted">—</span>' },
          { key: 'updatedAt', label: 'Diperbarui', sortable: true, className: 'hide-sm nowrap', render: r => `<span class="text-secondary">${r.status === 'scheduled' && r.publishAt ? 'Terbit ' + K.util.date(r.publishAt) : K.util.ago(r.updatedAt)}</span>` },
          { key: 'status', label: 'Status', render: r => K.ui.badge(r.status) },
        ],
        rowActions: r => `${K.ui.iconBtn('pencil', 'Edit ' + r.title, 'data-action="edit"')}
          <div class="menu-anchor">${K.ui.iconBtn('ellipsis', 'Aksi lainnya', 'data-menu-toggle aria-expanded="false"')}<div class="menu" role="menu">
            <button type="button" class="menu__item" data-action="preview">${icon('eye')}Pratinjau</button>
            ${r.status !== 'published' ? `<button type="button" class="menu__item" data-action="publish">${icon('send')}Terbitkan sekarang</button>` : `<button type="button" class="menu__item" data-action="unpublish">${icon('eye-off')}Jadikan draf</button>`}
            <button type="button" class="menu__item" data-action="dup">${icon('copy')}Duplikat</button>
            <button type="button" class="menu__item" data-action="archive">${icon('archive')}Arsipkan</button>
            <div class="menu__sep"></div><button type="button" class="menu__item menu__item--danger" data-action="delete">${icon('trash-2')}Hapus</button></div></div>`,
        bulkActions: [
          { label: 'Terbitkan', icon: 'send', handler: ids => { S.updateWhere('pages', p => ids.includes(p.id), { status: 'published', updatedAt: new Date().toISOString() }); kpis(); K.ui.toast(`${ids.length} halaman diterbitkan`); } },
          { label: 'Arsipkan', icon: 'archive', handler: ids => { S.updateWhere('pages', p => ids.includes(p.id), { status: 'archived' }); kpis(); K.ui.toast(`${ids.length} halaman diarsipkan`); } },
          { label: 'Hapus', icon: 'trash-2', variant: 'danger', handler: ids => K.ui.confirm({ title: `Hapus ${ids.length} halaman?` }).then(ok => { if (ok) { S.remove('pages', ids); kpis(); } return ok; }) },
        ],
        onAction: (a, r) => {
          const upd = (patch, msg) => { S.update('pages', r.id, { ...patch, updatedAt: new Date().toISOString() }); table.refresh(); kpis(); K.ui.toast(msg, r.title); };
          if (a === 'edit') editor(r);
          if (a === 'preview') preview(r);
          if (a === 'publish') { upd({ status: 'published', publishAt: null }, 'Halaman diterbitkan'); S.audit('page.publish', 'Menerbitkan halaman', r.title, 'info', 'Page'); }
          if (a === 'unpublish') upd({ status: 'draft' }, 'Halaman dijadikan draf');
          if (a === 'archive') upd({ status: 'archived' }, 'Halaman diarsipkan');
          if (a === 'dup') { S.insert('pages', { ...r, id: undefined, title: r.title + ' (salinan)', slug: r.slug + '-salinan', status: 'draft', views: 0, updatedAt: new Date().toISOString() }, { idPrefix: 'page' }); table.refresh(); kpis(); K.ui.toast('Halaman diduplikat'); }
          if (a === 'delete') K.ui.confirm({ title: 'Hapus halaman?', text: `"${r.title}" akan dihapus permanen.` }).then(ok => { if (ok) { S.remove('pages', r.id); S.audit('page.delete', 'Menghapus halaman', r.title, 'danger', 'Page'); table.refresh(); kpis(); K.ui.toast('Halaman dihapus'); } });
        },
      });

      function editor(p) {
        const tags = S.all('tags');
        K.ui.modal({
          title: p ? 'Edit halaman' : 'Halaman baru', size: 'lg',
          body: `<div class="form-grid">
            ${K.ui.field({ name: 'title', label: 'Judul', required: true, value: p?.title, span: true, placeholder: 'Judul halaman' })}
            <div class="field span-2"><label class="label" for="f_slug">Slug URL</label><div class="flex"><span class="input-addon">kontrol.id</span><input class="input" id="f_slug" name="slug" value="${esc(p?.slug || '/')}" required pattern="/[a-z0-9\\-\\/]*"></div><p class="help">Huruf kecil, angka, dan tanda hubung. Terisi otomatis dari judul.</p></div>
            ${K.ui.field({ name: 'categoryId', label: 'Kategori', type: 'select', value: p?.categoryId, options: S.all('categories').map(c => [c.id, c.name]) })}
            ${K.ui.field({ name: 'status', label: 'Status', type: 'select', value: p?.status || 'draft', options: [['draft', 'Draf'], ['published', 'Terbit'], ['scheduled', 'Terjadwal'], ['archived', 'Arsip']] })}
            <div class="field span-2" data-schedule hidden>${K.ui.field({ name: 'publishAt', label: 'Tanggal terbit', type: 'datetime-local', value: p?.publishAt ? p.publishAt.slice(0, 16) : '' })}</div>
            ${K.ui.field({ name: 'excerpt', label: 'Ringkasan (meta description)', type: 'textarea', value: p?.excerpt, span: true, help: 'Disarankan 120–160 karakter.' })}
            <div class="field span-2"><label class="label" for="f_body">Konten</label>
              <div class="editor"><div class="editor__bar" role="toolbar" aria-label="Format teks">${[['bold', 'Tebal', '**'], ['italic', 'Miring', '_'], ['heading-2', 'Judul', '## '], ['list', 'Daftar', '- '], ['link', 'Tautan', '[]()'], ['code', 'Kode', '`']].map(([ic, l, t]) => `<button type="button" class="icon-btn icon-btn--sm" data-md="${esc(t)}" aria-label="${l}" title="${l}">${icon(ic)}</button>`).join('')}</div>
              <textarea class="textarea" id="f_body" name="body" style="min-height:180px;border:0;border-radius:0 0 8px 8px" placeholder="Tulis konten dengan Markdown…">${esc(p?.body || '## ' + (p?.title || 'Judul') + '\n\nTulis konten di sini.')}</textarea></div><p class="help" data-wc></p></div>
            ${K.ui.field({ name: 'tags', label: 'Tag', type: 'checkboxes', value: p?.tags || [], options: tags.map(t => [t.id, '#' + t.name]), span: true })}
          </div>`,
          submitLabel: p ? 'Simpan perubahan' : 'Simpan halaman',
          onOpen: dlg => {
            const title = dlg.querySelector('[name=title]'), slug = dlg.querySelector('[name=slug]'), status = dlg.querySelector('[name=status]'), body = dlg.querySelector('[name=body]');
            let slugTouched = !!p;
            slug.addEventListener('input', () => { slugTouched = true; });
            title.addEventListener('input', () => { if (!slugTouched) slug.value = '/' + K.util.slugify(title.value); });
            const sched = () => { dlg.querySelector('[data-schedule]').hidden = status.value !== 'scheduled'; };
            status.addEventListener('change', sched); sched();
            const wc = () => { dlg.querySelector('[data-wc]').textContent = `${body.value.trim().split(/\s+/).filter(Boolean).length} kata · ±${Math.max(1, Math.round(body.value.split(/\s+/).length / 200))} menit baca`; };
            body.addEventListener('input', wc); wc();
            dlg.querySelector('.editor__bar').addEventListener('click', e => {
              const b = e.target.closest('[data-md]'); if (!b) return;
              const t = b.dataset.md, s = body.selectionStart, en = body.selectionEnd, sel = body.value.slice(s, en) || 'teks';
              const ins = t === '[]()' ? `[${sel}](https://)` : t.endsWith(' ') ? t + sel : t + sel + t;
              body.setRangeText(ins, s, en, 'end'); body.focus(); wc();
            });
          },
          onSubmit: (d, form) => {
            const data = { title: d.title, slug: d.slug, categoryId: d.categoryId, status: d.status, excerpt: d.excerpt, body: d.body, tags: K.ui.checkedValues(form, 'tags'), publishAt: d.status === 'scheduled' && d.publishAt ? new Date(d.publishAt).toISOString() : null, updatedAt: new Date().toISOString() };
            if (S.all('pages').some(x => x.slug === d.slug && x.id !== p?.id)) { K.ui.toast('Slug sudah digunakan', d.slug, 'error'); return false; }
            p ? S.update('pages', p.id, data) : S.insert('pages', { ...data, authorId: 'usr_me', views: 0 }, { idPrefix: 'page' });
            table.refresh(); kpis(); K.ui.toast(p ? 'Halaman disimpan' : 'Halaman dibuat', d.title);
          },
        });
      }

      function preview(p) {
        const body = esc(p.body || `## ${p.title}\n\n${p.excerpt}`)
          .replace(/^## (.*)$/gm, '<h2 style="font-size:20px;margin:0 0 12px">$1</h2>')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/_(.+?)_/g, '<em>$1</em>')
          .replace(/^- (.*)$/gm, '• $1').replace(/\n\n/g, '<br><br>');
        K.ui.modal({
          title: 'Pratinjau', desc: `<span class="mono">kontrol.id${esc(p.slug)}</span>`, size: 'lg',
          body: `<div class="browser-frame"><div class="browser-frame__bar"><span></span><span></span><span></span><p class="mono">kontrol.id${esc(p.slug)}</p></div><article class="browser-frame__body"><p class="eyebrow">${esc(K.lookup.category(p.categoryId)?.name || 'Halaman')}</p><h1 style="font-size:28px;letter-spacing:-0.8px;margin:12px 0 6px">${esc(p.title)}</h1><p class="text-secondary text-sm" style="margin-bottom:20px">Oleh ${esc(K.lookup.user(p.authorId).name)} · ${K.util.date(p.updatedAt)}</p><div style="line-height:1.7">${body}</div></article></div>`,
          footer: '<button type="button" class="btn btn-secondary" data-dismiss>Tutup</button>',
        });
      }

      $('#pg-new').addEventListener('click', () => editor());
      kpis();
      if (route.query.action === 'new') { history.replaceState(null, '', '#/pages'); editor(); }
    },
  });

  /* ======================= MEDIA LIBRARY ======================= */
  const blobUrls = new Map(); // pratinjau file yang diunggah selama sesi ini
  K.page('media', {
    render(view) {
      let layout = K.prefs.get('kontrol:media-layout', 'grid'), type = 'all', q = '';
      const typeIcon = { image: 'image', video: 'film', audio: 'music', document: 'file-text' };
      view.innerHTML = `${K.ui.pageHead({
        title: 'Media Library', eyebrow: 'Content', desc: 'Simpan dan kelola gambar, video, audio, dan dokumen.',
        actions: `<label class="btn btn-primary btn-sm" style="cursor:pointer">${icon('upload')}<span>Unggah file</span><input type="file" multiple class="sr-only" id="md-upload"></label>`,
      })}
        <div class="grid grid-4" id="md-stats"></div>
        <article class="card mt-4">
          <div class="flex wrap items-center justify-between gap-3">
            <div class="tabs" role="tablist" aria-label="Jenis media" id="md-tabs"></div>
            <div class="flex items-center gap-2 wrap">
              <label class="input-icon" style="width:220px">${icon('search')}<input type="search" class="input input-sm" placeholder="Cari file…" aria-label="Cari file" id="md-q"></label>
              <div class="segmented" role="group" aria-label="Tampilan"><button type="button" data-layout="grid" aria-pressed="${layout === 'grid'}" aria-label="Grid">${icon('layout-grid')}</button><button type="button" data-layout="list" aria-pressed="${layout === 'list'}" aria-label="Daftar">${icon('list')}</button></div>
            </div>
          </div>
          <label class="dropzone mt-4" id="md-drop" for="md-upload">${icon('upload-cloud')}<span class="fw-600">Seret file ke sini untuk mengunggah</span><span class="text-xs text-secondary">PNG, JPG, SVG, MP4, PDF · maks 50 MB per file</span></label>
          <div class="mt-4" id="md-items"></div>
        </article>`;
      const $ = s => view.querySelector(s);

      const thumb = (m, big) => {
        const url = blobUrls.get(m.id);
        if (url && m.type === 'image') return `<img src="${url}" alt="${esc(m.alt)}" class="media-thumb__img">`;
        return `<span class="media-thumb__ph" data-c="${m.tone}">${icon(typeIcon[m.type] || 'file', big ? 'i-32' : '')}<span class="media-thumb__ext">${esc(m.name.split('.').pop().toUpperCase())}</span></span>`;
      };

      function stats() {
        const all = S.all('media');
        const size = all.reduce((s, m) => s + m.size, 0);
        const set = K.store.settings();
        $('#md-stats').innerHTML = [
          K.ui.kpi({ label: 'Total file', value: num(all.length), icon: 'files', foot: 'di pustaka media' }),
          K.ui.kpi({ label: 'Gambar', value: num(all.filter(m => m.type === 'image').length), icon: 'image', foot: 'PNG, JPG, SVG' }),
          K.ui.kpi({ label: 'Ukuran total', value: K.util.bytes(size), icon: 'hard-drive', foot: 'dari pustaka ini' }),
          `<article class="card kpi"><div class="kpi__head"><h2 class="kpi__label">Kuota penyimpanan</h2><span class="kpi__icon">${icon('database')}</span></div><p class="kpi__value">${num(set.storageUsed, 1)}<small> / ${set.storageTotal} GB</small></p><div class="mt-4">${K.ui.progress((set.storageUsed / set.storageTotal) * 100)}</div></article>`,
        ].join('');
        const counts = { all: all.length }; all.forEach(m => { counts[m.type] = (counts[m.type] || 0) + 1; });
        $('#md-tabs').innerHTML = [['all', 'Semua'], ['image', 'Gambar'], ['video', 'Video'], ['audio', 'Audio'], ['document', 'Dokumen']].map(([k, l]) => `<button type="button" role="tab" class="tab" data-type="${k}" aria-selected="${k === type}">${l} <span class="count-pill">${counts[k] || 0}</span></button>`).join('');
      }

      function draw() {
        let items = S.all('media');
        if (type !== 'all') items = items.filter(m => m.type === type);
        if (q) items = items.filter(m => m.name.toLowerCase().includes(q));
        if (!items.length) { $('#md-items').innerHTML = K.ui.empty({ icon: 'image-off', title: 'Tidak ada media', text: 'Unggah file atau ubah filter.' }); return; }
        $('#md-items').innerHTML = layout === 'grid'
          ? `<div class="media-grid">${items.map(m => `<button type="button" class="media-card" data-id="${m.id}" aria-label="Detail ${esc(m.name)}"><span class="media-thumb">${thumb(m)}</span><span class="media-card__meta"><span class="truncate fw-500" style="display:block">${esc(m.name)}</span><span class="text-xs text-secondary">${K.util.bytes(m.size)}${m.dims ? ' · ' + esc(m.dims) : ''}</span></span></button>`).join('')}</div>`
          : `<div class="table-wrap" style="margin:0 -20px"><table class="table"><thead><tr><th scope="col">Nama</th><th scope="col" class="hide-sm">Jenis</th><th scope="col" class="num">Ukuran</th><th scope="col" class="hide-md">Diunggah oleh</th><th scope="col" class="hide-lg">Tanggal</th></tr></thead><tbody>${items.map(m => `<tr data-id="${m.id}" style="cursor:pointer"><td><div class="flex items-center gap-3"><span class="media-thumb media-thumb--sm">${thumb(m)}</span><span class="fw-500 truncate" style="max-width:260px">${esc(m.name)}</span></div></td><td class="hide-sm text-secondary">${esc(m.type)}</td><td class="num">${K.util.bytes(m.size)}</td><td class="hide-md">${esc(K.lookup.user(m.uploadedBy).name)}</td><td class="hide-lg text-secondary nowrap">${K.util.date(m.createdAt)}</td></tr>`).join('')}</tbody></table></div>`;
      }

      function detail(m) {
        K.ui.modal({
          title: m.name, size: 'lg',
          body: `<div class="grid grid-2" style="align-items:start"><div class="media-thumb media-thumb--lg">${thumb(m, true)}</div>
            <div class="stack" style="gap:14px"><dl class="dl"><dt>Jenis</dt><dd>${esc(m.type)}</dd><dt>Ukuran</dt><dd>${K.util.bytes(m.size)}</dd>${m.dims ? `<dt>Dimensi</dt><dd>${esc(m.dims)}</dd>` : ''}<dt>Diunggah</dt><dd>${K.util.dateTime(m.createdAt)}</dd><dt>Oleh</dt><dd>${esc(K.lookup.user(m.uploadedBy).name)}</dd></dl>
            ${K.ui.field({ name: 'alt', label: 'Teks alternatif (alt)', value: m.alt, help: 'Deskripsikan gambar untuk pembaca layar.' })}
            <div class="field"><span class="label">URL publik</span><div class="input-group"><input class="input input-sm mono" readonly value="https://cdn.kontrol.id/media/${esc(m.name)}" aria-label="URL publik"><button type="button" class="btn btn-secondary btn-sm" data-copy>${icon('copy')}<span>Salin</span></button></div></div></div></div>`,
          footer: `<button type="button" class="btn btn-danger-ghost" data-del style="margin-right:auto">${icon('trash-2')}<span>Hapus</span></button><button type="button" class="btn btn-secondary" data-dismiss>Tutup</button><button type="submit" class="btn btn-primary">Simpan</button>`,
          onSubmit: d => { S.update('media', m.id, { alt: d.alt }); K.ui.toast('Media diperbarui'); },
          onOpen: dlg => {
            dlg.querySelector('[data-copy]').addEventListener('click', () => K.util.copy(dlg.querySelector('[readonly]').value).then(() => K.ui.toast('URL disalin')));
            dlg.querySelector('[data-del]').addEventListener('click', () => { dlg.close(); K.ui.confirm({ title: 'Hapus file?', text: m.name + ' akan dihapus dari pustaka.' }).then(ok => { if (ok) { S.remove('media', m.id); stats(); draw(); K.ui.toast('File dihapus'); } }); });
          },
        });
      }

      function addFiles(files) {
        [...files].forEach(f => {
          const t = f.type.startsWith('image') ? 'image' : f.type.startsWith('video') ? 'video' : f.type.startsWith('audio') ? 'audio' : 'document';
          const m = S.insert('media', { name: f.name, type: t, size: f.size, dims: null, uploadedBy: 'usr_me', tone: K.util.tone(f.name), alt: f.name.replace(/\.[^.]+$/, '') }, { idPrefix: 'med' });
          if (t === 'image') blobUrls.set(m.id, URL.createObjectURL(f));
        });
        stats(); draw(); K.ui.toast(`${files.length} file diunggah`, 'Pratinjau gambar tersedia selama sesi ini (demo tanpa server).');
      }

      $('#md-upload').addEventListener('change', e => { if (e.target.files.length) addFiles(e.target.files); e.target.value = ''; });
      const drop = $('#md-drop');
      ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('is-over'); }));
      ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('is-over'); }));
      drop.addEventListener('drop', e => e.dataTransfer.files.length && addFiles(e.dataTransfer.files));
      view.addEventListener('click', e => {
        const t = e.target.closest('[data-type]'); if (t) { type = t.dataset.type; stats(); draw(); return; }
        const l = e.target.closest('[data-layout]'); if (l) { layout = l.dataset.layout; K.prefs.set('kontrol:media-layout', layout); view.querySelectorAll('[data-layout]').forEach(x => x.setAttribute('aria-pressed', x === l)); draw(); return; }
        const it = e.target.closest('#md-items [data-id]'); if (it) detail(S.get('media', it.dataset.id));
      });
      $('#md-q').addEventListener('input', K.util.debounce(e => { q = e.target.value.toLowerCase().trim(); draw(); }, 120));
      stats(); draw();
    },
  });

  /* ======================= CATEGORIES ======================= */
  K.page('categories', {
    render(view) {
      const colors = ['blue', 'emerald', 'amber', 'rose', 'violet', 'sky'];
      view.innerHTML = `${K.ui.pageHead({ title: 'Categories', eyebrow: 'Content', desc: 'Struktur hierarki untuk mengelompokkan halaman.' })}
        <div class="grid grid-side-main grid-side-main--wide">
          <article class="card"><h2 class="card__title" id="cat-form-title">Tambah kategori</h2><p class="card__desc">Slug dibuat otomatis dari nama.</p>
            <form class="stack mt-5" id="cat-form" novalidate>
              ${K.ui.field({ name: 'name', label: 'Nama', required: true, placeholder: 'mis. Tutorial' })}
              ${K.ui.field({ name: 'slug', label: 'Slug', placeholder: 'tutorial' })}
              ${K.ui.field({ name: 'parent', label: 'Induk', type: 'select', options: [['', '— Tidak ada (tingkat atas) —']] })}
              ${K.ui.field({ name: 'description', label: 'Deskripsi', type: 'textarea' })}
              <div class="field"><span class="label">Warna</span><div class="flex gap-2" role="radiogroup" aria-label="Warna kategori">${colors.map((c, i) => `<label class="color-dot" style="--c:var(--av-${c}-fg)"><input type="radio" name="color" value="${c}" ${i === 0 ? 'checked' : ''} aria-label="${c}"><span></span></label>`).join('')}</div></div>
              <input type="hidden" name="id">
              <div class="btn-group"><button type="submit" class="btn btn-primary">${icon('plus')}<span data-submit-label>Tambah kategori</span></button><button type="button" class="btn btn-ghost" data-cancel hidden>Batal edit</button></div>
            </form>
          </article>
          <div id="cat-table"></div>
        </div>`;
      const $ = s => view.querySelector(s);
      const form = $('#cat-form');
      const fillParents = (exclude) => { form.parent.innerHTML = `<option value="">— Tidak ada (tingkat atas) —</option>` + S.all('categories').filter(c => !c.parent && c.id !== exclude).map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join(''); };
      fillParents();
      form.name.addEventListener('input', () => { if (!form.id.value) form.slug.value = K.util.slugify(form.name.value); });

      const table = new K.DataTable($('#cat-table'), {
        title: 'Semua kategori', pageSize: 10, exportName: 'kategori',
        rows: () => { const all = S.all('categories'); return all.filter(c => !c.parent).flatMap(c => [c, ...all.filter(x => x.parent === c.id)]); },
        search: r => r.name + ' ' + r.slug,
        columns: [
          { key: 'name', label: 'Nama', render: r => `<div class="flex items-center gap-2" style="padding-left:${r.parent ? 22 : 0}px">${r.parent ? `<span class="text-muted">${icon('corner-down-right', 'i-14')}</span>` : ''}<span class="chip__swatch" style="width:10px;height:10px;background:var(--av-${r.color}-fg)"></span><div><p class="fw-500">${esc(r.name)}</p><p class="text-xs text-secondary">${esc(r.description || '')}</p></div></div>` },
          { key: 'slug', label: 'Slug', className: 'hide-md', render: r => `<span class="mono text-xs">${esc(r.slug)}</span>` },
          { key: 'count', label: 'Halaman', className: 'num', render: r => num(pageCount(r.id)), csv: r => pageCount(r.id) },
        ],
        rowActions: () => `${K.ui.iconBtn('pencil', 'Edit', 'data-action="edit"')}${K.ui.iconBtn('trash-2', 'Hapus', 'data-action="delete"', 'is-danger')}`,
        onAction: (a, r) => {
          if (a === 'edit') {
            fillParents(r.id);
            form.id.value = r.id; form.name.value = r.name; form.slug.value = r.slug; form.parent.value = r.parent || ''; form.description.value = r.description || '';
            form.querySelector(`[name=color][value="${r.color}"]`).checked = true;
            $('#cat-form-title').textContent = 'Edit kategori'; form.querySelector('[data-submit-label]').textContent = 'Simpan perubahan'; form.querySelector('[data-cancel]').hidden = false;
            form.name.focus();
          }
          if (a === 'delete') {
            const n = pageCount(r.id), kids = S.count('categories', c => c.parent === r.id);
            K.ui.confirm({ title: `Hapus kategori ${r.name}?`, text: `${n} halaman akan menjadi tanpa kategori${kids ? ` dan ${kids} sub-kategori dipindah ke tingkat atas` : ''}.` }).then(ok => {
              if (!ok) return;
              S.updateWhere('pages', p => p.categoryId === r.id, { categoryId: null });
              S.updateWhere('categories', c => c.parent === r.id, { parent: null });
              S.remove('categories', r.id); fillParents(); table.refresh(); K.ui.toast('Kategori dihapus');
            });
          }
        },
      });
      const resetForm = () => { form.reset(); form.id.value = ''; fillParents(); $('#cat-form-title').textContent = 'Tambah kategori'; form.querySelector('[data-submit-label]').textContent = 'Tambah kategori'; form.querySelector('[data-cancel]').hidden = true; };
      form.querySelector('[data-cancel]').addEventListener('click', resetForm);
      form.addEventListener('submit', e => {
        e.preventDefault();
        const d = K.util.formData(form);
        if (!d.name) { form.name.setAttribute('aria-invalid', 'true'); form.name.focus(); K.ui.toast('Nama kategori wajib diisi', '', 'error'); return; }
        form.name.removeAttribute('aria-invalid');
        const data = { name: d.name, slug: d.slug || K.util.slugify(d.name), parent: d.parent || null, description: d.description, color: d.color };
        if (d.id) S.update('categories', d.id, data); else S.insert('categories', data, { idPrefix: 'cat', prepend: false });
        K.ui.toast(d.id ? 'Kategori diperbarui' : 'Kategori ditambahkan', d.name);
        resetForm(); table.refresh();
      });
    },
  });

  /* ======================= TAGS ======================= */
  K.page('tags', {
    render(view) {
      view.innerHTML = `${K.ui.pageHead({ title: 'Tags', eyebrow: 'Content', desc: 'Label bebas untuk menghubungkan konten lintas kategori.' })}
        <article class="card">
          <div class="card__head"><div><h2 class="card__title">Tambah tag cepat</h2><p class="card__desc">Ketik lalu tekan Enter. Pisahkan beberapa tag dengan koma.</p></div></div>
          <form class="flex gap-2 mt-4 wrap" id="tag-form"><input class="input flex-1" name="names" placeholder="mis. keamanan, rilis-q4" aria-label="Nama tag baru" style="min-width:220px"><button type="submit" class="btn btn-primary">${icon('plus')}<span>Tambah</span></button></form>
          <p class="section-label mt-6">Awan tag</p><div class="tag-cloud" id="tag-cloud"></div>
        </article>
        <div class="mt-4" id="tag-table"></div>`;
      const $ = s => view.querySelector(s);

      const cloud = () => {
        const tags = S.all('tags'); const max = Math.max(1, ...tags.map(t => tagCount(t.id)));
        $('#tag-cloud').innerHTML = tags.map(t => { const c = tagCount(t.id); return `<span class="tag-cloud__item" style="--s:${(0.85 + (c / max) * 0.6).toFixed(2)};--c:var(--av-${t.color}-fg);--b:var(--av-${t.color}-bg)">#${esc(t.name)} <small>${c}</small></span>`; }).join('');
      };
      const table = new K.DataTable($('#tag-table'), {
        title: 'Semua tag', rows: () => S.all('tags'), pageSize: 10, selectable: true, exportName: 'tag',
        search: r => r.name, defaultSort: { key: 'name', dir: 'asc' },
        columns: [
          { key: 'name', label: 'Tag', sortable: true, render: r => `<span class="chip"><span class="chip__swatch" style="background:var(--av-${r.color}-fg)"></span>#${esc(r.name)}</span>` },
          { key: 'slug', label: 'Slug', className: 'hide-sm', render: r => `<span class="mono text-xs">${esc(r.slug)}</span>` },
          { key: 'usage', label: 'Dipakai di', sortable: true, sortValue: r => tagCount(r.id), className: 'num', render: r => `${num(tagCount(r.id))} halaman`, csv: r => tagCount(r.id) },
          { key: 'createdAt', label: 'Dibuat', className: 'hide-md nowrap', sortable: true, render: r => `<span class="text-secondary">${K.util.date(r.createdAt)}</span>` },
        ],
        rowActions: () => `${K.ui.iconBtn('pencil', 'Ubah nama', 'data-action="edit"')}${K.ui.iconBtn('trash-2', 'Hapus', 'data-action="delete"', 'is-danger')}`,
        bulkActions: [
          { label: 'Gabungkan', icon: 'merge', handler: ids => new Promise(res => {
            if (ids.length < 2) { K.ui.toast('Pilih minimal 2 tag', '', 'warning'); return res(false); }
            K.ui.modal({ title: `Gabungkan ${ids.length} tag`, body: K.ui.field({ name: 'target', label: 'Gabungkan ke', type: 'select', options: ids.map(id => [id, '#' + S.get('tags', id).name]) }), submitLabel: 'Gabungkan',
              onSubmit: d => { const others = ids.filter(i => i !== d.target); S.updateWhere('pages', p => (p.tags || []).some(t => others.includes(t)), p => ({ tags: [...new Set(p.tags.map(t => others.includes(t) ? d.target : t))] })); S.remove('tags', others); cloud(); K.ui.toast('Tag digabungkan'); res(true); } })
              .dialog.addEventListener('close', () => res(false));
          }) },
          { label: 'Hapus', icon: 'trash-2', variant: 'danger', handler: ids => K.ui.confirm({ title: `Hapus ${ids.length} tag?` }).then(ok => { if (ok) { S.updateWhere('pages', () => true, p => ({ tags: (p.tags || []).filter(t => !ids.includes(t)) })); S.remove('tags', ids); cloud(); } return ok; }) },
        ],
        onAction: (a, r) => {
          if (a === 'edit') K.ui.modal({ title: 'Ubah tag', size: 'sm', body: K.ui.field({ name: 'name', label: 'Nama', required: true, value: r.name }) + K.ui.field({ name: 'color', label: 'Warna', type: 'select', value: r.color, options: ['blue', 'emerald', 'amber', 'rose', 'violet', 'sky'] }),
            onSubmit: d => { S.update('tags', r.id, { name: K.util.slugify(d.name), slug: K.util.slugify(d.name), color: d.color }); table.refresh(); cloud(); K.ui.toast('Tag diperbarui'); } });
          if (a === 'delete') K.ui.confirm({ title: `Hapus #${r.name}?`, text: `Tag dilepas dari ${tagCount(r.id)} halaman.` }).then(ok => { if (ok) { S.updateWhere('pages', () => true, p => ({ tags: (p.tags || []).filter(t => t !== r.id) })); S.remove('tags', r.id); table.refresh(); cloud(); K.ui.toast('Tag dihapus'); } });
        },
      });
      $('#tag-form').addEventListener('submit', e => {
        e.preventDefault();
        const names = e.target.names.value.split(',').map(s => K.util.slugify(s)).filter(Boolean);
        const existing = new Set(S.all('tags').map(t => t.slug));
        const fresh = [...new Set(names)].filter(n => !existing.has(n));
        fresh.forEach(n => S.insert('tags', { name: n, slug: n, color: K.util.tone(n) }, { idPrefix: 'tag' }));
        e.target.reset(); table.refresh(); cloud();
        K.ui.toast(fresh.length ? `${fresh.length} tag ditambahkan` : 'Tidak ada tag baru', names.length - fresh.length ? `${names.length - fresh.length} sudah ada` : '', fresh.length ? 'success' : 'warning');
      });
      cloud();
    },
  });
})(window.K);
