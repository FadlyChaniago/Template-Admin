/* ==========================================================================
   Tools → Inbox (omnichannel: WhatsApp, Email, Internal)
   Tiga panel: daftar percakapan · thread · info kontak.
   Mobile: daftar ↔ thread bergantian.
   Backend: GET /conversations, GET /conversations/:id/messages,
            POST /conversations/:id/messages (lalu WebSocket/SSE untuk pesan masuk)
   ========================================================================== */
(function (K) {
  'use strict';
  const { esc } = K.util;
  const { icon } = K.ui;
  const S = K.store;
  const CH = { whatsapp: ['WhatsApp', 'message-circle', 'emerald'], email: ['Email', 'mail', 'blue'], internal: ['Internal', 'hash', 'violet'] };
  const QUICK = ['Terima kasih, kami cek terlebih dahulu ya.', 'Mohon kirimkan nomor invoice / ID transaksi.', 'Masalah sudah kami teruskan ke tim teknis.', 'Apakah ada lagi yang bisa kami bantu?'];
  const AUTO = ['Baik, terima kasih atas responnya 🙏', 'Oke, saya tunggu kabarnya.', 'Siap, nomornya INV-2026-1041.', 'Sudah aman sekarang, terima kasih!'];

  K.page('inbox', {
    render(view) {
      let active = S.all('conversations')[0]?.id, filter = 'all', q = '';
      const timers = new Set();
      view.innerHTML = `${K.ui.pageHead({ title: 'Inbox', eyebrow: 'Tools', desc: 'Satu kotak masuk untuk WhatsApp, email, dan pesan internal tim.' })}
        <div class="inbox card card--flush" id="ib">
          <aside class="inbox__list">
            <div class="inbox__list-head">
              <label class="input-icon">${icon('search')}<input type="search" class="input input-sm" placeholder="Cari percakapan…" aria-label="Cari percakapan" id="ib-q"></label>
              <div class="tabs mt-3" role="tablist" aria-label="Filter kanal" id="ib-tabs"></div>
            </div>
            <ul class="inbox__convs" id="ib-convs" role="listbox" aria-label="Percakapan"></ul>
          </aside>
          <section class="inbox__thread" id="ib-thread" aria-live="polite"></section>
          <aside class="inbox__info" id="ib-info"></aside>
        </div>`;
      const $ = s => view.querySelector(s);

      function drawList() {
        const all = S.all('conversations').slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        const count = f => f === 'unread' ? all.filter(c => c.unread).length : f === 'all' ? all.length : all.filter(c => c.channel === f).length;
        $('#ib-tabs').innerHTML = [['all', 'Semua'], ['unread', 'Belum dibaca'], ['whatsapp', 'WA'], ['email', 'Email'], ['internal', 'Internal']].map(([k, l]) => `<button type="button" role="tab" class="tab" data-f="${k}" aria-selected="${k === filter}">${l} <span class="count-pill">${count(k)}</span></button>`).join('');
        const list = all.filter(c => (filter === 'all' || (filter === 'unread' ? c.unread : c.channel === filter)) && (!q || (c.name + ' ' + c.messages.map(m => m.text).join(' ')).toLowerCase().includes(q)));
        $('#ib-convs').innerHTML = list.map(c => {
          const last = c.messages[c.messages.length - 1];
          const [chName, chIcon, chTone] = CH[c.channel];
          return `<li role="none"><button type="button" class="conv ${c.id === active ? 'is-active' : ''} ${c.unread ? 'is-unread' : ''}" data-conv="${c.id}" role="option" aria-selected="${c.id === active}">
            <span class="conv__avatar">${K.ui.avatar(c.name)}<span class="conv__ch" data-c="${chTone}" title="${chName}">${icon(chIcon)}</span></span>
            <span class="flex-1" style="min-width:0"><span class="flex justify-between gap-2"><span class="conv__name truncate">${esc(c.name)}</span><span class="conv__time">${K.util.ago(c.updatedAt).replace(' lalu', '')}</span></span>
            <span class="flex justify-between gap-2 mt-1"><span class="conv__preview truncate">${last.dir === 'out' ? 'Anda: ' : ''}${esc(last.text)}</span>${c.unread ? `<span class="conv__badge">${c.unread}</span>` : c.starred ? icon('star', 'star-on') : ''}</span></span>
          </button></li>`;
        }).join('') || `<li>${K.ui.empty({ icon: 'inbox', title: 'Tidak ada percakapan' })}</li>`;
      }

      function drawThread() {
        const c = S.get('conversations', active);
        if (!c) { $('#ib-thread').innerHTML = K.ui.empty({ icon: 'message-square', title: 'Pilih percakapan' }); $('#ib-info').innerHTML = ''; return; }
        const [chName, chIcon, chTone] = CH[c.channel];
        let lastDay = '';
        $('#ib-thread').innerHTML = `
          <header class="thread__head">
            <button type="button" class="icon-btn thread__back" data-back aria-label="Kembali ke daftar">${icon('arrow-left')}</button>
            ${K.ui.avatar(c.name)}
            <div class="flex-1" style="min-width:0"><p class="fw-600 truncate">${esc(c.name)}</p><p class="text-xs text-secondary flex items-center gap-1">${icon(chIcon, 'i-12')}${chName} · ${c.status === 'pending' ? 'Menunggu' : 'Terbuka'}</p></div>
            ${K.ui.iconBtn(c.starred ? 'star-off' : 'star', c.starred ? 'Hapus bintang' : 'Beri bintang', 'data-star')}
            ${K.ui.iconBtn('check-check', 'Tandai selesai', 'data-resolve')}
            ${K.ui.iconBtn('panel-right', 'Info kontak', 'data-info-toggle')}
          </header>
          <div class="thread__msgs" id="ib-msgs">${c.messages.map(m => {
            const d = new Date(m.at), dk = d.toDateString();
            const sep = dk !== lastDay ? `<p class="thread__day"><span>${K.util.date(m.at, { weekday: 'long', day: 'numeric', month: 'short' })}</span></p>` : ''; lastDay = dk;
            return `${sep}<div class="msg msg--${m.dir}"><div class="msg__bubble">${esc(m.text).replace(/\n/g, '<br>')}${m.file ? `<span class="msg__file">${icon('paperclip', 'i-14')}${esc(m.file)}</span>` : ''}</div><span class="msg__meta">${K.util.time(m.at).replace(' WIB', '')}${m.dir === 'out' ? ' ' + icon('check-check', 'i-12') : ''}</span></div>`;
          }).join('')}<div class="msg msg--in" id="ib-typing" hidden><div class="msg__bubble typing"><span></span><span></span><span></span></div></div></div>
          <div class="thread__quick">${QUICK.map(t => `<button type="button" class="chip" data-quick="${esc(t)}">${esc(t.length > 34 ? t.slice(0, 32) + '…' : t)}</button>`).join('')}</div>
          <form class="composer" id="ib-form">
            <label class="icon-btn" style="cursor:pointer" title="Lampirkan file">${icon('paperclip')}<input type="file" class="sr-only" id="ib-file" aria-label="Lampirkan file"></label>
            <div class="flex-1" style="min-width:0"><span class="chip" id="ib-att" hidden></span><textarea class="composer__input" id="ib-text" rows="1" placeholder="Tulis balasan… (Enter kirim, Shift+Enter baris baru)" aria-label="Tulis pesan"></textarea></div>
            <button type="submit" class="btn btn-primary" aria-label="Kirim">${icon('send-horizontal')}</button>
          </form>`;
        const msgs = $('#ib-msgs'); msgs.scrollTop = msgs.scrollHeight;
        const u = K.lookup.user(c.assignee);
        $('#ib-info').innerHTML = `<div style="text-align:center">${K.ui.avatar(c.name, 'xl')}<p class="fw-600 mt-3">${esc(c.name)}</p><p class="text-xs text-secondary">${esc(c.phone || c.email || 'Anggota workspace')}</p>
          <span class="badge badge--plain mt-2" style="background:var(--av-${chTone}-bg);color:var(--av-${chTone}-fg)">${chName}</span></div>
          <dl class="dl mt-5" style="grid-template-columns:90px 1fr"><dt>Status</dt><dd>${K.ui.badge(c.status === 'pending' ? 'pending' : 'active', c.status === 'pending' ? 'Menunggu' : 'Terbuka')}</dd><dt>Ditangani</dt><dd>${esc(u.name)}</dd><dt>Pesan</dt><dd>${c.messages.length}</dd></dl>
          <div class="field mt-4"><label class="label" for="ib-assign">Alihkan ke</label><select class="select select-sm" id="ib-assign">${S.find('users', x => x.status === 'active').slice(0, 12).map(x => `<option value="${x.id}" ${x.id === c.assignee ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
          <div class="field mt-4"><label class="label" for="ib-note">Catatan internal</label><textarea class="textarea" id="ib-note" style="min-height:70px" placeholder="Hanya terlihat oleh tim">${esc(c.note || '')}</textarea></div>`;
        if (c.unread) { S.update('conversations', c.id, { unread: 0 }); drawList(); }
        bindThread(c);
      }

      function bindThread(c) {
        const form = $('#ib-form'), text = $('#ib-text');
        let attachment = null;
        const grow = () => { text.style.height = 'auto'; text.style.height = Math.min(140, text.scrollHeight) + 'px'; };
        text.addEventListener('input', grow);
        text.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
        $('#ib-file').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; attachment = f.name; const a = $('#ib-att'); a.hidden = false; a.innerHTML = `${icon('paperclip')}${esc(f.name)}<button type="button" aria-label="Hapus lampiran">${icon('x')}</button>`; a.querySelector('button').onclick = () => { attachment = null; a.hidden = true; }; });
        form.addEventListener('submit', e => {
          e.preventDefault();
          const v = text.value.trim(); if (!v && !attachment) return;
          c.messages.push({ id: K.util.uid('msg'), dir: 'out', text: v || '(lampiran)', file: attachment, at: new Date().toISOString(), author: 'usr_me' });
          S.update('conversations', c.id, { messages: c.messages, updatedAt: new Date().toISOString() });
          drawList(); drawThread();
          // Simulasi balasan pelanggan (di produksi: event dari WebSocket/SSE)
          if (c.channel !== 'internal' || Math.random() > 0.3) {
            const t1 = setTimeout(() => { const ty = view.querySelector('#ib-typing'); if (ty && active === c.id) { ty.hidden = false; const m = $('#ib-msgs'); m.scrollTop = m.scrollHeight; } }, 900);
            const t2 = setTimeout(() => {
              c.messages.push({ id: K.util.uid('msg'), dir: 'in', text: AUTO[Math.floor(Math.random() * AUTO.length)], at: new Date().toISOString() });
              S.update('conversations', c.id, { messages: c.messages, updatedAt: new Date().toISOString(), unread: active === c.id ? 0 : (c.unread || 0) + 1 });
              if (active === c.id && view.isConnected) { drawList(); drawThread(); } else if (view.isConnected) drawList();
              else K.ui.toast('Pesan baru dari ' + c.name, '', 'info');
            }, 2600);
            timers.add(t1); timers.add(t2);
          }
        });
        $('#ib-assign').addEventListener('change', e => { S.update('conversations', c.id, { assignee: e.target.value }); K.ui.toast('Percakapan dialihkan', K.lookup.user(e.target.value).name); });
        $('#ib-note').addEventListener('change', e => { S.update('conversations', c.id, { note: e.target.value }); K.ui.toast('Catatan disimpan', '', 'success', 1500); });
        text.focus({ preventScroll: true });
      }

      view.addEventListener('click', e => {
        const t = e.target;
        const cv = t.closest('[data-conv]'); if (cv) { active = cv.dataset.conv; $('#ib').classList.add('show-thread'); drawList(); drawThread(); return; }
        const f = t.closest('[data-f]'); if (f) { filter = f.dataset.f; drawList(); return; }
        if (t.closest('[data-back]')) { $('#ib').classList.remove('show-thread'); return; }
        if (t.closest('[data-info-toggle]')) { $('#ib').classList.toggle('hide-info'); return; }
        const qk = t.closest('[data-quick]'); if (qk) { const tx = $('#ib-text'); tx.value = qk.dataset.quick; tx.focus(); return; }
        const c = S.get('conversations', active);
        if (t.closest('[data-star]')) { S.update('conversations', c.id, { starred: !c.starred }); drawList(); drawThread(); }
        if (t.closest('[data-resolve]')) { S.update('conversations', c.id, { status: 'open', unread: 0 }); K.ui.toast('Percakapan ditandai selesai', c.name); }
      });
      $('#ib-q').addEventListener('input', K.util.debounce(e => { q = e.target.value.toLowerCase().trim(); drawList(); }, 120));
      drawList(); drawThread();
      return () => timers.forEach(clearTimeout);
    },
  });
})(window.K);
