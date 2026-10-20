/* ==========================================================================
   Tools → Kanban Board
   Drag & drop native HTML5 + alternatif keyboard (menu "Pindahkan ke").
   Data: K.store 'kanban' (kartu) & 'kanbanLabels'.
   Backend: PATCH /tasks/:id { status, order } setiap kartu dipindah.
   ========================================================================== */
(function (K) {
  'use strict';
  const { esc } = K.util;
  const { icon } = K.ui;
  const S = K.store;

  const COLS = [['backlog', 'Backlog', 'circle-dashed'], ['todo', 'To Do', 'circle'], ['progress', 'In Progress', 'circle-dot'], ['review', 'Review', 'eye'], ['done', 'Done', 'circle-check']];
  const WIP = { progress: 4, review: 3 };
  const PRIO = { urgent: ['Mendesak', 'danger'], high: ['Tinggi', 'warning'], medium: ['Sedang', 'info'], low: ['Rendah', 'neutral'] };

  K.page('kanban', {
    render(view) {
      let q = '', who = '', label = '';
      const labelColor = id => (S.all('kanbanLabels').find(l => l.id === id) || {}).color || 'blue';
      view.innerHTML = `${K.ui.pageHead({
        title: 'Kanban Board', eyebrow: 'Tools', desc: 'Kelola tugas tim secara visual. Seret kartu antar kolom, atau gunakan menu kartu untuk navigasi keyboard.',
        actions: `<button type="button" class="btn btn-primary btn-sm" data-new="todo">${icon('plus')}<span>Tugas baru</span></button>`,
      })}
        <div class="flex wrap items-center justify-between gap-3">
          <div class="flex wrap items-center gap-2">
            <label class="input-icon" style="width:220px">${icon('search')}<input type="search" class="input input-sm" placeholder="Cari tugas…" aria-label="Cari tugas" id="kb-q"></label>
            <select class="select select-sm" style="width:auto" id="kb-who" aria-label="Filter penanggung jawab"><option value="">Semua orang</option><option value="usr_me">Tugas saya</option>${[...new Set(S.all('kanban').map(c => c.assignee))].map(id => `<option value="${id}">${esc(K.lookup.user(id).name)}</option>`).join('')}</select>
            <select class="select select-sm" style="width:auto" id="kb-label" aria-label="Filter label"><option value="">Semua label</option>${S.all('kanbanLabels').map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join('')}</select>
          </div>
          <p class="text-xs text-secondary" id="kb-summary"></p>
        </div>
        <div class="kanban mt-4" id="kb"></div>`;
      const $ = s => view.querySelector(s);

      const visible = c => (!q || c.title.toLowerCase().includes(q)) && (!who || c.assignee === who) && (!label || c.labels.includes(label));

      function cardHTML(c) {
        const u = K.lookup.user(c.assignee);
        const [pl, pt] = PRIO[c.priority];
        const overdue = c.due && c.status !== 'done' && new Date(c.due) < K.NOW;
        return `<article class="kb-card" draggable="true" data-card="${c.id}" tabindex="0" aria-label="${esc(c.title)}, prioritas ${pl}">
          <div class="flex items-start justify-between gap-2">
            <div class="chip-list">${c.labels.map(l => `<span class="kb-label" style="--c:var(--av-${labelColor(l)}-fg);--b:var(--av-${labelColor(l)}-bg)">${esc(l)}</span>`).join('')}</div>
            <div class="menu-anchor">${K.ui.iconBtn('ellipsis', 'Aksi kartu', 'data-menu-toggle aria-expanded="false"')}<div class="menu" role="menu">
              <button type="button" class="menu__item" data-open="${c.id}">${icon('pencil')}Buka / edit</button>
              <div class="menu__sep"></div>
              <p class="text-xs text-muted" style="padding:4px 10px">Pindahkan ke</p>
              ${COLS.filter(([k]) => k !== c.status).map(([k, l, ic]) => `<button type="button" class="menu__item" data-move="${c.id}" data-to="${k}">${icon(ic)}${l}</button>`).join('')}
              <div class="menu__sep"></div>
              <button type="button" class="menu__item menu__item--danger" data-del="${c.id}">${icon('trash-2')}Hapus</button></div></div>
          </div>
          <p class="kb-card__title">${esc(c.title)}</p>
          <div class="kb-card__meta">
            <span class="badge badge--${pt}">${pl}</span>
            ${c.due ? `<span class="kb-meta ${overdue ? 'text-danger' : ''}" title="Tenggat">${icon('calendar')}${K.util.date(c.due, { day: 'numeric', month: 'short' })}</span>` : ''}
            ${c.checklist ? `<span class="kb-meta" title="Checklist">${icon('list-todo')}${c.checklist[0]}/${c.checklist[1]}</span>` : ''}
            ${c.comments ? `<span class="kb-meta" title="Komentar">${icon('message-square')}${c.comments}</span>` : ''}
            <span style="margin-left:auto" title="${esc(u.name)}">${K.ui.avatar(u.name, 'sm')}</span>
          </div>
        </article>`;
      }

      function draw() {
        const all = S.all('kanban');
        $('#kb').innerHTML = COLS.map(([key, name, ic]) => {
          const cards = all.filter(c => c.status === key).sort((a, b) => a.order - b.order);
          const shown = cards.filter(visible);
          const limit = WIP[key], over = limit && cards.length > limit;
          return `<section class="kb-col" data-col="${key}" aria-label="Kolom ${name}">
            <header class="kb-col__head"><span class="flex items-center gap-2 fw-600">${icon(ic)}${name}</span><span class="count-pill ${over ? 'is-over' : ''}" title="${limit ? 'Batas WIP ' + limit : ''}">${cards.length}${limit ? ' / ' + limit : ''}</span></header>
            <div class="kb-col__body" data-drop="${key}">${shown.map(cardHTML).join('') || '<p class="kb-empty">Seret kartu ke sini</p>'}</div>
            <button type="button" class="kb-add" data-new="${key}">${icon('plus')}Tambah kartu</button>
          </section>`;
        }).join('');
        const done = all.filter(c => c.status === 'done').length;
        $('#kb-summary').textContent = `${all.length} tugas · ${done} selesai (${Math.round((done / Math.max(1, all.length)) * 100)}%)`;
      }

      /** Pindahkan kartu ke kolom & posisi tertentu, lalu normalisasi urutan. */
      function move(id, to, beforeId) {
        const card = S.get('kanban', id); if (!card) return;
        const from = card.status;
        const list = S.all('kanban').filter(c => c.status === to && c.id !== id).sort((a, b) => a.order - b.order);
        const idx = beforeId ? list.findIndex(c => c.id === beforeId) : list.length;
        list.splice(idx < 0 ? list.length : idx, 0, card);
        card.status = to;
        list.forEach((c, i) => { c.order = i; });
        S.update('kanban', id, { status: to, order: card.order });
        if (to !== from) K.ui.toast('Kartu dipindahkan', `${card.title} → ${COLS.find(c => c[0] === to)[1]}`, 'success', 1800);
        draw();
      }

      /* Drag & drop */
      let dragId = null;
      const marker = Object.assign(document.createElement('div'), { className: 'kb-drop-marker' });
      view.addEventListener('dragstart', e => {
        const c = e.target.closest('[data-card]'); if (!c) return;
        dragId = c.dataset.card; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId);
        requestAnimationFrame(() => c.classList.add('is-dragging'));
      });
      view.addEventListener('dragend', e => { e.target.closest?.('[data-card]')?.classList.remove('is-dragging'); marker.remove(); view.querySelectorAll('.kb-col.is-over').forEach(x => x.classList.remove('is-over')); dragId = null; });
      view.addEventListener('dragover', e => {
        const zone = e.target.closest('[data-drop]'); if (!zone || !dragId) return;
        e.preventDefault();
        view.querySelectorAll('.kb-col.is-over').forEach(x => x !== zone.parentElement && x.classList.remove('is-over'));
        zone.parentElement.classList.add('is-over');
        const after = [...zone.querySelectorAll('[data-card]:not(.is-dragging)')].find(el => e.clientY < el.getBoundingClientRect().top + el.offsetHeight / 2);
        after ? zone.insertBefore(marker, after) : zone.appendChild(marker);
      });
      view.addEventListener('drop', e => {
        const zone = e.target.closest('[data-drop]'); if (!zone || !dragId) return;
        e.preventDefault();
        const before = marker.nextElementSibling?.dataset?.card || null;
        marker.remove(); move(dragId, zone.dataset.drop, before);
      });

      /* Klik & keyboard */
      view.addEventListener('click', e => {
        const t = e.target;
        const mv = t.closest('[data-move]'); if (mv) { move(mv.dataset.move, mv.dataset.to); return; }
        const del = t.closest('[data-del]'); if (del) { const c = S.get('kanban', del.dataset.del); K.ui.confirm({ title: 'Hapus kartu?', text: c.title }).then(ok => { if (ok) { S.remove('kanban', c.id); draw(); K.ui.toast('Kartu dihapus'); } }); return; }
        const nw = t.closest('[data-new]'); if (nw) { edit(null, nw.dataset.new); return; }
        const op = t.closest('[data-open]'); if (op) { edit(S.get('kanban', op.dataset.open)); return; }
        const card = t.closest('[data-card]'); if (card && !t.closest('.menu-anchor')) edit(S.get('kanban', card.dataset.card));
      });
      view.addEventListener('keydown', e => {
        const card = e.target.closest?.('[data-card]'); if (!card || e.target !== card) return;
        if (e.key === 'Enter') edit(S.get('kanban', card.dataset.card));
        // Alt+←/→ memindahkan kartu antar kolom tanpa mouse
        if (e.altKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
          const c = S.get('kanban', card.dataset.card); const i = COLS.findIndex(x => x[0] === c.status) + (e.key === 'ArrowRight' ? 1 : -1);
          if (COLS[i]) { move(c.id, COLS[i][0]); view.querySelector(`[data-card="${c.id}"]`)?.focus(); }
        }
      });

      function edit(c, status = 'todo') {
        const users = S.find('users', u => u.status === 'active');
        K.ui.modal({
          title: c ? 'Detail tugas' : 'Tugas baru', size: 'lg',
          body: `<div class="form-grid">
            ${K.ui.field({ name: 'title', label: 'Judul', required: true, value: c?.title, span: true })}
            ${K.ui.field({ name: 'status', label: 'Kolom', type: 'select', value: c?.status || status, options: COLS.map(([k, l]) => [k, l]) })}
            ${K.ui.field({ name: 'priority', label: 'Prioritas', type: 'select', value: c?.priority || 'medium', options: Object.entries(PRIO).map(([k, [l]]) => [k, l]) })}
            ${K.ui.field({ name: 'assignee', label: 'Penanggung jawab', type: 'select', value: c?.assignee || 'usr_me', options: users.map(u => [u.id, u.name]) })}
            ${K.ui.field({ name: 'due', label: 'Tenggat', type: 'date', value: c?.due ? c.due.slice(0, 10) : '' })}
            ${K.ui.field({ name: 'labels', label: 'Label', type: 'checkboxes', value: c?.labels || [], options: S.all('kanbanLabels').map(l => [l.id, l.name]), span: true })}
            ${K.ui.field({ name: 'description', label: 'Deskripsi', type: 'textarea', value: c?.description, span: true })}
          </div>${c ? `<p class="text-xs text-secondary">ID <span class="mono">${esc(c.id)}</span> · ${c.comments} komentar · checklist ${c.checklist[0]}/${c.checklist[1]}</p>` : ''}`,
          submitLabel: c ? 'Simpan' : 'Buat tugas',
          onSubmit: (d, form) => {
            const data = { title: d.title, status: d.status, priority: d.priority, assignee: d.assignee, due: d.due ? new Date(d.due + 'T17:00:00+07:00').toISOString() : null, labels: K.ui.checkedValues(form, 'labels'), description: d.description };
            if (c) S.update('kanban', c.id, data);
            else S.insert('kanban', { ...data, order: -1, comments: 0, checklist: [0, 0] }, { idPrefix: 'card' });
            draw(); K.ui.toast(c ? 'Tugas diperbarui' : 'Tugas dibuat', d.title);
          },
        });
      }

      $('#kb-q').addEventListener('input', K.util.debounce(e => { q = e.target.value.toLowerCase().trim(); draw(); }, 120));
      $('#kb-who').addEventListener('change', e => { who = e.target.value; draw(); });
      $('#kb-label').addEventListener('change', e => { label = e.target.value; draw(); });
      draw();
    },
  });
})(window.K);
