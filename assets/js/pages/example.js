/* ==========================================================================
   STARTER CRUD — template modul baru. SALIN FILE INI untuk membuat modul.

   Langkah membuat modul baru (mis. "products"):
     1. Salin file ini → assets/js/pages/products.js
     2. Ganti konstanta RESOURCE, ROUTE, LABEL, dan FIELDS di bawah
     3. Daftarkan menu di K.nav (core/app.js):
          { id: 'products', label: 'Products', icon: 'package', perm: 'products.view' }
     4. Tambah <script src="assets/js/pages/products.js" defer> di index.html
     5. (opsional) Tambah kunci i18n 'nav.products' di assets/js/i18n/*.js
   Backend (Laravel/FastAPI) cukup menyediakan REST:
     GET    /projects?page=&per_page=&q=&status=&sort=   → { data: [...], meta: { total, page, per_page, last_page } }
     GET    /projects/:id                                → { data: {...} }
     POST   /projects                                    → 201 { data } | 422 { errors: { field: ['…'] } }
     PATCH  /projects/:id                                → { data }
     DELETE /projects/:id                                → 204
   Di mode demo (K.config.dataMode = 'demo') semua panggilan K.api dilayani K.store.
   ========================================================================== */
(function (K) {
  'use strict';
  const { esc, idr } = K.util;
  const { icon } = K.ui;

  /* ---------- 1. Konfigurasi modul ---------- */
  const RESOURCE = '/projects';        // endpoint REST
  const ROUTE = 'example';             // id route & menu (#/example)
  const LABEL = { one: 'Proyek', many: 'Proyek' };
  const PERM = { create: 'dashboard.view', update: 'dashboard.view', delete: 'dashboard.view' }; // ganti mis. 'projects.create'
  const STATUS = { planning: ['info', 'Perencanaan'], active: ['success', 'Berjalan'], on_hold: ['warning', 'Ditunda'], done: ['neutral', 'Selesai'] };

  /* ---------- 2. Definisi field (dipakai form, detail, & tabel) ---------- */
  const FIELDS = [
    { name: 'name', label: 'Nama proyek', required: true, attrs: 'minlength="3" maxlength="120"', span: true },
    { name: 'owner', label: 'Penanggung jawab', type: 'select', options: () => K.store.all('users').filter(u => u.status === 'active').map(u => [u.id, u.name]), show: v => K.lookup.user(v).name },
    { name: 'status', label: 'Status', type: 'select', options: () => Object.entries(STATUS).map(([k, [, l]]) => [k, l]), show: v => K.ui.badge(STATUS[v][0] === 'success' ? 'active' : v, STATUS[v][1]), html: true },
    { name: 'budget', label: 'Anggaran (Rp)', type: 'number', attrs: 'min="0" step="1000000"', show: v => idr(v) },
    { name: 'dueDate', label: 'Tenggat', type: 'date', show: v => K.util.date(v) },
    { name: 'description', label: 'Deskripsi', type: 'textarea', span: true },
  ];
  const badge = s => `<span class="badge badge--${STATUS[s][0]}">${STATUS[s][1]}</span>`;

  K.page(ROUTE, {
    render(view, route) {
      const [id, sub] = route.params;
      if (id === 'new') return formPage(view, null);
      if (id) return loadOne(view, id, item => (sub === 'edit' ? formPage(view, item) : detailPage(view, item)));
      return listPage(view, route);
    },
  });

  /** Muat satu item; 404/5xx otomatis menampilkan halaman error (opsi page: true). */
  function loadOne(view, id, then) {
    view.innerHTML = `<div class="card">${'<span class="skeleton" style="display:block;height:14px;margin:10px 0"></span>'.repeat(5)}</div>`;
    K.api.get(`${RESOURCE}/${id}`, { page: true }).then(({ data }) => view.isConnected && then(data)).catch(() => {});
  }

  /* ---------- 3. LIST (paginasi & filter di sisi server) ---------- */
  function listPage(view, route) {
    const state = { page: Number(route.query.page) || 1, per_page: 8, q: route.query.q || '', status: route.query.status || '' };
    view.innerHTML = `${K.ui.pageHead({ title: 'Starter CRUD', eyebrow: 'UI Kit', desc: `Template modul baru berbasis <code class="inline-code">K.api</code> — salin <code class="inline-code">assets/js/pages/example.js</code>. Mode data saat ini: <strong>${esc(K.config.dataMode)}</strong>.`,
      actions: `<a href="#/${ROUTE}/new" class="btn btn-primary btn-sm" data-perm="${PERM.create}">${icon('plus')}<span>${LABEL.one} baru</span></a>` })}
      <article class="card card--flush">
        <div class="dt-toolbar" style="padding-top:20px">
          <div class="dt-toolbar__left"><label class="input-icon dt-search">${icon('search')}<input type="search" class="input input-sm" placeholder="Cari ${LABEL.many.toLowerCase()}…" aria-label="Cari" id="ex-q" value="${esc(state.q)}"></label>
            <select class="select select-sm" style="width:auto" id="ex-status" aria-label="Filter status"><option value="">Semua status</option>${Object.entries(STATUS).map(([k, [, l]]) => `<option value="${k}" ${k === state.status ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
          <span class="badge badge--plain badge--neutral" id="ex-latency"></span>
        </div>
        <div class="table-wrap"><table class="table"><thead><tr><th scope="col">Nama</th><th scope="col" class="hide-md">Penanggung jawab</th><th scope="col" class="num hide-sm">Anggaran</th><th scope="col" class="hide-lg">Tenggat</th><th scope="col">Status</th><th scope="col" class="col-actions"><span class="sr-only">Aksi</span></th></tr></thead><tbody id="ex-body"></tbody></table></div>
        <div class="dt-foot"><p id="ex-info"></p><nav class="pagination" aria-label="Paginasi" id="ex-pager"></nav></div>
      </article>`;
    const $ = s => view.querySelector(s);
    let seq = 0;
    async function load() {
      const my = ++seq, t0 = performance.now();
      $('#ex-body').innerHTML = Array.from({ length: 5 }, () => `<tr class="skel-row"><td colspan="6"><span class="skeleton" style="display:block;height:14px"></span></td></tr>`).join('');
      try {
        const { data, meta } = await K.api.get(RESOURCE, { query: { page: state.page, per_page: state.per_page, q: state.q, status: state.status, sort: '-createdAt' } });
        if (my !== seq || !view.isConnected) return;               // abaikan respons usang
        $('#ex-latency').textContent = Math.round(performance.now() - t0) + ' ms';
        $('#ex-body').innerHTML = data.length ? data.map(p => `<tr><td><a href="#/${ROUTE}/${p.id}" class="fw-500">${esc(p.name)}</a></td><td class="hide-md">${esc(K.lookup.user(p.owner).name)}</td><td class="num hide-sm">${idr(p.budget)}</td><td class="hide-lg text-secondary nowrap">${K.util.date(p.dueDate)}</td><td>${badge(p.status)}</td>
          <td class="col-actions"><div class="row-actions"><a href="#/${ROUTE}/${p.id}/edit" class="icon-btn icon-btn--sm" aria-label="Edit ${esc(p.name)}" data-perm="${PERM.update}">${icon('pencil')}</a><button type="button" class="icon-btn icon-btn--sm is-danger" data-del="${p.id}" aria-label="Hapus ${esc(p.name)}" data-perm="${PERM.delete}">${icon('trash-2')}</button></div></td></tr>`).join('')
          : `<tr><td colspan="6">${K.ui.empty({ icon: 'folder-open', title: `Belum ada ${LABEL.many.toLowerCase()}`, text: state.q || state.status ? 'Coba ubah filter.' : 'Buat yang pertama.' })}</td></tr>`;
        $('#ex-info').textContent = meta.total ? K.t('table.showing', { from: (meta.page - 1) * meta.per_page + 1, to: (meta.page - 1) * meta.per_page + data.length, total: meta.total }) : K.t('table.none');
        $('#ex-pager').innerHTML = Array.from({ length: meta.last_page }, (_, i) => `<button type="button" data-page="${i + 1}" ${i + 1 === meta.page ? 'aria-current="page"' : ''}>${i + 1}</button>`).join('');
        K.applyPerms(view);
      } catch (e) { if (my === seq) $('#ex-body').innerHTML = `<tr><td colspan="6">${K.ui.empty({ icon: 'cloud-off', title: 'Gagal memuat', text: e.message, action: '<button type="button" class="btn btn-primary btn-sm" data-retry>Coba lagi</button>' })}</td></tr>`; }
    }
    // Simpan filter di URL agar bisa dibagikan & tombol Back berfungsi
    const sync = () => history.replaceState(null, '', `#/${ROUTE}?` + new URLSearchParams(Object.entries({ page: state.page, q: state.q, status: state.status }).filter(([, v]) => v && v !== 1)).toString());
    $('#ex-q').addEventListener('input', K.util.debounce(e => { state.q = e.target.value.trim(); state.page = 1; sync(); load(); }, 300));
    $('#ex-status').addEventListener('change', e => { state.status = e.target.value; state.page = 1; sync(); load(); });
    view.addEventListener('click', async e => {
      const pg = e.target.closest('[data-page]'); if (pg) { state.page = Number(pg.dataset.page); sync(); load(); }
      if (e.target.closest('[data-retry]')) load();
      const del = e.target.closest('[data-del]');
      if (del && await K.ui.confirm({ title: `Hapus ${LABEL.one.toLowerCase()}?`, text: 'Data akan dihapus permanen.' })) {
        await K.api.delete(`${RESOURCE}/${del.dataset.del}`); K.ui.toast(`${LABEL.one} dihapus`); load();
      }
    });
    load();
  }

  /* ---------- 4. DETAIL ---------- */
  function detailPage(view, item) {
    K.setCrumb('Starter CRUD', item.name, '#/' + ROUTE);
    view.innerHTML = `<a href="#/${ROUTE}" class="back-link">${icon('arrow-left')}<span>Semua ${LABEL.many.toLowerCase()}</span></a>
      ${K.ui.pageHead({ title: item.name, actions: `<a href="#/${ROUTE}/${item.id}/edit" class="btn btn-primary btn-sm" data-perm="${PERM.update}">${icon('pencil')}<span>Edit</span></a><button type="button" class="btn btn-danger-ghost btn-sm" data-del data-perm="${PERM.delete}">${icon('trash-2')}<span>Hapus</span></button>` })}
      <article class="card"><dl class="dl">${FIELDS.filter(f => f.name !== 'name').map(f => `<dt>${f.label}</dt><dd>${f.name === 'status' ? badge(item.status) : esc(f.show ? f.show(item[f.name]) : item[f.name] || '—')}</dd>`).join('')}<dt>ID</dt><dd class="mono text-xs">${esc(item.id)}</dd></dl></article>`;
    view.querySelector('[data-del]')?.addEventListener('click', async () => {
      if (!(await K.ui.confirm({ title: `Hapus ${item.name}?` }))) return;
      await K.api.delete(`${RESOURCE}/${item.id}`); K.ui.toast(`${LABEL.one} dihapus`); K.router.go(ROUTE);
    });
  }

  /* ---------- 5. FORM (create & edit) ---------- */
  function formPage(view, item) {
    const isNew = !item;
    K.setCrumb('Starter CRUD', isNew ? `${LABEL.one} baru` : 'Edit ' + item.name, '#/' + ROUTE);
    view.innerHTML = `<a href="#/${ROUTE}${isNew ? '' : '/' + item.id}" class="back-link">${icon('arrow-left')}<span>Kembali</span></a>
      ${K.ui.pageHead({ title: isNew ? `${LABEL.one} baru` : `Edit ${LABEL.one.toLowerCase()}` })}
      <form class="card" id="ex-form" novalidate><div class="form-grid">${FIELDS.map(f => K.ui.field({ ...f, options: f.options && f.options(), value: f.type === 'date' && item?.[f.name] ? item[f.name].slice(0, 10) : item?.[f.name] })).join('')}</div>
        <div class="flex justify-end gap-2 mt-6"><a href="#/${ROUTE}${isNew ? '' : '/' + item.id}" class="btn btn-ghost">${K.t('common.cancel')}</a><button type="submit" class="btn btn-primary">${icon('save')}<span>${K.t('common.save')}</span></button></div></form>`;
    const form = K.validate.attach(view.querySelector('#ex-form'));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      try {
        // K.api.submit: validasi klien → kirim → error 422 dari server tampil di field
        const { data } = await K.api.submit(form, isNew ? 'POST' : 'PATCH', isNew ? RESOURCE : `${RESOURCE}/${item.id}`, {
          transform: d => ({ ...d, budget: Number(d.budget) || 0, dueDate: d.dueDate ? new Date(d.dueDate).toISOString() : null }),
        });
        K.ui.toast(isNew ? `${LABEL.one} dibuat` : 'Perubahan disimpan', data.name);
        K.router.go(`${ROUTE}/${data.id}`);
      } catch { /* error sudah ditangani K.api / K.validate */ }
    });
  }
})(window.K);
