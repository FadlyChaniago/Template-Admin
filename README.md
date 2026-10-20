# Kontrol — Enterprise Admin Dashboard

Template admin dashboard lengkap berbasis **HTML + CSS + JavaScript murni** (tanpa framework, tanpa build step).
Semua 27 modul di sidebar sudah berfungsi dengan data demo, mode **terang & gelap**, responsif dari 360px hingga desktop lebar.

![Status](https://img.shields.io/badge/stack-HTML%20%7C%20CSS%20%7C%20Vanilla%20JS-2563EB) ![Build](https://img.shields.io/badge/build-tidak%20perlu-059669)

---

## Ringkasan

| Aspek | Pilihan | Alasan |
|---|---|---|
| Framework | Tidak ada (vanilla JS) | Bisa dibuka langsung, mudah dipindah ke Laravel Blade / backend apa pun |
| Ikon | [Lucide](https://lucide.dev) `1.59.0` via CDN | Konsisten dengan desain (stroke 1.8), ringan |
| Grafik | [Chart.js](https://www.chartjs.org) `4.5.1` via CDN | Matang, aksesibel, mudah di-theme |
| Routing | Hash router (`#/users`) | Jalan di GitHub Pages & `file://` tanpa konfigurasi server |
| Data | `localStorage` + data seed | Demo CRUD terasa nyata; diganti `fetch()` saat integrasi |
| Tema | CSS custom properties + `data-theme` | Satu sumber token warna untuk light/dark |

## Menjalankan

```bash
# Opsi 1 — buka langsung
open index.html            # atau klik dua kali

# Opsi 2 — server lokal (disarankan)
python3 -m http.server 8080
# buka http://localhost:8080
```

Halaman login demo: `login.html` (kata sandi apa pun ≥ 8 karakter).

## Deploy ke GitHub Pages

1. Push repo ke GitHub.
2. **Settings → Pages → Source: Deploy from a branch → `main` / root**.
3. Akses di `https://<username>.github.io/<repo>/`.

Tidak perlu build — semua path relatif.

## Struktur proyek

```
kontrol-admin/
├── index.html              # App shell (sidebar, topbar, container view)
├── login.html, register.html, forgot-password.html, reset-password.html,
│   verify-email.html, two-factor.html, lock-screen.html   # Auth standalone
├── error.html, 404.html    # Halaman error standalone
├── assets/
│   ├── css/
│   │   ├── tokens.css      # Design tokens light/dark (warna, font, radius)
│   │   ├── base.css        # Reset, tipografi, utilitas, focus ring
│   │   ├── layout.css      # Sidebar, topbar, drawer mobile, footer
│   │   ├── components.css  # Button, form, card, badge, tabel, modal, toast, menu
│   │   └── pages.css       # Gaya khusus per modul
│   ├── img/favicon.svg
│   └── js/
│       ├── core/
│       │   ├── utils.js    # Format IDR/tanggal, escape HTML, CSV, PRNG
│       │   ├── validate.js # Validasi form berbasis atribut HTML
│       │   ├── errors-data.js # Data & renderer halaman error 4xx/5xx
│       │   ├── data.js     # Data seed demo
│       │   ├── store.js    # Repository in-memory + localStorage
│       │   ├── ui.js       # Icon, toast, modal, confirm, form builder, menu
│       │   ├── table.js    # DataTable: cari, filter, sort, paginasi, bulk, CSV
│       │   ├── charts.js   # Wrapper Chart.js yang mengikuti tema
│       │   └── app.js      # Navigasi, router, tema, sidebar, command palette
│       ├── pages/          # Satu file per grup sidebar
│       │   ├── overview.js       # Dashboard
│       │   ├── workspace.js      # Analytics, Reports, Activity Log
│       │   ├── management.js     # Users, Teams, Organizations, Roles
│       │   ├── content.js        # Pages, Media, Categories, Tags
│       │   ├── applications.js   # Applications, Integrations, API, Webhooks
│       │   ├── system.js         # Notifications, Tasks, Audit, Health
│       │   ├── preferences.js    # Settings, Appearance, Localization, Security
│       │   ├── support.js        # Help Center, Documentation, Feedback
│       │   ├── account.js        # Profile, Account Settings, Upgrade Plan
│       │   ├── forms.js          # UI Kit: Forms & Wizard, Auth Pages
│       │   ├── uikit.js          # UI Kit: Toasts, Icons, Charts, Tables, Errors
│       │   └── errors.js         # 404, 403, #/error/:kode
│       └── auth.js         # Perilaku halaman auth standalone
│       └── main.js         # Entry point
```

**Kenapa dipisah per lapisan?** `core/` tidak tahu apa pun tentang modul bisnis, sedangkan `pages/` hanya memakai API core. Saat Anda mengganti data demo dengan backend, cukup ubah `store.js` — halaman tidak perlu disentuh.

## Daftar modul

| Grup | Modul | Fitur utama |
|---|---|---|
| Overview | Dashboard | KPI per periode, grafik pendapatan harian/mingguan, produk teratas, transaksi + filter status, metode bayar, aktivitas |
| Workspace | Analytics | Rentang 7/30/90 hari, trafik, perangkat, kanal, corong konversi, halaman teratas, retensi kohort |
| | Reports | Template, CRUD, jalankan ulang, favorit, unduh, bulk delete |
| | Activity Log | Timeline per hari, filter tipe, pencarian, muat lebih banyak |
| Management | Users | Undang, edit, tangguhkan, reset sandi, impor CSV, bulk action, detail + audit |
| | Teams | Kartu tim, kelola anggota, visibilitas, team lead |
| | Organizations | CRUD, paket, status, filter |
| | Roles & Permissions | Matriks izin per modul/aksi, duplikat, peran kustom, proteksi Owner |
| Content | Pages | Editor Markdown, slug otomatis, jadwal terbit, pratinjau, bulk publish |
| | Media Library | Grid/list, drag & drop upload, filter tipe, detail + alt text |
| | Categories | Hierarki induk–anak, warna, hitung halaman |
| | Tags | Tambah cepat, awan tag, gabungkan tag, ganti nama |
| Applications | Applications | Kartu per env, kredensial, rotasi secret, deploy ulang, riwayat deploy |
| | Integrations | Hubungkan/putuskan, konfigurasi token & event |
| | API Management | Grafik 2xx/4xx/5xx, kuota, buat key (tampil sekali), rotasi, cabut |
| | Webhooks | Endpoint CRUD, kirim tes, signing secret, log pengiriman + payload |
| System | Notifications | Baca/belum, filter, preferensi kanal Email/Push/WhatsApp |
| | Tasks & Jobs | Progres live, jalankan/jeda/retry, log job, cron baru |
| | Audit Logs | Filter tingkat/sumber/aktor, detail JSON, ekspor CSV |
| | System Health | Uptime 90 hari, CPU/memori/disk live, latensi, insiden |
| Preferences | General Settings | Profil workspace, deteksi perubahan, ekspor JSON, reset demo, zona berbahaya |
| | Appearance | Tema terang/gelap/sistem, kepadatan, default sidebar |
| | Localization | Bahasa, zona waktu WIB/WITA/WIT, mata uang, format + pratinjau |
| | Security Settings | Paksa 2FA, kebijakan sandi, timeout sesi, IP allowlist, SSO, skor keamanan, sesi aktif |
| Support | Help Center | Pencarian artikel, FAQ, tiket dukungan |
| | Documentation | Referensi API, scrollspy, salin kode, unduh OpenAPI |
| | Feedback | Formulir + rating, papan voting |
| Akun | Profile / Account / Upgrade Plan | Profil, ganti email/sandi + meter kekuatan, setup 2FA + kode cadangan, paket & invoice |

## Baru di v2

| Area | Isi |
|---|---|
| **UI Kit** (grup sidebar baru) | Forms & Wizard, Toasts & Alerts, Icons (2.155 Lucide), Charts (10 jenis + sparkline), Tables & Pagination (client & server-side), Error Pages, Auth Pages |
| **Error pages** | 13 kode 4xx/5xx dengan ikon — in-app `#/error/503`, standalone `error.html?code=503`, dan `404.html` (otomatis di GitHub Pages) |
| **Auth pages** | `login`, `register`, `forgot-password`, `reset-password`, `verify-email`, `two-factor` (OTP 6 digit), `lock-screen` |
| **Navigasi atas** | Appearance → Tata letak → *Navigasi atas*: grup menu jadi dropdown horizontal |
| **Validasi form** | `K.validate` — aturan dari atribut HTML, validasi live, error server 422 |
| **Pola CRUD** | Users: `#/users` → `#/users/:id` (detail + tab) → `#/users/:id/edit` / `#/users/new` |
| **Toast API** | Tombol aksi (Undo), progress bar, jeda saat hover, 5 posisi |

### Pola CRUD untuk modul baru

```
#/products            → list (K.DataTable)
#/products/new        → form tambah (halaman penuh)
#/products/:id        → detail (header + tab)
#/products/:id/edit   → form edit
```

```js
K.page('products', {
  render(view, route) {
    const [id, sub] = route.params;          // dari hash #/products/abc/edit
    if (id === 'new') return productForm(view, null);
    if (id) return sub === 'edit' ? productForm(view, find(id)) : productDetail(view, find(id));
    return productList(view);
  },
});
```

Contoh lengkap: `userDetail()` dan `userEdit()` di `assets/js/pages/management.js`.

## Fitur global

- **Command palette** — `Ctrl/⌘ + K` atau `/` untuk lompat ke halaman/aksi.
- **Sidebar** — ciut/buka (tersimpan), grup bisa dilipat, tooltip saat ciut, drawer di mobile (Esc/klik backdrop menutup).
- **Aksesibilitas** — skip link, `aria-*` pada tab/menu/modal, focus ring, `<dialog>` native, target sentuh ≥ 44px di mobile, menghormati `prefers-reduced-motion`.
- **Tabel responsif** — kolom sekunder disembunyikan berdasarkan **lebar kartu** (container query), hanya area tabel yang scroll horizontal.

## Menambah modul baru

1. Tambahkan item di `K.nav` (`assets/js/core/app.js`):
   ```js
   { id: 'invoices', label: 'Invoices', icon: 'receipt', perm: 'billing.view' }
   ```
2. Daftarkan halaman (mis. di file baru `assets/js/pages/invoices.js`):
   ```js
   K.page('invoices', {
     render(view, route) {
       view.innerHTML = K.ui.pageHead({ title: 'Invoices' }) + '<div id="tbl"></div>';
       new K.DataTable(view.querySelector('#tbl'), {
         title: 'Semua invoice',
         rows: () => K.store.all('invoices'),
         columns: [{ key: 'number', label: 'Nomor', sortable: true }],
       });
       return () => { /* cleanup: clearInterval, observer.disconnect, dll. */ };
     },
   });
   ```
3. Tambahkan `<script src="assets/js/pages/invoices.js" defer></script>` di `index.html` sebelum `main.js`.

## Integrasi ke backend (Laravel / FastAPI / Node)

`K.store` sengaja dibuat mirip repository. Ganti implementasinya dengan `fetch()`:

```js
async all(name) {
  const res = await fetch(`/api/${name}`, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
  if (!res.ok) throw new Error(res.status);
  return (await res.json()).data;
}
```

Catatan penting:
- **Visibilitas menu ≠ otorisasi.** `K.can()` hanya menyaring UI. Setiap route & endpoint wajib memeriksa izin di server (mis. Laravel Policy/Gate, FastAPI dependency).
- Simpan sesi di **cookie HttpOnly**, bukan `localStorage`.
- Semua data dinamis sudah di-escape lewat `K.util.esc()`; pertahankan pola ini untuk mencegah XSS.
- Untuk tabel besar, pindahkan cari/filter/sort/paginasi ke server (cursor pagination).

## Kustomisasi tema

Semua warna ada di `assets/css/tokens.css`. Contoh mengganti warna utama:

```css
:root            { --primary: #0EA5E9; --primary-hover: #0284C7; }
[data-theme=dark]{ --primary: #38BDF8; --primary-hover: #7DD3FC; }
```

## Mode offline

Lucide dan Chart.js dimuat dari CDN jsDelivr dengan versi dikunci. Untuk lingkungan tanpa internet, unduh kedua file lalu ubah `src` di `index.html` ke `assets/vendor/…`. Aplikasi tetap berjalan bila CDN gagal — ikon/grafik saja yang tidak tampil.

## Lisensi

MIT — lihat [LICENSE](LICENSE).
