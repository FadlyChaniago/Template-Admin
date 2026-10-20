/* ==========================================================================
   Tools → Calendar
   Tampilan Bulan (grid) & Agenda (daftar). Klik tanggal untuk membuat acara,
   klik acara untuk mengubah. Minggu dimulai Senin (sesuai Localization).
   Backend: GET /events?from=&to=  ·  POST/PATCH/DELETE /events/:id
   ========================================================================== */
(function (K) {
  'use strict';
  const { esc } = K.util;
  const { icon } = K.ui;
  const S = K.store;
  const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const sameDay = (a, b) => key(a) === key(b);
  const hhmm = d => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  K.page('calendar', {
    render(view) {
      const today = new Date(K.NOW);
      let cursor = new Date(today.getFullYear(), today.getMonth(), 1);
      let mode = innerWidth < 768 ? 'agenda' : 'month';
      const hidden = new Set();
      const cats = () => S.all('eventCategories');
      const cat = id => cats().find(c => c.id === id) || { name: id, color: 'blue' };

      view.innerHTML = `${K.ui.pageHead({
        title: 'Calendar', eyebrow: 'Tools', desc: 'Jadwal rapat, deploy, pemeliharaan, dan cuti tim dalam satu tempat.',
        actions: `<button type="button" class="btn btn-primary btn-sm" id="cal-new">${icon('calendar-plus')}<span>Acara baru</span></button>`,
      })}
        <div class="cal-layout">
          <aside class="stack">
            <article class="card"><div class="flex items-center justify-between"><p class="fw-600" id="mini-title"></p><div class="flex">${K.ui.iconBtn('chevron-left', 'Bulan sebelumnya', 'data-nav="-1"')}${K.ui.iconBtn('chevron-right', 'Bulan berikutnya', 'data-nav="1"')}</div></div><div class="mini-cal mt-3" id="mini"></div></article>
            <article class="card"><h2 class="card__title">Kategori</h2><div class="stack mt-4" style="gap:10px" id="cal-cats"></div></article>
            <article class="card"><h2 class="card__title">Hari ini</h2><div class="list mt-4" id="cal-today"></div></article>
          </aside>
          <article class="card card--flush">
            <div class="cal-toolbar">
              <div class="flex items-center gap-2"><button type="button" class="btn btn-secondary btn-sm" data-today>Hari ini</button>${K.ui.iconBtn('chevron-left', 'Sebelumnya', 'data-nav="-1"')}${K.ui.iconBtn('chevron-right', 'Berikutnya', 'data-nav="1"')}<h2 class="card__title" style="font-size:18px" id="cal-title" aria-live="polite"></h2></div>
              <div class="segmented" role="group" aria-label="Tampilan"><button type="button" data-mode="month">${icon('calendar-days')}Bulan</button><button type="button" data-mode="agenda">${icon('list')}Agenda</button></div>
            </div>
            <div id="cal-body"></div>
          </article>
        </div>`;
      const $ = s => view.querySelector(s);

      const events = () => S.all('events').filter(e => !hidden.has(e.category)).map(e => ({ ...e, d: new Date(e.start) })).sort((a, b) => a.d - b.d);
      const monthGrid = base => {
        const first = new Date(base.getFullYear(), base.getMonth(), 1);
        const start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7)); // mundur ke Senin
        return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
      };
      const evChip = e => `<button type="button" class="cal-ev" data-ev="${e.id}" style="--c:var(--av-${cat(e.category).color}-fg);--b:var(--av-${cat(e.category).color}-bg)" title="${esc(e.title)}"><span class="cal-ev__time">${hhmm(e.d)}</span>${esc(e.title)}</button>`;

      function drawMonth() {
        const evs = events(), byDay = {};
        evs.forEach(e => { (byDay[key(e.d)] = byDay[key(e.d)] || []).push(e); });
        $('#cal-body').innerHTML = `<div class="cal-grid" role="group" aria-label="Kalender bulan">
          ${DAYS.map(d => `<div class="cal-dow" aria-hidden="true">${d}</div>`).join('')}
          ${monthGrid(cursor).map(d => {
            const list = byDay[key(d)] || [], out = d.getMonth() !== cursor.getMonth();
            return `<div class="cal-cell ${out ? 'is-out' : ''} ${sameDay(d, today) ? 'is-today' : ''} ${d.getDay() === 0 || d.getDay() === 6 ? 'is-weekend' : ''}" data-day="${key(d)}">
              <button type="button" class="cal-cell__num" data-add="${key(d)}" aria-label="Tambah acara ${d.getDate()} ${d.toLocaleDateString('id-ID', { month: 'long' })}">${d.getDate()}</button>
              <div class="cal-cell__evs">${list.slice(0, 3).map(evChip).join('')}${list.length > 3 ? `<button type="button" class="cal-more" data-more="${key(d)}">+${list.length - 3} lagi</button>` : ''}</div>
            </div>`;
          }).join('')}</div>`;
      }

      function drawAgenda() {
        const evs = events().filter(e => e.d.getMonth() === cursor.getMonth() && e.d.getFullYear() === cursor.getFullYear());
        let last = '';
        $('#cal-body').innerHTML = evs.length ? `<div class="agenda">${evs.map(e => {
          const k = key(e.d), head = k !== last ? `<p class="agenda__day ${sameDay(e.d, today) ? 'is-today' : ''}">${e.d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>` : ''; last = k;
          const c = cat(e.category);
          return `${head}<button type="button" class="agenda__item" data-ev="${e.id}"><span class="agenda__bar" style="background:var(--av-${c.color}-fg)"></span><span class="agenda__time">${hhmm(e.d)}<small>${e.duration >= 60 ? Math.round(e.duration / 60) + ' jam' : e.duration + ' mnt'}</small></span><span class="flex-1"><span class="fw-500" style="display:block">${esc(e.title)}</span><span class="text-xs text-secondary">${esc(c.name)}${e.location ? ' · ' + esc(e.location) : ''}</span></span>${icon('chevron-right', 'text-muted')}</button>`;
        }).join('')}</div>` : K.ui.empty({ icon: 'calendar-x', title: 'Tidak ada acara bulan ini' });
      }

      function drawSide() {
        const grid = monthGrid(cursor), evDays = new Set(events().map(e => key(e.d)));
        $('#mini-title').textContent = cursor.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        $('#mini').innerHTML = DAYS.map(d => `<span class="mini-cal__dow">${d[0]}</span>`).join('') + grid.map(d => `<button type="button" class="mini-cal__day ${d.getMonth() !== cursor.getMonth() ? 'is-out' : ''} ${sameDay(d, today) ? 'is-today' : ''} ${evDays.has(key(d)) ? 'has-ev' : ''}" data-add="${key(d)}" aria-label="${d.toLocaleDateString('id-ID')}">${d.getDate()}</button>`).join('');
        $('#cal-cats').innerHTML = cats().map(c => `<label class="check"><input type="checkbox" data-cat="${c.id}" ${hidden.has(c.id) ? '' : 'checked'} style="accent-color:var(--av-${c.color}-fg)"><span class="legend__swatch" style="background:var(--av-${c.color}-fg)"></span>${esc(c.name)}<span class="text-xs text-muted" style="margin-left:auto">${S.count('events', e => e.category === c.id)}</span></label>`).join('');
        const tdy = events().filter(e => sameDay(e.d, today));
        $('#cal-today').innerHTML = tdy.map(e => `<button type="button" class="list-item" style="width:100%;text-align:left" data-ev="${e.id}"><span class="chip__swatch" style="width:10px;height:10px;background:var(--av-${cat(e.category).color}-fg)"></span><div class="list-item__body"><p class="list-item__title">${esc(e.title)}</p><p class="list-item__sub">${hhmm(e.d)} · ${e.duration} menit</p></div></button>`).join('') || '<p class="text-sm text-secondary">Tidak ada acara hari ini.</p>';
      }

      function draw() {
        $('#cal-title').textContent = cursor.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        view.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === mode));
        mode === 'month' ? drawMonth() : drawAgenda();
        drawSide();
      }

      function edit(ev, dayKey) {
        const d = ev ? new Date(ev.start) : new Date(dayKey + 'T09:00:00');
        K.ui.modal({
          title: ev ? 'Ubah acara' : 'Acara baru',
          body: `<div class="form-grid">
            ${K.ui.field({ name: 'title', label: 'Judul', required: true, value: ev?.title, span: true })}
            ${K.ui.field({ name: 'date', label: 'Tanggal', type: 'date', required: true, value: key(d) })}
            ${K.ui.field({ name: 'time', label: 'Mulai', type: 'time', required: true, value: hhmm(d) })}
            ${K.ui.field({ name: 'duration', label: 'Durasi', type: 'select', value: ev?.duration || 60, options: [[15, '15 menit'], [30, '30 menit'], [45, '45 menit'], [60, '1 jam'], [90, '1,5 jam'], [120, '2 jam'], [240, '4 jam'], [480, 'Seharian']] })}
            ${K.ui.field({ name: 'category', label: 'Kategori', type: 'select', value: ev?.category || 'meeting', options: cats().map(c => [c.id, c.name]) })}
            ${K.ui.field({ name: 'location', label: 'Lokasi / tautan', value: ev?.location, span: true })}
            ${K.ui.field({ name: 'notes', label: 'Catatan', type: 'textarea', value: ev?.notes, span: true })}
          </div>`,
          footer: `${ev ? `<button type="button" class="btn btn-danger-ghost" data-del style="margin-right:auto">${icon('trash-2')}<span>Hapus</span></button>` : ''}<button type="button" class="btn btn-secondary" data-dismiss>Batal</button><button type="submit" class="btn btn-primary">${ev ? 'Simpan' : 'Buat acara'}</button>`,
          onOpen: dlg => dlg.querySelector('[data-del]')?.addEventListener('click', () => { S.remove('events', ev.id); dlg.close(); draw(); K.ui.toast('Acara dihapus', ev.title); }),
          onSubmit: d => {
            const start = new Date(`${d.date}T${d.time}:00`).toISOString();
            const data = { title: d.title, start, duration: +d.duration, category: d.category, location: d.location, notes: d.notes };
            ev ? S.update('events', ev.id, data) : S.insert('events', data, { idPrefix: 'evt' });
            cursor = new Date(new Date(start).getFullYear(), new Date(start).getMonth(), 1);
            draw(); K.ui.toast(ev ? 'Acara diperbarui' : 'Acara dibuat', d.title);
          },
        });
      }

      view.addEventListener('click', e => {
        const t = e.target;
        const nav = t.closest('[data-nav]'); if (nav) { cursor = new Date(cursor.getFullYear(), cursor.getMonth() + Number(nav.dataset.nav), 1); draw(); return; }
        if (t.closest('[data-today]')) { cursor = new Date(today.getFullYear(), today.getMonth(), 1); draw(); return; }
        const m = t.closest('[data-mode]'); if (m) { mode = m.dataset.mode; draw(); return; }
        const ev = t.closest('[data-ev]'); if (ev) { edit(S.get('events', ev.dataset.ev)); return; }
        const more = t.closest('[data-more]'); if (more) { mode = 'agenda'; draw(); view.querySelector('.agenda')?.scrollIntoView({ block: 'nearest' }); return; }
        const add = t.closest('[data-add]'); if (add) { edit(null, add.dataset.add); return; }
        const cell = t.closest('.cal-cell'); if (cell && !t.closest('button')) edit(null, cell.dataset.day);
      });
      view.addEventListener('change', e => { const c = e.target.closest('[data-cat]'); if (c) { c.checked ? hidden.delete(c.dataset.cat) : hidden.add(c.dataset.cat); draw(); } });
      $('#cal-new').addEventListener('click', () => edit(null, key(today)));
      draw();
    },
  });
})(window.K);
