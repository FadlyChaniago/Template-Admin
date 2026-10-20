/* ==========================================================================
   K.ui — komponen UI yang dipakai ulang (icon, toast, modal, menu, badge…)
   Semua fungsi render mengembalikan STRING HTML; data dinamis selalu
   di-escape dengan K.util.esc untuk mencegah XSS.
   ========================================================================== */
(function (K) {
  'use strict';
  const { esc } = K.util;
  const iconCache = new Map();

  const ui = {
    /* ---------- Icon (Lucide → inline SVG string) ---------- */
    icon(name, cls = '') {
      const key = name + '|' + cls;
      if (iconCache.has(key)) return iconCache.get(key);
      const lib = window.lucide && window.lucide.icons;
      const pascal = name.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
      const node = lib && lib[pascal];
      if (!node) {
        if (lib) console.warn('[icon] tidak ditemukan:', name);
        return `<span class="${esc(cls)}" aria-hidden="true"></span>`;
      }
      const inner = node.map(([tag, attrs]) =>
        `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="${esc(cls)}" aria-hidden="true" focusable="false">${inner}</svg>`;
      iconCache.set(key, svg);
      return svg;
    },

    /* ---------- Badge status ---------- */
    statusMap: {
      success: ['success', 'Berhasil'], active: ['success', 'Aktif'], published: ['success', 'Terbit'], healthy: ['success', 'Sehat'],
      connected: ['success', 'Terhubung'], ready: ['success', 'Siap'], operational: ['success', 'Operasional'], shipped: ['success', 'Dirilis'],
      answered: ['success', 'Terjawab'], running: ['info', 'Berjalan'], planned: ['info', 'Direncanakan'], in_progress: ['info', 'Dikerjakan'],
      generating: ['info', 'Diproses'], scheduled: ['info', 'Terjadwal'], info: ['info', 'Info'],
      pending: ['warning', 'Pending'], invited: ['warning', 'Diundang'], trial: ['warning', 'Trial'], degraded: ['warning', 'Menurun'],
      queued: ['warning', 'Antre'], draft: ['neutral', 'Draf'], warning: ['warning', 'Peringatan'], paused: ['neutral', 'Dijeda'],
      failed: ['danger', 'Gagal'], suspended: ['danger', 'Ditangguhkan'], failing: ['danger', 'Bermasalah'], revoked: ['danger', 'Dicabut'],
      danger: ['danger', 'Kritis'], outage: ['danger', 'Gangguan'], refunded: ['neutral', 'Refund'],
      archived: ['neutral', 'Diarsipkan'], disabled: ['neutral', 'Nonaktif'], disconnected: ['neutral', 'Terputus'],
    },
    badge(status, label) {
      const [tone, def] = ui.statusMap[status] || ['neutral', status];
      const k = 'status.' + status, tr = K.t ? K.t(k) : k; // terjemahan opsional
      return `<span class="badge badge--${tone}">${esc(label || (tr !== k ? tr : def))}</span>`;
    },

    trend(value, { suffix = '%', invert = false } = {}) {
      const up = value >= 0;
      const good = invert ? !up : up;
      const cls = value === 0 ? 'flat' : good ? 'up' : 'down';
      return `<span class="trend trend--${cls}">${ui.icon(up ? 'arrow-up' : 'arrow-down')}${K.util.num(Math.abs(value), 1)}${suffix}</span>`;
    },

    /* ---------- Avatar & person ---------- */
    avatar(name, size = '') {
      return `<span class="avatar ${size ? 'avatar--' + size : ''}" data-c="${K.util.tone(name)}" aria-hidden="true">${esc(K.util.initials(name))}</span>`;
    },
    person(user, sub) {
      const s = sub === undefined ? user.email : sub;
      return `<div class="person">${ui.avatar(user.name)}<div class="flex-1"><div class="person__name truncate">${esc(user.name)}</div>${s ? `<div class="person__sub truncate">${esc(s)}</div>` : ''}</div></div>`;
    },

    /* ---------- Page header ---------- */
    pageHead({ title, desc, eyebrow, actions = '' }) {
      return `<div class="page-head">
        <div>
          <div class="page-head__title"><h1 id="page-title" tabindex="-1">${esc(title)}</h1>${eyebrow ? `<span class="eyebrow">${esc(eyebrow)}</span>` : ''}</div>
          ${desc ? `<p class="page-head__desc">${desc}</p>` : ''}
        </div>
        ${actions ? `<div class="page-head__actions">${actions}</div>` : ''}
      </div>`;
    },

    kpi({ label, value, icon, trend, trendInvert, foot = K.t('common.vsLastMonth'), title }) {
      return `<article class="card kpi">
        <div class="kpi__head"><h2 class="kpi__label">${esc(label)}</h2><span class="kpi__icon">${ui.icon(icon)}</span></div>
        <p class="kpi__value"${title ? ` title="${esc(title)}"` : ''}>${value}</p>
        <div class="kpi__foot">${trend !== undefined ? ui.trend(trend, { invert: trendInvert }) : ''}<span>${esc(foot)}</span></div>
      </article>`;
    },

    empty({ icon = 'inbox', title = 'Belum ada data', text = '', action = '' } = {}) {
      return `<div class="empty"><div class="empty__icon">${ui.icon(icon)}</div><p class="empty__title">${esc(title)}</p>${text ? `<p class="empty__text">${esc(text)}</p>` : ''}${action}</div>`;
    },

    btn(label, { variant = 'secondary', icon, size, attrs = '', type = 'button' } = {}) {
      return `<button type="${type}" class="btn btn-${variant}${size ? ' btn-' + size : ''}" ${attrs}>${icon ? ui.icon(icon) : ''}${label ? `<span>${esc(label)}</span>` : ''}</button>`;
    },

    iconBtn(icon, label, attrs = '', extra = '') {
      return `<button type="button" class="icon-btn icon-btn--sm ${extra}" aria-label="${esc(label)}" title="${esc(label)}" ${attrs}>${ui.icon(icon)}</button>`;
    },

    progress(value, tone = '', label = '') {
      const v = Math.max(0, Math.min(100, value));
      return `<div class="progress ${tone ? 'progress--' + tone : ''}" role="progressbar" aria-label="${esc(label || Math.round(v) + '%')}" aria-valuenow="${Math.round(v)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${v}%"></span></div>`;
    },

    switchEl({ name, checked, label, id, disabled, ariaLabel }) {
      const _id = id || 'sw_' + name;
      return `<label class="switch" for="${_id}"><input type="checkbox" id="${_id}" name="${esc(name)}" ${!label && ariaLabel ? `aria-label="${esc(ariaLabel)}"` : ''} ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}><span class="switch__track"></span>${label ? `<span>${esc(label)}</span>` : ''}</label>`;
    },

    /* ---------- Form builder ---------- */
    field(f) {
      const id = 'f_' + f.name;
      const req = f.required ? ' required' : '';
      const val = f.value ?? '';
      const label = `<label class="label" for="${id}">${esc(f.label)}${f.required ? '<span class="req" aria-hidden="true">*</span>' : ''}</label>`;
      const help = f.help ? `<p class="help" id="${id}_help">${esc(f.help)}</p>` : '';
      const describe = f.help ? ` aria-describedby="${id}_help"` : '';
      let control;
      switch (f.type) {
        case 'select':
          control = `<select class="select" id="${id}" name="${f.name}"${req}${describe}>${f.options.map(o => {
            const [v, l] = Array.isArray(o) ? o : [o, o];
            return `<option value="${esc(v)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(l)}</option>`;
          }).join('')}</select>`; break;
        case 'textarea':
          control = `<textarea class="textarea" id="${id}" name="${f.name}" placeholder="${esc(f.placeholder || '')}"${req}${describe}>${esc(val)}</textarea>`; break;
        case 'switch':
          return `<div class="field ${f.span ? 'span-2' : ''}">${ui.switchEl({ name: f.name, checked: !!val, label: f.label, id })}${help}</div>`;
        case 'checkboxes':
          control = `<div class="chip-list" role="group" aria-label="${esc(f.label)}">${f.options.map(o => {
            const [v, l] = Array.isArray(o) ? o : [o, o];
            return `<label class="chip"><input type="checkbox" name="${f.name}" value="${esc(v)}" ${(val || []).includes(v) ? 'checked' : ''}> ${esc(l)}</label>`;
          }).join('')}</div>`;
          return `<fieldset class="field ${f.span ? 'span-2' : ''}" style="border:0;padding:0;margin:0"><legend class="label" style="margin-bottom:6px">${esc(f.label)}</legend>${control}${help}</fieldset>`;
        default:
          control = `<input class="input" id="${id}" name="${f.name}" type="${f.type || 'text'}" value="${esc(val)}" placeholder="${esc(f.placeholder || '')}"${req}${describe}${f.attrs ? ' ' + f.attrs : ''}>`;
      }
      return `<div class="field ${f.span ? 'span-2' : ''}">${label}${control}${help}</div>`;
    },

    /** Ambil nilai grup checkbox bernama sama sebagai array. */
    checkedValues(form, name) { return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(i => i.value); },

    /* ---------- Toast ---------- */
    /** ui.toast(judul, teks, tipe, timeoutMs, { action: { label, onClick } })
        tipe: success | error | warning | info. timeout 0 = tidak hilang otomatis. */
    toast(title, text = '', type = 'success', timeout = 3800, opts = {}) {
      const region = document.getElementById('toast-region');
      if (!region) return;
      const icons = { success: 'circle-check', error: 'circle-alert', warning: 'triangle-alert', info: 'info' };
      const el = document.createElement('div');
      el.className = `toast toast--${type}`;
      el.setAttribute('role', type === 'error' ? 'alert' : 'status');
      el.innerHTML = `${ui.icon(icons[type] || 'info')}<div class="toast__body"><p class="toast__title">${esc(title)}</p>${text ? `<p class="toast__text">${esc(text)}</p>` : ''}${opts.action ? `<button type="button" class="btn btn-secondary btn-sm toast__action" data-act>${esc(opts.action.label)}</button>` : ''}</div>${ui.iconBtn('x', K.t('common.closeToast'), 'data-close')}${timeout ? `<span class="toast__bar" style="animation-duration:${timeout}ms"></span>` : ''}`;
      let timer;
      const close = () => { clearTimeout(timer); el.classList.add('is-leaving'); setTimeout(() => el.remove(), 180); };
      el.querySelector('[data-close]').addEventListener('click', close);
      el.querySelector('[data-act]')?.addEventListener('click', () => { opts.action.onClick && opts.action.onClick(); close(); });
      // Jeda saat hover agar pengguna sempat membaca
      el.addEventListener('mouseenter', () => { clearTimeout(timer); el.querySelector('.toast__bar')?.style.setProperty('animation-play-state', 'paused'); });
      el.addEventListener('mouseleave', () => { if (timeout) { el.querySelector('.toast__bar')?.style.setProperty('animation-play-state', 'running'); timer = setTimeout(close, 1500); } });
      region.appendChild(el);
      while (region.children.length > 5) region.firstElementChild.remove(); // batasi tumpukan
      if (timeout) timer = setTimeout(close, timeout);
      return { close };
    },

    /* ---------- Modal (native <dialog>) ----------
       ui.modal({ title, desc, body, size, submitLabel, danger, onSubmit(data, form, close) })
       onSubmit boleh mengembalikan false untuk membatalkan penutupan. */
    modal({ title, desc = '', body = '', size = '', submitLabel = K.t('common.save'), cancelLabel = K.t('common.cancel'), danger = false, onSubmit, onOpen, footer, hideFooter = false }) {
      const dlg = document.createElement('dialog');
      dlg.className = `modal ${size ? 'modal--' + size : ''}`;
      dlg.setAttribute('aria-labelledby', 'modal-title');
      dlg.innerHTML = `<form method="dialog" novalidate style="display:contents">
        <div class="modal__head"><div><h2 class="modal__title" id="modal-title">${esc(title)}</h2>${desc ? `<p class="modal__desc">${desc}</p>` : ''}</div>${ui.iconBtn('x', K.t('common.close'), 'data-dismiss value="cancel"')}</div>
        <div class="modal__body">${body}</div>
        ${hideFooter ? '' : `<div class="modal__foot">${footer ?? `<button type="button" class="btn btn-secondary" data-dismiss>${esc(cancelLabel)}</button>${onSubmit ? `<button type="submit" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" value="submit">${esc(submitLabel)}</button>` : ''}`}</div>`}
      </form>`;
      document.body.appendChild(dlg);
      const form = dlg.querySelector('form');
      const close = () => { dlg.close(); };
      dlg.addEventListener('close', () => setTimeout(() => dlg.remove(), 50));
      dlg.addEventListener('click', e => { if (e.target === dlg) close(); }); // klik backdrop
      dlg.querySelectorAll('[data-dismiss]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); close(); }));
      form.addEventListener('submit', e => {
        e.preventDefault();
        if (!onSubmit) return close();
        // Validasi native browser + tandai field invalid
        let valid = true;
        form.querySelectorAll('[required]').forEach(el => {
          const ok = el.checkValidity();
          el.setAttribute('aria-invalid', ok ? 'false' : 'true');
          if (!ok && valid) { el.focus(); valid = false; }
        });
        if (!valid) { ui.toast(K.t('common.checkFields'), K.t('common.checkFieldsText'), 'error'); return; }
        const result = onSubmit(K.util.formData(form), form, close);
        if (result !== false) close();
      });
      dlg.showModal();
      onOpen && onOpen(dlg, form);
      const firstInput = dlg.querySelector('.modal__body input:not([type=hidden]):not([type=checkbox]), .modal__body select, .modal__body textarea');
      if (firstInput) firstInput.focus();
      return { dialog: dlg, form, close };
    },

    /** Drawer samping kanan (edit cepat tanpa pindah halaman). Opsi sama dengan modal. */
    drawer(opts) { return ui.modal({ ...opts, size: 'drawer' }); },

    confirm({ title = K.t ? K.t('common.confirm') : 'Anda yakin?', text = '', confirmLabel = K.t ? K.t('common.delete') : 'Hapus', danger = true } = {}) {
      return new Promise(resolve => {
        let ok = false;
        const m = ui.modal({
          title, size: 'sm', body: `<p class="text-secondary">${esc(text)}</p>`,
          submitLabel: confirmLabel, danger, onSubmit: () => { ok = true; },
        });
        m.dialog.addEventListener('close', () => resolve(ok));
      });
    },

    /* ---------- Dropdown menu (delegasi global) ----------
       Markup: <div class="menu-anchor"><button data-menu-toggle aria-expanded="false">…</button><div class="menu">…</div></div> */
    initMenus() {
      document.addEventListener('click', e => {
        const toggle = e.target.closest('[data-menu-toggle]');
        const openMenus = document.querySelectorAll('.menu.is-open');
        if (toggle) {
          const menu = toggle.parentElement.querySelector(':scope > .menu');
          const willOpen = !menu.classList.contains('is-open');
          openMenus.forEach(m => ui.closeMenu(m));
          if (willOpen) {
            // Menu di dalam area yang bisa di-scroll (tabel) diposisikan fixed agar tidak terpotong
            if (toggle.closest('.table-wrap, .modal__body')) {
              const r = toggle.getBoundingClientRect();
              // Ancestor dengan transform/container-type bisa menjadi containing block untuk position:fixed.
              // Ukur titik asal sebenarnya dengan menaruh menu di (0,0) lalu koreksi offset-nya.
              Object.assign(menu.style, { position: 'fixed', left: '0px', top: '0px', right: 'auto', bottom: 'auto', transform: 'none', transition: 'none' });
              const o = menu.getBoundingClientRect();
              const w = menu.offsetWidth, h = menu.offsetHeight;
              let top = r.bottom + 6;
              if (top + h > innerHeight - 8) top = Math.max(8, r.top - h - 6);
              const left = Math.max(8, Math.min(innerWidth - w - 8, r.right - w));
              Object.assign(menu.style, { left: left - o.left + 'px', top: top - o.top + 'px', transform: '', transition: '' });
            }
            menu.classList.add('is-open');
            toggle.setAttribute('aria-expanded', 'true');
            const first = menu.querySelector('button, a, input');
            if (first && e.detail === 0) first.focus(); // dibuka via keyboard
          }
          return;
        }
        openMenus.forEach(m => { if (!m.contains(e.target) || e.target.closest('.menu__item')) ui.closeMenu(m); });
      });
      // Tutup menu fixed saat halaman di-scroll / di-resize
      const closeFixed = () => document.querySelectorAll('.menu.is-open').forEach(m => { if (m.style.position === 'fixed') ui.closeMenu(m); });
      window.addEventListener('scroll', closeFixed, { passive: true, capture: true });
      window.addEventListener('resize', closeFixed);
      document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        document.querySelectorAll('.menu.is-open').forEach(m => {
          ui.closeMenu(m);
          m.parentElement.querySelector('[data-menu-toggle]')?.focus();
        });
      });
    },
    closeMenu(menu) {
      menu.classList.remove('is-open');
      menu.parentElement.querySelector('[data-menu-toggle]')?.setAttribute('aria-expanded', 'false');
    },

    /* ---------- Tabs sederhana ----------
       container berisi .tab[data-tab] dan panel [data-panel]; cb(tabId) opsional */
    tabs(root, cb) {
      const tabs = [...root.querySelectorAll('[role="tab"]')];
      const select = (t, focus) => {
        tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; });
        root.querySelectorAll('[role="tabpanel"]').forEach(p => { p.hidden = p.id !== t.getAttribute('aria-controls'); });
        if (focus) t.focus();
        cb && cb(t.dataset.tab);
      };
      tabs.forEach((t, i) => {
        t.addEventListener('click', () => select(t));
        t.addEventListener('keydown', e => {
          const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
          if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
        });
      });
    },
  };

  K.ui = ui;
})(window.K);
