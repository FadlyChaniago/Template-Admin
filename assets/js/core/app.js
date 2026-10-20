/* ==========================================================================
   K.app — shell aplikasi: navigasi, router hash, tema, sidebar, izin,
   favorit & riwayat, command palette (+ pencarian data), pintasan keyboard,
   banner offline & pratinjau peran.
   Halaman didaftarkan di assets/js/pages/*.js lewat K.page(id, def).
   ========================================================================== */
(function (K) {
  'use strict';
  const { esc, $ } = K.util;
  const { icon } = K.ui;
  const t = (k, v) => K.t(k, v);
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* abaikan */ } },
  };
  K.prefs = LS;

  /* ---------- Konfigurasi navigasi (satu sumber untuk sidebar, topnav, breadcrumb, palette) ----------
     `perm` = izin untuk MELIHAT menu. Ini hanya penyaringan UI; otorisasi sesungguhnya
     wajib divalidasi di server untuk setiap route & endpoint. Label diterjemahkan lewat
     kunci i18n `nav.<id>` (fallback ke `label`). */
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
    { group: 'Tools', items: [
      { id: 'kanban', label: 'Kanban Board', icon: 'square-kanban', perm: 'dashboard.view' },
      { id: 'calendar', label: 'Calendar', icon: 'calendar-days', perm: 'dashboard.view' },
      { id: 'inbox', label: 'Inbox', icon: 'inbox', perm: 'dashboard.view', badge: () => K.store.all('conversations').reduce((s, c) => s + (c.unread || 0), 0), badgeTone: 'primary' },
      { id: 'approvals', label: 'Approvals', icon: 'stamp', perm: 'dashboard.view', badge: () => K.approvals ? K.approvals.waitingFor('usr_me').length : 0, badgeTone: 'primary' },
      { id: 'maps', label: 'Maps', icon: 'map', perm: 'dashboard.view' },
      { id: 'import', label: 'Import Center', icon: 'file-up', perm: 'users.create' },
      { id: 'invoices', label: 'Invoices', icon: 'receipt-text', perm: 'billing.view' },
    ] },
    { group: 'System', items: [
      { id: 'notifications', label: 'Notifications', icon: 'bell', perm: 'dashboard.view', badge: () => K.store.count('notifications', n => !n.read), badgeTone: 'primary' },
      { id: 'tasks', label: 'Tasks & Jobs', icon: 'clipboard-check', perm: 'system.view', badge: () => K.store.count('tasks', x => ['running', 'queued'].includes(x.status)) },
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
    { group: 'UI Kit', items: [
      { id: 'ui-forms', label: 'Forms & Wizard', icon: 'square-pen', perm: 'dashboard.view' },
      { id: 'ui-toasts', label: 'Toasts & Alerts', icon: 'bell-ring', perm: 'dashboard.view' },
      { id: 'ui-overlays', label: 'Modals & Drawers', icon: 'panel-right', perm: 'dashboard.view' },
      { id: 'ui-states', label: 'Empty & Loading', icon: 'loader', perm: 'dashboard.view' },
      { id: 'ui-timeline', label: 'Timeline & Stepper', icon: 'git-commit-vertical', perm: 'dashboard.view' },
      { id: 'ui-icons', label: 'Icons', icon: 'shapes', perm: 'dashboard.view' },
      { id: 'ui-charts', label: 'Charts', icon: 'chart-pie', perm: 'dashboard.view' },
      { id: 'ui-tables', label: 'Tables & Pagination', icon: 'table', perm: 'dashboard.view' },
      { id: 'ui-errors', label: 'Error Pages', icon: 'octagon-x', perm: 'dashboard.view' },
      { id: 'ui-auth', label: 'Auth Pages', icon: 'key-round', perm: 'dashboard.view' },
      { id: 'example', label: 'Starter CRUD', icon: 'blocks', perm: 'dashboard.view' },
    ] },
  ];
  /** Route tambahan di luar sidebar (menu akun & pratinjau error). */
  const extraRoutes = [
    { id: 'profile', label: 'User Profile', icon: 'circle-user', group: 'Akun' },
    { id: 'account', label: 'Account Settings', icon: 'user-cog', group: 'Akun' },
    { id: 'billing', label: 'Upgrade Plan', icon: 'sparkles', group: 'Akun' },
    { id: 'error', label: 'Pratinjau error', icon: 'octagon-x', group: 'UI Kit' },
  ];
  const navIndex = new Map();
  K.nav.forEach(g => g.items.forEach(it => navIndex.set(it.id, { ...it, group: g.group })));
  extraRoutes.forEach(r => navIndex.set(r.id, r));
  const label = it => { const k = 'nav.' + it.id; const v = t(k); return v === k ? it.label : v; };
  const groupLabel = g => { const k = 'nav.group.' + g; const v = t(k); return v === k ? g : v; };
  K.navLabel = id => (navIndex.get(id) ? label(navIndex.get(id)) : id);

  /* ---------- Pengguna aktif, izin & pratinjau peran ----------
     K.viewAs (sessionStorage) memungkinkan admin melihat UI sebagai peran lain
     untuk menguji izin — tanpa mengubah data. */
  K.currentUser = () => K.store.get('users', 'usr_me');
  K.viewAs = {
    get() { try { return sessionStorage.getItem('kontrol:viewAs'); } catch { return null; } },
    set(roleId) { try { roleId ? sessionStorage.setItem('kontrol:viewAs', roleId) : sessionStorage.removeItem('kontrol:viewAs'); } catch { /* abaikan */ } refreshShell(); router.go('dashboard'); },
  };
  K.can = perm => {
    const roleId = K.viewAs.get() || K.currentUser()?.roleId;
    const role = roleId && K.store.get('roles', roleId);
    return !!role && role.permissions.includes(perm);
  };
  /** Permission guard deklaratif: <button data-perm="users.delete" data-perm-mode="disable">.
      Mode default "hide" (elemen dihapus). Dipanggil otomatis setelah setiap render. */
  K.applyPerms = (root = document) => {
    root.querySelectorAll('[data-perm]').forEach(el => {
      if (K.can(el.dataset.perm)) return;
      if (el.dataset.permMode === 'disable') {
        el.setAttribute('disabled', ''); el.setAttribute('aria-disabled', 'true');
        el.title = 'Anda tidak memiliki izin: ' + el.dataset.perm;
        if (el.tagName === 'A') { el.removeAttribute('href'); el.classList.add('is-disabled'); }
      } else el.remove();
    });
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
      const th = K.theme.resolved();
      document.documentElement.dataset.theme = th;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', th === 'dark' ? '#111827' : '#FFFFFF');
      const btn = $('#theme-toggle');
      if (btn) {
        btn.innerHTML = icon(th === 'dark' ? 'sun' : 'moon');
        btn.setAttribute('aria-label', t(th === 'dark' ? 'shell.themeLight' : 'shell.themeDark'));
        btn.title = btn.getAttribute('aria-label');
      }
      K.charts.refreshTheme();
      if (rerender && K.charts.hasAny()) router.render(); // grafik perlu warna baru
      document.dispatchEvent(new CustomEvent('k:theme', { detail: th }));
    },
  };
  mq.addEventListener('change', () => { if (K.theme.pref() === 'system') K.theme.apply(true); });

  /* ---------- Favorit & riwayat ---------- */
  K.favorites = {
    list() { return LS.get('kontrol:favs', []).filter(id => navIndex.has(id)); },
    has(id) { return K.favorites.list().includes(id); },
    toggle(id) {
      const f = K.favorites.list(); const on = !f.includes(id);
      LS.set('kontrol:favs', on ? [...f, id] : f.filter(x => x !== id));
      K.ui.toast(t(on ? 'shell.pinned' : 'shell.unpinned'), K.navLabel(id), 'success', 1600);
      renderSidebar(); syncPin();
    },
  };
  const recent = {
    list() { return LS.get('kontrol:recent', []).filter(id => navIndex.has(id)); },
    push(id) { if (!navIndex.has(id) || id === 'error') return; LS.set('kontrol:recent', [id, ...recent.list().filter(x => x !== id)].slice(0, 8)); },
  };

  /* ---------- Sidebar ---------- */
  function navLink(it) {
    const b = it.badge ? it.badge() : 0;
    const l = label(it);
    return `<a href="#/${it.id}" class="nav-link" data-nav="${it.id}" data-tip="${esc(l)}${b ? ' · ' + b : ''}">${icon(it.icon)}<span class="nav-link__label">${esc(l)}</span>${b ? `<span class="nav-link__badge ${it.badgeTone === 'primary' ? 'nav-link__badge--primary' : ''}">${b}</span><span class="nav-link__dot" aria-hidden="true"></span>` : ''}</a>`;
  }
  function renderSidebar() {
    const open = LS.get('kontrol:navgroups', {});
    const favs = K.favorites.list().map(id => navIndex.get(id)).filter(it => !it.perm || K.can(it.perm));
    const favHtml = favs.length ? `<section class="nav-group nav-group--fav" data-open="true" aria-label="${esc(groupLabel('Favorit'))}"><p class="nav-group__head">${icon('star', 'i-12')} ${esc(groupLabel('Favorit'))}</p><div class="nav-group__items">${favs.map(navLink).join('')}</div></section>` : '';
    $('#sidebar-nav').innerHTML = favHtml + K.nav.map(g => {
      const items = g.items.filter(it => !it.perm || K.can(it.perm));
      if (!items.length) return '';
      const isOpen = open[g.group] !== false;
      const gl = groupLabel(g.group);
      const head = g.group === 'Overview'
        ? `<p class="nav-group__head">${esc(gl)}</p>`
        : `<button type="button" class="nav-group__head" data-group-toggle="${esc(g.group)}" aria-expanded="${isOpen}">${esc(gl)}${icon('chevron-down')}</button>`;
      return `<section class="nav-group" data-open="${isOpen}" aria-label="${esc(gl)}">${head}<div class="nav-group__items">${items.map(navLink).join('')}</div></section>`;
    }).join('');
    markActive();
  }

  /* ---------- Navigasi atas (layout "topnav") ---------- */
  const groupIcon = { Tools: 'square-kanban', Workspace: 'chart-column', Management: 'users', Content: 'file-text', Applications: 'app-window', System: 'server', Preferences: 'settings', Support: 'life-buoy', 'UI Kit': 'shapes' };
  function renderTopnav() {
    const el = $('#topnav-list'); if (!el) return;
    el.innerHTML = K.nav.map(g => {
      const items = g.items.filter(it => !it.perm || K.can(it.perm));
      if (!items.length) return '';
      if (items.length === 1) { const it = items[0]; return `<li><a href="#/${it.id}" class="topnav__link" data-nav="${it.id}">${icon(it.icon)}<span>${esc(label(it))}</span></a></li>`; }
      return `<li class="menu-anchor"><button type="button" class="topnav__link" data-menu-toggle aria-expanded="false" aria-haspopup="true" data-group="${esc(g.group)}">${icon(groupIcon[g.group] || 'folder')}<span>${esc(groupLabel(g.group))}</span>${icon('chevron-down', 'topnav__caret')}</button>
        <div class="menu menu--left topnav__menu">${items.map(it => { const b = it.badge ? it.badge() : 0; return `<a href="#/${it.id}" class="menu__item" data-nav="${it.id}">${icon(it.icon)}<span class="flex-1">${esc(label(it))}</span>${b ? `<span class="nav-link__badge">${b}</span>` : ''}</a>`; }).join('')}</div></li>`;
    }).join('');
    markActive();
  }

  K.layout = {
    get() { return LS.get('kontrol:layout', 'sidebar'); },
    set(v) { LS.set('kontrol:layout', v); document.documentElement.dataset.layout = v; document.querySelectorAll('.menu.is-open').forEach(m => K.ui.closeMenu(m)); window.dispatchEvent(new Event('resize')); },
  };

  function markActive() {
    const id = router.current?.id;
    document.querySelectorAll('[data-nav]').forEach(a => { a.dataset.nav === id ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
    const grp = router.current?.meta?.group;
    document.querySelectorAll('#topnav [data-group]').forEach(b => b.classList.toggle('is-active', b.dataset.group === grp));
  }

  function setupSidebar() {
    const app = $('#app');
    app.dataset.sidebar = LS.get('kontrol:sidebar', 'expanded');
    const syncToggle = () => {
      const collapsed = app.dataset.sidebar === 'collapsed';
      const b = $('#sidebar-toggle');
      b.innerHTML = icon(collapsed ? 'panel-left-open' : 'panel-left-close');
      b.setAttribute('aria-label', t(collapsed ? 'shell.expand' : 'shell.collapse'));
      b.setAttribute('aria-expanded', String(!collapsed));
      b.title = b.getAttribute('aria-label');
    };
    K.toggleSidebar = () => { app.dataset.sidebar = app.dataset.sidebar === 'collapsed' ? 'expanded' : 'collapsed'; LS.set('kontrol:sidebar', app.dataset.sidebar); syncToggle(); hideTip(); window.dispatchEvent(new Event('resize')); };
    K.syncSidebarToggle = syncToggle;
    syncToggle();
    $('#sidebar-toggle').addEventListener('click', K.toggleSidebar);

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

    $('#sidebar-nav').addEventListener('click', e => {
      const g = e.target.closest('[data-group-toggle]'); if (!g) return;
      const sec = g.closest('.nav-group');
      const isOpen = sec.dataset.open !== 'true';
      sec.dataset.open = isOpen; g.setAttribute('aria-expanded', isOpen);
      const state = LS.get('kontrol:navgroups', {}); state[g.dataset.groupToggle] = isOpen; LS.set('kontrol:navgroups', state);
    });

    // Tooltip saat sidebar diciutkan
    const tip = $('#nav-tooltip');
    const showTip = el => {
      if (app.dataset.sidebar !== 'collapsed' || innerWidth < 1024) return;
      const r = el.getBoundingClientRect();
      tip.textContent = el.dataset.tip || el.getAttribute('aria-label') || '';
      tip.style.left = r.right + 10 + 'px'; tip.style.top = r.top + r.height / 2 - 15 + 'px';
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
    $('#notif-toggle').setAttribute('aria-label', `${t('shell.notifications')}: ${unread}`);
    const typeIcon = { report: 'file-chart-column', user: 'user-plus', system: 'refresh-cw', security: 'shield-check', alert: 'triangle-alert', content: 'message-square', billing: 'receipt' };
    $('#notif-menu').innerHTML = `
      <div class="notif-menu__head"><p class="fw-600">${esc(t('shell.notifications'))} ${unread ? `<span class="text-primary text-xs" style="margin-left:4px">${esc(t('shell.new', { n: unread }))}</span>` : ''}</p>
        <button type="button" class="btn btn-ghost btn-sm" data-mark-all ${unread ? '' : 'disabled'}>${esc(t('shell.markRead'))}</button></div>
      <div class="notif-menu__list">${list.slice(0, 6).map(n => `
        <a href="#/notifications" class="menu__item" style="align-items:flex-start;padding:12px 16px;min-height:0;border-radius:0;gap:12px">
          <span class="icon-tile" style="width:32px;height:32px">${icon(typeIcon[n.type] || 'bell')}</span>
          <span class="flex-1"><span class="fw-500" style="display:block;color:var(--text-strong)">${esc(n.title)}</span><span class="text-xs text-secondary" style="display:block;margin-top:2px">${esc(K.util.ago(n.createdAt))}</span></span>
          ${n.read ? '' : '<span style="width:7px;height:7px;border-radius:50%;background:var(--primary);margin-top:6px;flex-shrink:0" aria-hidden="true"></span>'}
        </a>`).join('')}</div>
      <div class="notif-menu__foot"><a href="#/notifications" class="btn btn-ghost btn-sm btn-block">${esc(t('shell.viewAll'))}</a></div>`;
  }

  /* ---------- Pencarian data global ----------
     Mode demo: mencari di K.store. Mode API: GET /search?q= (lihat K.api). */
  K.search = q => {
    q = String(q || '').toLowerCase().trim(); if (q.length < 2) return [];
    const S = K.store, hit = s => String(s || '').toLowerCase().includes(q), out = [];
    S.all('users').filter(u => hit(u.name) || hit(u.email)).slice(0, 5).forEach(u => out.push({ type: 'user', label: u.name, sub: u.email, icon: 'user', href: '#/users/' + u.id }));
    S.all('invoices').filter(i => hit(i.number) || hit(i.client)).slice(0, 4).forEach(i => out.push({ type: 'invoice', label: i.number, sub: i.client, icon: 'receipt-text', href: '#/invoices/' + i.id }));
    S.all('organizations').filter(o => hit(o.name) || hit(o.domain)).slice(0, 3).forEach(o => out.push({ type: 'org', label: o.name, sub: o.domain, icon: 'building-2', href: '#/organizations' }));
    S.all('pages').filter(p => hit(p.title)).slice(0, 3).forEach(p => out.push({ type: 'page', label: p.title, sub: p.slug, icon: 'file-text', href: '#/pages' }));
    S.all('kanban').filter(c => hit(c.title)).slice(0, 3).forEach(c => out.push({ type: 'task', label: c.title, sub: 'Kanban', icon: 'square-kanban', href: '#/kanban' }));
    (S.all('approvals') || []).filter(a => hit(a.title) || hit(a.code)).slice(0, 3).forEach(a => out.push({ type: 'approval', label: a.title, sub: a.code, icon: 'stamp', href: '#/approvals/' + a.id }));
    return out;
  };

  /* ---------- Command palette (Ctrl/⌘ + K) ---------- */
  function commands() {
    const nav = [...navIndex.values()].filter(n => n.id !== 'error' && (!n.perm || K.can(n.perm))).map(n => ({ group: t('palette.nav'), label: label(n), icon: n.icon, hint: groupLabel(n.group), run: () => router.go(n.id) }));
    const A = t('palette.actions'), P = t('palette.prefs');
    const actions = [
      { group: A, label: 'Undang pengguna baru', icon: 'user-plus', run: () => router.go('users/new'), perm: 'users.create' },
      { group: A, label: 'Buat invoice baru', icon: 'receipt-text', run: () => router.go('invoices/new'), perm: 'billing.update' },
      { group: A, label: 'Ajukan approval baru', icon: 'stamp', run: () => router.go('approvals/new') },
      { group: A, label: 'Buat halaman baru', icon: 'file-plus', run: () => router.go('pages', { action: 'new' }), perm: 'content.create' },
      { group: A, label: 'Buat API key', icon: 'key-round', run: () => router.go('api', { action: 'new' }), perm: 'api.create' },
      { group: A, label: 'Favoritkan halaman ini', icon: 'star', run: () => router.current && K.favorites.toggle(router.current.id) },
      { group: P, label: 'Ganti tema terang/gelap', icon: 'sun-moon', run: () => K.theme.toggle() },
      { group: P, label: 'Ciutkan / buka sidebar', icon: 'panel-left', run: () => K.toggleSidebar() },
      { group: P, label: 'Ganti layout: sidebar kiri ↔ navigasi atas', icon: 'layout-panel-top', run: () => K.layout.set(K.layout.get() === 'topnav' ? 'sidebar' : 'topnav') },
      { group: P, label: K.i18n.lang === 'en' ? 'Bahasa Indonesia' : 'Switch to English', icon: 'languages', run: () => K.i18n.set(K.i18n.lang === 'en' ? 'id' : 'en') },
      { group: P, label: t('shortcuts.title'), icon: 'keyboard', run: () => openShortcuts() },
    ].filter(a => !a.perm || K.can(a.perm));
    return [...nav, ...actions];
  }

  function openPalette() {
    if (document.querySelector('.cmdk[open]')) return;
    const all = commands();
    const recents = recent.list().filter(id => id !== router.current?.id).slice(0, 5).map(id => navIndex.get(id)).filter(n => !n.perm || K.can(n.perm))
      .map(n => ({ group: t('palette.recent'), label: label(n), icon: 'history', hint: groupLabel(n.group), run: () => router.go(n.id) }));
    let filtered = [...recents, ...all], active = 0, seq = 0;
    const m = K.ui.modal({ title: t('palette.title'), hideFooter: true, body: '<div data-results role="listbox" aria-label="Hasil"></div>' });
    const dlg = m.dialog;
    dlg.classList.add('cmdk');
    dlg.querySelector('.modal__head').outerHTML = `<div class="cmdk__input-wrap">${icon('search')}<input class="cmdk__input" type="text" placeholder="${esc(t('palette.placeholder'))}" aria-label="${esc(t('palette.placeholder'))}" role="combobox" aria-expanded="true" aria-controls="cmdk-list" autocomplete="off"><kbd>Esc</kbd></div>`;
    const input = dlg.querySelector('.cmdk__input');
    const box = dlg.querySelector('[data-results]'); box.id = 'cmdk-list';
    const draw = () => {
      let lastGroup = '';
      box.innerHTML = filtered.length ? filtered.map((c, i) => {
        const g = c.group !== lastGroup ? `<p class="cmdk__group">${esc(c.group)}</p>` : ''; lastGroup = c.group;
        return `${g}<button type="button" class="cmdk__item" role="option" id="cmdk-${i}" data-i="${i}" aria-selected="${i === active}">${icon(c.icon)}<span class="truncate">${esc(c.label)}</span>${c.hint ? `<small>${esc(c.hint)}</small>` : ''}</button>`;
      }).join('') : K.ui.empty({ icon: 'search-x', title: t('palette.empty'), text: t('palette.emptyText') });
      input.setAttribute('aria-activedescendant', filtered.length ? 'cmdk-' + active : '');
      box.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
    };
    const run = i => { const c = filtered[i]; if (!c) return; m.close(); setTimeout(c.run, 60); };
    const dataHits = async q => {
      // Mode API: endpoint /search; mode demo: K.search lokal (instan)
      const res = K.config.dataMode === 'api' ? (await K.api.get('/search', { query: { q }, handle: false }).catch(() => ({ data: [] }))).data : K.search(q);
      return (res || []).map(r => ({ group: t('palette.data'), label: r.label, icon: r.icon, hint: r.sub, run: () => { location.hash = r.href; } }));
    };
    // Filter perintah lokal sinkron (Enter langsung akurat); pencarian data di-debounce & ditaruh SETELAH hasil navigasi
    let base = filtered;
    const loadHits = K.util.debounce(async (q, my) => {
      const hits = await dataHits(q);
      if (my === seq && dlg.open && hits.length) { filtered = [...base, ...hits]; draw(); }
    }, 150);
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim(), my = ++seq;
      base = q ? all.filter(c => (c.label + ' ' + (c.hint || '') + ' ' + c.group).toLowerCase().includes(q)) : [...recents, ...all];
      filtered = base; active = 0; draw();
      if (q.length >= 2) loadHits(q, my);
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

  /* ---------- Modal pintasan keyboard (tekan ?) ---------- */
  function openShortcuts() {
    if (document.querySelector('dialog[open]')) return;
    const rows = [[['Ctrl', 'K'], 'shortcuts.palette'], [['/'], 'shortcuts.search'], [['?'], 'shortcuts.help'], [['['], 'shortcuts.sidebar'], [['T'], 'shortcuts.theme'],
      [['F'], 'shortcuts.pin'], [['G', 'D / U / I'], 'shortcuts.goto'], [['Esc'], 'shortcuts.esc'], [['←', '→'], 'shortcuts.tabs'], [['Alt', '← / →'], 'shortcuts.kanban']];
    K.ui.modal({ title: t('shortcuts.title'), size: 'sm', footer: `<button type="button" class="btn btn-secondary" data-dismiss>${esc(t('common.close'))}</button>`,
      body: `<dl class="shortcut-list">${rows.map(([keys, k]) => `<div><dt>${keys.map(x => `<kbd>${esc(x)}</kbd>`).join(' + ')}</dt><dd>${esc(t(k))}</dd></div>`).join('')}</dl>` });
  }
  K.openShortcuts = openShortcuts;

  /* ---------- Router (hash) — #/users, #/users/:id/edit, #/users?action=new ---------- */
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
      const old = $('#view');                 // ganti elemen view → listener halaman lama ikut terbuang
      const view = old.cloneNode(false);
      old.replaceWith(view);
      K.charts.destroyAll();
      if (typeof router.cleanup === 'function') { try { router.cleanup(); } catch (e) { console.error(e); } }
      router.cleanup = null;
      document.querySelectorAll('dialog[open]').forEach(d => d.close());

      let def = pages.get(route.id);
      const meta = navIndex.get(route.id);
      if (def && meta?.perm && !K.can(meta.perm)) def = pages.get('403');
      if (!def) def = pages.get('404');
      router.current = { ...route, meta };

      $('#crumb-parent').textContent = meta ? groupLabel(meta.group) : 'Kontrol';
      $('#crumb-current').textContent = meta ? label(meta) : '404';
      document.title = (meta ? label(meta) : '404') + ' · Kontrol';

      view.classList.add('view-enter');
      try { router.cleanup = def.render(view, route) || null; }
      catch (err) { console.error(err); view.innerHTML = K.ui.empty({ icon: 'bug', title: 'Terjadi kesalahan saat memuat halaman', text: String(err.message || err) }); }
      K.applyPerms(view);
      // Region yang bisa di-scroll harus bisa difokus keyboard (WCAG 2.1.1)
      view.querySelectorAll('.code:not([tabindex]), .htimeline:not([tabindex])').forEach(el => { el.tabIndex = 0; });
      if (meta && def !== pages.get('404') && def !== pages.get('403')) recent.push(route.id);
      syncPin();
      markActive();
      K.closeDrawer && K.closeDrawer(false);
      if (focus) { window.scrollTo({ top: 0 }); $('#page-title')?.focus({ preventScroll: true }); }
    },
  };
  K.router = router;
  /** Halaman detail boleh mengganti breadcrumb, mis. K.setCrumb('Users', 'Andi Pratama', '#/users'). */
  K.setCrumb = (parent, current, parentHref) => {
    const p = $('#crumb-parent');
    p.innerHTML = parentHref ? `<a href="${parentHref}" style="color:inherit">${esc(parent)}</a>` : esc(parent);
    $('#crumb-current').textContent = current;
    document.title = current + ' · Kontrol';
  };

  function syncPin() {
    const b = $('#pin-toggle'); if (!b) return;
    const id = router.current?.id, ok = id && navIndex.has(id) && id !== 'error';
    b.hidden = !ok; if (!ok) return;
    const on = K.favorites.has(id);
    b.innerHTML = icon(on ? 'star-off' : 'star'); b.classList.toggle('is-on', on);
    b.setAttribute('aria-label', t(on ? 'shell.unpin' : 'shell.pin')); b.title = b.getAttribute('aria-label');
    b.setAttribute('aria-pressed', on);
  }

  /* ---------- Banner: offline & pratinjau peran ---------- */
  function syncBanners() {
    const off = $('#offline-banner');
    off.hidden = navigator.onLine;
    off.querySelector('span').textContent = t('shell.offline');
    const va = K.viewAs.get(), vb = $('#viewas-banner');
    vb.hidden = !va;
    if (va) vb.querySelector('span').textContent = t('shell.viewAs', { role: K.lookup.role(va).name });
  }

  function refreshShell() {
    K.i18n.apply();
    K.syncSidebarToggle && K.syncSidebarToggle();
    renderSidebar(); renderTopnav(); renderNotifMenu(); syncBanners();
    const me = K.currentUser();
    document.querySelectorAll('[data-me-role]').forEach(el => { el.textContent = K.lookup.role(K.viewAs.get() || me.roleId).name; });
    K.theme.apply(false);
  }
  K.refreshShell = refreshShell;

  /* ---------- Boot ---------- */
  function boot() {
    K.i18n.apply();
    K.theme.apply(false);
    document.documentElement.dataset.density = LS.get('kontrol:density', 'default');
    K.ui.initMenus();
    document.documentElement.dataset.layout = K.layout.get();
    $('#toast-region').dataset.pos = LS.get('kontrol:toast-pos', 'bottom-right');
    setupSidebar();

    const me = K.currentUser();
    document.querySelectorAll('[data-me-name]').forEach(el => { el.textContent = me.name; });
    document.querySelectorAll('[data-me-email]').forEach(el => { el.textContent = me.email; });
    document.querySelectorAll('[data-me-avatar]').forEach(el => { el.textContent = K.util.initials(me.name); el.dataset.c = 'blue'; });
    document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
    refreshShell();

    $('#theme-toggle').addEventListener('click', () => K.theme.toggle());
    $('#search-trigger').addEventListener('click', openPalette);
    $('#pin-toggle').addEventListener('click', () => router.current && K.favorites.toggle(router.current.id));
    $('#viewas-exit').addEventListener('click', () => K.viewAs.set(null));
    $('#notif-menu').addEventListener('click', e => {
      if (e.target.closest('[data-mark-all]')) { K.store.updateWhere('notifications', () => true, { read: true }); K.ui.toast(t('shell.allRead')); }
    });
    document.addEventListener('click', e => {
      if (e.target.closest('[data-signout]')) {
        e.preventDefault();
        K.ui.confirm({ title: t('shell.signoutTitle'), text: t('shell.signoutText'), confirmLabel: t('shell.signoutConfirm'), danger: false })
          .then(ok => { if (ok) location.href = K.config.loginUrl; });
      }
    });

    // Pintasan keyboard global
    let gPending = 0;
    document.addEventListener('keydown', e => {
      const el = document.activeElement;
      const typing = /INPUT|TEXTAREA|SELECT/.test(el.tagName) || el.isContentEditable;
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); openPalette(); return; }
      if (typing || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('dialog[open]')) return;
      if (gPending && Date.now() - gPending < 1200) {
        const to = { d: 'dashboard', u: 'users', i: 'inbox', a: 'approvals', k: 'kanban' }[e.key.toLowerCase()];
        gPending = 0; if (to) { e.preventDefault(); router.go(to); } return;
      }
      if (e.key === '/') { e.preventDefault(); openPalette(); }
      else if (e.key === '?') { e.preventDefault(); openShortcuts(); }
      else if (e.key === '[') { e.preventDefault(); K.toggleSidebar(); }
      else if (e.key === 't' || e.key === 'T') { K.theme.toggle(); }
      else if (e.key === 'f' || e.key === 'F') { router.current && K.favorites.toggle(router.current.id); }
      else if (e.key === 'g' || e.key === 'G') { gPending = Date.now(); }
    });

    // Status koneksi
    window.addEventListener('offline', syncBanners);
    window.addEventListener('online', () => { syncBanners(); K.ui.toast(t('shell.online'), '', 'success', 2000); });

    // Bahasa berubah → render ulang shell & halaman aktif
    document.addEventListener('k:locale', () => { refreshShell(); router.render(); });

    K.store.on('change', ({ collection }) => {
      if (['notifications', 'tasks', 'conversations', 'approvals', '*'].includes(collection)) { renderSidebar(); renderTopnav(); renderNotifMenu(); }
      if (['roles', 'users', '*'].includes(collection)) { renderSidebar(); renderTopnav(); }
    });

    window.addEventListener('hashchange', () => router.render(true));
    router.render(false);
    K.session && K.session.start();
    document.documentElement.classList.remove('is-loading');
  }

  K.boot = boot;
})(window.K);
