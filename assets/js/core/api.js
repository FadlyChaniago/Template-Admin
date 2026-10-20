/* ==========================================================================
   K.api — satu pintu untuk semua request data.

     const { data, meta } = await K.api.get('/users', { query: { status: 'active', page: 1 } });
     const { data } = await K.api.post('/users', body);
     await K.api.patch(`/users/${id}`, { status: 'suspended' });
     await K.api.delete(`/users/${id}`);

   Mode (K.config.dataMode):
     'demo' → adapter lokal memakai K.store (seed + localStorage) dengan latensi simulasi
     'api'  → fetch() ke K.config.apiBaseUrl

   Penanganan error terpusat (bisa dimatikan per panggilan dengan { handle: false }):
     401 → arahkan ke halaman login (?next=…)
     403/404/5xx pada { page: true } → tampilkan halaman error #/error/:kode
     422 → dilempar sebagai ApiError berisi .errors (pakai K.validate.setErrors)
     lainnya → toast error
   Format respons mengikuti gaya Laravel API Resource: { data, meta? }
   ========================================================================== */
(function (K) {
  'use strict';
  const C = K.config;

  class ApiError extends Error {
    constructor(status, message, payload = {}) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.errors = payload.errors || null; // { field: ['pesan'] }
      this.payload = payload;
    }
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const qs = query => {
    if (!query) return '';
    const p = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, v); });
    const s = p.toString();
    return s ? '?' + s : '';
  };

  /* ---------------- Adapter HTTP (backend sungguhan) ---------------- */
  async function httpAdapter(method, path, { body, query, signal, headers = {} }) {
    const h = { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...headers };
    let payload = body;
    if (body && !(body instanceof FormData)) { h['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
    if (C.authMode === 'bearer') { const t = C.getToken(); if (t) h.Authorization = 'Bearer ' + t; }
    else { const csrf = document.querySelector(`meta[name="${C.csrfMeta}"]`)?.content; if (csrf) h['X-CSRF-TOKEN'] = csrf; }
    const res = await fetch(C.apiBaseUrl.replace(/\/$/, '') + path + qs(query), { method, headers: h, body: payload, signal, credentials: 'same-origin' });
    if (res.status === 204) return { status: 204, json: null };
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(res.status, json?.message || res.statusText || 'Permintaan gagal', json || {});
    return { status: res.status, json };
  }

  /* ---------------- Adapter DEMO (K.store) ---------------- */
  // Pemetaan path REST → nama koleksi di K.store
  const COLL = { 'api-keys': 'apiKeys', 'audit-logs': 'auditLogs', 'import-history': 'importHistory', tasks: 'kanban', jobs: 'tasks' };
  const demoRules = {
    users: (b, id) => {
      const e = {};
      if ('name' in b && (!b.name || b.name.length < 3)) e.name = ['Nama minimal 3 karakter.'];
      if ('email' in b) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email || '')) e.email = ['Format email tidak valid.'];
        else if (K.store.all('users').some(u => u.email.toLowerCase() === b.email.toLowerCase() && u.id !== id)) e.email = ['Email sudah digunakan.'];
      }
      return e;
    },
  };

  async function demoAdapter(method, path, { body, query }) {
    const [lo, hi] = C.demoLatencyMs;
    await sleep(lo + Math.random() * (hi - lo));
    const [, res, id] = path.split('?')[0].split('/');
    if (res === 'search') return { status: 200, json: { data: K.search(query?.q || '') } };
    const coll = COLL[res] || res.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (!K.store.all(coll) || !Array.isArray(K.store.all(coll))) throw new ApiError(404, `Resource "${res}" tidak ditemukan.`);

    if (method === 'GET' && !id) {
      const { page = 1, per_page = 15, q = '', sort = '', ...filters } = query || {};
      let rows = K.store.all(coll);
      Object.entries(filters).forEach(([k, v]) => { rows = rows.filter(r => String(r[k]) === String(v)); });
      if (q) rows = rows.filter(r => JSON.stringify(r).toLowerCase().includes(String(q).toLowerCase()));
      if (sort) { const desc = sort.startsWith('-'); const key = sort.replace(/^-/, ''); rows = [...rows].sort((a, b) => String(a[key] ?? '').localeCompare(String(b[key] ?? ''), 'id', { numeric: true }) * (desc ? -1 : 1)); }
      const total = rows.length, pp = Number(per_page), pg = Math.max(1, Number(page));
      return { status: 200, json: { data: rows.slice((pg - 1) * pp, pg * pp), meta: { total, page: pg, per_page: pp, last_page: Math.max(1, Math.ceil(total / pp)) } } };
    }
    const item = id ? K.store.get(coll, id) : null;
    if (id && !item) throw new ApiError(404, 'Data tidak ditemukan.');
    if (method === 'GET') return { status: 200, json: { data: item } };
    if (method === 'DELETE') { K.store.remove(coll, id); return { status: 204, json: null }; }
    const errors = demoRules[coll] ? demoRules[coll](body || {}, id) : {};
    if (Object.keys(errors).length) throw new ApiError(422, 'Data yang diberikan tidak valid.', { errors });
    if (method === 'POST') return { status: 201, json: { data: K.store.insert(coll, body, { idPrefix: coll.slice(0, 3) }) } };
    return { status: 200, json: { data: K.store.update(coll, id, { ...body, updatedAt: new Date().toISOString() }) } };
  }

  /* ---------------- Inti request + retry + penanganan error ---------------- */
  async function request(method, path, opts = {}) {
    const { handle = true, page = false, timeout = C.apiTimeoutMs } = opts;
    const adapter = C.dataMode === 'api' ? httpAdapter : demoAdapter;
    const retries = method === 'GET' ? (opts.retries ?? C.apiRetries) : 0;
    let attempt = 0;
    for (;;) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeout);
      try {
        const { json } = await adapter(method, path, { ...opts, signal: ctrl.signal });
        clearTimeout(timer);
        return json || {};
      } catch (err) {
        clearTimeout(timer);
        const e = err instanceof ApiError ? err
          : err.name === 'AbortError' ? new ApiError(408, 'Permintaan melebihi batas waktu.')
          : new ApiError(0, navigator.onLine ? 'Tidak dapat terhubung ke server.' : 'Anda sedang offline.');
        const retryable = e.status === 0 || e.status === 408 || e.status >= 500;
        if (retryable && attempt < retries) { attempt++; await sleep(400 * 2 ** attempt); continue; }
        if (handle) handleError(e, { page, path });
        throw e;
      }
    }
  }

  function handleError(e, { page, path }) {
    if (e.status === 401) { location.href = `${C.loginUrl}?next=${encodeURIComponent(location.hash || '#/dashboard')}`; return; }
    if (e.status === 422) return; // ditangani form pemanggil
    if (page && [403, 404, 500, 502, 503, 504].includes(e.status)) { K.router.go('error/' + e.status); return; }
    K.ui.toast(e.status ? `Error ${e.status}` : 'Koneksi bermasalah', e.message, 'error', 5000);
    console.warn('[K.api]', e.status, path, e.message);
  }

  /* ---------------- Helper submit form ----------------
     K.api.submit(form, 'POST', '/users', { transform: d => d }).then(res => …)
     → validasi klien, kunci tombol, kirim, tampilkan error 422 di field. */
  async function submit(form, method, path, { transform = d => d, ...opts } = {}) {
    if (!K.validate.form(form)) throw new ApiError(422, 'Validasi klien gagal.');
    const btn = form.querySelector('[type=submit]');
    const html = btn?.innerHTML;
    if (btn) { btn.disabled = true; btn.innerHTML = `${K.ui.icon('loader-circle', 'spin')}<span>Menyimpan…</span>`; }
    try { return await request(method, path, { ...opts, body: transform(K.util.formData(form)) }); }
    catch (e) { if (e.status === 422 && e.errors) K.validate.setErrors(form, e.errors); throw e; }
    finally { if (btn) { btn.disabled = false; btn.innerHTML = html; } }
  }

  K.api = {
    get: (p, o) => request('GET', p, o),
    post: (p, body, o) => request('POST', p, { ...o, body }),
    put: (p, body, o) => request('PUT', p, { ...o, body }),
    patch: (p, body, o) => request('PATCH', p, { ...o, body }),
    delete: (p, o) => request('DELETE', p, o),
    submit,
    ApiError,
    demoRules,
  };
})(window.K);
