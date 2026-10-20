/* ==========================================================================
   K.app — shell aplikasi: navigasi, router hash, tema, sidebar,
   command palette, notifikasi topbar.
   Halaman didaftarkan di assets/js/pages/*.js lewat K.page(id, def).
   ========================================================================== */
(function (K) {
  'use strict';
  const { esc, $ } = K.util;
  const { icon } = K.ui;
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* abaikan */ } },
  };
  K.prefs = LS;

  /* ---------- Konfigurasi navigasi (satu sumber untuk sidebar, breadcrumb, cmd palette) ----------
     `perm` = izin yang dibutuhkan untuk MELIHAT menu. Ini hanya penyaringan UI;
     otorisasi sesungguhnya wajib divalidasi di server untuk setiap route/API. */
  K.nav = [
    { group: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', icon: 'layout-grid', perm: 'dashboard.view' }] },
    { group: 'Workspace', items: [
      { id: 'analytics', label: 'Analytics', icon: 'chart-column', perm: 'analytics.view' },
      { id: 'reports', label: 'Reports', icon: 'file-chart-column', perm: 'reports.view' },
      { id: 'activity', label: 'Activity Log', icon: 'activity', perm: 'dashboard.view' },
    ] },
    { group: 'Management', items: [
      { id: 'users', label: 'Users', icon: 'user', perm: 'users.view' },
      { id: 'teams', label: 'Teams', icon: 'users', perm: 'teams.view' },
      { id: 'organizations', label: 'Organizations', icon: 'building-2', perm: 'organizations.view' },
      { id: 'roles', label: 'Roles & Permissions', icon: 'shield-check', perm: 'roles.view' },
    ] },
    { group: 'Content', items: [
      { id: 'pages', label: 'Pages', icon: 'file-text', perm: 'content.view' },
      { id: 'media', label: 'Media Library', icon: 'image', perm: 'content.view' },
      { id: 'categories', label: 'Categories', icon: 'folder', perm: 'content.view' },
      { id: 'tags', label: 'Tags', icon: 'tag', perm: 'content.view' },
    ] },
    { group: 'Applications', items: [
      { id: 'applications', label: 'Applications', icon: 'app-window', perm: 'applications.view' },
      { id: 'integrations', label: 'Integrations', icon: 'plug', perm: 'integrations.view' },
      { id: 'api', label: 'API Management', icon: 'code-xml', perm: 'api.view' },
      { id: 'webhooks', label: 'Webhooks', icon: 'webhook', perm: 'integrations.view' },
    ] },
    { group: 'System', items: [
      { id: 'notifications', label: 'Notifications', icon: 'bell', perm: 'dashboard.view', badge: () => K.store.count('notifications', n => !n.read), badgeTone: 'primary' },
      { id: 'tasks', label: 'Tasks & Jobs', icon: 'clipboard-check', perm: 'system.view', badge: () => K.store.count('tasks', t => ['running', 'queued'].includes(t.status)) },
      { id: 'audit', label: 'Audit Logs', icon: 'file-search', perm: 'audit.view' },
      { id: 'health', label: 'System Health', icon: 'monitor-cog', perm: 'system.view' },
    ] },
    { group: 'Preferences', items: [
      { id: 'settings', label: 'General Settings', icon: 'settings', perm: 'settings.view' },
      { id: 'appearance', label: 'Appearance', icon: 'palette', perm: 'dashboard.view' },
      { id: 'localization', label: 'Localization', icon: 'languages', perm: 'settings.view' },
      { id: 'security', label: 'Security Settings', icon: 'lock-keyhole', perm: 'settings.view' },
    ] },
    { group: 'Support', items: [
      { id: 'help', label: 'Help Center', icon: 'life-buoy', perm: 'dashboard.view' },
      { id: 'docs', label: 'Documentation', icon: 'book-open', perm: 'dashboard.view' },
      { id: 'feedback', label: 'Feedback', icon: 'message-square', perm: 'dashboard.view' },
    ] },
  ];
  /** Route tambahan di luar sidebar (menu akun). */
  const extraRoutes = [
    { id: 'profile', label: 'User Profile', icon: 'circle-user', group: 'Akun' },
    { id: 'account', label: 'Account Settings', icon: 'user-cog', group: 'Akun' },
    { id: 'billing', label: 'Upgrade Plan', icon: 'sparkles', group: 'Akun' },
  ];
  const navIndex = new Map();
  K.nav.forEach(g => g.items.forEach(it => navIndex.set(it.id, { ...it, group: g.group })));
  extraRoutes.forEach(r => navIndex.set(r.id, r));

  /* ---------- Pengguna aktif & izin ---------- */
  K.currentUser = () => K.store.get('users', 'usr_me');
  K.can = perm => {
    const u = K.currentUser();
    const role = u && K.store.get('roles', u.roleId);
    return !!role && role.permissions.includes(perm);
  };

  /* ---------- Registry halaman ---------- */
  const pages = new Map();
  K.page = (id, def) => pages.set(id, def);

  /* ---------- Tema ---------- */
  const mq = matchMedia('(prefers-color-scheme: dark)');
  K.theme = {
    pref() { return LS.get('kontrol:theme', 'system'); },
    resolved() { const p = K.theme.pref(); return p === 'system' ? (mq.matches ? 'dark' : 'light') : p; },
    set(pref) { LS.set('kontrol:theme', pref); K.theme.apply(true); },
    toggle() { K.theme.set(K.theme.resolved() === 'dark' ? 'light' : 'dark'); },
    apply(rerender) {
      const t = K.theme.resolved();
      document.documentElement.dataset.theme = t;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#111827' : '#FFFFFF');
      const btn = $('#theme-toggle');
      if (btn) {
        btn.innerHTML = icon(t === 'dark' ? 'sun' : 'moon');
        btn.setAttribute('aria-label', t === 'dark' ? 'Gunakan tema terang' : 'Gunakan tema gelap');
        btn.title = btn.getAttribute('aria-label');
      }
      K.charts.refreshTheme();
      if (rerender && K.charts.hasAny()) router.render(); // grafik perlu warna baru
      document.dispatchEvent(new CustomEvent('k:theme', { detail: t }));
    },
  };
  mq.addEventListener('change', () => { if (K.theme.pref() === 'system') K.theme.apply(true); });

  /* ---------- Sidebar ---------- */
  function renderSidebar() {
    const open = LS.get('kontrol:navgroups', {});
    $('#sidebar-nav').innerHTML = K.nav.map(g => {
      const items = g.items.filter(it => !it.perm || K.can(it.perm));
      if (!items.length) return '';
      const isOpen = open[g.group] !== false;
      const head = g.group === 'Overview'
        ? `<p class="nav-group__head">${esc(g.group)}</p>`
        : `<button type="button" class="nav-group__head" data-group-toggle="${esc(g.group)}" aria-expanded="${isOpen}">${esc(g.group)}${icon('chevron-down')}</button>`;
      return `<section class="nav-group" data-open="${isOpen}" aria-label="${esc(g.group)}">${head}
        <div class="nav-group__items">${items.map(it => {
          const b = it.badge ? it.badge() : 0;
          return `<a href="#/${it.id}" class="nav-link" data-nav="${it.id}" data-tip="${esc(it.label)}${b ? ' · ' + b : ''}">${icon(it.icon)}<span class="nav-link__label">${esc(it.label)}</span>${b ? `<span class="nav-link__badge ${it.badgeTone === 'primary' ? 'nav-link__badge--primary' : ''}">${b}</span><span class="nav-link__dot" aria-hidden="true"></span>` : ''}</a>`;
        }).join('')}</div></section>`;
    }).join('');
    markActive();
  }

  function markActive() {
    const id = router.current?.id;
    document.querySelectorAll('[data-nav]').forEach(a => {
      if (a.dataset.nav === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  function setupSidebar() {
    const app = $('#app');
    app.dataset.sidebar = LS.get('kontrol:sidebar', 'expanded');
    const syncToggle = () => {
      const collapsed = app.dataset.sidebar === 'collapsed';
      const b = $('#sidebar-toggle');
      b.innerHTML = icon(collapsed ? 'panel-left-open' : 'panel-left-close');
      b.setAttribute('aria-label', collapsed ? 'Buka sidebar' : 'Ciutkan sidebar');
      b.setAttribute('aria-expanded', String(!collapsed));
      b.title = b.getAttribute('aria-label');
    };
    syncToggle();
    $('#sidebar-toggle').addEventListener('click', () => {
      app.dataset.sidebar = app.dataset.sidebar === 'collapsed' ? 'expanded' : 'collapsed';
      LS.set('kontrol:sidebar', app.dataset.sidebar);
      syncToggle(); hideTip();
      window.dispatchEvent(new Event('resize')); // supaya chart menyesuaikan lebar
    });

    // Drawer mobile
    const openDrawer = () => { app.classList.add('drawer-open'); document.body.classList.add('no-scroll'); $('#drawer-open').setAttribute('aria-expanded', 'true'); setTimeout(() => $('#drawer-close').focus(), 50); };
    const closeDrawer = (focusBack = true) => {
      if (!app.classList.contains('drawer-open')) return;
      app.classList.remove('drawer-open'); document.body.classList.remove('no-scroll');
      $('#drawer-open').setAttribute('aria-expanded', 'false'); if (focusBack) $('#drawer-open').focus();
    };
    K.closeDrawer = closeDrawer;
    $('#drawer-open').addEventListener('click', openDrawer);
    $('#drawer-close').addEventListener('click', () => closeDrawer());
    $('#drawer-overlay').addEventListener('click', () => closeDrawer());
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && app.classList.contains('drawer-open')) closeDrawer(); });
    matchMedia('(min-width: 1024px)').addEventListener('change', e => { if (e.matches) closeDrawer(false); });

    // Grup nav dapat dilipat
    $('#sidebar-nav').addEventListener('click', e => {
      const t = e.target.closest('[data-group-toggle]');
      if (!t) return;
      const sec = t.closest('.nav-group');
      const isOpen = sec.dataset.open !== 'true';
      sec.dataset.open = isOpen; t.setAttribute('aria-expanded', isOpen);
      const state = LS.get('kontrol:navgroups', {}); state[t.dataset.groupToggle] = isOpen; LS.set('kontrol:navgroups', state);
    });

    // Tooltip saat sidebar diciutkan
    const tip = $('#nav-tooltip');
    const showTip = el => {
      if (app.dataset.sidebar !== 'collapsed' || innerWidth < 1024) return;
      const r = el.getBoundingClientRect();
      tip.textContent = el.dataset.tip || el.getAttribute('aria-label') || '';
      tip.style.left = r.right + 10 + 'px';
      tip.style.top = r.top + r.height / 2 - 15 + 'px';
      tip.classList.add('is-visible');
    };
    function hideTip() { tip.classList.remove('is-visible'); }
    const sidebar = $('#sidebar');
    sidebar.addEventListener('mouseover', e => { const el = e.target.closest('[data-tip]'); el ? showTip(el) : hideTip(); });
    sidebar.addEventListener('mouseleave', hideTip);
    sidebar.addEventListener('focusin', e => { const el = e.target.closest('[data-tip]'); el && showTip(el); });
    sidebar.addEventListener('focusout', hideTip);
    $('#sidebar-nav').addEventListener('scroll', hideTip, { passive: true });
  }

  /* ---------- Notifikasi topbar ---------- */
  function renderNotifMenu() {
    const list = K.store.all('notifications');
    const unread = list.filter(n => !n.read).length;
    $('#notif-dot').hidden = !unread;
    $('#notif-toggle').setAttribute('aria-label', `Notifikasi: ${unread} belum dibaca`);
    const typeIcon = { report: 'file-chart-column', user: 'user-plus', system: 'refresh-cw', security: 'shield-check', alert: 'triangle-alert', content: 'message-square', billing: 'receipt' };
    $('#notif-menu').innerHTML = `
      <div class="notif-menu__head"><p class="fw-600">Notifikasi ${unread ? `<span class="text-primary text-xs" style="margin-left:4px">${unread} baru</span>` : ''}</p>
        <button type="button" class="btn btn-ghost btn-sm" data-mark-all ${unread ? '' : 'disabled'}>Tandai dibaca</button></div>
      <div class="notif-menu__list">${list.slice(0, 6).map(n => `
        <a href="#/notifications" class="menu__item" style="align-items:flex-start;padding:12px 16px;min-height:0;border-radius:0;gap:12px">
          <span class="icon-tile" style="width:32px;height:32px">${icon(typeIcon[n.type] || 'bell')}</span>
          <span class="flex-1"><span class="fw-500" style="display:block;color:var(--text-strong)">${esc(n.title)}</span><span class="text-xs text-secondary" style="display:block;margin-top:2px">${esc(K.util.ago(n.createdAt))}</span></span>
          ${n.read ? '' : '<span style="width:7px;height:7px;border-radius:50%;background:var(--primary);margin-top:6px;flex-shrink:0" aria-label="Belum dibaca"></span>'}
        </a>`).join('')}</div>
      <div class="notif-menu__foot"><a href="#/notifications" class="btn btn-ghost btn-sm btn-block">Lihat semua notifikasi</a></div>`;
  }

  /* ---------- Command palette (Ctrl/⌘ + K) ---------- */
  function commands() {
    const nav = [...navIndex.values()].filter(n => !n.perm || K.can(n.perm)).map(n => ({ group: 'Navigasi', label: n.label, icon: n.icon, hint: n.group, run: () => router.go(n.id) }));
    const actions = [
      { group: 'Aksi cepat', label: 'Undang pengguna baru', icon: 'user-plus', run: () => router.go('users', { action: 'new' }) },
      { group: 'Aksi cepat', label: 'Buat halaman baru', icon: 'file-plus', run: () => router.go('pages', { action: 'new' }) },
      { group: 'Aksi cepat', label: 'Buat API key', icon: 'key-round', run: () => router.go('api', { action: 'new' }) },
      { group: 'Aksi cepat', label: 'Tambah webhook', icon: 'webhook', run: () => router.go('webhooks', { action: 'new' }) },
      { group: 'Aksi cepat', label: 'Kirim feedback', icon: 'message-square-plus', run: () => router.go('feedback') },
      { group: 'Preferensi', label: 'Ganti tema terang/gelap', icon: 'sun-moon', run: () => K.theme.toggle() },
      { group: 'Preferensi', label: 'Ciutkan / buka sidebar', icon: 'panel-left', run: () => $('#sidebar-toggle').click() },
    ];
    return [...nav, ...actions];
  }

  function openPalette() {
    if (document.querySelector('.cmdk[open]')) return;
    const all = commands();
    let filtered = all, active = 0;
    const m = K.ui.modal({
      title: 'Pencarian', hideFooter: true,
      body: '<div data-results role="listbox" aria-label="Hasil pencarian"></div>',
    });
    const dlg = m.dialog;
    dlg.classList.add('cmdk');
    dlg.querySelector('.modal__head').outerHTML = `<div class="cmdk__input-wrap">${icon('search')}<input class="cmdk__input" type="text" placeholder="Cari halaman atau aksi…" aria-label="Cari halaman atau aksi" role="combobox" aria-expanded="true" aria-controls="cmdk-list" autocomplete="off"><kbd>Esc</kbd></div>`;
    const input = dlg.querySelector('.cmdk__input');
    const box = dlg.querySelector('[data-results]'); box.id = 'cmdk-list';
    const draw = () => {
      let lastGroup = '';
      box.innerHTML = filtered.length ? filtered.map((c, i) => {
        const g = c.group !== lastGroup ? `<p class="cmdk__group">${esc(c.group)}</p>` : ''; lastGroup = c.group;
        return `${g}<button type="button" class="cmdk__item" role="option" id="cmdk-${i}" data-i="${i}" aria-selected="${i === active}">${icon(c.icon)}<span>${esc(c.label)}</span>${c.hint ? `<small>${esc(c.hint)}</small>` : ''}</button>`;
      }).join('') : K.ui.empty({ icon: 'search-x', title: 'Tidak ditemukan', text: 'Coba kata kunci lain.' });
      input.setAttribute('aria-activedescendant', filtered.length ? 'cmdk-' + active : '');
      box.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
    };
    const run = i => { const c = filtered[i]; if (!c) return; m.close(); setTimeout(c.run, 60); };
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim();
      filtered = q ? all.filter(c => (c.label + ' ' + (c.hint || '') + ' ' + c.group).toLowerCase().includes(q)) : all;
      active = 0; draw();
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(filtered.length - 1, active + 1); draw(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(0, active - 1); draw(); }
      if (e.key === 'Enter') { e.preventDefault(); run(active); }
    });
    box.addEventListener('click', e => { const b = e.target.closest('[data-i]'); b && run(Number(b.dataset.i)); });
    draw(); input.focus();
  }
  K.openPalette = openPalette;

  /* ---------- Router (hash) ----------
     URL: #/users  atau  #/users?action=new  */
  const router = {
    current: null,
    cleanup: null,
    parse() {
      const raw = location.hash.replace(/^#\/?/, '') || 'dashboard';
      const [path, qs] = raw.split('?');
      const [id, ...rest] = path.split('/');
      return { id, params: rest, query: Object.fromEntries(new URLSearchParams(qs || '')) };
    },
    go(id, query) {
      const qs = query ? '?' + new URLSearchParams(query).toString() : '';
      const target = '#/' + id + qs;
      if (location.hash === target) router.render(); else location.hash = target;
    },
    render(focus = false) {
      const route = router.parse();
      // Ganti elemen view dengan salinan bersih agar event listener halaman sebelumnya ikut terbuang
      const old = $('#view');
      const view = old.cloneNode(false);
      old.replaceWith(view);
      K.charts.destroyAll();
      if (typeof router.cleanup === 'function') { try { router.cleanup(); } catch (e) { console.error(e); } }
      router.cleanup = null;

      let def = pages.get(route.id);
      const meta = navIndex.get(route.id);
      if (def && meta?.perm && !K.can(meta.perm)) def = pages.get('403');
      if (!def) def = pages.get('404');
      router.current = { ...route, meta };

      // Breadcrumb + judul dokumen
      $('#crumb-parent').textContent = meta ? meta.group : 'Kontrol';
      $('#crumb-current').textContent = meta ? meta.label : 'Tidak ditemukan';
      document.title = (meta ? meta.label : 'Tidak ditemukan') + ' · Kontrol';

      view.classList.add('view-enter');
      try {
        router.cleanup = def.render(view, route) || null;
      } catch (err) {
        console.error(err);
        view.innerHTML = K.ui.empty({ icon: 'bug', title: 'Terjadi kesalahan saat memuat halaman', text: String(err.message || err) });
      }
      markActive();
      K.closeDrawer && K.closeDrawer(false);
      if (focus) { window.scrollTo({ top: 0 }); $('#page-title')?.focus({ preventScroll: true }); }
    },
  };
  K.router = router;

  /* ---------- Boot ---------- */
  function boot() {
    K.theme.apply(false);
    document.documentElement.dataset.density = LS.get('kontrol:density', 'default');
    K.ui.initMenus();
    setupSidebar();
    renderSidebar();
    renderNotifMenu();

    const me = K.currentUser();
    document.querySelectorAll('[data-me-name]').forEach(el => el.textContent = me.name);
    document.querySelectorAll('[data-me-email]').forEach(el => el.textContent = me.email);
    document.querySelectorAll('[data-me-role]').forEach(el => el.textContent = K.lookup.role(me.roleId).name);
    document.querySelectorAll('[data-me-avatar]').forEach(el => { el.textContent = K.util.initials(me.name); el.dataset.c = 'blue'; });

    // Ikon statis di shell
    document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });

    $('#theme-toggle').addEventListener('click', () => K.theme.toggle());
    $('#search-trigger').addEventListener('click', openPalette);
    $('#notif-menu').addEventListener('click', e => {
      if (e.target.closest('[data-mark-all]')) {
        K.store.updateWhere('notifications', () => true, { read: true });
        K.ui.toast('Semua notifikasi ditandai dibaca');
      }
    });
    document.addEventListener('click', e => {
      if (e.target.closest('[data-signout]')) {
        e.preventDefault();
        K.ui.confirm({ title: 'Keluar dari Kontrol?', text: 'Sesi Anda di perangkat ini akan diakhiri.', confirmLabel: 'Keluar', danger: false })
          .then(ok => { if (ok) location.href = 'login.html'; });
      }
    });
    document.addEventListener('keydown', e => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); openPalette(); }
      else if (e.key === '/' && !typing && !document.querySelector('dialog[open]')) { e.preventDefault(); openPalette(); }
    });

    // Sinkronkan badge & notifikasi saat data berubah
    K.store.on('change', ({ collection }) => {
      if (['notifications', 'tasks', '*'].includes(collection)) { renderSidebar(); renderNotifMenu(); }
      if (collection === 'roles' || collection === 'users' || collection === '*') renderSidebar();
    });

    window.addEventListener('hashchange', () => router.render(true));
    router.render(false);
    document.documentElement.classList.remove('is-loading');
  }

  K.boot = boot;
})(window.K);
