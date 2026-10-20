# Memulai

## 1. Menjalankan

```bash
# buka langsung (file://) — semua fitur jalan, termasuk peta (tile butuh internet)
open index.html

# atau server lokal (disarankan, mendekati produksi)
python3 -m http.server 8080   # → http://localhost:8080
```

Tidak ada build step. Semua library (Lucide, Chart.js, Leaflet + MarkerCluster) ada di `assets/vendor/` — tidak bergantung CDN.

## 2. Konfigurasi — `assets/js/config.js`

Satu-satunya file yang perlu diubah saat pindah lingkungan.

| Kunci | Default | Keterangan |
|---|---|---|
| `dataMode` | `'demo'` | `'demo'` = seed + localStorage; `'api'` = `fetch` ke backend |
| `apiBaseUrl` | `'/api/v1'` | Prefix semua `K.api.*` |
| `apiTimeoutMs` / `apiRetries` | `15000` / `2` | Retry hanya untuk GET saat error jaringan/5xx |
| `authMode` | `'cookie'` | `'cookie'` (Sanctum SPA + CSRF, disarankan) atau `'bearer'` |
| `csrfMeta` | `'csrf-token'` | Nama `<meta>` berisi token CSRF |
| `getToken` | `() => null` | Sumber token untuk `authMode: 'bearer'` |
| `loginUrl` / `lockUrl` | `login.html` / `lock-screen.html` | Tujuan saat 401 / sesi idle |
| `sessionIdleMinutes` | `null` | `null` = ikut Security Settings; `0` = mati |
| `sessionWarnSeconds` | `60` | Lama hitung mundur sebelum terkunci |
| `locale` | `'id'` | Bahasa default (`id` / `en`) |
| `map.tileUrl` | OSM | Ganti ke tile server internal untuk jaringan tertutup |

Override tanpa mengedit file (mis. dari Blade):

```html
<script>
  window.KONTROL_CONFIG = { dataMode: 'api', apiBaseUrl: '/api/v1' };
</script>
<script src="assets/js/config.js" defer></script>
```

## 3. Deploy ke GitHub Pages

Repo sudah berisi workflow `.github/workflows/pages.yml`.

1. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Push ke `main` (atau jalankan manual dari tab **Actions → Deploy to GitHub Pages → Run workflow**).
3. URL: `https://<user>.github.io/<repo>/`.

Workflow hanya menyalin file statis (tanpa build) dan mengecualikan `docs/`, `.github/`, serta file Markdown dari artefak publik.

## 4. Integrasi Laravel (ringkas)

```
public/admin/            ← salin isi repo ini
resources/views/admin.blade.php   ← atau sajikan index.html lewat route
routes/api.php           ← Route::middleware('auth:sanctum')->prefix('v1')->group(...)
```

- Set `dataMode: 'api'`, `authMode: 'cookie'`, dan cetak `<meta name="csrf-token" content="{{ csrf_token() }}">`.
- Format respons mengikuti **API Resource** (`{ data, meta }`) dan error validasi bawaan Laravel (`422 { message, errors }`) — tanpa adaptasi tambahan.
- Lihat [api.md](api.md) untuk kontrak endpoint.

## 5. Reset data demo

Settings → General → *Zona berbahaya → Reset data demo*, atau di console: `K.store.reset()`.
