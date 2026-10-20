# Arsitektur

```
index.html ── vendor (lucide, chart.js) ── config.js
     │
     ├── core/   (tidak tahu apa pun soal modul bisnis)
     │    utils → i18n (+ kamus id/en) → errors-data → validate
     │    → data, data-v3, data-v4 (seed) → store → ui → table → charts
     │    → api → session → app (nav, router, tema, palette, izin)
     │
     ├── pages/  (satu file per grup sidebar; hanya memakai API core)
     └── main.js (boot)
```

Semua script klasik dengan `defer` (bukan ES module) agar bisa dibuka lewat `file://`. Semua API diekspos di satu namespace global `window.K`.

## Kenapa dipisah begini?

| Lapisan | Tanggung jawab | Manfaat |
|---|---|---|
| `config.js` | Nilai lingkungan | Pindah demo → produksi cukup ubah 1 file |
| `core/` | Infrastruktur UI & data | Bisa dipakai ulang lintas proyek |
| `core/api.js` | Satu pintu akses data | Halaman tidak peduli data dari seed atau server |
| `pages/` | Logika tampilan per modul | Menambah/menghapus modul tidak menyentuh core |

## Router

Hash router: `#/users/usr_001/edit` → halaman `users`, `route.params = ['usr_001', 'edit']`.

```js
K.page('users', {
  render(view, route) {
    // view = elemen <div> baru setiap render (listener lama otomatis hilang)
    return () => { /* cleanup opsional: clearInterval, map.remove(), dll. */ };
  },
});
```

Setiap render, router otomatis:
1. menutup `<dialog>` yang masih terbuka;
2. memanggil cleanup halaman sebelumnya;
3. memeriksa `perm` item nav → halaman 403 bila tidak berizin;
4. menjalankan `K.applyPerms(view)` (lihat [permissions.md](permissions.md));
5. mencatat ke *halaman terakhir* (palette) dan memfokuskan judul halaman (screen reader).

## Store (mode demo)

`K.store` = repository in-memory yang dipersist ke `localStorage` (`kontrol:db:v1`). Seed baru di versi berikutnya otomatis digabung tanpa menghapus data lama.

| Method | Keterangan |
|---|---|
| `all(c)`, `get(c, id)`, `find(c, fn)`, `count(c)` | Baca |
| `insert(c, row)`, `update(c, id, patch)`, `updateWhere`, `remove(c, ids)` | Tulis (memicu event) |
| `settings()`, `saveSettings(patch)` | Pengaturan workspace |
| `audit(action, target, meta)` | Tambah audit log |
| `on(c, fn)` | Berlangganan perubahan |

Di mode `api`, halaman baru sebaiknya memakai `K.api` (bukan `K.store`) — lihat `pages/example.js`.

## Penyimpanan browser

| Kunci | Isi |
|---|---|
| `kontrol:db:v1` | Data demo |
| `kontrol:theme`, `kontrol:layout`, `kontrol:sidebar` | Preferensi tampilan |
| `kontrol:locale` | Bahasa |
| `kontrol:favs`, `kontrol:recent` | Favorit & halaman terakhir |
| `kontrol:lastActivity` | Sinkron idle antar tab |
| `sessionStorage: kontrol:viewAs` | Pratinjau peran (hilang saat tab ditutup) |

Jangan pernah menyimpan token sesi di `localStorage` — gunakan cookie HttpOnly.
