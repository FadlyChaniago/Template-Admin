# Membuat modul CRUD baru

`assets/js/pages/example.js` adalah template siap salin: list (paginasi server, cari, filter tersinkron ke URL, skeleton, retry) → detail → form tambah/edit, semuanya lewat `K.api`.

## Alur URL

```
#/products              list
#/products/new          form tambah
#/products/:id          detail
#/products/:id/edit     form edit
```

## Langkah (≈10 menit)

1. **Salin** `assets/js/pages/example.js` → `assets/js/pages/products.js`.
2. **Ubah konstanta** di bagian atas:
   ```js
   const RESOURCE = '/products';
   const ROUTE = 'products';
   const LABEL = { one: 'Produk', many: 'Produk' };
   const PERM = { create: 'products.create', update: 'products.update', delete: 'products.delete' };
   const STATUS = { active: ['success', 'Aktif'], archived: ['neutral', 'Diarsipkan'] };
   const FIELDS = [
     { name: 'name', label: 'Nama', required: true, span: true },
     { name: 'price', label: 'Harga', type: 'number', show: v => K.util.idr(v) },
   ];
   ```
3. **Daftarkan menu** di `K.nav` (`assets/js/core/app.js`):
   ```js
   { id: 'products', label: 'Products', icon: 'package', perm: 'products.view' }
   ```
4. **Muat script** di `index.html` sebelum `main.js`:
   ```html
   <script src="assets/js/pages/products.js" defer></script>
   ```
5. *(Opsional)* terjemahan `nav.products` di `assets/js/i18n/id.js` & `en.js`.
6. *(Mode demo)* tambah seed `products: [...]` ke `K.seed` agar adapter demo punya koleksi.
7. *(Backend)* sediakan 5 endpoint REST di [api.md](api.md#kontrak-rest-yang-diharapkan-gaya-laravel-api-resource).

## Pola yang dipakai & alasannya

| Pola | Alasan |
|---|---|
| Halaman penuh untuk form (bukan modal) | Form panjang, URL bisa dibagikan, tombol Back bekerja |
| Filter di URL (`?q=&status=&page=`) | Refresh/bagikan link tetap di posisi yang sama |
| Skeleton saat memuat, empty state saat kosong, tombol coba lagi saat gagal | Tiga state wajib setiap daftar |
| Konfirmasi sebelum hapus + toast hasil | Mencegah aksi tak sengaja, memberi umpan balik |
| `data-perm` pada tombol | Satu atribut, otomatis disembunyikan untuk peran tanpa izin |

## Checklist sebelum merge

- [ ] Semua teks dinamis lewat `K.util.esc()` (XSS)
- [ ] Empty, loading, dan error state ada
- [ ] Tombol aksi berbahaya pakai `K.ui.confirm`
- [ ] Tombol berizin memakai `data-perm`, **dan** endpoint dicek di server
- [ ] Dicoba di 390px dan mode gelap
- [ ] Ikon hanya-ikon punya `aria-label`
