/* ==========================================================================
   K.validate — validasi form reusable berbasis atribut HTML.
   Aturan dibaca dari markup sehingga sama persis dengan aturan backend:
     required, minlength, maxlength, min, max, pattern, type="email|url|number"
     data-match="#id"      → harus sama dengan field lain (konfirmasi sandi)
     data-msg-*="…"        → pesan kustom (data-msg-required, data-msg-pattern, …)
   Pemakaian:
     K.validate.attach(form)            // validasi live saat blur/input
     if (!K.validate.form(form)) return // validasi saat submit
     K.validate.setErrors(form, { email: 'Email sudah terdaftar' }) // error dari server (422)
   Bisa dipakai tanpa app shell (halaman auth) karena tidak bergantung modul lain.
   ========================================================================== */
window.K = window.K || {};
(function (K) {
  'use strict';

  const messages = {
    required: 'Kolom ini wajib diisi.',
    email: 'Format email tidak valid.',
    url: 'URL harus diawali http:// atau https://.',
    minlength: n => `Minimal ${n} karakter.`,
    maxlength: n => `Maksimal ${n} karakter.`,
    min: n => `Nilai minimal ${n}.`,
    max: n => `Nilai maksimal ${n}.`,
    pattern: 'Format tidak sesuai.',
    match: 'Nilai tidak sama.',
    number: 'Harus berupa angka.',
  };

  function message(el) {
    const v = el.validity, d = el.dataset;
    if (v.valueMissing) return d.msgRequired || messages.required;
    if (v.typeMismatch) return d.msgType || messages[el.type] || messages.pattern;
    if (v.badInput) return messages.number;
    if (v.tooShort) return d.msgMinlength || messages.minlength(el.minLength);
    if (v.tooLong) return d.msgMaxlength || messages.maxlength(el.maxLength);
    if (v.rangeUnderflow) return d.msgMin || messages.min(el.min);
    if (v.rangeOverflow) return d.msgMax || messages.max(el.max);
    if (v.patternMismatch) return d.msgPattern || messages.pattern;
    if (v.customError) return el.validationMessage;
    return '';
  }

  function holder(el) { return el.closest('.field') || el.parentElement; }

  function show(el, msg) {
    const h = holder(el);
    let err = h.querySelector(':scope > .field-error');
    if (msg) {
      if (!err) {
        err = document.createElement('p');
        err.className = 'field-error';
        err.id = (el.id || el.name) + '_err';
        h.appendChild(err);
      }
      err.textContent = msg;
      el.setAttribute('aria-invalid', 'true');
      el.setAttribute('aria-errormessage', err.id);
    } else {
      err && err.remove();
      el.removeAttribute('aria-invalid');
      el.removeAttribute('aria-errormessage');
    }
  }

  function check(el) {
    if (!el.willValidate || el.type === 'hidden') return true;
    // Aturan data-match (mis. konfirmasi kata sandi)
    if (el.dataset.match) {
      const other = el.form.querySelector(el.dataset.match);
      el.setCustomValidity(other && el.value !== other.value ? (el.dataset.msgMatch || messages.match) : '');
    } else if (el.dataset.serverError) {
      el.setCustomValidity(''); delete el.dataset.serverError;
    }
    const msg = el.checkValidity() ? '' : message(el);
    show(el, msg);
    return !msg;
  }

  const fields = form => [...form.querySelectorAll('input, select, textarea')].filter(el => el.name && !el.disabled);

  K.validate = {
    field: check,
    /** Validasi seluruh form; fokus ke field pertama yang salah. */
    form(form) {
      let first = null;
      fields(form).forEach(el => { if (!check(el) && !first) first = el; });
      if (first) first.focus();
      return !first;
    },
    /** Validasi live: setelah blur pertama, field divalidasi ulang setiap diketik. */
    attach(form) {
      form.setAttribute('novalidate', '');
      form.addEventListener('focusout', e => { if (e.target.name) { e.target.dataset.touched = '1'; check(e.target); } });
      form.addEventListener('input', e => {
        if (e.target.dataset.touched) check(e.target);
        // Revalidasi field yang bergantung (data-match)
        form.querySelectorAll(`[data-match="#${e.target.id}"][data-touched]`).forEach(check);
      });
      form.addEventListener('reset', () => setTimeout(() => fields(form).forEach(el => { delete el.dataset.touched; show(el, ''); }), 0));
      return form;
    },
    /** Tampilkan error dari server (mis. respons Laravel 422: { errors: { email: ['…'] } }). */
    setErrors(form, errors) {
      let first = null;
      Object.entries(errors).forEach(([name, msg]) => {
        const el = form.elements[name]; if (!el || !el.setCustomValidity) return;
        const text = Array.isArray(msg) ? msg[0] : msg;
        el.setCustomValidity(text); el.dataset.serverError = '1'; el.dataset.touched = '1';
        show(el, text); first = first || el;
      });
      first && first.focus();
    },
    clear(form) { fields(form).forEach(el => { el.setCustomValidity(''); show(el, ''); }); },
  };
})(window.K);
