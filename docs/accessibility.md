# Aksesibilitas

Target: **WCAG 2.1 AA**.

## Hasil audit v4.0.0

Diuji otomatis dengan **axe-core 4.10** (aturan `wcag2a` + `wcag2aa`) pada 17 rute utama (Dashboard, Users, form edit, Settings, Approvals + detail, Maps, Starter CRUD, Overlays, States, Timeline, Kanban, Calendar, Inbox, Invoices, Forms) × tema terang & gelap: **0 pelanggaran**.

Perbaikan selama audit v4:

| Masalah | Perbaikan |
|---|---|
| Kontras `--text-muted` & warna status < 4.5:1 | Token disesuaikan (light & dark) |
| Teks putih di atas `--primary` mode gelap (3.67:1) | Token baru `--primary-solid` |
| Progress bar tanpa nama | `aria-label` otomatis |
| Switch tanpa label | Opsi `ariaLabel` |
| Role `grid` kalender tidak lengkap | Diganti `group` (grid penuh butuh navigasi panah 2D) |
| `li` di dalam listbox Inbox | `role="none"` |
| Link di dalam teks hanya dibedakan warna | Garis bawah |
| Blok kode / timeline yang bisa di-scroll tidak bisa difokus | `tabindex="0"` otomatis |

Audit otomatis hanya menangkap sebagian masalah (umumnya disebut ±30–50%). Yang juga sudah diuji otomatis lewat Playwright: alur keyboard utama (Ctrl+K, `?`, `Esc` menutup dialog, Kanban `Alt+←/→`), tanpa overflow horizontal di 390px & 1440px. Uji dengan screen reader sungguhan (NVDA/VoiceOver) **belum** dilakukan — disarankan sebelum produksi.

## Fitur bawaan

- Skip link ke konten, landmark (`header`, `nav`, `main`), judul halaman difokus saat pindah rute.
- `<dialog>` native: trap fokus, `Esc` menutup.
- Ikon dekoratif `aria-hidden`, tombol ikon selalu ber-`aria-label`.
- Toast: `role="status"` / `role="alert"` untuk error.
- Target sentuh ≥ 44px di mobile.
- Pintasan keyboard (`?` untuk daftar lengkap) tidak aktif saat mengetik di input.

## Checklist modul baru

- [ ] Setiap input punya `<label>` (atau `aria-label`)
- [ ] Tombol hanya-ikon pakai `K.ui.iconBtn` (otomatis `aria-label`)
- [ ] Status tidak hanya disampaikan lewat warna (ada teks/ikon)
- [ ] Teks di atas warna solid memakai token `*-solid` / kontras ≥ 4.5:1
- [ ] Bisa dioperasikan penuh dengan keyboard
- [ ] Cek dengan [axe DevTools](https://www.deque.com/axe/devtools/) di kedua tema
