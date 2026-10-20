/* ==========================================================================
   K.store — penyimpanan data sederhana (in-memory + localStorage)
   API mirip repository sehingga mudah diganti fetch() ke backend:
     K.store.all('users')            → array
     K.store.get('users', id)        → object | undefined
     K.store.insert('users', obj)    → object baru (id dibuat otomatis)
     K.store.update('users', id, patch)
     K.store.remove('users', id | [ids])
     K.store.settings() / K.store.saveSettings(patch)
     K.store.on('change', fn)        → event saat data berubah
   ========================================================================== */
(function (K) {
  'use strict';
  const KEY = 'kontrol:db:v1';
  const listeners = new Set();
  let db;

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        db = JSON.parse(raw);
        // Koleksi baru dari versi template berikutnya ditambahkan tanpa menghapus data lama
        Object.keys(K.seed).forEach(k => { if (!(k in db)) db[k] = clone(K.seed[k]); });
        return;
      }
    } catch { /* storage diblokir atau korup → pakai seed */ }
    db = clone(K.seed);
  }

  const persist = K.util.debounce(() => {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* kuota penuh / private mode */ }
  }, 150);

  function emit(collection, type, payload) {
    persist();
    listeners.forEach(fn => { try { fn({ collection, type, payload }); } catch (e) { console.error(e); } });
  }

  const store = {
    all(name) { return db[name] || []; },
    get(name, id) { return (db[name] || []).find(x => x.id === id); },
    find(name, pred) { return (db[name] || []).filter(pred); },
    count(name, pred) { return pred ? store.find(name, pred).length : store.all(name).length; },

    insert(name, obj, { prepend = true, idPrefix } = {}) {
      const item = { id: K.util.uid(idPrefix || name.slice(0, 3)), createdAt: new Date().toISOString(), ...obj };
      db[name] = db[name] || [];
      prepend ? db[name].unshift(item) : db[name].push(item);
      emit(name, 'insert', item);
      return item;
    },

    update(name, id, patch) {
      const item = store.get(name, id);
      if (!item) return null;
      Object.assign(item, patch);
      emit(name, 'update', item);
      return item;
    },

    /** Update banyak item sekaligus (satu event). */
    updateWhere(name, pred, patch) {
      const items = (db[name] || []).filter(pred);
      items.forEach(it => Object.assign(it, typeof patch === 'function' ? patch(it) : patch));
      emit(name, 'update', items);
      return items.length;
    },

    remove(name, ids) {
      const set = new Set([].concat(ids));
      const before = (db[name] || []).length;
      db[name] = (db[name] || []).filter(x => !set.has(x.id));
      emit(name, 'remove', [...set]);
      return before - db[name].length;
    },

    settings() { return db.settings; },
    saveSettings(patch) { Object.assign(db.settings, patch); emit('settings', 'update', db.settings); return db.settings; },

    /** Tambah entri audit log setiap aksi penting — meniru perilaku backend. */
    audit(action, label, resource, severity = 'info', resourceType = 'Settings') {
      db.auditLogs.unshift({
        id: 'aud_' + Date.now(), action, label, severity, resourceType, resource,
        actorId: 'usr_me', ip: '103.28.12.44', userAgent: 'Chrome 129 · macOS', createdAt: new Date().toISOString(),
      });
      persist();
    },

    on(_evt, fn) { listeners.add(fn); return () => listeners.delete(fn); },

    reset() {
      try { localStorage.removeItem(KEY); } catch {}
      db = clone(K.seed);
      emit('*', 'reset');
    },
  };

  load();
  K.store = store;

  /** Helper relasi yang sering dipakai. */
  K.lookup = {
    user: id => store.get('users', id) || { name: 'Pengguna dihapus', email: '-', id },
    role: id => store.get('roles', id) || { name: '—' },
    category: id => store.get('categories', id),
    product: id => store.get('products', id) || { name: '—' },
  };
})(window.K);
