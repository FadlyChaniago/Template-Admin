/* ==========================================================================
   UI Kit → Forms & Wizard, Auth Pages (galeri)
   ========================================================================== */
(function (K) {
  'use strict';
  const { esc, num } = K.util;
  const { icon } = K.ui;

  /* ======================= FORMS & WIZARD ======================= */
  K.page('ui-forms', {
    render(view) {
      const cities = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Yogyakarta', 'Denpasar', 'Palembang', 'Balikpapan', 'Pontianak', 'Manado'];
      view.innerHTML = `${K.ui.pageHead({ title: 'Forms & Wizard', eyebrow: 'UI Kit', desc: 'Semua elemen input, validasi live berbasis atribut HTML, upload file, tag input, combobox, dan form multi-langkah.' })}
        <div class="stack">
        <div class="grid grid-2">
          <article class="card"><h2 class="card__title">Input dasar</h2><p class="card__desc">Label, placeholder, teks bantuan, dan status nonaktif.</p>
            <div class="stack mt-5" style="gap:14px">
              <div class="field"><label class="label" for="x-text">Teks</label><input class="input" id="x-text" placeholder="Nama lengkap"></div>
              <div class="field"><label class="label" for="x-icon">Dengan ikon</label><div class="input-icon">${icon('mail')}<input class="input" id="x-icon" type="email" placeholder="nama@perusahaan.id"></div></div>
              <div class="field"><label class="label" for="x-addon">Addon</label><div class="flex"><span class="input-addon">https://</span><input class="input" id="x-addon" placeholder="kontrol.id"></div></div>
              <div class="field"><label class="label" for="x-rp">Nominal</label><div class="flex"><span class="input-addon">Rp</span><input class="input tabular" id="x-rp" inputmode="numeric" placeholder="0" data-currency></div><p class="help">Diformat otomatis dengan pemisah ribuan.</p></div>
              <div class="field"><label class="label" for="x-pw">Kata sandi</label><div class="input-icon"><input class="input" id="x-pw" type="password" value="rahasia123" style="padding-right:44px"><span class="input-suffix">${K.ui.iconBtn('eye', 'Tampilkan kata sandi', 'data-peek="#x-pw"')}</span></div></div>
              <div class="field"><label class="label" for="x-dis">Nonaktif</label><input class="input" id="x-dis" value="Tidak dapat diubah" disabled></div>
              <div class="field"><label class="label" for="x-ta">Textarea dengan penghitung</label><textarea class="textarea" id="x-ta" maxlength="160" data-counter placeholder="Maksimal 160 karakter"></textarea><p class="help text-right" data-count-for="x-ta">0 / 160</p></div>
            </div></article>

          <article class="card"><h2 class="card__title">Pilihan</h2><p class="card__desc">Select, checkbox, radio, switch, range, tanggal & warna.</p>
            <div class="stack mt-5" style="gap:16px">
              <div class="form-grid">
                <div class="field"><label class="label" for="x-sel">Select</label><select class="select" id="x-sel"><option>Bulanan</option><option>Tahunan</option></select></div>
                <div class="field"><label class="label" for="x-date">Tanggal</label><input class="input" id="x-date" type="date" value="2026-10-20"></div>
                <div class="field"><label class="label" for="x-time">Waktu</label><input class="input" id="x-time" type="time" value="09:30"></div>
                <div class="field"><label class="label" for="x-color">Warna</label><div class="flex items-center gap-2"><input type="color" id="x-color" value="#2563EB" class="color-input"><span class="mono text-sm" data-color-out>#2563EB</span></div></div>
              </div>
              <fieldset class="field" style="border:0;padding:0;margin:0"><legend class="label" style="margin-bottom:8px">Checkbox</legend><div class="flex wrap gap-4"><label class="check"><input type="checkbox" checked> Email</label><label class="check"><input type="checkbox"> WhatsApp</label><label class="check"><input type="checkbox" disabled> SMS (segera)</label></div></fieldset>
              <fieldset class="field" style="border:0;padding:0;margin:0"><legend class="label" style="margin-bottom:8px">Radio</legend><div class="flex wrap gap-4"><label class="check"><input type="radio" name="x-r" checked> Harian</label><label class="check"><input type="radio" name="x-r"> Mingguan</label><label class="check"><input type="radio" name="x-r"> Bulanan</label></div></fieldset>
              <div class="flex wrap gap-4">${K.ui.switchEl({ name: 'x-sw1', checked: true, label: 'Notifikasi aktif' })}${K.ui.switchEl({ name: 'x-sw2', label: 'Mode senyap' })}${K.ui.switchEl({ name: 'x-sw3', label: 'Nonaktif', disabled: true })}</div>
              <div class="field"><label class="label" for="x-range">Range: <span class="tabular" data-range-out>60</span>%</label><input type="range" class="range" id="x-range" min="0" max="100" value="60"></div>
              <div class="field"><span class="label">Segmented</span><div class="segmented" role="group" aria-label="Contoh segmented"><button type="button" aria-pressed="true" data-seg>Hari</button><button type="button" aria-pressed="false" data-seg>Minggu</button><button type="button" aria-pressed="false" data-seg>Bulan</button></div></div>
            </div></article>
        </div>

        <div class="grid grid-2">
          <article class="card"><h2 class="card__title">Tag input</h2><p class="card__desc">Enter atau koma untuk menambah, Backspace untuk menghapus.</p>
            <div class="field mt-5"><label class="label" for="x-tags">Label</label><div class="tags-input" data-tags><span class="chip-list" data-tag-list></span><input id="x-tags" placeholder="Tambah tag…" autocomplete="off"></div><input type="hidden" name="tags" data-tag-value></div>
            <h2 class="card__title mt-6">Combobox (select dengan pencarian)</h2><p class="card__desc">Navigasi panah ↑↓, Enter memilih, Esc menutup.</p>
            <div class="field mt-4 combo" data-combo><label class="label" for="x-combo">Kota</label>
              <div class="input-icon">${icon('map-pin')}<input class="input" id="x-combo" role="combobox" aria-expanded="false" aria-controls="x-combo-list" aria-autocomplete="list" autocomplete="off" placeholder="Ketik nama kota…"></div>
              <ul class="combo__list" id="x-combo-list" role="listbox" hidden></ul></div>
          </article>
          <article class="card"><h2 class="card__title">Upload file</h2><p class="card__desc">Drag & drop, pratinjau gambar, validasi ukuran & tipe.</p>
            <label class="dropzone mt-5" for="x-file" data-drop>${icon('upload-cloud')}<span class="fw-600">Pilih atau seret file</span><span class="text-xs text-secondary">PNG, JPG, PDF · maks 2 MB · bisa banyak file</span><input type="file" id="x-file" class="sr-only" multiple accept=".png,.jpg,.jpeg,.pdf"></label>
            <ul class="file-list mt-4" data-file-list></ul></article>
        </div>

        <article class="card"><div class="demo-head"><div><h2 class="card__title">Validasi live</h2><p class="card__desc">Aturan ditulis sebagai atribut HTML (<code class="inline-code">required</code>, <code class="inline-code">minlength</code>, <code class="inline-code">pattern</code>, <code class="inline-code">data-match</code>) — sama dengan aturan di backend. Error muncul setelah field ditinggalkan.</p></div></div>
          <form class="form-grid mt-5" id="x-valid" novalidate>
            <div class="field"><label class="label" for="v-name">Nama<span class="req">*</span></label><input class="input" id="v-name" name="name" required minlength="3"></div>
            <div class="field"><label class="label" for="v-email">Email<span class="req">*</span></label><input class="input" id="v-email" name="email" type="email" required><p class="help">Coba isi <span class="mono">fadly@kontrol.id</span> untuk melihat error dari server (422).</p></div>
            <div class="field"><label class="label" for="v-phone">Telepon<span class="req">*</span></label><input class="input" id="v-phone" name="phone" required pattern="(\\+62|0)8[0-9]{8,11}" data-msg-pattern="Gunakan format 08xxxxxxxxxx atau +628xxxxxxxxxx." placeholder="08xxxxxxxxxx"></div>
            <div class="field"><label class="label" for="v-age">Umur</label><input class="input" id="v-age" name="age" type="number" min="17" max="70"></div>
            <div class="field"><label class="label" for="v-pass">Kata sandi<span class="req">*</span></label><input class="input" id="v-pass" name="password" type="password" required minlength="8"></div>
            <div class="field"><label class="label" for="v-pass2">Ulangi kata sandi<span class="req">*</span></label><input class="input" id="v-pass2" name="password_confirmation" type="password" required data-match="#v-pass" data-msg-match="Konfirmasi kata sandi tidak cocok."></div>
            <div class="field span-2"><label class="check"><input type="checkbox" name="terms" required data-msg-required="Anda harus menyetujui syarat & ketentuan."> Saya menyetujui syarat &amp; ketentuan</label></div>
            <div class="span-2 btn-group"><button type="submit" class="btn btn-primary">${icon('send')}<span>Kirim</span></button><button type="reset" class="btn btn-ghost">Reset</button></div>
          </form>
          <div class="code mt-5">${esc(`K.validate.attach(form);                 // validasi live
form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!K.validate.form(form)) return;     // validasi sisi klien
  const res = await fetch('/api/users', { method: 'POST', body: new FormData(form) });
  if (res.status === 422) K.validate.setErrors(form, (await res.json()).errors);
});`)}</div>
        </article>

        <article class="card"><h2 class="card__title">Form multi-langkah (wizard)</h2><p class="card__desc">Validasi per langkah, bisa kembali tanpa kehilangan data, ringkasan sebelum kirim.</p>
          <ol class="stepper mt-5" id="wz-steps">${['Akun', 'Organisasi', 'Paket', 'Tinjau'].map((s, i) => `<li class="stepper__item" data-step="${i}"><span class="stepper__dot">${i + 1}</span><span class="stepper__label">${s}</span></li>`).join('')}</ol>
          <form id="wz" class="mt-6" novalidate>
            <section data-panel="0" class="form-grid">
              <div class="field"><label class="label" for="wz-name">Nama lengkap<span class="req">*</span></label><input class="input" id="wz-name" name="name" required minlength="3"></div>
              <div class="field"><label class="label" for="wz-email">Email kerja<span class="req">*</span></label><input class="input" id="wz-email" name="email" type="email" required></div>
            </section>
            <section data-panel="1" class="form-grid" hidden>
              <div class="field"><label class="label" for="wz-org">Nama organisasi<span class="req">*</span></label><input class="input" id="wz-org" name="org" required></div>
              <div class="field"><label class="label" for="wz-size">Jumlah karyawan</label><select class="select" id="wz-size" name="size"><option>1–10</option><option>11–50</option><option selected>51–200</option><option>200+</option></select></div>
              <div class="field span-2"><label class="label" for="wz-domain">Domain<span class="req">*</span></label><div class="flex"><span class="input-addon">https://</span><input class="input" id="wz-domain" name="domain" required pattern="[a-z0-9\\-]+(\\.[a-z0-9\\-]+)+" data-msg-pattern="Contoh: perusahaan.co.id"></div></div>
            </section>
            <section data-panel="2" hidden>
              <div class="choice-grid" role="radiogroup" aria-label="Paket">${[['Starter', 'Rp450 rb/bln'], ['Professional', 'Rp1,25 jt/bln'], ['Enterprise', 'Rp2,85 jt/bln']].map(([p, h], i) => `<label class="choice"><input type="radio" name="plan" value="${p}" ${i === 1 ? 'checked' : ''}><span class="choice__title" style="margin-top:0">${p}</span><span class="choice__desc">${h}</span></label>`).join('')}</div>
              <label class="check mt-4">${''}<input type="checkbox" name="annual"> Tagih tahunan (hemat 20%)</label>
            </section>
            <section data-panel="3" hidden><dl class="dl" id="wz-review"></dl></section>
            <div class="flex justify-between items-center mt-6 wrap gap-3"><button type="button" class="btn btn-secondary" id="wz-prev">${icon('chevron-left')}<span>Kembali</span></button><span class="text-xs text-secondary" id="wz-info"></span><button type="submit" class="btn btn-primary" id="wz-next"><span>Lanjut</span>${icon('chevron-right')}</button></div>
          </form>
        </article>
        </div>`;
      const $ = s => view.querySelector(s);

      // Format mata uang saat mengetik
      $('[data-currency]').addEventListener('input', e => { const d = e.target.value.replace(/\D/g, ''); e.target.value = d ? Number(d).toLocaleString('id-ID') : ''; });
      view.addEventListener('click', e => {
        const p = e.target.closest('[data-peek]'); if (p) { const i = view.querySelector(p.dataset.peek); i.type = i.type === 'password' ? 'text' : 'password'; p.innerHTML = icon(i.type === 'password' ? 'eye' : 'eye-off'); }
        const s = e.target.closest('[data-seg]'); if (s) s.parentElement.querySelectorAll('[data-seg]').forEach(x => x.setAttribute('aria-pressed', x === s));
      });
      $('[data-counter]').addEventListener('input', e => { $(`[data-count-for="${e.target.id}"]`).textContent = `${e.target.value.length} / ${e.target.maxLength}`; });
      $('#x-range').addEventListener('input', e => { $('[data-range-out]').textContent = e.target.value; });
      $('#x-color').addEventListener('input', e => { $('[data-color-out]').textContent = e.target.value.toUpperCase(); });

      // Tag input
      const tags = new Set(['laporan', 'atm']);
      const tagBox = $('[data-tags]'), tagIn = $('#x-tags');
      const drawTags = () => { $('[data-tag-list]').innerHTML = [...tags].map(t => `<span class="chip">#${esc(t)}<button type="button" data-rm-tag="${esc(t)}" aria-label="Hapus ${esc(t)}">${icon('x')}</button></span>`).join(''); $('[data-tag-value]').value = [...tags].join(','); };
      tagIn.addEventListener('keydown', e => {
        if ((e.key === 'Enter' || e.key === ',') && tagIn.value.trim()) { e.preventDefault(); tags.add(K.util.slugify(tagIn.value)); tagIn.value = ''; drawTags(); }
        else if (e.key === 'Backspace' && !tagIn.value && tags.size) { tags.delete([...tags].pop()); drawTags(); }
      });
      tagBox.addEventListener('click', e => { const b = e.target.closest('[data-rm-tag]'); if (b) { tags.delete(b.dataset.rmTag); drawTags(); } tagIn.focus(); });
      drawTags();

      // Combobox
      const cIn = $('#x-combo'), cList = $('#x-combo-list'); let cActive = 0, cItems = [];
      const cDraw = () => {
        const q = cIn.value.toLowerCase();
        cItems = cities.filter(c => c.toLowerCase().includes(q));
        cList.hidden = !cItems.length; cIn.setAttribute('aria-expanded', !cList.hidden);
        cList.innerHTML = cItems.map((c, i) => `<li role="option" id="cb-${i}" class="combo__opt" aria-selected="${i === cActive}" data-val="${c}">${c}</li>`).join('');
        cIn.setAttribute('aria-activedescendant', cItems.length ? 'cb-' + cActive : '');
      };
      const cPick = v => { cIn.value = v; cList.hidden = true; cIn.setAttribute('aria-expanded', 'false'); };
      cIn.addEventListener('focus', () => { cActive = 0; cDraw(); });
      cIn.addEventListener('input', () => { cActive = 0; cDraw(); });
      cIn.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') { e.preventDefault(); cActive = Math.min(cItems.length - 1, cActive + 1); cDraw(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); cActive = Math.max(0, cActive - 1); cDraw(); }
        else if (e.key === 'Enter' && !cList.hidden) { e.preventDefault(); cPick(cItems[cActive]); }
        else if (e.key === 'Escape') { cList.hidden = true; }
      });
      cList.addEventListener('mousedown', e => { const o = e.target.closest('[data-val]'); if (o) { e.preventDefault(); cPick(o.dataset.val); } });
      cIn.addEventListener('blur', () => setTimeout(() => { cList.hidden = true; cIn.setAttribute('aria-expanded', 'false'); }, 100));

      // Upload file
      const fileList = $('[data-file-list]'), MAX = 2 * 1024 * 1024;
      const addFiles = files => [...files].forEach(f => {
        const ok = /\.(png|jpe?g|pdf)$/i.test(f.name), big = f.size > MAX;
        const li = document.createElement('li'); li.className = 'file-item' + (ok && !big ? '' : ' is-error');
        const thumb = ok && f.type.startsWith('image') ? `<img src="${URL.createObjectURL(f)}" alt="">` : icon(ok ? 'file-text' : 'file-x');
        li.innerHTML = `<span class="file-item__thumb">${thumb}</span><div class="flex-1"><p class="fw-500 truncate">${esc(f.name)}</p><p class="text-xs ${ok && !big ? 'text-secondary' : 'text-danger'}">${!ok ? 'Tipe file tidak didukung' : big ? `Terlalu besar (${K.util.bytes(f.size)})` : K.util.bytes(f.size)}</p>${ok && !big ? '<div class="mt-2">' + K.ui.progress(0) + '</div>' : ''}</div>${K.ui.iconBtn('x', 'Hapus file', 'data-rm-file', 'is-danger')}`;
        fileList.appendChild(li);
        if (ok && !big) { let p = 0; const bar = li.querySelector('.progress > span'); const t = setInterval(() => { p = Math.min(100, p + 8 + Math.random() * 20); bar.style.width = p + '%'; if (p >= 100) { clearInterval(t); li.querySelector('.progress').outerHTML = '<p class="text-xs text-success">Terunggah</p>'; } }, 180); }
      });
      $('#x-file').addEventListener('change', e => { addFiles(e.target.files); e.target.value = ''; });
      const drop = $('[data-drop]');
      ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('is-over'); }));
      ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('is-over'); }));
      drop.addEventListener('drop', e => addFiles(e.dataTransfer.files));
      fileList.addEventListener('click', e => { const b = e.target.closest('[data-rm-file]'); if (b) b.closest('li').remove(); });

      // Validasi live
      const vf = K.validate.attach($('#x-valid'));
      vf.addEventListener('submit', e => {
        e.preventDefault();
        if (!K.validate.form(vf)) { K.ui.toast('Periksa kembali isian', '', 'error', 2200); return; }
        const btn = vf.querySelector('[type=submit]'); btn.disabled = true;
        setTimeout(() => { // simulasi respons server
          btn.disabled = false;
          if (vf.email.value.toLowerCase() === 'fadly@kontrol.id') { K.validate.setErrors(vf, { email: ['Email sudah terdaftar.'] }); K.ui.toast('Server menolak data (422)', 'Lihat pesan di kolom email.', 'error'); }
          else { K.ui.toast('Form valid & terkirim', vf.name.value); vf.reset(); }
        }, 600);
      });

      // Wizard
      const wz = K.validate.attach($('#wz')); let step = 0; const last = 3;
      const drawWz = () => {
        wz.querySelectorAll('[data-panel]').forEach(p => { p.hidden = +p.dataset.panel !== step; });
        view.querySelectorAll('#wz-steps [data-step]').forEach(li => { const i = +li.dataset.step; li.classList.toggle('is-done', i < step); li.classList.toggle('is-current', i === step); li.querySelector('.stepper__dot').innerHTML = i < step ? icon('check') : i + 1; i === step ? li.setAttribute('aria-current', 'step') : li.removeAttribute('aria-current'); });
        $('#wz-prev').disabled = step === 0;
        $('#wz-next').innerHTML = step === last ? `${icon('check')}<span>Kirim pendaftaran</span>` : `<span>Lanjut</span>${icon('chevron-right')}`;
        $('#wz-info').textContent = `Langkah ${step + 1} dari ${last + 1}`;
        if (step === last) { const d = K.util.formData(wz); $('#wz-review').innerHTML = `<dt>Nama</dt><dd>${esc(d.name)}</dd><dt>Email</dt><dd>${esc(d.email)}</dd><dt>Organisasi</dt><dd>${esc(d.org)} (${esc(d.size)} karyawan)</dd><dt>Domain</dt><dd>${esc(d.domain)}</dd><dt>Paket</dt><dd>${esc(d.plan)} · ${d.annual ? 'Tahunan' : 'Bulanan'}</dd>`; }
      };
      const panelValid = () => { const p = wz.querySelector(`[data-panel="${step}"]`); let ok = true, first; p.querySelectorAll('input, select').forEach(el => { if (!K.validate.field(el)) { ok = false; first = first || el; } }); first && first.focus(); return ok; };
      $('#wz-prev').addEventListener('click', () => { step = Math.max(0, step - 1); drawWz(); });
      wz.addEventListener('submit', e => {
        e.preventDefault();
        if (step < last) { if (panelValid()) { step++; drawWz(); } return; }
        K.ui.toast('Pendaftaran terkirim', K.util.formData(wz).org); wz.reset(); step = 0; drawWz();
      });
      drawWz();
    },
  });

  /* ======================= AUTH PAGES (galeri) ======================= */
  K.page('ui-auth', {
    render(view) {
      const pages = [
        ['login.html', 'Login', 'log-in', 'Email + kata sandi, ingat saya, SSO.'],
        ['register.html', 'Register', 'user-plus', 'Daftar akun dengan meter kekuatan sandi.'],
        ['forgot-password.html', 'Lupa kata sandi', 'key-round', 'Kirim tautan reset ke email.'],
        ['reset-password.html', 'Reset kata sandi', 'lock-keyhole', 'Atur sandi baru + konfirmasi.'],
        ['verify-email.html', 'Verifikasi email', 'mail-check', 'Instruksi cek inbox + kirim ulang (cooldown).'],
        ['two-factor.html', 'Verifikasi 2FA / OTP', 'shield-check', '6 kotak OTP, tempel otomatis, kode cadangan.'],
        ['lock-screen.html', 'Lock screen', 'lock', 'Kunci sesi idle, masuk lagi dengan sandi.'],
        ['error.html?code=500', 'Error standalone', 'server-crash', 'Halaman error untuk web server.'],
      ];
      view.innerHTML = `${K.ui.pageHead({ title: 'Auth Pages', eyebrow: 'UI Kit', desc: 'Halaman autentikasi standalone (tanpa app shell) — siap dipindah ke Blade/Jinja/EJS. Semua memakai tema & validasi yang sama.' })}
        <div class="grid grid-4">${pages.map(([href, t, ic, d]) => `<a href="${href}" target="_blank" rel="noopener" class="card card--hover auth-card"><span class="icon-tile icon-tile--lg">${icon(ic)}</span><h2 class="card__title mt-4">${t}</h2><p class="card__desc">${d}</p><p class="text-xs text-primary mt-3 flex items-center gap-1">${icon('external-link', 'i-12')} ${href}</p></a>`).join('')}</div>
        <div class="alert alert--info mt-4">${icon('info')}<div><p class="alert__title">Catatan keamanan untuk implementasi</p><p class="alert__text">Halaman ini hanya UI. Di backend: rate limit login/OTP, token reset sekali pakai dengan masa berlaku singkat, pesan error yang tidak membocorkan apakah email terdaftar, dan sesi di cookie HttpOnly + SameSite.</p></div></div>`;
    },
  });
})(window.K);
