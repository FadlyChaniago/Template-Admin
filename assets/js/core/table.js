/* ==========================================================================
   K.DataTable — tabel data reusable: cari, filter tab, filter select,
   sort, paginasi, pilih massal, aksi baris, ekspor CSV.

   Contoh:
     new K.DataTable(el, {
       title: 'Pengguna', rows: () => K.store.all('users'),
       columns: [{ key: 'name', label: 'Nama', sortable: true, render: r => … }],
       search: r => r.name + ' ' + r.email,
       tabs: { key: 'status', options: [['active','Aktif'], …] },
       selects: [{ key: 'roleId', label: 'Semua peran', options: [...] }],
       rowActions: r => '<button data-action="edit">…</button>',
       onAction: (action, row) => { … },
     });
   ========================================================================== */
(function (K) {
  'use strict';
  const { esc } = K.util;
  const { icon } = K.ui;

  class DataTable {
    constructor(root, opts) {
      this.root = root;
      this.o = Object.assign({ pageSize: 8, selectable: false, exportName: null, searchPlaceholder: K.t('common.search') }, opts);
      this.state = { q: '', tab: 'all', selects: {}, sort: this.o.defaultSort || null, page: 1, selected: new Set() };
      this.root.classList.add('card', 'card--flush');
      this.mount();
      this.bind();
      this.update();
    }

    /* ---- Data pipeline: filter → sort → paginate ---- */
    filtered() {
      const { q, tab, selects } = this.state;
      let rows = this.o.rows();
      if (this.o.tabs && tab !== 'all') rows = rows.filter(r => (this.o.tabs.match ? this.o.tabs.match(r, tab) : String(r[this.o.tabs.key]) === tab));
      for (const s of this.o.selects || []) {
        const v = selects[s.key];
        if (v) rows = rows.filter(r => (s.match ? s.match(r, v) : String(r[s.key]) === v));
      }
      if (q) {
        const needle = q.toLowerCase();
        rows = rows.filter(r => (this.o.search ? this.o.search(r) : Object.values(r).join(' ')).toLowerCase().includes(needle));
      }
      if (this.state.sort) {
        const { key, dir } = this.state.sort;
        const col = this.o.columns.find(c => c.key === key);
        const val = col && col.sortValue ? col.sortValue : r => r[key];
        rows = [...rows].sort((a, b) => {
          const x = val(a), y = val(b);
          const cmp = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), 'id', { numeric: true });
          return dir === 'asc' ? cmp : -cmp;
        });
      }
      return rows;
    }

    mount() {
      const o = this.o;
      const head = o.title ? `<div class="card__head"><div><div class="flex items-center gap-2"><h2 class="card__title">${esc(o.title)}</h2><span class="count-pill" data-total></span></div>${o.desc ? `<p class="card__desc">${esc(o.desc)}</p>` : ''}</div>${o.headerActions || ''}</div>` : '<div style="height:16px"></div>';

      const tabs = o.tabs ? `<div class="tabs" role="tablist" aria-label="Filter ${esc(o.title || '')}" data-tabs style="padding:0 20px 12px"></div>` : '';

      const selects = (o.selects || []).map(s => `<select class="select select-sm" style="width:auto;min-width:150px" data-select="${s.key}" aria-label="${esc(s.label)}"><option value="">${esc(s.label)}</option>${s.options.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select>`).join('');

      const exportBtn = o.exportName ? `<button type="button" class="btn btn-secondary btn-sm" data-export>${icon('download')}<span>${esc(K.t('table.exportCsv'))}</span></button>` : '';

      this.root.innerHTML = `${head}${tabs}
        <div class="dt-toolbar">
          <div class="dt-toolbar__left">
            <label class="input-icon dt-search">${icon('search')}<input type="search" class="input input-sm" placeholder="${esc(o.searchPlaceholder)}" aria-label="${esc(o.searchPlaceholder)}" data-search></label>
            ${selects}
          </div>
          <div class="dt-toolbar__right">${o.toolbarRight || ''}${exportBtn}</div>
        </div>
        <div class="dt-bulk" data-bulk hidden></div>
        <div class="table-wrap" tabindex="0" role="region" aria-label="${esc(o.title || 'Tabel data')}"><table class="table"><thead data-thead></thead><tbody data-tbody></tbody></table></div>
        <div class="dt-foot"><p data-info aria-live="polite"></p><nav class="pagination" aria-label="${esc(K.t('table.pagination'))}" data-pager></nav></div>`;
    }

    bind() {
      const R = this.root;
      R.querySelector('[data-search]').addEventListener('input', K.util.debounce(e => { this.state.q = e.target.value.trim(); this.state.page = 1; this.update(); }, 150));
      R.querySelectorAll('[data-select]').forEach(s => s.addEventListener('change', () => { this.state.selects[s.dataset.select] = s.value; this.state.page = 1; this.update(); }));
      R.addEventListener('click', e => {
        const t = e.target;
        const tab = t.closest('[data-tab-value]');
        if (tab) { this.state.tab = tab.dataset.tabValue; this.state.page = 1; this.state.selected.clear(); this.update(); return; }
        const sort = t.closest('[data-sort]');
        if (sort) {
          const key = sort.dataset.sort; const cur = this.state.sort;
          this.state.sort = !cur || cur.key !== key ? { key, dir: 'asc' } : cur.dir === 'asc' ? { key, dir: 'desc' } : null;
          this.update(); return;
        }
        const pg = t.closest('[data-page]');
        if (pg && !pg.disabled) { this.state.page = Number(pg.dataset.page); this.update(); R.querySelector('.table-wrap').scrollTo({ left: 0 }); return; }
        if (t.closest('[data-export]')) { this.exportCSV(); return; }
        const bulk = t.closest('[data-bulk-action]');
        if (bulk) {
          const a = this.o.bulkActions[Number(bulk.dataset.bulkAction)];
          Promise.resolve(a.handler([...this.state.selected])).then(done => { if (done !== false) { this.state.selected.clear(); this.update(); } });
          return;
        }
        if (t.closest('[data-bulk-clear]')) { this.state.selected.clear(); this.update(); return; }
        const act = t.closest('[data-action]');
        if (act && this.o.onAction) {
          const tr = act.closest('tr[data-id]');
          const row = tr ? this.o.rows().find(r => String(r.id) === tr.dataset.id) : null;
          this.o.onAction(act.dataset.action, row, act, this);
        }
      });
      R.addEventListener('change', e => {
        const t = e.target;
        if (t.matches('[data-check-all]')) {
          this.pageRows().forEach(r => t.checked ? this.state.selected.add(r.id) : this.state.selected.delete(r.id));
          this.update();
        } else if (t.matches('[data-check]')) {
          t.checked ? this.state.selected.add(t.value) : this.state.selected.delete(t.value);
          this.update();
        }
      });
    }

    pageRows() {
      const rows = this.filtered();
      const start = (this.state.page - 1) * this.o.pageSize;
      return rows.slice(start, start + this.o.pageSize);
    }

    update() {
      const o = this.o, s = this.state, R = this.root;
      const all = o.rows();
      const rows = this.filtered();
      const pages = Math.max(1, Math.ceil(rows.length / o.pageSize));
      if (s.page > pages) s.page = pages;
      const start = (s.page - 1) * o.pageSize;
      const pageRows = rows.slice(start, start + o.pageSize);
      // Bersihkan pilihan yang sudah tidak ada
      for (const id of s.selected) if (!all.some(r => r.id === id)) s.selected.delete(id);

      const total = R.querySelector('[data-total]');
      if (total) total.textContent = K.util.num(all.length);

      // Tabs dengan jumlah
      if (o.tabs) {
        const count = v => v === 'all' ? all.length : all.filter(r => (o.tabs.match ? o.tabs.match(r, v) : String(r[o.tabs.key]) === v)).length;
        R.querySelector('[data-tabs]').innerHTML = [['all', o.tabs.allLabel || K.t('common.all')], ...o.tabs.options]
          .map(([v, l]) => `<button type="button" role="tab" class="tab" data-tab-value="${esc(v)}" aria-selected="${s.tab === v}">${esc(l)} <span class="count-pill">${count(v)}</span></button>`).join('');
      }

      // Header
      const allChecked = pageRows.length > 0 && pageRows.every(r => s.selected.has(r.id));
      R.querySelector('[data-thead]').innerHTML = `<tr>
        ${o.selectable ? `<th class="col-check"><input type="checkbox" data-check-all aria-label="${esc(K.t('table.selectAll'))}" ${allChecked ? 'checked' : ''}></th>` : ''}
        ${o.columns.map(c => {
          const dir = s.sort && s.sort.key === c.key ? s.sort.dir : null;
          const aria = dir ? ` aria-sort="${dir === 'asc' ? 'ascending' : 'descending'}"` : '';
          const inner = c.sortable ? `<button type="button" class="th-sort" data-sort="${c.key}" ${dir ? `data-dir="${dir}"` : ''}>${esc(c.label)}${icon(dir === 'asc' ? 'arrow-up' : dir === 'desc' ? 'arrow-down' : 'arrow-up-down')}</button>` : esc(c.label);
          return `<th scope="col" class="${c.className || ''}"${aria}>${inner}</th>`;
        }).join('')}
        ${o.rowActions ? `<th scope="col" class="col-actions"><span class="sr-only">${esc(K.t('table.actions'))}</span></th>` : ''}
      </tr>`;

      // Body
      const colCount = o.columns.length + (o.selectable ? 1 : 0) + (o.rowActions ? 1 : 0);
      R.querySelector('[data-tbody]').innerHTML = pageRows.length ? pageRows.map(r => `<tr data-id="${esc(r.id)}" class="${s.selected.has(r.id) ? 'is-selected' : ''}">
        ${o.selectable ? `<td class="col-check"><input type="checkbox" data-check value="${esc(r.id)}" aria-label="${esc(K.t('table.selectRow'))}" ${s.selected.has(r.id) ? 'checked' : ''}></td>` : ''}
        ${o.columns.map(c => `<td class="${c.className || ''}">${c.render ? c.render(r) : esc(r[c.key])}</td>`).join('')}
        ${o.rowActions ? `<td class="col-actions"><div class="row-actions">${o.rowActions(r)}</div></td>` : ''}
      </tr>`).join('') : `<tr><td colspan="${colCount}">${K.ui.empty(o.empty || { icon: 'search-x', title: K.t('table.noResult'), text: K.t('table.noResultText') })}</td></tr>`;

      // Bulk bar
      const bulk = R.querySelector('[data-bulk]');
      if (o.bulkActions && s.selected.size) {
        bulk.hidden = false;
        bulk.innerHTML = `<span>${esc(K.t('table.selected', { n: s.selected.size }))}</span><button type="button" class="btn btn-ghost btn-sm" data-bulk-clear>${esc(K.t('table.clearSel'))}</button><div class="btn-group">${o.bulkActions.map((a, i) => `<button type="button" class="btn btn-sm ${a.variant === 'danger' ? 'btn-danger' : 'btn-secondary'}" data-bulk-action="${i}">${a.icon ? icon(a.icon) : ''}<span>${esc(a.label)}</span></button>`).join('')}</div>`;
      } else bulk.hidden = true;

      // Info + pager
      R.querySelector('[data-info]').textContent = rows.length
        ? K.t('table.showing', { from: start + 1, to: start + pageRows.length, total: K.util.num(rows.length) }) + (rows.length !== all.length ? K.t('table.filtered', { all: K.util.num(all.length) }) : '')
        : K.t('table.none');
      R.querySelector('[data-pager]').innerHTML = this.pager(s.page, pages);
      K.applyPerms && K.applyPerms(R);
      o.afterRender && o.afterRender(this);
    }

    pager(cur, total) {
      const btn = (p, label = p, extra = '') => `<button type="button" data-page="${p}" ${p === cur ? 'aria-current="page"' : ''} ${extra}>${label}</button>`;
      const list = [];
      const range = new Set([1, total, cur - 1, cur, cur + 1].filter(p => p >= 1 && p <= total));
      let prev = 0;
      [...range].sort((a, b) => a - b).forEach(p => { if (p - prev > 1) list.push('<span class="pg-gap" aria-hidden="true">…</span>'); list.push(btn(p, p, `aria-label="${esc(K.t('table.page', { n: p }))}"`)); prev = p; });
      return `<button type="button" class="pg-edge" data-page="${cur - 1}" ${cur <= 1 ? 'disabled' : ''} aria-label="${esc(K.t('table.prev'))}">${icon('chevron-left')}</button>${list.join('')}<button type="button" class="pg-edge" data-page="${cur + 1}" ${cur >= total ? 'disabled' : ''} aria-label="${esc(K.t('table.next'))}">${icon('chevron-right')}</button>`;
    }

    exportCSV() {
      const cols = this.o.columns.filter(c => c.csv !== false);
      const csv = K.util.toCSV(this.filtered(), cols);
      const name = `${this.o.exportName}-${new Date().toISOString().slice(0, 10)}.csv`;
      K.util.downloadFile(name, '﻿' + csv, 'text/csv');
      K.ui.toast(K.t('table.exported'), K.t('table.exportedText', { file: name }));
    }

    refresh() { this.update(); }
  }

  K.DataTable = DataTable;
})(window.K);
