# K.api — akses data

Semua halaman baru sebaiknya membaca/menulis data lewat `K.api`. Dengan begitu, beralih dari data demo ke backend sungguhan cukup mengubah `dataMode` di `config.js`.

```js
const { data, meta } = await K.api.get('/projects', { query: { page: 1, per_page: 15, q: 'atm', status: 'active', sort: '-createdAt' } });
const { data: one }  = await K.api.get('/projects/prj_1', { page: true });   // 404 → halaman error
const { data: made } = await K.api.post('/projects', { name: 'Baru' });
await K.api.patch('/projects/prj_1', { status: 'done' });
await K.api.delete('/projects/prj_1');
```

## Opsi per panggilan

| Opsi | Default | Fungsi |
|---|---|---|
| `query` | – | Object → query string (nilai kosong diabaikan) |
| `body` | – | Object (JSON) atau `FormData` (upload) |
| `handle` | `true` | `false` = tangani error sendiri (tanpa toast/redirect) |
| `page` | `false` | `true` = 403/404/5xx menampilkan halaman `#/error/:kode` |
| `timeout` | `config.apiTimeoutMs` | ms sebelum dibatalkan (→ 408) |
| `retries` | `config.apiRetries` | Hanya GET; untuk error jaringan, 408, dan 5xx (backoff eksponensial) |

## Penanganan error terpusat

| Status | Perilaku default |
|---|---|
| `401` | Redirect ke `login.html?next=#/halaman-terakhir` |
| `422` | Tidak ada toast — dilempar sebagai `ApiError` dengan `.errors` untuk form |
| `403/404/5xx` + `{ page: true }` | Halaman error penuh |
| lainnya / jaringan | Toast error + `console.warn` |

## Form + error validasi server

```js
form.addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const { data } = await K.api.submit(form, 'POST', '/projects', {
      transform: d => ({ ...d, budget: Number(d.budget) }),
    });
    K.router.go('example/' + data.id);
  } catch (err) { /* 422 sudah ditempel ke field oleh submit() */ }
});
```

`K.api.submit` menjalankan validasi klien (`K.validate`), menonaktifkan tombol submit selama request, dan menempelkan error `422` ke field yang sesuai.

## Kontrak REST yang diharapkan (gaya Laravel API Resource)

```http
GET    /projects?page=1&per_page=15&q=&status=&sort=-createdAt
200 { "data": [...], "meta": { "total": 42, "page": 1, "per_page": 15, "last_page": 3 } }

GET    /projects/{id}      200 { "data": {...} }  | 404
POST   /projects           201 { "data": {...} }  | 422 { "message": "...", "errors": { "name": ["..."] } }
PATCH  /projects/{id}      200 { "data": {...} }
DELETE /projects/{id}      204
GET    /search?q=          200 { "data": [{ "label", "sub", "icon", "href" }] }   ← dipakai Ctrl+K
```

Header yang dikirim: `Accept: application/json`, `X-Requested-With: XMLHttpRequest`, dan `X-CSRF-TOKEN` (mode cookie) atau `Authorization: Bearer` (mode bearer). Request memakai `credentials: 'same-origin'`.

## Mode demo

Adapter demo memetakan `/resource[/id]` ke koleksi `K.store` (kebab-case → camelCase, plus alias seperti `/tasks` → `kanban`), mendukung paginasi/cari/filter/sort, dan mensimulasikan latensi `demoLatencyMs`. Aturan validasi demo (mis. email duplikat → 422) ada di `K.api.demoRules` dan bisa ditambah:

```js
K.api.demoRules.projects = body => (body.name?.length < 3 ? { name: ['Minimal 3 karakter.'] } : {});
```

## Catatan produksi

- Validasi klien hanya untuk UX — **server tetap wajib memvalidasi**.
- Total uang (invoice, approval) **dihitung ulang di server**.
- Untuk daftar besar gunakan paginasi server (`meta.last_page`) — jangan kirim ribuan baris ke browser.
