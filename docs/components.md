# Referensi komponen

Contoh hidup setiap komponen ada di grup sidebar **UI Kit**. Dokumen ini merangkum API JavaScript-nya.

## K.ui — helper string HTML

Semua mengembalikan string HTML (gabungkan dengan template literal), kecuali yang ditandai *DOM*.

| Fungsi | Contoh |
|---|---|
| `icon(name, cls)` | `K.ui.icon('users')` — nama ikon [Lucide](https://lucide.dev/icons) |
| `badge(status, label?)` | `K.ui.badge('active')` — warna & teks dari peta status (ikut i18n) |
| `trend(value, {invert})` | `K.ui.trend(12.4)` → ▲ 12,4% |
| `avatar(name, size)` / `person(user, sub)` | Inisial berwarna / avatar + nama |
| `pageHead({title, desc, eyebrow, actions})` | Judul halaman standar |
| `kpi({label, value, icon, trend, foot})` | Kartu KPI |
| `empty({icon, title, text, action})` | Empty state |
| `btn(label, {variant, icon, size, attrs})` / `iconBtn(icon, label)` | Tombol (`iconBtn` otomatis `aria-label`) |
| `progress(value, tone, label)` | Progress bar ber-`role="progressbar"` |
| `switchEl({name, checked, label, ariaLabel})` | Switch toggle |
| `field({name, label, type, options, required, help, attrs})` | Field form lengkap + label + error slot |

| Fungsi *DOM* | Keterangan |
|---|---|
| `toast(title, text, type, timeout, {action})` | `type`: success/error/warning/info. `action: {label, onClick}` untuk Undo. Posisi diatur pengguna di Appearance |
| `modal({title, desc, body, size, submitLabel, danger, onSubmit, onOpen, footer, hideFooter})` | `<dialog>` native; `size`: `sm`, `lg`, `full`, `drawer`, `sheet`. Return `{dialog, close}` |
| `drawer(opts)` | Alias `modal({...opts, size: 'drawer'})` — panel kanan |
| `confirm({title, text, confirmLabel, danger})` | `Promise<boolean>` |
| `tabs(root, cb)` | Tab ARIA dengan navigasi panah |

## K.DataTable

```js
new K.DataTable(el, {
  title: 'Semua pengguna',
  rows: () => K.store.all('users'),
  columns: [
    { key: 'name', label: 'Nama', sortable: true, render: u => K.ui.person(u) },
    { key: 'email', label: 'Email', className: 'hide-md' },   // sembunyi di kartu sempit (container query)
  ],
  search: u => u.name + ' ' + u.email,                          // teks yang dicari
  tabs: { key: 'status', options: [['active', 'Aktif'], ['invited', 'Diundang']] },
  selects: [{ key: 'roleId', label: 'Semua peran', options: [['role_admin', 'Admin']] }],
  bulkActions: [{ label: 'Hapus', icon: 'trash-2', variant: 'danger', handler: ids => … }],
  rowActions: u => `<button class="btn btn-ghost btn-sm" data-action="edit" data-perm="users.update">Edit</button>`,
  onAction: (action, row) => { if (action === 'edit') K.router.go(`users/${row.id}/edit`); },
  exportName: 'users',      // tampilkan tombol Ekspor CSV
  pageSize: 10,
  defaultSort: { key: 'name', dir: 'asc' },
});
```

Mendukung cari, filter, sort, paginasi, pilih massal, ekspor CSV, dan skeleton. Contoh server-side ada di **UI Kit → Tables**.

## K.charts

Wrapper Chart.js yang otomatis mengikuti token warna tema dan dirender ulang saat tema berganti: `K.charts.line`, `bar`, `doughnut`, `sparkline`, dan `custom(canvas, config)` untuk konfigurasi Chart.js bebas. Lihat **UI Kit → Charts**.

## K.validate

Aturan dibaca dari atribut HTML standar (`required`, `minlength`, `pattern`, `type="email"`, `min/max`) plus `data-match="#password"`. Validasi live setelah field disentuh.

```js
if (!K.validate.form(form)) return;
K.validate.setErrors(form, { email: ['Email sudah digunakan.'] }); // dari respons 422
```

## Kelas CSS v4 yang sering dipakai

| Kelas | Fungsi |
|---|---|
| `.process` + `.process__step.is-done / .is-current` | Stepper status proses |
| `.timeline--rich`, `.htimeline`, `.tracking` | Timeline vertikal, horizontal, pelacakan |
| `.approval-chain` | Rantai persetujuan berjenjang |
| `.skeleton`, `.dots-loader`, `.progress--indeterminate` | State memuat |
| `.empty` | Empty state |
| `.banner--warning / --info` | Banner global di atas konten |

Token warna, radius, dan font ada di `assets/css/tokens.css`. Gunakan `--primary-solid` (bukan `--primary`) untuk latar yang berisi teks putih agar kontras tetap ≥ 4.5:1 di mode gelap.
