/* ==========================================================================
   Tools → Import Center
   Alur: Unggah CSV → Petakan kolom → Validasi & pratinjau → Impor → Riwayat.
   Parser CSV mendukung tanda kutip dan deteksi pemisah (, atau ;).
   Backend: kirim baris valid ke POST /imports (antrean job), pantau progres
   lewat Tasks & Jobs; untuk file besar lakukan parsing di server.
   ========================================================================== */
(function (K) {
  'use strict';
  const { esc, num } = K.util;
  const { icon } = K.ui;
  const S = K.store;

  /** Definisi target impor: field, alias header untuk auto-mapping, dan validator. */
  const TARGETS = {
    users: {
      label: 'Pengguna', icon: 'users',
      fields: [
        { key: 'name', label: 'Nama', required: true, alias: ['nama', 'name', 'full name', 'nama lengkap'] },
        { key: 'email', label: 'Email', required: true, alias: ['email', 'e-mail', 'surel'] },
        { key: 'role', label: 'Peran', alias: ['role', 'peran', 'jabatan akses'] },
        { key: 'team', label: 'Tim', alias: ['team', 'tim', 'divisi', 'department'] },
        { key: 'phone', label: 'Telepon', alias: ['phone', 'telepon', 'hp', 'no hp', 'whatsapp'] },
      ],
      sample: 'nama;email;peran;tim;telepon\nRina Kusuma;rina.kusuma@kontrol.id;Editor;Marketing;081234567890\nYoga Halim;yoga.halim@kontrol.id;Developer;Engineering;081298765432\nIntan Permata;intan@kontrol;Viewer;Finance;0812\nBagas Setiawan;bagas.s@kontrol.id;Analyst;Product;\n;tanpa.nama@kontrol.id;Viewer;Design;\nRina K (duplikat);rina.kusuma@kontrol.id;Editor;Marketing;\nFadly (sudah ada);fadly@kontrol.id;Viewer;Engineering;\n"Siregar, Teguh";teguh.siregar@kontrol.id;Developer;Operations;081377788899',
      validate(row, ctx) {
        const errs = [];
        if (!row.name) errs.push('Nama kosong');
        if (!row.email) errs.push('Email kosong');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(row.email)) errs.push('Format email tidak valid');
        else if (ctx.existing.has(row.email.toLowerCase())) errs.push('Email sudah terdaftar');
        else if (ctx.seen.has(row.email.toLowerCase())) errs.push('Duplikat di file');
        if (row.role && !ctx.roles.has(row.role.toLowerCase())) errs.push(`Peran "${row.role}" tidak dikenal`);
        if (row.phone && !/^(\+62|0)8\d{8,11}$/.test(row.phone.replace(/[\s-]/g, ''))) errs.push('Format telepon tidak valid');
        if (row.email) ctx.seen.add(row.email.toLowerCase());
        return errs;
      },
      commit(row, ctx) {
        const role = S.all('roles').find(r => r.name.toLowerCase() === (row.role || 'viewer').toLowerCase()) || S.get('roles', 'role_viewer');
        S.insert('users', { name: row.name, email: row.email, roleId: role.id, team: row.team || 'Operations', phone: row.phone, status: 'invited', lastActive: null, twoFA: false }, { idPrefix: 'usr' });
      },
      context: () => ({ existing: new Set(S.all('users').map(u => u.email.toLowerCase())), seen: new Set(), roles: new Set(S.all('roles').map(r => r.name.toLowerCase())) }),
    },
    organizations: {
      label: 'Organisasi', icon: 'building-2',
      fields: [
        { key: 'name', label: 'Nama', required: true, alias: ['nama', 'name', 'organisasi', 'perusahaan'] },
        { key: 'domain', label: 'Domain', required: true, alias: ['domain', 'website', 'situs'] },
        { key: 'plan', label: 'Paket', alias: ['plan', 'paket'] },
        { key: 'city', label: 'Kota', alias: ['kota', 'city'] },
      ],
      sample: 'nama,domain,paket,kota\nPT Maju Jaya,majujaya.co.id,Professional,Jakarta\nCV Sinar Abadi,sinarabadi,Starter,Bandung\nPT Data Prima,dataprima.id,Gold,Surabaya',
      validate(row, ctx) {
        const errs = [];
        if (!row.name) errs.push('Nama kosong');
        if (!row.domain) errs.push('Domain kosong'); else if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(row.domain)) errs.push('Domain tidak valid');
        else if (ctx.existing.has(row.domain.toLowerCase())) errs.push('Domain sudah ada');
        if (row.plan && !['starter', 'professional', 'enterprise'].includes(row.plan.toLowerCase())) errs.push(`Paket "${row.plan}" tidak dikenal`);
        return errs;
      },
      commit(row) { const p = (row.plan || 'Starter'); S.insert('organizations', { name: row.name, domain: row.domain, plan: p[0].toUpperCase() + p.slice(1).toLowerCase(), city: row.city || '-', members: 1, status: 'trial', owner: K.currentUser().name }, { idPrefix: 'org' }); },
      context: () => ({ existing: new Set(S.all('organizations').map(o => o.domain.toLowerCase())) }),
    },
  };

  /** Parser CSV kecil (RFC 4180 dasar): kutip ganda, koma/titik koma, baris baru di dalam kutip. */
  function parseCSV(text) {
    text = text.replace(/^﻿/, '');
    const firstLine = text.split(/\r?\n/)[0] || '';
    const delim = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
    const rows = []; let row = [], cell = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') quoted = false;
        else cell += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === delim) { row.push(cell.trim()); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell.trim()); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell || row.length) { row.push(cell.trim()); rows.push(row); }
    const clean = rows.filter(r => r.some(c => c !== ''));
    return { delim, header: clean[0] || [], rows: clean.slice(1) };
  }

  K.page('import', {
    render(view) {
      let step = 0, target = 'users', file = null, parsed = null, mapping = {}, results = [];
      const steps = ['Unggah', 'Petakan kolom', 'Validasi', 'Selesai'];
      view.innerHTML = `${K.ui.pageHead({ title: 'Import Center', eyebrow: 'Tools', desc: 'Impor data massal dari CSV dengan pemetaan kolom otomatis dan validasi sebelum disimpan.' })}
        <article class="card">
          <ol class="stepper" id="im-steps">${steps.map((s, i) => `<li class="stepper__item" data-step="${i}"><span class="stepper__dot">${i + 1}</span><span class="stepper__label">${s}</span></li>`).join('')}</ol>
          <div class="mt-6" id="im-body"></div>
        </article>
        <article class="card card--flush mt-4"><div class="card__head"><div><h2 class="card__title">Riwayat impor</h2><p class="card__desc">Simpan file asli & laporan error untuk audit.</p></div></div>
          <div class="table-wrap"><table class="table"><thead><tr><th scope="col">File</th><th scope="col" class="hide-sm">Target</th><th scope="col" class="num">Baris</th><th scope="col" class="num">Berhasil</th><th scope="col" class="num hide-sm">Gagal</th><th scope="col" class="hide-md">Oleh</th><th scope="col" class="hide-lg">Waktu</th></tr></thead><tbody id="im-hist"></tbody></table></div></article>`;
      const $ = s => view.querySelector(s);

      const drawSteps = () => view.querySelectorAll('#im-steps [data-step]').forEach(li => { const i = +li.dataset.step; li.classList.toggle('is-done', i < step); li.classList.toggle('is-current', i === step); li.querySelector('.stepper__dot').innerHTML = i < step ? icon('check') : i + 1; });
      const drawHist = () => { $('#im-hist').innerHTML = S.all('importHistory').map(h => `<tr><td><span class="flex items-center gap-2">${icon('file-spreadsheet', 'i-16')}<span class="fw-500">${esc(h.file)}</span></span></td><td class="hide-sm">${esc(TARGETS[h.target]?.label || h.target)}</td><td class="num">${num(h.rows)}</td><td class="num text-success">${num(h.ok)}</td><td class="num hide-sm ${h.failed ? 'text-danger' : ''}">${num(h.failed)}</td><td class="hide-md">${esc(K.lookup.user(h.by).name)}</td><td class="hide-lg text-secondary nowrap">${K.util.ago(h.createdAt)}</td></tr>`).join(''); };

      function load(name, text) {
        parsed = parseCSV(text);
        if (!parsed.header.length || !parsed.rows.length) { K.ui.toast('File kosong atau tidak valid', 'Pastikan baris pertama berisi judul kolom.', 'error'); return; }
        file = name;
        // Auto-mapping: cocokkan judul kolom dengan alias field
        mapping = {};
        TARGETS[target].fields.forEach(f => { const idx = parsed.header.findIndex(h => f.alias.includes(h.toLowerCase().trim())); if (idx >= 0) mapping[f.key] = idx; });
        step = 1; draw();
      }

      function stepUpload() {
        $('#im-body').innerHTML = `<div class="grid grid-2" style="align-items:start">
          <div class="stack" style="gap:14px">
            <div class="field"><span class="label">Impor ke</span><div class="choice-grid" role="radiogroup" aria-label="Target impor">${Object.entries(TARGETS).map(([k, t]) => `<label class="choice"><input type="radio" name="im-target" value="${k}" ${k === target ? 'checked' : ''}><span class="icon-tile">${icon(t.icon)}</span><span class="choice__title">${t.label}</span><span class="choice__desc">${t.fields.length} kolom · ${t.fields.filter(f => f.required).length} wajib</span></label>`).join('')}</div></div>
            <label class="dropzone" for="im-file" id="im-drop">${icon('file-up')}<span class="fw-600">Pilih file CSV atau seret ke sini</span><span class="text-xs text-secondary">Pemisah koma atau titik koma · UTF-8 · maks 5 MB</span><input type="file" id="im-file" accept=".csv,text/csv" class="sr-only"></label>
            <div class="flex gap-2 wrap"><button type="button" class="btn btn-secondary btn-sm" id="im-sample">${icon('wand-sparkles')}<span>Coba dengan data contoh</span></button><button type="button" class="btn btn-ghost btn-sm" id="im-template">${icon('download')}<span>Unduh template CSV</span></button></div>
          </div>
          <div class="alert alert--info">${icon('info')}<div><p class="alert__title">Kolom yang didukung</p><p class="alert__text">${TARGETS[target].fields.map(f => `<strong>${f.label}</strong>${f.required ? '*' : ''}`).join(', ')}. Judul kolom dicocokkan otomatis (mis. “nama”, “email”, “tim”). Kolom bertanda * wajib.</p></div></div>
        </div>`;
        view.querySelectorAll('[name="im-target"]').forEach(r => r.addEventListener('change', () => { target = r.value; stepUpload(); }));
        const inp = $('#im-file'), drop = $('#im-drop');
        const read = f => { if (!f) return; if (f.size > 5 * 1024 * 1024) { K.ui.toast('File terlalu besar', 'Maksimal 5 MB.', 'error'); return; } if (!/\.csv$/i.test(f.name)) { K.ui.toast('Hanya file .csv', 'Simpan Excel sebagai CSV UTF-8 terlebih dahulu.', 'error'); return; } f.text().then(t => load(f.name, t)); };
        inp.addEventListener('change', () => read(inp.files[0]));
        ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('is-over'); }));
        ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('is-over'); }));
        drop.addEventListener('drop', e => read(e.dataTransfer.files[0]));
        $('#im-sample').addEventListener('click', () => load(`contoh-${target}.csv`, TARGETS[target].sample));
        $('#im-template').addEventListener('click', () => K.util.downloadFile(`template-${target}.csv`, '﻿' + TARGETS[target].fields.map(f => f.key).join(',') + '\n', 'text/csv'));
      }

      function stepMap() {
        const t = TARGETS[target];
        $('#im-body').innerHTML = `<div class="flex wrap items-center justify-between gap-3"><p class="text-sm"><span class="fw-600">${esc(file)}</span> <span class="text-secondary">· ${parsed.rows.length} baris · pemisah “${parsed.delim}”</span></p><button type="button" class="btn btn-ghost btn-sm" data-restart>${icon('rotate-ccw')}<span>Ganti file</span></button></div>
          <div class="table-wrap mt-4"><table class="table"><thead><tr><th scope="col">Field tujuan</th><th scope="col">Kolom di file</th><th scope="col" class="hide-sm">Contoh nilai</th></tr></thead><tbody>
            ${t.fields.map(f => `<tr><td class="fw-500">${f.label}${f.required ? '<span class="text-danger">*</span>' : ''}</td><td><select class="select select-sm" data-map="${f.key}" aria-label="Kolom untuk ${f.label}" style="min-width:160px"><option value="">— Lewati —</option>${parsed.header.map((h, i) => `<option value="${i}" ${mapping[f.key] === i ? 'selected' : ''}>${esc(h)}</option>`).join('')}</select></td><td class="hide-sm text-secondary" data-sample="${f.key}"></td></tr>`).join('')}
          </tbody></table></div>
          <p class="section-label mt-6">Pratinjau 5 baris pertama</p>
          <div class="table-wrap"><table class="table table--compact table--striped"><thead><tr>${parsed.header.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${parsed.rows.slice(0, 5).map(r => `<tr>${parsed.header.map((_, i) => `<td>${esc(r[i] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
          <div class="flex justify-between mt-6"><button type="button" class="btn btn-secondary" data-restart>${icon('chevron-left')}<span>Kembali</span></button><button type="button" class="btn btn-primary" id="im-validate"><span>Validasi data</span>${icon('chevron-right')}</button></div>`;
        const sample = () => t.fields.forEach(f => { const i = mapping[f.key]; view.querySelector(`[data-sample="${f.key}"]`).textContent = i === undefined ? '—' : (parsed.rows.find(r => r[i])?.[i] || '—'); });
        view.querySelectorAll('[data-map]').forEach(s => s.addEventListener('change', () => { s.value === '' ? delete mapping[s.dataset.map] : (mapping[s.dataset.map] = +s.value); sample(); }));
        sample();
        $('#im-validate').addEventListener('click', () => {
          const missing = t.fields.filter(f => f.required && mapping[f.key] === undefined);
          if (missing.length) { K.ui.toast('Kolom wajib belum dipetakan', missing.map(f => f.label).join(', '), 'error'); return; }
          const ctx = t.context();
          results = parsed.rows.map((r, i) => { const row = {}; t.fields.forEach(f => { row[f.key] = mapping[f.key] === undefined ? '' : (r[mapping[f.key]] || '').trim(); }); return { line: i + 2, row, errors: t.validate(row, ctx) }; });
          step = 2; draw();
        });
      }

      function stepValidate() {
        const t = TARGETS[target];
        const ok = results.filter(r => !r.errors.length), bad = results.filter(r => r.errors.length);
        let show = 'all';
        $('#im-body').innerHTML = `<div class="grid grid-3"><div class="mini-stat"><p class="text-xs text-secondary">Total baris</p><p class="stat-inline__value">${results.length}</p></div><div class="mini-stat" style="background:var(--success-bg)"><p class="text-xs text-success">Siap diimpor</p><p class="stat-inline__value text-success">${ok.length}</p></div><div class="mini-stat" style="background:var(--danger-bg)"><p class="text-xs text-danger">Bermasalah</p><p class="stat-inline__value text-danger">${bad.length}</p></div></div>
          <div class="flex wrap items-center justify-between gap-3 mt-5"><div class="tabs" role="tablist" id="im-show">${[['all', 'Semua'], ['ok', 'Valid'], ['bad', 'Bermasalah']].map(([k, l]) => `<button type="button" role="tab" class="tab" data-show="${k}" aria-selected="${k === show}">${l}</button>`).join('')}</div>${bad.length ? `<button type="button" class="btn btn-ghost btn-sm" id="im-errcsv">${icon('download')}<span>Unduh baris bermasalah</span></button>` : ''}</div>
          <div class="table-wrap mt-3"><table class="table table--compact"><thead><tr><th scope="col">Baris</th>${t.fields.map(f => `<th scope="col" class="${f.required ? '' : 'hide-md'}">${f.label}</th>`).join('')}<th scope="col">Status</th></tr></thead><tbody id="im-rows"></tbody></table></div>
          ${bad.length ? `<div class="alert alert--warning mt-4">${icon('triangle-alert')}<div><p class="alert__title">${bad.length} baris akan dilewati</p><p class="alert__text">Perbaiki di file lalu impor ulang, atau lanjutkan hanya dengan baris valid.</p></div></div>` : ''}
          <div class="flex justify-between mt-6 wrap gap-2"><button type="button" class="btn btn-secondary" id="im-back">${icon('chevron-left')}<span>Ubah pemetaan</span></button><button type="button" class="btn btn-primary" id="im-commit" ${ok.length ? '' : 'disabled'}>${icon('file-check-2')}<span>Impor ${ok.length} baris valid</span></button></div>`;
        const rows = () => { $('#im-rows').innerHTML = results.filter(r => show === 'all' || (show === 'ok' ? !r.errors.length : r.errors.length)).map(r => `<tr class="${r.errors.length ? 'is-invalid-row' : ''}"><td class="tabular text-muted">${r.line}</td>${t.fields.map(f => `<td class="${f.required ? '' : 'hide-md'}">${esc(r.row[f.key]) || '<span class="text-muted">—</span>'}</td>`).join('')}<td>${r.errors.length ? `<span class="badge badge--danger" title="${esc(r.errors.join(', '))}">${r.errors.length} error</span><p class="text-xs text-danger mt-1">${esc(r.errors.join(' · '))}</p>` : '<span class="badge badge--success">Valid</span>'}</td></tr>`).join(''); };
        $('#im-show').addEventListener('click', e => { const b = e.target.closest('[data-show]'); if (!b) return; show = b.dataset.show; view.querySelectorAll('[data-show]').forEach(x => x.setAttribute('aria-selected', x === b)); rows(); });
        rows();
        $('#im-errcsv')?.addEventListener('click', () => K.util.downloadFile('baris-bermasalah.csv', '﻿' + K.util.toCSV(bad.map(b => ({ line: b.line, ...b.row, error: b.errors.join('; ') })), [{ key: 'line', label: 'baris' }, ...t.fields.map(f => ({ key: f.key, label: f.key })), { key: 'error', label: 'error' }]), 'text/csv'));
        $('#im-back').addEventListener('click', () => { step = 1; draw(); });
        $('#im-commit').addEventListener('click', e => {
          const btn = e.currentTarget; btn.disabled = true; btn.innerHTML = `${icon('loader-circle', 'spin')}<span>Mengimpor…</span>`;
          setTimeout(() => {
            ok.forEach(r => t.commit(r.row));
            S.insert('importHistory', { file, target, rows: results.length, ok: ok.length, failed: bad.length, by: 'usr_me' }, { idPrefix: 'imp' });
            S.audit('import.run', 'Mengimpor data', `${file} (${ok.length} baris)`, 'warning', 'Import');
            step = 3; draw(); drawHist();
          }, 900);
        });
      }

      function stepDone() {
        const ok = results.filter(r => !r.errors.length).length, bad = results.length - ok;
        $('#im-body').innerHTML = `<div style="text-align:center;padding:16px 0">
          <div class="auth-icon" style="margin:0 auto 16px;background:var(--success-bg);color:var(--success)">${icon('circle-check')}</div>
          <h2 style="font-size:20px">Impor selesai</h2>
          <p class="text-secondary mt-2">${ok} ${TARGETS[target].label.toLowerCase()} berhasil ditambahkan${bad ? `, ${bad} baris dilewati` : ''}.</p>
          <div class="btn-group mt-6" style="justify-content:center"><a href="#/${target}" class="btn btn-primary">${icon('external-link')}<span>Lihat ${TARGETS[target].label}</span></a><button type="button" class="btn btn-secondary" data-restart>${icon('file-up')}<span>Impor file lain</span></button></div></div>`;
      }

      function draw() { drawSteps(); [stepUpload, stepMap, stepValidate, stepDone][step](); }
      view.addEventListener('click', e => { if (e.target.closest('[data-restart]')) { step = 0; file = null; parsed = null; results = []; draw(); } });
      draw(); drawHist();
    },
  });
})(window.K);
