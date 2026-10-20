/* ==========================================================================
   Tools → Approvals (workflow persetujuan berjenjang)
   #/approvals · #/approvals/new · #/approvals/:id
   Rantai persetujuan dihitung dari tipe & nominal (K.approvals.chainFor).
   Backend: simpan setiap keputusan sebagai baris audit yang tidak bisa diubah;
   validasi di server bahwa user yang menyetujui = approver langkah aktif.
   ========================================================================== */
(function (K) {
  'use strict';
  const { esc, idr } = K.util;
  const { icon } = K.ui;
  const S = K.store;
  const ME = 'usr_me';
  const TYPE_ICON = { procurement: 'shopping-cart', leave: 'palmtree', access: 'key-round', budget: 'piggy-bank', expense: 'receipt' };
  const MONEY = ['procurement', 'budget', 'expense'];
  const STATUS = { pending: ['warning', 'Menunggu'], approved: ['success', 'Disetujui'], rejected: ['danger', 'Ditolak'], cancelled: ['neutral', 'Dibatalkan'] };
  const badge = s => `<span class="badge badge--${STATUS[s][0]}">${STATUS[s][1]}</span>`;

  /** Helper workflow — dipakai juga oleh badge sidebar. */
  K.approvals = {
    current: a => a.steps.find(s => s.status === 'pending'),
    waitingFor: uid => S.all('approvals').filter(a => a.status === 'pending' && K.approvals.current(a)?.approver === uid),
    chainFor(type, amount) {
      const users = S.all('users');
      const L = [{ name: 'Atasan langsung', approver: ME }];
      if (type === 'access') L.push({ name: 'Security Officer', approver: users[2].id });
      if (amount >= 10e6) L.push({ name: 'Finance', approver: users[10].id });
      if (amount >= 100e6) L.push({ name: 'Direktur', approver: users[1].id });
      return L;
    },
    /** Putuskan langkah aktif. decision: 'approved' | 'rejected'. */
    decide(a, decision, comment) {
      const step = K.approvals.current(a); if (!step) return;
      step.status = decision; step.at = new Date().toISOString(); step.comment = comment || '';
      if (decision === 'rejected') a.status = 'rejected';
      else { const next = a.steps.find(s => s.status === 'waiting'); if (next) next.status = 'pending'; else a.status = 'approved'; }
      S.update('approvals', a.id, { steps: a.steps, status: a.status });
      S.audit('approval.' + decision, decision === 'approved' ? 'Menyetujui pengajuan' : 'Menolak pengajuan', a.code, decision === 'approved' ? 'info' : 'warning', 'Approval');
    },
  };

  K.page('approvals', {
    render(view, route) {
      const [id] = route.params;
      if (id === 'new') return form(view);
      if (id) { const a = S.get('approvals', id); if (!a) { view.innerHTML = K.ui.empty({ icon: 'file-x', title: 'Pengajuan tidak ditemukan', action: '<a href="#/approvals" class="btn btn-secondary">Kembali</a>' }); return; } return detail(view, a); }
      list(view, route);
    },
  });

  /* ---------- LIST ---------- */
  function list(view, route) {
    const mine = K.approvals.waitingFor(ME);
    view.innerHTML = `${K.ui.pageHead({ title: 'Approvals', eyebrow: 'Tools', desc: 'Pengajuan yang membutuhkan persetujuan berjenjang — pengadaan, cuti, akses, anggaran, dan reimburse.',
      actions: `<a href="#/approvals/new" class="btn btn-primary btn-sm">${icon('plus')}<span>Ajukan baru</span></a>` })}
      ${mine.length ? `<div class="alert alert--warning" style="margin-bottom:16px">${icon('bell-ring')}<div><p class="alert__title">${mine.length} pengajuan menunggu keputusan Anda</p><p class="alert__text">${mine.slice(0, 3).map(a => `<a href="#/approvals/${a.id}">${esc(a.code)}</a> ${esc(a.title)}`).join(' · ')}</p></div></div>` : ''}
      <div id="ap-table"></div>`;
    new K.DataTable(view.querySelector('#ap-table'), {
      title: 'Semua pengajuan', rows: () => S.all('approvals'), pageSize: 10, exportName: 'approvals',
      search: r => r.code + ' ' + r.title + ' ' + K.lookup.user(r.requester).name,
      tabs: { key: 'status', allLabel: 'Semua', options: [['mine', 'Menunggu saya'], ['submitted', 'Diajukan saya'], ['pending', 'Menunggu'], ['approved', 'Disetujui'], ['rejected', 'Ditolak']],
        match: (r, v) => v === 'mine' ? (r.status === 'pending' && K.approvals.current(r)?.approver === ME) : v === 'submitted' ? r.requester === ME : r.status === v },
      selects: [{ key: 'type', label: 'Semua tipe', options: S.all('approvalTypes').map(t => [t.id, t.name]) }],
      defaultSort: { key: 'createdAt', dir: 'desc' },
      columns: [
        { key: 'title', label: 'Pengajuan', sortable: true, render: r => `<a href="#/approvals/${r.id}" class="row-link"><div class="flex items-center gap-3"><span class="icon-tile">${icon(TYPE_ICON[r.type])}</span><div><p class="fw-500 person__name">${esc(r.title)}</p><p class="text-xs text-secondary"><span class="mono">${esc(r.code)}</span> · ${esc(r.typeLabel)}</p></div></div></a>` },
        { key: 'requester', label: 'Pemohon', className: 'hide-md', render: r => K.ui.person(K.lookup.user(r.requester), ''), csv: r => K.lookup.user(r.requester).name },
        { key: 'amount', label: 'Nominal', sortable: true, className: 'num hide-sm nowrap', render: r => r.amount ? idr(r.amount) : '<span class="text-muted">—</span>' },
        { key: 'progress', label: 'Tahap', className: 'hide-lg', render: r => `<div class="mini-steps" aria-label="${r.steps.filter(s => s.status === 'approved').length} dari ${r.steps.length} tahap disetujui">${r.steps.map(s => `<span class="mini-steps__dot is-${s.status}" title="${esc(s.name)}: ${s.status}"></span>`).join('')}</div>`, csv: r => r.steps.map(s => s.status).join('>') },
        { key: 'createdAt', label: 'Diajukan', sortable: true, className: 'hide-sm nowrap', render: r => `<span class="text-secondary">${K.util.ago(r.createdAt)}</span>` },
        { key: 'status', label: 'Status', render: r => (r.status === 'pending' && K.approvals.current(r)?.approver === ME) ? '<span class="badge badge--info">Menunggu saya</span>' : badge(r.status) },
      ],
      rowActions: r => `<a href="#/approvals/${r.id}" class="btn btn-${r.status === 'pending' && K.approvals.current(r)?.approver === ME ? 'primary' : 'secondary'} btn-sm">${r.status === 'pending' && K.approvals.current(r)?.approver === ME ? 'Tinjau' : 'Lihat'}</a>`,
    });
    if (route.query.tab) view.querySelector(`[data-tab-value="${route.query.tab}"]`)?.click();
  }

  /* ---------- DETAIL ---------- */
  function detail(view, a) {
    const req = K.lookup.user(a.requester);
    const cur = K.approvals.current(a);
    const canDecide = a.status === 'pending' && cur?.approver === ME;
    K.setCrumb('Approvals', a.code, '#/approvals');
    const stepIcon = { approved: 'check', rejected: 'x', pending: 'clock', waiting: 'circle-dashed' };
    view.innerHTML = `
      <a href="#/approvals" class="back-link">${icon('arrow-left')}<span>Semua pengajuan</span></a>
      <section class="card detail-head">
        <div class="flex items-start gap-4 wrap">
          <span class="icon-tile icon-tile--lg">${icon(TYPE_ICON[a.type])}</span>
          <div class="flex-1" style="min-width:240px">
            <div class="flex items-center gap-2 wrap"><h1 id="page-title" tabindex="-1" style="font-size:22px;letter-spacing:-0.5px">${esc(a.title)}</h1>${badge(a.status)}</div>
            <p class="text-sm text-secondary mt-1"><span class="mono">${esc(a.code)}</span> · ${esc(a.typeLabel)} · diajukan ${K.util.ago(a.createdAt)} oleh ${esc(req.name)}</p>
          </div>
          ${a.amount ? `<div class="text-right"><p class="text-xs text-secondary">Nominal</p><p class="fw-700 tabular" style="font-size:22px">${idr(a.amount)}</p></div>` : ''}
        </div>
        <ol class="approval-chain mt-6" aria-label="Rantai persetujuan">${a.steps.map((s, i) => { const u = K.lookup.user(s.approver); return `<li class="approval-chain__step is-${s.status}">
          <span class="approval-chain__dot">${icon(stepIcon[s.status])}</span>
          <div><p class="text-xs text-secondary">Tahap ${i + 1} · ${esc(s.name)}</p><p class="fw-600">${esc(u.id === ME ? u.name + ' (Anda)' : u.name)}</p>
          <p class="text-xs ${s.status === 'rejected' ? 'text-danger' : s.status === 'approved' ? 'text-success' : 'text-secondary'}">${{ approved: 'Disetujui ' + (s.at ? K.util.ago(s.at) : ''), rejected: 'Ditolak ' + (s.at ? K.util.ago(s.at) : ''), pending: 'Menunggu keputusan', waiting: 'Belum giliran' }[s.status]}</p></div></li>`; }).join('')}</ol>
      </section>
      ${canDecide ? `<div class="decision-bar"><div><p class="fw-600">Giliran Anda memutuskan</p><p class="text-xs text-secondary">Tahap ${a.steps.indexOf(cur) + 1}: ${esc(cur.name)}. Keputusan tercatat di audit log dan tidak dapat diubah.</p></div><div class="btn-group"><button type="button" class="btn btn-danger-ghost" data-decide="rejected">${icon('x')}<span>Tolak</span></button><button type="button" class="btn btn-primary" data-decide="approved">${icon('check')}<span>Setujui</span></button></div></div>` : ''}
      <div class="grid grid-main-side mt-4">
        <div class="stack">
          <article class="card"><h2 class="card__title">Rincian</h2><p class="mt-3" style="line-height:1.7">${esc(a.description)}</p>
            ${a.attachments.length ? `<p class="section-label mt-5">Lampiran</p><ul class="file-list">${a.attachments.map(f => `<li class="file-item"><span class="file-item__thumb">${icon(/\.(jpe?g|png)$/i.test(f) ? 'image' : 'file-text')}</span><span class="flex-1 fw-500 truncate">${esc(f)}</span><button type="button" class="btn btn-ghost btn-sm" onclick="K.ui.toast('Pratinjau lampiran (demo)', '${esc(f)}', 'info')">Lihat</button></li>`).join('')}</ul>` : ''}</article>
          <article class="card"><h2 class="card__title">Diskusi</h2>
            <div class="comments mt-4" id="ap-comments">${commentsHTML(a)}</div>
            <form class="comment-form mt-4" id="ap-cform">${K.ui.avatar(K.currentUser().name, 'sm')}<textarea class="textarea" name="text" rows="2" placeholder="Tulis komentar… (@sebut nama)" aria-label="Komentar" style="min-height:44px"></textarea><button type="submit" aria-label="Kirim komentar" class="btn btn-secondary">${icon('send')}</button></form></article>
        </div>
        <aside class="stack">
          <article class="card"><h2 class="card__title">Informasi</h2><dl class="dl mt-4" style="grid-template-columns:100px 1fr"><dt>Pemohon</dt><dd>${esc(req.name)}</dd><dt>Tim</dt><dd>${esc(req.team || '—')}</dd><dt>Tipe</dt><dd>${esc(a.typeLabel)}</dd><dt>Tahap</dt><dd>${a.steps.filter(s => s.status === 'approved').length} / ${a.steps.length}</dd></dl>
            ${a.status === 'pending' && a.requester === ME ? `<button type="button" class="btn btn-danger-ghost btn-sm mt-4" data-cancel>${icon('ban')}<span>Batalkan pengajuan</span></button>` : ''}</article>
          <article class="card"><h2 class="card__title">Riwayat</h2><div class="timeline mt-4">
            <div class="timeline-item"><span class="timeline-item__icon">${icon('send')}</span><div class="timeline-item__body"><p><span class="fw-600">${esc(req.name)}</span> mengajukan</p><p class="timeline-item__time">${K.util.dateTime(a.createdAt)}</p></div></div>
            ${a.steps.filter(s => s.at).map(s => `<div class="timeline-item"><span class="timeline-item__icon" style="color:var(--${s.status === 'approved' ? 'success' : 'danger'})">${icon(s.status === 'approved' ? 'circle-check' : 'circle-x')}</span><div class="timeline-item__body"><p><span class="fw-600">${esc(K.lookup.user(s.approver).name)}</span> ${s.status === 'approved' ? 'menyetujui' : 'menolak'}</p>${s.comment ? `<p class="text-sm text-secondary mt-1">“${esc(s.comment)}”</p>` : ''}<p class="timeline-item__time">${K.util.dateTime(s.at)}</p></div></div>`).join('')}
          </div></article>
        </aside>
      </div>`;

    view.addEventListener('click', e => {
      const d = e.target.closest('[data-decide]');
      if (d) {
        const reject = d.dataset.decide === 'rejected';
        K.ui.modal({
          title: reject ? 'Tolak pengajuan?' : 'Setujui pengajuan?', size: 'sm', danger: reject,
          desc: `${esc(a.code)} · ${esc(a.title)}`,
          body: `<div class="field"><label class="label" for="dec-c">Komentar${reject ? '<span class="req">*</span>' : ' (opsional)'}</label><textarea class="textarea" id="dec-c" name="comment" ${reject ? 'required minlength="10" data-msg-required="Alasan penolakan wajib diisi." data-msg-minlength="Tulis alasan minimal 10 karakter."' : ''} placeholder="${reject ? 'Jelaskan alasan penolakan' : 'Catatan untuk pemohon'}"></textarea></div>`,
          submitLabel: reject ? 'Tolak' : 'Setujui',
          onSubmit: (data, f) => {
            if (!K.validate.form(f)) return false;
            K.approvals.decide(a, d.dataset.decide, data.comment);
            K.ui.toast(reject ? 'Pengajuan ditolak' : 'Pengajuan disetujui', a.code, reject ? 'warning' : 'success');
            K.router.render();
          },
        });
      }
      if (e.target.closest('[data-cancel]')) K.ui.confirm({ title: 'Batalkan pengajuan?', text: 'Pengajuan tidak dapat dilanjutkan setelah dibatalkan.', confirmLabel: 'Batalkan pengajuan' }).then(ok => { if (ok) { S.update('approvals', a.id, { status: 'cancelled' }); K.ui.toast('Pengajuan dibatalkan'); K.router.render(); } });
    });
    view.querySelector('#ap-cform').addEventListener('submit', e => {
      e.preventDefault(); const tx = e.target.text.value.trim(); if (!tx) return;
      a.comments.push({ by: ME, text: tx, at: new Date().toISOString() }); S.update('approvals', a.id, { comments: a.comments });
      view.querySelector('#ap-comments').innerHTML = commentsHTML(a); e.target.reset();
    });
  }
  const commentsHTML = a => a.comments.length ? a.comments.map(c => { const u = K.lookup.user(c.by); return `<div class="comment">${K.ui.avatar(u.name, 'sm')}<div class="comment__body"><p class="text-sm"><span class="fw-600">${esc(u.name)}</span> <span class="text-xs text-muted">${K.util.ago(c.at)}</span></p><p class="text-sm mt-1">${esc(c.text).replace(/@(\w+)/g, '<span class="text-primary fw-500">@$1</span>')}</p></div></div>`; }).join('') : '<p class="text-sm text-secondary">Belum ada komentar.</p>';

  /* ---------- FORM PENGAJUAN ---------- */
  function form(view) {
    K.setCrumb('Approvals', 'Pengajuan baru', '#/approvals');
    view.innerHTML = `<a href="#/approvals" class="back-link">${icon('arrow-left')}<span>Semua pengajuan</span></a>
      ${K.ui.pageHead({ title: 'Ajukan persetujuan', desc: 'Rantai persetujuan dibuat otomatis berdasarkan tipe dan nominal.' })}
      <form id="ap-form" class="grid grid-main-side" style="align-items:start" novalidate>
        <article class="card"><div class="form-grid">
          <div class="field span-2"><span class="label">Tipe pengajuan</span><div class="choice-grid" role="radiogroup" aria-label="Tipe">${S.all('approvalTypes').map((t, i) => `<label class="choice"><input type="radio" name="type" value="${t.id}" ${i === 0 ? 'checked' : ''}><span class="icon-tile">${icon(TYPE_ICON[t.id])}</span><span class="choice__title">${esc(t.name)}</span></label>`).join('')}</div></div>
          <div class="field span-2"><label class="label" for="ap-title">Judul<span class="req">*</span></label><input class="input" id="ap-title" name="title" required minlength="8" placeholder="mis. Pengadaan 5 monitor untuk tim Design"></div>
          <div class="field" data-money><label class="label" for="ap-amount">Nominal (Rp)<span class="req">*</span></label><input class="input tabular" id="ap-amount" name="amount" type="number" min="1" step="1000" required></div>
          <div class="field" data-date hidden><label class="label" for="ap-from">Tanggal</label><div class="flex gap-2"><input class="input" type="date" id="ap-from" name="from" aria-label="Mulai"><input class="input" type="date" name="to" aria-label="Selesai"></div></div>
          <div class="field span-2"><label class="label" for="ap-desc">Alasan & rincian<span class="req">*</span></label><textarea class="textarea" id="ap-desc" name="description" required minlength="20" data-msg-minlength="Jelaskan minimal 20 karakter agar approver punya konteks."></textarea></div>
          <div class="field span-2"><label class="label" for="ap-files">Lampiran</label><input class="input" type="file" id="ap-files" multiple></div>
        </div></article>
        <aside class="stack" style="position:sticky;top:calc(var(--topbar-h) + 16px)">
          <article class="card"><h2 class="card__title">Rantai persetujuan</h2><p class="card__desc">Diperbarui otomatis.</p><ol class="approval-chain approval-chain--v mt-4" id="ap-chain"></ol>
            <button type="submit" class="btn btn-primary btn-block mt-5">${icon('send')}<span>Kirim pengajuan</span></button></article>
        </aside>
      </form>`;
    const f = K.validate.attach(view.querySelector('#ap-form'));
    const chain = () => {
      const type = f.type.value, money = MONEY.includes(type);
      view.querySelector('[data-money]').hidden = !money; f.amount.disabled = !money;
      view.querySelector('[data-date]').hidden = type !== 'leave';
      const steps = K.approvals.chainFor(type, money ? Number(f.amount.value) || 0 : 0);
      view.querySelector('#ap-chain').innerHTML = steps.map((s, i) => `<li class="approval-chain__step is-waiting"><span class="approval-chain__dot">${i + 1}</span><div><p class="text-xs text-secondary">${esc(s.name)}</p><p class="fw-500">${esc(K.lookup.user(s.approver).name)}</p></div></li>`).join('');
    };
    f.addEventListener('change', chain); f.amount.addEventListener('input', chain); chain();
    f.addEventListener('submit', e => {
      e.preventDefault();
      if (!K.validate.form(f)) return;
      const d = K.util.formData(f), money = MONEY.includes(d.type), amount = money ? Number(d.amount) : 0;
      const steps = K.approvals.chainFor(d.type, amount).map((s, i) => ({ ...s, status: i === 0 ? 'pending' : 'waiting', at: null, comment: '' }));
      const n = 318 + S.count('approvals') - 9;
      const a = S.insert('approvals', { code: `APR-2026-${String(n + 1).padStart(4, '0')}`, type: d.type, typeLabel: S.all('approvalTypes').find(t => t.id === d.type).name, title: d.title, amount, requester: ME, status: 'pending', description: d.description, attachments: [...f.querySelector('#ap-files').files].map(x => x.name), steps, comments: [] }, { idPrefix: 'apr' });
      K.ui.toast('Pengajuan terkirim', `${a.code} · ${steps.length} tahap persetujuan`);
      K.router.go('approvals/' + a.id);
    });
  }
})(window.K);
