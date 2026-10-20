# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/) dan [Semantic Versioning](https://semver.org/lang/id/).

## [4.0.0] — 2026-10-20

Rilis final: fondasi integrasi backend, modul workflow, dan audit kualitas.

### Ditambahkan
- **Fondasi**
  - `assets/js/config.js` — satu tempat konfigurasi: `dataMode` demo ↔ api, base URL, auth cookie/bearer, sesi, peta. Bisa di-override via `window.KONTROL_CONFIG`.
  - `K.api` — wrapper request dengan adapter demo (K.store) & HTTP, retry + timeout, penanganan 401/403/404/422/5xx terpusat, `K.api.submit()` untuk form.
  - **Starter CRUD** (`#/example`, `pages/example.js`) — template modul siap salin: paginasi server, filter tersinkron URL, skeleton, retry, form + error 422.
  - Library dipindah ke `assets/vendor/` (Lucide, Chart.js, Leaflet, MarkerCluster) — **berjalan penuh tanpa CDN**.
  - `K.session` — peringatan & kunci layar otomatis saat idle, sinkron antar tab.
  - `K.i18n` — Bahasa Indonesia / English untuk shell, tabel, dialog, status, error, Dashboard, Users, Settings.
- **Modul**
  - **Approvals** — workflow persetujuan berjenjang (rantai ditentukan tipe & nominal), setujui/tolak dengan komentar wajib, diskusi, riwayat, badge "menunggu saya".
  - **Maps** — sebaran lokasi ATM/CRM/cabang (Leaflet + OpenStreetMap), cluster, filter status/tipe, daftar samping, mode gelap.
  - UI Kit: **Modal & Drawer** (sm/lg/long/full/drawer/bottom sheet), **States** (empty, skeleton, loader, offline), **Timeline & Stepper** (proses, vertikal, horizontal, pelacakan).
- **Shell UX**
  - Permission guard deklaratif `data-perm` (+ `data-perm-mode="disable"`) dan **pratinjau peran** dari halaman Roles.
  - **Favorit** (pin halaman ke sidebar) & **halaman terakhir** di command palette.
  - **Pencarian data global** di Ctrl+K (users, invoice, organisasi, halaman, tugas, approval).
  - Modal **pintasan keyboard** (`?`), pintasan `g` + huruf, `[`, `t`, `f`.
  - Banner **offline** & banner pratinjau peran.
- **Rilis**: folder `docs/` (9 panduan), workflow GitHub Actions deploy Pages, CHANGELOG ini.

### Diubah
- Token kontras: `--text-secondary`, `--text-muted`, `--success`, `--warning`, `--danger` (light) dan `--text-muted` (dark) disesuaikan ke WCAG AA. Token baru `--primary-solid` untuk latar berteks putih.
- Command palette: filter lokal kini sinkron (Enter langsung akurat), hasil data tampil setelah hasil navigasi.
- Halaman auth mendukung `?next=#/…` (aman, divalidasi regex) untuk kembali ke halaman semula setelah login/buka kunci.

### Diperbaiki
- 0 pelanggaran axe-core WCAG 2 A/AA pada 17 rute × 2 tema (sebelumnya: kontras, label progress/switch, ARIA kalender & inbox, region scroll tanpa fokus, link dalam teks).
- Cincin fokus tidak lagi muncul pada judul halaman yang difokus otomatis saat pindah rute.

## [3.0.0] — Tools

### Ditambahkan
- Grup **Tools**: Kanban Board (drag & drop + keyboard, batas WIP), Calendar (bulan/agenda, mini calendar), Inbox omnichannel (WhatsApp/Email/Internal), Import Center (CSV mapping + validasi per baris), Invoices (CRUD, PPN, cetak/PDF A4).
- Seed data baru otomatis digabung ke data `localStorage` yang sudah ada.

## [2.0.0] — UI Kit & pola CRUD

### Ditambahkan
- Grup **UI Kit**: Forms & Wizard, Toasts & Alerts, Icons, Charts, Tables & Pagination, Error Pages, Auth Pages.
- 13 halaman error 4xx/5xx (in-app, `error.html?code=`, `404.html`).
- 7 halaman auth standalone (login, register, lupa/reset sandi, verifikasi email, 2FA, lock screen).
- Layout **navigasi atas** sebagai alternatif sidebar.
- `K.validate` (validasi berbasis atribut HTML + error 422), pola CRUD halaman penuh untuk Users, toast dengan aksi Undo & posisi.

## [1.0.0] — Rilis awal

### Ditambahkan
- Admin dashboard HTML/CSS/JS murni dengan 27 modul (Overview, Workspace, Management, Content, Applications, System, Preferences, Support, Akun).
- Mode terang/gelap/sistem, sidebar ciut + drawer mobile, command palette, hash router, `K.store` + localStorage, `K.DataTable`, wrapper Chart.js.

[4.0.0]: https://github.com/FadlyChaniago/Template-Admin/compare/v3...v4.0.0
[3.0.0]: https://github.com/FadlyChaniago/Template-Admin/compare/v2...v3
[2.0.0]: https://github.com/FadlyChaniago/Template-Admin/compare/main...v2
