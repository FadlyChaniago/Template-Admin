/* ==========================================================================
   Management → Users, Teams, Organizations, Roles & Permissions
   ========================================================================== */
(function (K) {
  'use strict';
  const { esc, num } = K.util;
  const { icon } = K.ui;
  const S = K.store;

  const roleOptions = () => S.all('roles').map(r => [r.id, r.name]);
  const teamOptions = () => S.all('teams').map(t => [t.name, t.name]);
  const roleChip = id => { const r = K.lookup.role(id); return `<span class="chip"><span class="chip__swatch" style="background:var(--av-${r.color || 'blue'}-fg)"></span>${esc(r.name)}</span>`; };

  /* ======================= USERS ======================= */
  K.page('users', {
    render(view, route) {
      // Pola CRUD: #/users (list) · #/users/new · #/users/:id (detail) · #/users/:id/edit
      const [id, sub] = route.params;
      if (id === 'new') return userEdit(view, null);
      if (id) {
        const u = S.get('users', id);
        if (!u) { view.innerHTML = K.ui.empty({ icon: 'user-x', title: 'Pengguna tidak ditemukan', text: 'Mungkin sudah dihapus.', action: '<a href="#/users" class="btn btn-secondary">Kembali ke daftar</a>' }); return; }
        return sub === 'edit' ? userEdit(view, u) : userDetail(view, u);
      }
      view.innerHTML = `${K.ui.pageHead({
        title: 'Users', eyebrow: 'Management', desc: 'Kelola anggota workspace, peran, dan status akses.',
        actions: `<button type="button" class="btn btn-secondary btn-sm" id="us-import">${icon('upload')}<span>Impor CSV</span></button>
          <button type="button" class="btn btn-primary btn-sm" id="us-new">${icon('user-plus')}<span>Undang pengguna</span></button>`,
      })}<div class="grid grid-4" id="us-kpis"></div><div class="mt-4" id="us-table"></div>`;
      const $ = s => view.querySelector(s);

      const kpis = () => {
        const u = S.all('users');
        const twofa = u.filter(x => x.twoFA).length;
        $('#us-kpis').innerHTML = [
          K.ui.kpi({ label: 'Total pengguna', value: num(u.length), icon: 'users', trend: 6.4 }),
          K.ui.kpi({ label: 'Aktif', value: num(u.filter(x => x.status === 'active').length), icon: 'user-check', foot: 'login dalam 30 hari' }),
          K.ui.kpi({ label: 'Undangan tertunda', value: num(u.filter(x => x.status === 'invited').length), icon: 'mail', foot: 'belum diterima' }),
          K.ui.kpi({ label: 'Cakupan 2FA', value: `${num((twofa / u.length) * 100, 0)}<small>%</small>`, icon: 'shield-check', foot: `${twofa} dari ${u.length} pengguna` }),
        ].join('');
      };

      const table = new K.DataTable($('#us-table'), {
        title: 'Semua pengguna', rows: () => S.all('users'), selectable: true, pageSize: 10, exportName: 'pengguna',
        searchPlaceholder: 'Cari nama atau email…', search: r => r.name + ' ' + r.email,
        tabs: { key: 'status', options: [['active', 'Aktif'], ['invited', 'Diundang'], ['suspended', 'Ditangguhkan']] },
        selects: [{ key: 'roleId', label: 'Semua peran', options: roleOptions() }, { key: 'team', label: 'Semua tim', options: teamOptions() }],
        defaultSort: { key: 'name', dir: 'asc' },
        columns: [
          { key: 'name', label: 'Pengguna', sortable: true, render: r => `<a href="#/users/${esc(r.id)}" class="row-link">${K.ui.person(r)}</a>`, csv: r => r.name },
          { key: 'email', label: 'Email', className: 'hidden', csv: r => r.email },
          { key: 'roleId', label: 'Peran', sortable: true, sortValue: r => K.lookup.role(r.roleId).name, render: r => roleChip(r.roleId), csv: r => K.lookup.role(r.roleId).name },
          { key: 'team', label: 'Tim', sortable: true, className: 'hide-md', render: r => `<span class="text-secondary">${esc(r.team)}</span>` },
          { key: 'twoFA', label: '2FA', className: 'hide-lg', render: r => r.twoFA ? `<span class="text-success" title="2FA aktif">${icon('shield-check', 'i-16')}</span>` : `<span class="text-muted" title="2FA nonaktif">${icon('shield-off', 'i-16')}</span>`, csv: r => (r.twoFA ? 'Ya' : 'Tidak') },
          { key: 'lastActive', label: 'Terakhir aktif', sortable: true, className: 'hide-sm nowrap', sortValue: r => r.lastActive || '', render: r => r.lastActive ? `<span class="text-secondary">${K.util.ago(r.lastActive)}</span>` : '<span class="text-muted">Belum pernah</span>' },
          { key: 'status', label: 'Status', render: r => K.ui.badge(r.status) },
        ],
        rowActions: r => `${K.ui.iconBtn('pencil', 'Edit ' + r.name, 'data-action="edit"')}
          <div class="menu-anchor">${K.ui.iconBtn('ellipsis', 'Aksi lainnya', 'data-menu-toggle aria-expanded="false"')}<div class="menu" role="menu">
            <button type="button" class="menu__item" data-action="view">${icon('eye')}Buka halaman detail</button>
            <button type="button" class="menu__item" data-action="quick">${icon('panel-right')}Pratinjau cepat</button>
            ${r.status === 'invited' ? `<button type="button" class="menu__item" data-action="resend">${icon('send')}Kirim ulang undangan</button>` : ''}
            <button type="button" class="menu__item" data-action="reset">${icon('key-round')}Reset kata sandi</button>
            ${r.status === 'suspended' ? `<button type="button" class="menu__item" data-action="activate">${icon('user-check')}Aktifkan kembali</button>` : `<button type="button" class="menu__item" data-action="suspend" ${r.id === 'usr_me' ? 'disabled' : ''}>${icon('user-x')}Tangguhkan</button>`}
            <div class="menu__sep"></div>
            <button type="button" class="menu__item menu__item--danger" data-action="delete" ${r.id === 'usr_me' ? 'disabled' : ''}>${icon('trash-2')}Hapus pengguna</button></div></div>`,
        bulkActions: [
          { label: 'Aktifkan', icon: 'user-check', handler: ids => { S.updateWhere('users', u => ids.includes(u.id), { status: 'active' }); kpis(); K.ui.toast(`${ids.length} pengguna diaktifkan`); } },
          { label: 'Tangguhkan', icon: 'user-x', handler: ids => { const t = ids.filter(i => i !== 'usr_me'); S.updateWhere('users', u => t.includes(u.id), { status: 'suspended' }); kpis(); K.ui.toast(`${t.length} pengguna ditangguhkan`, '', 'warning'); } },
          { label: 'Hapus', icon: 'trash-2', variant: 'danger', handler: ids => K.ui.confirm({ title: `Hapus ${ids.length} pengguna?`, text: 'Akses mereka akan dicabut segera. Akun Anda sendiri tidak akan dihapus.' }).then(ok => { if (ok) { const t = ids.filter(i => i !== 'usr_me'); S.remove('users', t); S.audit('user.delete', 'Menghapus pengguna (massal)', t.length + ' pengguna', 'danger', 'User'); kpis(); K.ui.toast(`${t.length} pengguna dihapus`); } return ok; }) },
        ],
        onAction: (a, r) => {
          const done = (msg, sev = 'success') => { table.refresh(); kpis(); K.ui.toast(msg, r.name, sev); };
          if (a === 'edit') K.router.go('users/' + r.id + '/edit');
          else if (a === 'view') K.router.go('users/' + r.id);
          else if (a === 'quick') showUser(r);
          else if (a === 'resend') K.ui.toast('Undangan dikirim ulang', r.email, 'info');
          else if (a === 'reset') K.ui.toast('Tautan reset dikirim', r.email, 'info');
          else if (a === 'suspend') { S.update('users', r.id, { status: 'suspended' }); S.audit('user.suspend', 'Menangguhkan pengguna', r.name, 'danger', 'User'); done('Pengguna ditangguhkan', 'warning'); }
          else if (a === 'activate') { S.update('users', r.id, { status: 'active' }); done('Pengguna diaktifkan'); }
          else if (a === 'delete') K.ui.confirm({ title: 'Hapus pengguna?', text: `${r.name} akan kehilangan akses ke workspace.` }).then(ok => { if (ok) { S.remove('users', r.id); S.audit('user.delete', 'Menghapus pengguna', r.name, 'danger', 'User'); done('Pengguna dihapus'); } });
        },
      });

      function openForm(u) {
        K.ui.modal({
          title: u ? 'Edit pengguna' : 'Undang pengguna', desc: u ? esc(u.email) : 'Undangan akan dikirim ke email yang dimasukkan.',
          body: `<div class="form-grid">
            ${K.ui.field({ name: 'name', label: 'Nama lengkap', required: true, value: u?.name, placeholder: 'mis. Rina Kusuma' })}
            ${K.ui.field({ name: 'email', label: 'Email', type: 'email', required: true, value: u?.email, placeholder: 'nama@perusahaan.id' })}
            ${K.ui.field({ name: 'roleId', label: 'Peran', type: 'select', value: u?.roleId || 'role_viewer', options: roleOptions(), help: 'Menentukan izin akses pengguna.' })}
            ${K.ui.field({ name: 'team', label: 'Tim', type: 'select', value: u?.team, options: teamOptions() })}
            ${u ? K.ui.field({ name: 'status', label: 'Status', type: 'select', value: u.status, options: [['active', 'Aktif'], ['invited', 'Diundang'], ['suspended', 'Ditangguhkan']] }) : K.ui.field({ name: 'message', label: 'Pesan undangan (opsional)', type: 'textarea', span: true, placeholder: 'Halo! Bergabunglah dengan workspace kami.' })}
          </div>`,
          submitLabel: u ? 'Simpan perubahan' : 'Kirim undangan',
          onSubmit: d => {
            const dup = S.all('users').find(x => x.email.toLowerCase() === d.email.toLowerCase() && x.id !== u?.id);
            if (dup) { K.ui.toast('Email sudah terdaftar', d.email, 'error'); return false; }
            if (u) { S.update('users', u.id, { name: d.name, email: d.email, roleId: d.roleId, team: d.team, status: d.status }); S.audit('user.update', 'Memperbarui pengguna', d.name, 'warning', 'User'); }
            else { S.insert('users', { name: d.name, email: d.email, roleId: d.roleId, team: d.team, status: 'invited', lastActive: null, twoFA: false }, { idPrefix: 'usr' }); S.audit('user.invite', 'Mengundang pengguna', d.email, 'info', 'User'); }
            table.refresh(); kpis();
            K.ui.toast(u ? 'Pengguna diperbarui' : 'Undangan terkirim', d.email);
          },
        });
      }

      function showUser(u) {
        const role = K.lookup.role(u.roleId);
        const logs = S.find('auditLogs', l => l.actorId === u.id).slice(0, 4);
        K.ui.modal({
          title: u.name, desc: esc(u.email), size: 'lg',
          body: `<div class="flex items-center gap-4 wrap">${K.ui.avatar(u.name, 'xl')}<div class="flex-1"><p class="fw-600" style="font-size:18px">${esc(u.name)}</p><p class="text-secondary">${esc(u.title || role.name)} · ${esc(u.team)}</p><div class="flex gap-2 mt-2 wrap">${K.ui.badge(u.status)}${roleChip(u.roleId)}${u.twoFA ? '<span class="badge badge--success">2FA aktif</span>' : '<span class="badge badge--warning">2FA nonaktif</span>'}</div></div></div>
            <div class="grid grid-2"><dl class="dl"><dt>Bergabung</dt><dd>${K.util.date(u.createdAt)}</dd><dt>Terakhir aktif</dt><dd>${u.lastActive ? K.util.ago(u.lastActive) : '—'}</dd><dt>ID</dt><dd class="mono text-xs">${esc(u.id)}</dd></dl>
            <div><p class="section-label">Izin peran (${role.permissions?.length || 0})</p><div class="chip-list">${(role.permissions || []).slice(0, 12).map(p => `<span class="chip mono" style="font-size:10.5px">${esc(p)}</span>`).join('')}${(role.permissions || []).length > 12 ? `<span class="chip">+${role.permissions.length - 12} lainnya</span>` : ''}</div></div></div>
            <div><p class="section-label">Aktivitas audit terbaru</p>${logs.length ? `<div class="list">${logs.map(l => `<div class="list-item"><span class="icon-tile">${icon('history')}</span><div class="list-item__body"><p class="list-item__title">${esc(l.label)}</p><p class="list-item__sub">${esc(l.resource)} · ${esc(l.ip)}</p></div><span class="list-item__meta">${K.util.ago(l.createdAt)}</span></div>`).join('')}</div>` : '<p class="text-secondary text-sm">Belum ada aktivitas tercatat.</p>'}</div>`,
          footer: `<button type="button" class="btn btn-secondary" data-dismiss>Tutup</button><a href="#/users/${esc(u.id)}" class="btn btn-secondary" data-dismiss-nav>${icon('external-link')}<span>Halaman detail</span></a><button type="button" class="btn btn-primary" data-edit>${icon('pencil')}<span>Edit cepat</span></button>`,
          onOpen: dlg => { dlg.querySelector('[data-edit]').addEventListener('click', () => { dlg.close(); setTimeout(() => openForm(u), 80); }); dlg.querySelector('[data-dismiss-nav]').addEventListener('click', () => dlg.close()); },
        });
      }

      $('#us-new').addEventListener('click', () => openForm());
      $('#us-import').addEventListener('click', () => K.ui.modal({
        title: 'Impor pengguna dari CSV', desc: 'Kolom wajib: <code class="inline-code">name,email,role</code>',
        body: `<label class="dropzone" for="csv-file">${icon('upload-cloud')}<span class="fw-600">Pilih file CSV</span><span class="text-xs text-secondary">atau seret ke sini · maks 2 MB</span><input type="file" id="csv-file" accept=".csv" class="sr-only"></label><p class="text-xs text-secondary" id="csv-info">Belum ada file dipilih.</p>`,
        submitLabel: 'Impor',
        onOpen: dlg => dlg.querySelector('#csv-file').addEventListener('change', e => { const f = e.target.files[0]; dlg.querySelector('#csv-info').textContent = f ? `${f.name} · ${K.util.bytes(f.size)}` : 'Belum ada file dipilih.'; }),
        onSubmit: (_, form) => {
          const f = form.querySelector('#csv-file').files[0];
          if (!f) { K.ui.toast('Pilih file terlebih dahulu', '', 'error'); return false; }
          f.text().then(txt => {
            const lines = txt.split(/\r?\n/).filter(Boolean).slice(1);
            let n = 0;
            lines.forEach(l => { const [name, email] = l.split(',').map(s => s && s.trim()); if (name && email && email.includes('@')) { S.insert('users', { name, email, roleId: 'role_viewer', team: 'Operations', status: 'invited', lastActive: null, twoFA: false }, { idPrefix: 'usr' }); n++; } });
            table.refresh(); kpis(); K.ui.toast(`${n} pengguna diimpor`, n ? 'Undangan dikirim otomatis.' : 'Tidak ada baris valid.', n ? 'success' : 'warning');
          });
        },
      }));
      kpis();
      if (route.query.action === 'new') { history.replaceState(null, '', '#/users'); openForm(); }
    },
  });

  /* ======================= USERS — DETAIL (pola CRUD) ======================= */
  function userDetail(view, u) {
    const role = K.lookup.role(u.roleId);
    const teams = S.find('teams', t => t.members.includes(u.id) || t.lead === u.id);
    const logs = S.find('auditLogs', l => l.actorId === u.id);
    const pages = S.find('pages', p => p.authorId === u.id);
    K.setCrumb('Users', u.name, '#/users');
    view.innerHTML = `
      <a href="#/users" class="back-link">${icon('arrow-left')}<span>Semua pengguna</span></a>
      <section class="card detail-head">
        <div class="flex items-center gap-4 wrap">
          ${K.ui.avatar(u.name, 'xl')}
          <div class="flex-1" style="min-width:220px">
            <div class="flex items-center gap-2 wrap"><h1 id="page-title" tabindex="-1" style="font-size:24px;letter-spacing:-0.6px">${esc(u.name)}</h1>${K.ui.badge(u.status)}</div>
            <p class="text-secondary text-sm mt-1">${esc(u.email)} · ${esc(u.team)}</p>
            <div class="chip-list mt-3">${roleChip(u.roleId)}${u.twoFA ? '<span class="badge badge--success">2FA aktif</span>' : '<span class="badge badge--warning">2FA nonaktif</span>'}</div>
          </div>
          <div class="btn-group">
            <a href="#/users/${esc(u.id)}/edit" class="btn btn-primary btn-sm">${icon('pencil')}<span>Edit</span></a>
            <div class="menu-anchor"><button type="button" class="btn btn-secondary btn-sm" data-menu-toggle aria-expanded="false">${icon('ellipsis')}<span>Lainnya</span></button>
              <div class="menu" role="menu">
                <button type="button" class="menu__item" data-act="reset">${icon('key-round')}Kirim reset kata sandi</button>
                <button type="button" class="menu__item" data-act="toggle">${icon(u.status === 'suspended' ? 'user-check' : 'user-x')}${u.status === 'suspended' ? 'Aktifkan kembali' : 'Tangguhkan'}</button>
                <div class="menu__sep"></div>
                <button type="button" class="menu__item menu__item--danger" data-act="delete" ${u.id === 'usr_me' ? 'disabled' : ''}>${icon('trash-2')}Hapus pengguna</button>
              </div></div>
          </div>
        </div>
        <div class="grid grid-4 mt-6 detail-stats">${[['Bergabung', K.util.date(u.createdAt)], ['Terakhir aktif', u.lastActive ? K.util.ago(u.lastActive) : 'Belum pernah'], ['Izin peran', role.permissions?.length || 0], ['Halaman ditulis', pages.length]].map(([l, v]) => `<div><p class="text-xs text-secondary">${l}</p><p class="fw-600 mt-1">${esc(v)}</p></div>`).join('')}</div>
      </section>

      <div class="tabs tabs--line mt-4" role="tablist" aria-label="Detail pengguna">
        <button type="button" role="tab" class="tab" aria-selected="true" aria-controls="ud-ov" data-tab="ov">${icon('user')}Ringkasan</button>
        <button type="button" role="tab" class="tab" aria-selected="false" aria-controls="ud-act" data-tab="act" tabindex="-1">${icon('history')}Aktivitas <span class="count-pill">${logs.length}</span></button>
        <button type="button" role="tab" class="tab" aria-selected="false" aria-controls="ud-perm" data-tab="perm" tabindex="-1">${icon('shield-check')}Izin</button>
        <button type="button" role="tab" class="tab" aria-selected="false" aria-controls="ud-sec" data-tab="sec" tabindex="-1">${icon('lock')}Keamanan</button>
      </div>
      <div class="mt-4">
        <div role="tabpanel" id="ud-ov" class="grid grid-main-side">
          <article class="card"><h2 class="card__title">Informasi</h2>
            <dl class="dl mt-4"><dt>Nama</dt><dd>${esc(u.name)}</dd><dt>Email</dt><dd>${esc(u.email)}</dd><dt>Telepon</dt><dd>${esc(u.phone || '—')}</dd><dt>Jabatan</dt><dd>${esc(u.title || '—')}</dd><dt>Lokasi</dt><dd>${esc(u.location || '—')}</dd><dt>Tim</dt><dd>${esc(u.team)}</dd><dt>Peran</dt><dd>${esc(role.name)}</dd><dt>ID</dt><dd class="mono text-xs">${esc(u.id)}</dd></dl></article>
          <article class="card"><h2 class="card__title">Tim (${teams.length})</h2><div class="list mt-4">${teams.map(t => `<div class="list-item"><span class="avatar avatar--square" data-c="${t.color}">${esc(K.util.initials(t.name))}</span><div class="list-item__body"><p class="list-item__title">${esc(t.name)}</p><p class="list-item__sub">${t.members.length} anggota</p></div>${t.lead === u.id ? '<span class="badge badge--info">Lead</span>' : ''}</div>`).join('') || '<p class="text-sm text-secondary">Belum tergabung di tim.</p>'}</div></article>
        </div>
        <div role="tabpanel" id="ud-act" hidden><article class="card">${logs.length ? `<div class="timeline">${logs.slice(0, 15).map(l => `<div class="timeline-item"><span class="timeline-item__icon">${icon('history')}</span><div class="timeline-item__body flex wrap justify-between gap-2"><div><p class="fw-500">${esc(l.label)}</p><p class="timeline-item__time">${esc(l.resource)} · ${esc(l.ip)}</p></div>${K.ui.badge(l.severity)}</div></div>`).join('')}</div>` : K.ui.empty({ icon: 'history', title: 'Belum ada aktivitas' })}</article></div>
        <div role="tabpanel" id="ud-perm" hidden><article class="card"><div class="flex justify-between items-center wrap gap-2"><div><h2 class="card__title">${esc(role.name)}</h2><p class="card__desc">${esc(role.description || '')}</p></div><a href="#/roles" class="btn btn-secondary btn-sm">Kelola peran</a></div>
          <div class="chip-list mt-4">${(role.permissions || []).map(p => `<span class="chip mono" style="font-size:10.5px">${esc(p)}</span>`).join('')}</div></article></div>
        <div role="tabpanel" id="ud-sec" hidden><article class="card"><div class="list">
          <div class="list-item"><span class="icon-tile ${u.twoFA ? 'icon-tile--success' : 'icon-tile--warning'}">${icon(u.twoFA ? 'shield-check' : 'shield-off')}</span><div class="list-item__body"><p class="list-item__title">Autentikasi dua faktor</p><p class="list-item__sub">${u.twoFA ? 'Aktif via aplikasi authenticator' : 'Belum diaktifkan'}</p></div></div>
          <div class="list-item"><span class="icon-tile">${icon('key-round')}</span><div class="list-item__body"><p class="list-item__title">Kata sandi</p><p class="list-item__sub">Terakhir diubah 64 hari lalu</p></div><button type="button" class="btn btn-secondary btn-sm" data-act="reset">Kirim reset</button></div>
          <div class="list-item"><span class="icon-tile">${icon('monitor-smartphone')}</span><div class="list-item__body"><p class="list-item__title">Sesi aktif</p><p class="list-item__sub">2 perangkat</p></div><button type="button" class="btn btn-danger-ghost btn-sm" data-act="logout">Keluarkan semua</button></div>
        </div></article></div>
      </div>`;
    K.ui.tabs(view);
    view.addEventListener('click', e => {
      const a = e.target.closest('[data-act]')?.dataset.act; if (!a) return;
      if (a === 'reset') K.ui.toast('Tautan reset dikirim', u.email, 'info');
      if (a === 'logout') K.ui.toast('Semua sesi dikeluarkan', u.name, 'warning');
      if (a === 'toggle') { S.update('users', u.id, { status: u.status === 'suspended' ? 'active' : 'suspended' }); K.ui.toast(u.status === 'suspended' ? 'Pengguna ditangguhkan' : 'Pengguna diaktifkan', u.name); K.router.render(); }
      if (a === 'delete') K.ui.confirm({ title: `Hapus ${u.name}?`, text: 'Akses akan dicabut segera.' }).then(ok => { if (ok) { S.remove('users', u.id); S.audit('user.delete', 'Menghapus pengguna', u.name, 'danger', 'User'); K.ui.toast('Pengguna dihapus'); K.router.go('users'); } });
    });
  }

  /* ======================= USERS — CREATE / EDIT (halaman penuh) ======================= */
  function userEdit(view, u) {
    const isNew = !u;
    K.setCrumb('Users', isNew ? 'Pengguna baru' : 'Edit ' + u.name, '#/users');
    view.innerHTML = `
      <a href="${isNew ? '#/users' : '#/users/' + esc(u.id)}" class="back-link">${icon('arrow-left')}<span>${isNew ? 'Semua pengguna' : esc(u.name)}</span></a>
      ${K.ui.pageHead({ title: isNew ? 'Pengguna baru' : 'Edit pengguna', desc: isNew ? 'Lengkapi data lalu kirim undangan. Pengguna akan menerima email untuk mengatur kata sandi.' : 'Perubahan peran dan status langsung berlaku setelah disimpan.' })}
      <form id="ue-form" class="stack" novalidate>
        <article class="card"><div class="form-row" style="padding-top:0;border:0"><div class="form-row__label"><h2 class="card__title">Profil</h2><p class="help">Nama dan kontak yang terlihat oleh anggota lain.</p></div>
          <div class="form-grid">
            <div class="field"><label class="label" for="ue-name">Nama lengkap<span class="req">*</span></label><input class="input" id="ue-name" name="name" required minlength="3" value="${esc(u?.name || '')}"></div>
            <div class="field"><label class="label" for="ue-email">Email<span class="req">*</span></label><input class="input" id="ue-email" name="email" type="email" required value="${esc(u?.email || '')}"></div>
            <div class="field"><label class="label" for="ue-phone">Telepon</label><input class="input" id="ue-phone" name="phone" type="tel" pattern="(\\+62|0)8[0-9]{8,11}" data-msg-pattern="Format 08xxxxxxxxxx atau +628xxxxxxxxxx." value="${esc(u?.phone || '')}" placeholder="08xxxxxxxxxx"></div>
            <div class="field"><label class="label" for="ue-title">Jabatan</label><input class="input" id="ue-title" name="title" value="${esc(u?.title || '')}"></div>
            <div class="field span-2"><label class="label" for="ue-location">Lokasi</label><input class="input" id="ue-location" name="location" value="${esc(u?.location || '')}" placeholder="Kota, Negara"></div>
          </div></div></article>
        <article class="card"><div class="form-row" style="padding-top:0;border:0"><div class="form-row__label"><h2 class="card__title">Akses</h2><p class="help">Peran menentukan izin. Visibilitas menu bukan otorisasi — server tetap memeriksa izin.</p></div>
          <div class="form-grid">
            ${K.ui.field({ name: 'roleId', label: 'Peran', type: 'select', value: u?.roleId || 'role_viewer', options: roleOptions() })}
            ${K.ui.field({ name: 'team', label: 'Tim', type: 'select', value: u?.team, options: teamOptions() })}
            ${isNew ? '' : K.ui.field({ name: 'status', label: 'Status', type: 'select', value: u.status, options: [['active', 'Aktif'], ['invited', 'Diundang'], ['suspended', 'Ditangguhkan']] })}
            <div class="field ${isNew ? '' : ''}"><span class="label">Keamanan</span>${K.ui.switchEl({ name: 'require2fa', checked: u ? (u.require2FA ?? u.twoFA) : true, label: 'Wajibkan 2FA saat login' })}</div>
          </div></div></article>
        ${isNew ? `<article class="card"><div class="form-row" style="padding-top:0;border:0"><div class="form-row__label"><h2 class="card__title">Undangan</h2><p class="help">Pesan opsional di email undangan.</p></div>
          <div class="field"><label class="label" for="ue-msg">Pesan</label><textarea class="textarea" id="ue-msg" name="message" maxlength="300" placeholder="Halo! Bergabunglah dengan workspace kami."></textarea></div></div></article>` : ''}
        <div class="save-bar save-bar--static"><span class="text-secondary">${isNew ? 'Kolom bertanda * wajib diisi.' : 'Terakhir diperbarui ' + K.util.ago(u.updatedAt || u.createdAt)}</span>
          <div class="btn-group"><a href="${isNew ? '#/users' : '#/users/' + esc(u.id)}" class="btn btn-ghost">Batal</a><button type="submit" class="btn btn-primary">${icon(isNew ? 'send' : 'save')}<span>${isNew ? 'Simpan & kirim undangan' : 'Simpan perubahan'}</span></button></div></div>
      </form>`;
    const form = K.validate.attach(view.querySelector('#ue-form'));
    let dirty = false;
    form.addEventListener('input', () => { dirty = true; });
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!K.validate.form(form)) { K.ui.toast('Periksa kembali isian', '', 'error', 2200); return; }
      const d = K.util.formData(form);
      // Validasi unik (di backend: aturan unique:users,email) → tampil sebagai error field
      if (S.all('users').some(x => x.email.toLowerCase() === d.email.toLowerCase() && x.id !== u?.id)) { K.validate.setErrors(form, { email: 'Email sudah digunakan pengguna lain.' }); return; }
      const data = { name: d.name, email: d.email, phone: d.phone, title: d.title, location: d.location, roleId: d.roleId, team: d.team, require2FA: d.require2fa, updatedAt: new Date().toISOString() };
      if (isNew) { const n = S.insert('users', { ...data, status: 'invited', lastActive: null, twoFA: false }, { idPrefix: 'usr' }); S.audit('user.invite', 'Mengundang pengguna', d.email, 'info', 'User'); dirty = false; K.ui.toast('Undangan terkirim', d.email); K.router.go('users/' + n.id); }
      else { S.update('users', u.id, { ...data, status: d.status }); S.audit('user.update', 'Memperbarui pengguna', d.name, 'warning', 'User'); dirty = false; K.ui.toast('Perubahan disimpan', d.name); K.router.go('users/' + u.id); }
    });
    // Peringatan perubahan belum disimpan saat menutup tab
    const warn = e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }

  /* ======================= TEAMS ======================= */
  K.page('teams', {
    render(view) {
      let q = '';
      view.innerHTML = `${K.ui.pageHead({
        title: 'Teams', eyebrow: 'Management', desc: 'Kelompokkan pengguna ke dalam tim untuk kolaborasi dan pengaturan akses.',
        actions: `<label class="input-icon" style="width:220px">${icon('search')}<input type="search" class="input input-sm" placeholder="Cari tim…" aria-label="Cari tim" id="tm-q"></label><button type="button" class="btn btn-primary btn-sm" id="tm-new">${icon('plus')}<span>Buat tim</span></button>`,
      })}<div class="grid grid-3" id="tm-grid"></div>`;
      const $ = s => view.querySelector(s);

      function draw() {
        const teams = S.all('teams').filter(t => !q || (t.name + t.description).toLowerCase().includes(q));
        $('#tm-grid').innerHTML = teams.length ? teams.map(t => {
          const members = t.members.map(id => S.get('users', id)).filter(Boolean);
          const lead = K.lookup.user(t.lead);
          return `<article class="card card--hover team-card">
            <div class="flex items-center justify-between gap-2"><span class="avatar avatar--lg avatar--square" data-c="${t.color}">${esc(K.util.initials(t.name))}</span>
              <div class="menu-anchor">${K.ui.iconBtn('ellipsis', 'Aksi tim ' + t.name, 'data-menu-toggle aria-expanded="false"')}<div class="menu" role="menu">
                <button type="button" class="menu__item" data-act="view" data-id="${t.id}">${icon('users')}Kelola anggota</button>
                <button type="button" class="menu__item" data-act="edit" data-id="${t.id}">${icon('pencil')}Edit tim</button>
                <div class="menu__sep"></div><button type="button" class="menu__item menu__item--danger" data-act="delete" data-id="${t.id}">${icon('trash-2')}Hapus tim</button></div></div></div>
            <h2 class="card__title mt-4">${esc(t.name)}</h2>
            <p class="card__desc" style="min-height:34px">${esc(t.description)}</p>
            <div class="flex items-center justify-between mt-4">
              <div class="avatar-stack">${members.slice(0, 4).map(m => K.ui.avatar(m.name, 'sm')).join('')}${members.length > 4 ? `<span class="avatar avatar--sm" data-c="sky">+${members.length - 4}</span>` : ''}</div>
              <span class="badge ${t.visibility === 'private' ? 'badge--neutral' : 'badge--info'}">${t.visibility === 'private' ? 'Privat' : 'Publik'}</span>
            </div>
            <div class="card__foot"><span>Lead: <span class="fw-500" style="color:var(--text-strong)">${esc(lead.name)}</span></span><span>${members.length} anggota</span></div>
            <button type="button" class="stretched" data-act="view" data-id="${t.id}" aria-label="Kelola anggota ${esc(t.name)}"></button>
          </article>`;
        }).join('') : `<div class="card" style="grid-column:1/-1">${K.ui.empty({ icon: 'users', title: 'Tim tidak ditemukan' })}</div>`;
      }

      function openForm(t) {
        const users = S.all('users').filter(u => u.status !== 'suspended');
        K.ui.modal({
          title: t ? 'Edit tim' : 'Buat tim', size: 'lg',
          body: `<div class="form-grid">
            ${K.ui.field({ name: 'name', label: 'Nama tim', required: true, value: t?.name })}
            ${K.ui.field({ name: 'visibility', label: 'Visibilitas', type: 'select', value: t?.visibility || 'public', options: [['public', 'Publik — semua anggota bisa melihat'], ['private', 'Privat — hanya anggota']] })}
            ${K.ui.field({ name: 'description', label: 'Deskripsi', type: 'textarea', value: t?.description, span: true })}
            ${K.ui.field({ name: 'lead', label: 'Team lead', type: 'select', value: t?.lead, options: users.map(u => [u.id, u.name]) })}
          </div>
          <fieldset style="border:0;padding:0;margin:0"><legend class="label" style="margin-bottom:8px">Anggota</legend>
            <label class="input-icon">${icon('search')}<input type="search" class="input input-sm" placeholder="Filter anggota…" data-filter aria-label="Filter anggota"></label>
            <div class="member-pick mt-2">${users.map(u => `<label class="member-pick__item" data-name="${esc(u.name.toLowerCase())}"><input type="checkbox" name="members" value="${u.id}" ${t?.members.includes(u.id) ? 'checked' : ''}>${K.ui.person(u, u.team)}</label>`).join('')}</div></fieldset>`,
          submitLabel: t ? 'Simpan' : 'Buat tim',
          onOpen: dlg => dlg.querySelector('[data-filter]').addEventListener('input', e => { const v = e.target.value.toLowerCase(); dlg.querySelectorAll('.member-pick__item').forEach(el => { el.hidden = !el.dataset.name.includes(v); }); }),
          onSubmit: (d, form) => {
            const members = K.ui.checkedValues(form, 'members');
            const data = { name: d.name, description: d.description, visibility: d.visibility, lead: d.lead, members: members.includes(d.lead) ? members : [d.lead, ...members] };
            t ? S.update('teams', t.id, data) : S.insert('teams', { ...data, color: K.util.tone(d.name) }, { idPrefix: 'team', prepend: false });
            draw(); K.ui.toast(t ? 'Tim diperbarui' : 'Tim dibuat', d.name);
          },
        });
      }

      function manage(t) {
        const render = () => t.members.map(id => S.get('users', id)).filter(Boolean).map(u => `<div class="list-item">${K.ui.person(u)}${u.id === t.lead ? '<span class="badge badge--info">Lead</span>' : `<button type="button" class="btn btn-danger-ghost btn-sm" data-remove="${u.id}">Keluarkan</button>`}</div>`).join('') || '<p class="text-secondary">Belum ada anggota.</p>';
        K.ui.modal({
          title: t.name, desc: `${t.members.length} anggota · ${esc(t.description)}`,
          body: `<div class="list" data-list>${render()}</div>`,
          footer: `<button type="button" class="btn btn-secondary" data-dismiss>Tutup</button><button type="button" class="btn btn-primary" data-add>${icon('user-plus')}<span>Tambah anggota</span></button>`,
          onOpen: dlg => {
            dlg.querySelector('[data-list]').addEventListener('click', e => {
              const b = e.target.closest('[data-remove]'); if (!b) return;
              t.members = t.members.filter(id => id !== b.dataset.remove); S.update('teams', t.id, { members: t.members });
              dlg.querySelector('[data-list]').innerHTML = render(); draw(); K.ui.toast('Anggota dikeluarkan');
            });
            dlg.querySelector('[data-add]').addEventListener('click', () => { dlg.close(); setTimeout(() => openForm(t), 80); });
          },
        });
      }

      view.addEventListener('click', e => {
        const b = e.target.closest('[data-act]'); if (!b) return;
        const t = S.get('teams', b.dataset.id);
        if (b.dataset.act === 'edit') openForm(t);
        else if (b.dataset.act === 'view') manage(t);
        else if (b.dataset.act === 'delete') K.ui.confirm({ title: `Hapus tim ${t.name}?`, text: 'Anggota tidak dihapus, hanya keanggotaan tim.' }).then(ok => { if (ok) { S.remove('teams', t.id); draw(); K.ui.toast('Tim dihapus'); } });
      });
      $('#tm-new').addEventListener('click', () => openForm());
      $('#tm-q').addEventListener('input', K.util.debounce(e => { q = e.target.value.toLowerCase().trim(); draw(); }, 120));
      draw();
    },
  });

  /* ======================= ORGANIZATIONS ======================= */
  K.page('organizations', {
    render(view) {
      view.innerHTML = `${K.ui.pageHead({
        title: 'Organizations', eyebrow: 'Management', desc: 'Organisasi pelanggan atau unit bisnis yang dikelola dari workspace ini.',
        actions: `<button type="button" class="btn btn-primary btn-sm" id="org-new">${icon('plus')}<span>Tambah organisasi</span></button>`,
      })}<div class="grid grid-4" id="org-kpis"></div><div class="mt-4" id="org-table"></div>`;
      const $ = s => view.querySelector(s);
      const planTone = { Enterprise: 'violet', Professional: 'blue', Starter: 'emerald' };
      const kpis = () => {
        const o = S.all('organizations');
        $('#org-kpis').innerHTML = [
          K.ui.kpi({ label: 'Organisasi', value: num(o.length), icon: 'building-2', trend: 4.2 }),
          K.ui.kpi({ label: 'Total anggota', value: num(o.reduce((s, x) => s + Number(x.members || 0), 0)), icon: 'users', trend: 7.8 }),
          K.ui.kpi({ label: 'Enterprise', value: num(o.filter(x => x.plan === 'Enterprise').length), icon: 'gem', foot: 'paket tertinggi' }),
          K.ui.kpi({ label: 'Trial', value: num(o.filter(x => x.status === 'trial').length), icon: 'hourglass', foot: 'menunggu konversi' }),
        ].join('');
      };
      const table = new K.DataTable($('#org-table'), {
        title: 'Daftar organisasi', rows: () => S.all('organizations'), pageSize: 8, exportName: 'organisasi', selectable: true,
        search: r => r.name + ' ' + r.domain + ' ' + r.city,
        tabs: { key: 'status', options: [['active', 'Aktif'], ['trial', 'Trial'], ['suspended', 'Ditangguhkan']] },
        selects: [{ key: 'plan', label: 'Semua paket', options: [['Enterprise', 'Enterprise'], ['Professional', 'Professional'], ['Starter', 'Starter']] }],
        columns: [
          { key: 'name', label: 'Organisasi', sortable: true, render: r => `<div class="person"><span class="avatar avatar--square" data-c="${K.util.tone(r.name)}">${esc(K.util.initials(r.name.replace(/^(PT|CV)\s/, '')))}</span><div><p class="person__name">${esc(r.name)}</p><p class="person__sub">${esc(r.domain)}</p></div></div>` },
          { key: 'plan', label: 'Paket', sortable: true, render: r => `<span class="chip"><span class="chip__swatch" style="background:var(--av-${planTone[r.plan]}-fg)"></span>${esc(r.plan)}</span>` },
          { key: 'members', label: 'Anggota', sortable: true, className: 'num hide-sm', render: r => num(r.members) },
          { key: 'city', label: 'Kota', className: 'hide-md', render: r => `<span class="text-secondary">${esc(r.city)}</span>` },
          { key: 'createdAt', label: 'Sejak', sortable: true, className: 'hide-lg nowrap', render: r => `<span class="text-secondary">${K.util.date(r.createdAt)}</span>` },
          { key: 'status', label: 'Status', render: r => K.ui.badge(r.status) },
        ],
        rowActions: () => `${K.ui.iconBtn('pencil', 'Edit', 'data-action="edit"')}${K.ui.iconBtn('trash-2', 'Hapus', 'data-action="delete"', 'is-danger')}`,
        bulkActions: [{ label: 'Hapus', icon: 'trash-2', variant: 'danger', handler: ids => K.ui.confirm({ title: `Hapus ${ids.length} organisasi?` }).then(ok => { if (ok) { S.remove('organizations', ids); kpis(); } return ok; }) }],
        onAction: (a, r) => {
          if (a === 'edit') openForm(r);
          if (a === 'delete') K.ui.confirm({ title: 'Hapus organisasi?', text: `${r.name} beserta datanya akan dihapus.` }).then(ok => { if (ok) { S.remove('organizations', r.id); table.refresh(); kpis(); K.ui.toast('Organisasi dihapus'); } });
        },
      });
      function openForm(o) {
        K.ui.modal({
          title: o ? 'Edit organisasi' : 'Tambah organisasi',
          body: `<div class="form-grid">
            ${K.ui.field({ name: 'name', label: 'Nama organisasi', required: true, value: o?.name, span: true })}
            ${K.ui.field({ name: 'domain', label: 'Domain', required: true, value: o?.domain, placeholder: 'perusahaan.co.id' })}
            ${K.ui.field({ name: 'city', label: 'Kota', value: o?.city })}
            ${K.ui.field({ name: 'plan', label: 'Paket', type: 'select', value: o?.plan || 'Starter', options: ['Starter', 'Professional', 'Enterprise'] })}
            ${K.ui.field({ name: 'status', label: 'Status', type: 'select', value: o?.status || 'trial', options: [['active', 'Aktif'], ['trial', 'Trial'], ['suspended', 'Ditangguhkan']] })}
            ${K.ui.field({ name: 'members', label: 'Jumlah anggota', type: 'number', value: o?.members || 1, attrs: 'min="1"' })}
          </div>`,
          onSubmit: d => {
            d.members = Number(d.members) || 1;
            o ? S.update('organizations', o.id, d) : S.insert('organizations', { ...d, owner: K.currentUser().name }, { idPrefix: 'org' });
            table.refresh(); kpis(); K.ui.toast(o ? 'Organisasi diperbarui' : 'Organisasi ditambahkan', d.name);
          },
        });
      }
      $('#org-new').addEventListener('click', () => openForm());
      kpis();
    },
  });

  /* ======================= ROLES & PERMISSIONS ======================= */
  K.page('roles', {
    render(view) {
      let selected = S.all('roles')[1]?.id || S.all('roles')[0].id;
      let draft = null; // salinan izin yang sedang diedit
      const actionsAll = ['view', 'create', 'update', 'delete', 'publish', 'export', 'deploy', 'revoke'];
      const actionLabel = { view: 'Lihat', create: 'Buat', update: 'Ubah', delete: 'Hapus', publish: 'Terbitkan', export: 'Ekspor', deploy: 'Deploy', revoke: 'Cabut' };

      view.innerHTML = `${K.ui.pageHead({
        title: 'Roles & Permissions', eyebrow: 'Management', desc: 'Tentukan peran dan izin granular untuk setiap modul. Visibilitas menu mengikuti izin <strong>view</strong>.',
        actions: `<button type="button" class="btn btn-primary btn-sm" id="rl-new">${icon('plus')}<span>Peran baru</span></button>`,
      })}
      <div class="alert alert--info" style="margin-bottom:16px">${icon('info')}<div><p class="alert__title">Penting untuk implementasi</p><p class="alert__text">Menyembunyikan menu bukan otorisasi. Setiap route dan endpoint API wajib memeriksa izin yang sama di sisi server.</p></div></div>
      <div class="grid grid-side-main">
        <aside class="stack" id="rl-list" aria-label="Daftar peran"></aside>
        <article class="card card--flush" id="rl-detail"></article>
      </div>`;
      const $ = s => view.querySelector(s);

      function drawList() {
        $('#rl-list').innerHTML = S.all('roles').map(r => {
          const n = S.count('users', u => u.roleId === r.id);
          return `<button type="button" class="card role-item ${r.id === selected ? 'is-active' : ''}" data-role="${r.id}" aria-pressed="${r.id === selected}">
            <div class="flex items-center justify-between gap-2"><span class="fw-600 flex items-center gap-2"><span class="chip__swatch" style="width:10px;height:10px;background:var(--av-${r.color}-fg)"></span>${esc(r.name)}</span>${r.system ? '<span class="badge badge--plain badge--neutral">Sistem</span>' : ''}</div>
            <p class="text-xs text-secondary mt-1" style="text-align:left">${esc(r.description)}</p>
            <p class="text-xs mt-2 flex gap-3"><span>${icon('users', 'i-12')} ${n} pengguna</span><span>${icon('key-round', 'i-12')} ${r.permissions.length} izin</span></p>
          </button>`;
        }).join('');
      }

      function drawDetail() {
        const r = S.get('roles', selected);
        draft = new Set(r.permissions);
        const locked = r.id === 'role_owner';
        const mods = S.all('permissionModules');
        $('#rl-detail').innerHTML = `
          <div class="card__head"><div><h2 class="card__title">${esc(r.name)}</h2><p class="card__desc">${esc(r.description)}</p></div>
            <div class="btn-group">${!r.system ? `<button type="button" class="btn btn-danger-ghost btn-sm" data-del>${icon('trash-2')}<span>Hapus</span></button>` : ''}
              <button type="button" class="btn btn-secondary btn-sm" data-dup>${icon('copy')}<span>Duplikat</span></button>
              <button type="button" class="btn btn-secondary btn-sm" data-edit>${icon('pencil')}<span>Ubah info</span></button></div></div>
          ${locked ? `<div class="alert alert--warning" style="margin:0 20px 16px">${icon('lock')}<div><p class="alert__title">Peran Owner terkunci</p><p class="alert__text">Owner selalu memiliki seluruh izin dan tidak dapat diubah.</p></div></div>` : ''}
          <div class="table-wrap"><table class="table perm-table">
            <thead><tr><th scope="col">Modul</th>${actionsAll.map(a => `<th scope="col" class="num">${actionLabel[a]}</th>`).join('')}<th scope="col" class="num">Semua</th></tr></thead>
            <tbody>${mods.map(m => {
              const allOn = m.actions.every(a => draft.has(`${m.key}.${a}`));
              return `<tr><th scope="row" class="fw-500" style="background:none;border-top:0;text-transform:none;letter-spacing:0;font-size:var(--fs-sm);color:var(--text-strong)">${esc(m.label)}</th>${actionsAll.map(a => m.actions.includes(a)
                ? `<td class="num"><input type="checkbox" data-perm="${m.key}.${a}" aria-label="${esc(m.label)}: ${actionLabel[a]}" ${draft.has(`${m.key}.${a}`) ? 'checked' : ''} ${locked ? 'disabled' : ''}></td>`
                : '<td class="num text-muted" aria-hidden="true">·</td>').join('')}<td class="num"><input type="checkbox" data-row="${m.key}" aria-label="Semua izin ${esc(m.label)}" ${allOn ? 'checked' : ''} ${locked ? 'disabled' : ''}></td></tr>`;
            }).join('')}</tbody></table></div>
          <div class="card__foot"><span data-count>${draft.size} izin dipilih</span><div class="btn-group"><button type="button" class="btn btn-secondary btn-sm" data-reset ${locked ? 'disabled' : ''}>Reset</button><button type="button" class="btn btn-primary btn-sm" data-save ${locked ? 'disabled' : ''}>${icon('save')}<span>Simpan izin</span></button></div></div>`;
      }

      const syncRowBoxes = () => {
        view.querySelectorAll('[data-row]').forEach(cb => {
          const boxes = [...view.querySelectorAll(`[data-perm^="${cb.dataset.row}."]`)];
          cb.checked = boxes.every(b => b.checked);
          cb.indeterminate = !cb.checked && boxes.some(b => b.checked);
        });
        $('[data-count]').textContent = `${draft.size} izin dipilih`;
      };

      view.addEventListener('change', e => {
        const t = e.target;
        if (t.dataset.perm) { t.checked ? draft.add(t.dataset.perm) : draft.delete(t.dataset.perm); syncRowBoxes(); }
        if (t.dataset.row) { view.querySelectorAll(`[data-perm^="${t.dataset.row}."]`).forEach(b => { b.checked = t.checked; t.checked ? draft.add(b.dataset.perm) : draft.delete(b.dataset.perm); }); syncRowBoxes(); }
      });
      view.addEventListener('click', e => {
        const roleBtn = e.target.closest('[data-role]');
        if (roleBtn) { selected = roleBtn.dataset.role; drawList(); drawDetail(); syncRowBoxes(); return; }
        const r = S.get('roles', selected);
        if (e.target.closest('[data-save]')) {
          // Jangan biarkan admin mengunci dirinya sendiri dari halaman ini
          if (r.id === K.currentUser().roleId && !draft.has('roles.view')) { K.ui.toast('Tidak dapat menyimpan', 'Anda akan kehilangan akses ke halaman Roles.', 'error'); return; }
          S.update('roles', r.id, { permissions: [...draft] });
          S.audit('role.update', 'Memperbarui izin peran', r.name, 'warning', 'Role');
          drawList(); K.ui.toast('Izin disimpan', r.name);
        }
        if (e.target.closest('[data-reset]')) { drawDetail(); syncRowBoxes(); }
        if (e.target.closest('[data-edit]')) openForm(r);
        if (e.target.closest('[data-dup]')) { const n = S.insert('roles', { ...r, id: undefined, name: r.name + ' (salinan)', system: false }, { idPrefix: 'role', prepend: false }); selected = n.id; drawList(); drawDetail(); syncRowBoxes(); K.ui.toast('Peran diduplikat'); }
        if (e.target.closest('[data-del]')) {
          const n = S.count('users', u => u.roleId === r.id);
          K.ui.confirm({ title: `Hapus peran ${r.name}?`, text: n ? `${n} pengguna akan dipindahkan ke peran Viewer.` : 'Peran ini tidak memiliki pengguna.' }).then(ok => {
            if (!ok) return;
            S.updateWhere('users', u => u.roleId === r.id, { roleId: 'role_viewer' });
            S.remove('roles', r.id); selected = 'role_admin'; drawList(); drawDetail(); syncRowBoxes(); K.ui.toast('Peran dihapus');
          });
        }
      });

      function openForm(r) {
        const colors = ['blue', 'emerald', 'amber', 'rose', 'violet', 'sky'];
        K.ui.modal({
          title: r ? 'Ubah info peran' : 'Peran baru',
          body: `${K.ui.field({ name: 'name', label: 'Nama peran', required: true, value: r?.name })}
            ${K.ui.field({ name: 'description', label: 'Deskripsi', type: 'textarea', value: r?.description })}
            ${K.ui.field({ name: 'color', label: 'Warna penanda', type: 'select', value: r?.color || 'blue', options: colors.map(c => [c, c[0].toUpperCase() + c.slice(1)]) })}
            ${r ? '' : K.ui.field({ name: 'base', label: 'Salin izin dari', type: 'select', value: 'role_viewer', options: [['', '— Kosong —'], ...roleOptions()] })}`,
          onSubmit: d => {
            if (r) S.update('roles', r.id, { name: d.name, description: d.description, color: d.color });
            else { const base = d.base ? S.get('roles', d.base).permissions : []; const n = S.insert('roles', { name: d.name, description: d.description, color: d.color, system: false, permissions: [...base] }, { idPrefix: 'role', prepend: false }); selected = n.id; }
            drawList(); drawDetail(); syncRowBoxes(); K.ui.toast(r ? 'Peran diperbarui' : 'Peran dibuat', d.name);
          },
        });
      }
      $('#rl-new').addEventListener('click', () => openForm());
      drawList(); drawDetail(); syncRowBoxes();
    },
  });
})(window.K);
