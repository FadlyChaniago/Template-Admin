# Vendor (offline)

Library pihak ketiga disalin lokal agar template berjalan tanpa internet (server internal).

| Library | Versi | Lisensi | Sumber |
|---|---|---|---|
| Lucide | 1.59.0 | ISC | https://lucide.dev |
| Chart.js | 4.5.1 | MIT | https://www.chartjs.org |
| Leaflet | 1.9.4 | BSD-2-Clause | https://leafletjs.com |
| Leaflet.markercluster | 1.5.3 | MIT | https://github.com/Leaflet/Leaflet.markercluster |

Perbarui: `npm pack <nama>@<versi>` lalu salin file `dist/` ke folder ini.
Catatan: **tile peta** (gambar peta) tetap diambil dari server tile (default OpenStreetMap). Untuk jaringan tanpa internet, ganti `K.config.map.tileUrl` ke tile server internal.
