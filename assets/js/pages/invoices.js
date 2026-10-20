/* ==========================================================================
   Tools → Invoices (pola CRUD lengkap + dokumen cetak)
   #/invoices · #/invoices/new · #/invoices/:id · #/invoices/:id/edit
   Cetak/PDF memakai window.print() + CSS @media print (lihat pages.css).
   Backend: hitung ulang total di server — jangan percaya angka dari klien.
   ========================================================================== */
(function (K) {
  'use strict';
  const { esc, num, idr } = K.util;
  const { icon } = K.ui;
  const S = K.store;
  const STATUS = { paid: ['success', 'Lunas'], unpaid: ['info', 'Belum dibayar'], overdue: ['danger', 'Jatuh tempo'], draft: ['neutral', 'Draf'], void: ['neutral', 'Dibatalkan'] };
  const badge = s => `<span class="badge badge--${STATUS[s][0]}">${STATUS[s][1]}</span>`;

  /** Satu-satunya fungsi perhitungan total (mudah dicerminkan di backend). */
  function totals(inv) {
    const subtotal = inv.lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.price) || 0), 0);
    const discount = Math.round(subtotal * (Number(inv.discount) || 0) / 100);
    const taxable = subtotal - discount;
    const tax = Math.round(taxable * (Number(inv.tax) || 0) / 100);
    return { subtotal, discount, taxable, tax, total: taxable + tax };
  }
  const nextNumber = () => { const max = Math.max(0, ...S.all('invoices').map(i => +i.number.split('-').pop())); return `INV-2026-${String(max + 1).padStart(4, '0')}`; };

  K.page('invoices', {
    render(view, route) {
      const [id, sub] = route.params;
      if (id === 'new') return form(view, null);
      if (id) {
        const inv = S.get('invoices', id);
        if (!inv) { view.innerHTML = K.ui.empty({ icon: 'file-x', title: 'Invoice tidak ditemukan', action: '<a href="#/invoices" class="btn btn-secondary">Kembali</a>' }); return; }
        return sub === 'edit' ? form(view, inv) : detail(view, inv);
      }
      list(view);
    },
  });

  /* ---------- LIST ---------- */
  function list(view) {
    const all = () => S.all('invoices');
    const sum = st => all().filter(i => st.includes(i.status)).reduce((s, i) => s + totals(i).total, 0);
    view.innerHTML = `${K.ui.pageHead({
      title: 'Invoices', eyebrow: 'Tools', desc: 'Buat, kirim, dan pantau pembayaran invoice pelanggan.',
      actions: `<a href="#/invoices/new" class="btn btn-primary btn-sm" data-perm="billing.update">${icon('plus')}<span>Invoice baru</span></a>`,
    })}
      <div class="grid grid-4">
        ${K.ui.kpi({ label: 'Total ditagihkan', value: idr(sum(['paid', 'unpaid', 'overdue']), { compact: true }), icon: 'receipt-text', foot: `${all().filter(i => i.status !== 'draft').length} invoice` })}
        ${K.ui.kpi({ label: 'Sudah dibayar', value: idr(sum(['paid']), { compact: true }), icon: 'banknote', trend: 8.4 })}
        ${K.ui.kpi({ label: 'Belum dibayar', value: idr(sum(['unpaid']), { compact: true }), icon: 'clock', foot: `${all().filter(i => i.status === 'unpaid').length} invoice` })}
        ${K.ui.kpi({ label: 'Jatuh tempo', value: idr(sum(['overdue']), { compact: true }), icon: 'triangle-alert', foot: `${all().filter(i => i.status === 'overdue').length} perlu ditagih` })}
      </div>
      <div class="mt-4" id="iv-table"></div>`;
    new K.DataTable(view.querySelector('#iv-table'), {
      title: 'Semua invoice', rows: all, pageSize: 10, selectable: true, exportName: 'invoice',
      search: r => r.number + ' ' + r.client,
      tabs: { key: 'status', options: Object.entries(STATUS).filter(([k]) => k !== 'void').map(([k, [, l]]) => [k, l]) },
      defaultSort: { key: 'issueDate', dir: 'desc' },
      columns: [
        { key: 'number', label: 'Nomor', sortable: true, render: r => `<a href="#/invoices/${r.id}" class="mono fw-600">${esc(r.number)}</a>` },
        { key: 'client', label: 'Pelanggan', sortable: true, render: r => `<p class="fw-500">${esc(r.client)}</p><p class="text-xs text-secondary">${esc(r.email)}</p>` },
        { key: 'issueDate', label: 'Terbit', sortable: true, className: 'hide-md nowrap', render: r => `<span class="text-secondary">${K.util.date(r.issueDate)}</span>` },
        { key: 'dueDate', label: 'Jatuh tempo', sortable: true, className: 'hide-lg nowrap', render: r => `<span class="${r.status === 'overdue' ? 'text-danger fw-500' : 'text-secondary'}">${K.util.date(r.dueDate)}</span>` },
        { key: 'total', label: 'Total', sortable: true, sortValue: r => totals(r).total, className: 'num nowrap fw-600', render: r => idr(totals(r).total), csv: r => totals(r).total },
        { key: 'status', label: 'Status', render: r => badge(r.status) },
      ],
      rowActions: r => `${K.ui.iconBtn('eye', 'Lihat', 'data-action="view"')}${K.ui.iconBtn('pencil', 'Edit', `data-action="edit" ${r.status === 'paid' ? 'disabled title="Invoice lunas tidak dapat diubah"' : ''}`)}`,
      bulkActions: [
        { label: 'Tandai lunas', icon: 'check', handler: ids => { S.updateWhere('invoices', i => ids.includes(i.id) && i.status !== 'draft', { status: 'paid', paidAt: new Date().toISOString() }); K.ui.toast('Invoice ditandai lunas'); K.router.render(); } },
        { label: 'Kirim pengingat', icon: 'send', handler: ids => K.ui.toast(`${ids.length} pengingat dikirim`, 'Email ke kontak finance pelanggan.', 'info') },
      ],
      onAction: (a, r) => K.router.go(`invoices/${r.id}${a === 'edit' ? '/edit' : ''}`),
    });
  }

  /* ---------- DETAIL / DOKUMEN ---------- */
  function detail(view, inv) {
    const t = totals(inv);
    K.setCrumb('Invoices', inv.number, '#/invoices');
    view.innerHTML = `
      <a href="#/invoices" class="back-link no-print">${icon('arrow-left')}<span>Semua invoice</span></a>
      <div class="flex wrap items-center justify-between gap-3 no-print" style="margin-bottom:16px">
        <div class="flex items-center gap-2 wrap"><h1 id="page-title" tabindex="-1" class="mono" style="font-size:22px">${esc(inv.number)}</h1>${badge(inv.status)}</div>
        <div class="btn-group">
          ${inv.status !== 'paid' ? `<a href="#/invoices/${inv.id}/edit" class="btn btn-secondary btn-sm">${icon('pencil')}<span>Edit</span></a>` : ''}
          <button type="button" class="btn btn-secondary btn-sm" data-print>${icon('printer')}<span>Cetak / PDF</span></button>
          ${['unpaid', 'overdue'].includes(inv.status) ? `<button type="button" class="btn btn-secondary btn-sm" data-remind>${icon('send')}<span>Kirim pengingat</span></button><button type="button" class="btn btn-primary btn-sm" data-pay>${icon('banknote')}<span>Catat pembayaran</span></button>` : ''}
          ${inv.status === 'draft' ? `<button type="button" class="btn btn-primary btn-sm" data-send>${icon('send')}<span>Terbitkan & kirim</span></button>` : ''}
        </div>
      </div>
      ${inv.status === 'overdue' ? `<div class="alert alert--danger no-print" style="margin-bottom:16px">${icon('triangle-alert')}<div><p class="alert__title">Melewati jatuh tempo ${Math.max(1, Math.round((K.NOW - new Date(inv.dueDate)) / 86400000))} hari</p><p class="alert__text">Kirim pengingat atau hubungi ${esc(inv.email)}.</p></div></div>` : ''}
      <article class="invoice-doc card" id="invoice-doc">
        <header class="invoice-doc__head">
          <div><div class="flex items-center gap-2"><span class="brand-mark" style="width:34px;height:34px"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 5v14M10 12l8-7M10 12l8 7"/></svg></span><span class="brand-word" style="font-size:22px">kontrol<span>.</span></span></div>
            <p class="text-sm text-secondary mt-3">PT Kontrol Digital Indonesia<br>Jl. Jenderal Sudirman Kav. 52-53<br>Jakarta Selatan 12190 · NPWP 01.234.567.8-012.000</p></div>
          <div class="text-right"><p class="invoice-doc__title">INVOICE</p><p class="mono fw-600 mt-1">${esc(inv.number)}</p>${inv.status === 'paid' ? '<span class="invoice-doc__stamp">LUNAS</span>' : ''}</div>
        </header>
        <div class="invoice-doc__meta">
          <div><p class="section-label">Ditagihkan kepada</p><p class="fw-600">${esc(inv.client)}</p><p class="text-sm text-secondary">${esc(inv.address)}<br>${esc(inv.email)}</p></div>
          <dl class="dl" style="grid-template-columns:auto auto;justify-content:end;gap:6px 20px"><dt>Tanggal terbit</dt><dd>${K.util.date(inv.issueDate)}</dd><dt>Jatuh tempo</dt><dd>${K.util.date(inv.dueDate)}</dd>${inv.paidAt ? `<dt>Dibayar</dt><dd>${K.util.date(inv.paidAt)}</dd>` : ''}</dl>
        </div>
        <div class="table-wrap"><table class="table invoice-doc__lines"><thead><tr><th scope="col">Deskripsi</th><th scope="col" class="num">Qty</th><th scope="col" class="num">Harga</th><th scope="col" class="num">Jumlah</th></tr></thead>
          <tbody>${inv.lines.map(l => `<tr><td>${esc(l.desc)}</td><td class="num">${num(l.qty)}</td><td class="num">${idr(l.price)}</td><td class="num fw-500">${idr(l.qty * l.price)}</td></tr>`).join('')}</tbody></table></div>
        <div class="invoice-doc__totals"><dl>
          <dt>Subtotal</dt><dd>${idr(t.subtotal)}</dd>
          ${t.discount ? `<dt>Diskon ${inv.discount}%</dt><dd>−${idr(t.discount)}</dd>` : ''}
          <dt>PPN ${inv.tax}%</dt><dd>${idr(t.tax)}</dd>
          <dt class="is-total">Total</dt><dd class="is-total">${idr(t.total)}</dd></dl></div>
        <footer class="invoice-doc__foot"><div><p class="section-label">Pembayaran</p><p class="text-sm">Bank Mandiri · 123-00-0987654-3<br>a.n. PT Kontrol Digital Indonesia</p></div><div><p class="section-label">Catatan</p><p class="text-sm text-secondary">${esc(inv.notes || '—')}</p></div></footer>
      </article>`;
    view.addEventListener('click', e => {
      if (e.target.closest('[data-print]')) window.print();
      if (e.target.closest('[data-remind]')) K.ui.toast('Pengingat dikirim', inv.email, 'info');
      if (e.target.closest('[data-send]')) { S.update('invoices', inv.id, { status: 'unpaid', issueDate: new Date().toISOString() }); K.ui.toast('Invoice diterbitkan', `Dikirim ke ${inv.email}`); K.router.render(); }
      if (e.target.closest('[data-pay]')) K.ui.modal({
        title: 'Catat pembayaran', desc: `${esc(inv.number)} · ${idr(totals(inv).total)}`,
        body: `<div class="form-grid">${K.ui.field({ name: 'date', label: 'Tanggal bayar', type: 'date', required: true, value: new Date(K.NOW).toISOString().slice(0, 10) })}${K.ui.field({ name: 'method', label: 'Metode', type: 'select', options: ['Transfer bank', 'Virtual Account', 'QRIS', 'Kartu kredit'] })}${K.ui.field({ name: 'ref', label: 'No. referensi', span: true, placeholder: 'mis. nomor mutasi rekening' })}</div>`,
        submitLabel: 'Simpan pembayaran',
        onSubmit: d => { S.update('invoices', inv.id, { status: 'paid', paidAt: new Date(d.date).toISOString(), payment: d }); S.audit('invoice.paid', 'Mencatat pembayaran', inv.number, 'info', 'Invoice'); K.ui.toast('Pembayaran dicatat', inv.number); K.router.render(); },
      });
    });
  }

  /* ---------- CREATE / EDIT ---------- */
  function form(view, inv) {
    const isNew = !inv;
    const data = inv ? JSON.parse(JSON.stringify(inv)) : { number: nextNumber(), orgId: '', client: '', email: '', address: '', lines: [{ desc: '', qty: 1, price: 0 }], discount: 0, tax: 11, issueDate: new Date(K.NOW).toISOString(), dueDate: new Date(K.NOW + 14 * 86400000).toISOString(), notes: 'Pembayaran melalui transfer ke rekening yang tercantum. Terima kasih atas kerja samanya.', status: 'draft' };
    K.setCrumb('Invoices', isNew ? 'Invoice baru' : 'Edit ' + data.number, '#/invoices');
    const orgs = S.all('organizations');
    view.innerHTML = `
      <a href="${isNew ? '#/invoices' : '#/invoices/' + inv.id}" class="back-link">${icon('arrow-left')}<span>${isNew ? 'Semua invoice' : esc(inv.number)}</span></a>
      ${K.ui.pageHead({ title: isNew ? 'Invoice baru' : 'Edit invoice', desc: `Nomor <span class="mono fw-600">${esc(data.number)}</span> · total dihitung otomatis termasuk PPN.` })}
      <form id="iv-form" class="grid grid-main-side" novalidate style="align-items:start">
        <div class="stack">
          <article class="card"><h2 class="card__title">Pelanggan</h2><div class="form-grid mt-4">
            <div class="field span-2"><label class="label" for="iv-org">Organisasi<span class="req">*</span></label><select class="select" id="iv-org" name="orgId" required data-msg-required="Pilih pelanggan."><option value="">— Pilih organisasi —</option>${orgs.map(o => `<option value="${o.id}" ${o.id === data.orgId ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select></div>
            <div class="field"><label class="label" for="iv-email">Email penagihan<span class="req">*</span></label><input class="input" id="iv-email" name="email" type="email" required value="${esc(data.email)}"></div>
            <div class="field"><label class="label" for="iv-address">Alamat</label><input class="input" id="iv-address" name="address" value="${esc(data.address)}"></div>
            <div class="field"><label class="label" for="iv-issue">Tanggal terbit</label><input class="input" id="iv-issue" name="issueDate" type="date" required value="${data.issueDate.slice(0, 10)}"></div>
            <div class="field"><label class="label" for="iv-due">Jatuh tempo</label><input class="input" id="iv-due" name="dueDate" type="date" required value="${data.dueDate.slice(0, 10)}"></div>
          </div></article>
          <article class="card card--flush"><div class="card__head"><div><h2 class="card__title">Item</h2><p class="card__desc">Tambahkan produk atau jasa.</p></div><button type="button" class="btn btn-secondary btn-sm" data-add-line>${icon('plus')}<span>Tambah baris</span></button></div>
            <div class="table-wrap"><table class="table line-table"><thead><tr><th scope="col">Deskripsi</th><th scope="col" style="width:90px">Qty</th><th scope="col" style="width:170px">Harga (Rp)</th><th scope="col" class="num" style="width:150px">Jumlah</th><th scope="col" class="col-actions"><span class="sr-only">Hapus</span></th></tr></thead><tbody id="iv-lines"></tbody></table></div></article>
          <article class="card"><div class="field"><label class="label" for="iv-notes">Catatan untuk pelanggan</label><textarea class="textarea" id="iv-notes" name="notes">${esc(data.notes)}</textarea></div></article>
        </div>
        <aside class="stack" style="position:sticky;top:calc(var(--topbar-h) + 16px)">
          <article class="card"><h2 class="card__title">Ringkasan</h2>
            <div class="form-grid mt-4"><div class="field"><label class="label" for="iv-disc">Diskon (%)</label><input class="input" id="iv-disc" name="discount" type="number" min="0" max="100" value="${data.discount}"></div><div class="field"><label class="label" for="iv-tax">PPN (%)</label><input class="input" id="iv-tax" name="tax" type="number" min="0" max="100" value="${data.tax}"></div></div>
            <div class="invoice-doc__totals" style="margin-top:16px"><dl id="iv-totals"></dl></div>
            <div class="stack mt-5" style="gap:8px">
              <button type="submit" class="btn btn-primary btn-block" data-intent="send">${icon('send')}<span>${isNew || data.status === 'draft' ? 'Simpan & terbitkan' : 'Simpan perubahan'}</span></button>
              ${isNew || data.status === 'draft' ? `<button type="submit" class="btn btn-secondary btn-block" data-intent="draft">${icon('save')}<span>Simpan sebagai draf</span></button>` : ''}
            </div></article>
        </aside>
      </form>`;
    const $ = s => view.querySelector(s);
    const f = K.validate.attach($('#iv-form'));

    const drawLines = () => {
      $('#iv-lines').innerHTML = data.lines.map((l, i) => `<tr data-line="${i}">
        <td><input class="input input-sm" data-k="desc" value="${esc(l.desc)}" placeholder="Nama produk / jasa" aria-label="Deskripsi baris ${i + 1}" required data-msg-required="Deskripsi wajib diisi."></td>
        <td><input class="input input-sm tabular" data-k="qty" type="number" min="1" value="${l.qty}" aria-label="Qty baris ${i + 1}"></td>
        <td><input class="input input-sm tabular" data-k="price" type="number" min="0" step="1000" value="${l.price}" aria-label="Harga baris ${i + 1}"></td>
        <td class="num fw-500" data-amount>${idr(l.qty * l.price)}</td>
        <td class="col-actions">${K.ui.iconBtn('trash-2', 'Hapus baris', `data-rm-line="${i}" ${data.lines.length === 1 ? 'disabled' : ''}`, 'is-danger')}</td></tr>`).join('');
      // input baris tidak punya name → beri name unik agar ikut tervalidasi
      view.querySelectorAll('#iv-lines [data-k="desc"]').forEach((el, i) => { el.name = 'line_desc_' + i; });
      drawTotals();
    };
    const drawTotals = () => {
      data.discount = +$('#iv-disc').value || 0; data.tax = +$('#iv-tax').value || 0;
      const t = totals(data);
      $('#iv-totals').innerHTML = `<dt>Subtotal</dt><dd>${idr(t.subtotal)}</dd>${t.discount ? `<dt>Diskon ${data.discount}%</dt><dd>−${idr(t.discount)}</dd>` : ''}<dt>PPN ${data.tax}%</dt><dd>${idr(t.tax)}</dd><dt class="is-total">Total</dt><dd class="is-total">${idr(t.total)}</dd>`;
    };
    $('#iv-lines').addEventListener('input', e => {
      const tr = e.target.closest('[data-line]'); if (!tr) return;
      const l = data.lines[+tr.dataset.line]; const k = e.target.dataset.k;
      l[k] = k === 'desc' ? e.target.value : Math.max(0, +e.target.value || 0);
      tr.querySelector('[data-amount]').textContent = idr(l.qty * l.price); drawTotals();
    });
    view.addEventListener('click', e => {
      if (e.target.closest('[data-add-line]')) { data.lines.push({ desc: '', qty: 1, price: 0 }); drawLines(); view.querySelector(`[data-line="${data.lines.length - 1}"] input`).focus(); }
      const rm = e.target.closest('[data-rm-line]'); if (rm && !rm.disabled) { data.lines.splice(+rm.dataset.rmLine, 1); drawLines(); }
    });
    $('#iv-org').addEventListener('change', e => { const o = S.get('organizations', e.target.value); if (o) { $('#iv-email').value = 'finance@' + o.domain; $('#iv-address').value = o.city + ', Indonesia'; } });
    ['#iv-disc', '#iv-tax'].forEach(s => $(s).addEventListener('input', drawTotals));
    let intent = 'send';
    f.addEventListener('click', e => { const b = e.target.closest('[data-intent]'); if (b) intent = b.dataset.intent; });
    f.addEventListener('submit', e => {
      e.preventDefault();
      if (!K.validate.form(f)) { K.ui.toast('Periksa kembali isian', '', 'error', 2000); return; }
      if (!data.lines.some(l => l.qty * l.price > 0)) { K.ui.toast('Tambahkan minimal satu item berharga', '', 'error'); return; }
      const d = K.util.formData(f); const o = S.get('organizations', d.orgId);
      const payload = { number: data.number, orgId: d.orgId, client: o.name, email: d.email, address: d.address, lines: data.lines, discount: +d.discount || 0, tax: +d.tax || 0, issueDate: new Date(d.issueDate).toISOString(), dueDate: new Date(d.dueDate).toISOString(), notes: d.notes, status: intent === 'draft' ? 'draft' : (inv && inv.status !== 'draft' ? inv.status : 'unpaid') };
      if (new Date(payload.dueDate) < new Date(payload.issueDate)) { K.validate.setErrors(f, { dueDate: 'Jatuh tempo tidak boleh sebelum tanggal terbit.' }); return; }
      const saved = inv ? S.update('invoices', inv.id, payload) : S.insert('invoices', { ...payload, paidAt: null }, { idPrefix: 'inv' });
      S.audit('invoice.save', inv ? 'Memperbarui invoice' : 'Membuat invoice', payload.number, 'info', 'Invoice');
      K.ui.toast(intent === 'draft' ? 'Draf disimpan' : 'Invoice disimpan', `${payload.number} · ${idr(totals(payload).total)}`);
      K.router.go('invoices/' + saved.id);
    });
    drawLines();
  }
})(window.K);
