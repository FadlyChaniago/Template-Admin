/* ==========================================================================
   Tools → Maps (Leaflet + MarkerCluster, dimuat lazy dari assets/vendor)
   Menampilkan lokasi (mis. ATM/cabang) dengan status, cluster, filter,
   dan daftar yang tersinkron dengan peta.
   Tile peta dari K.config.map.tileUrl (default OpenStreetMap → butuh internet).
   Backend: GET /locations?status=&type=  (GeoJSON juga bisa langsung dipakai Leaflet)
   ========================================================================== */
(function (K) {
  'use strict';
  const { esc, num } = K.util;
  const { icon } = K.ui;
  const S = K.store;
  const ST = { online: ['success', 'Online'], offline: ['danger', 'Offline'], maintenance: ['warning', 'Maintenance'], cashlow: ['warning', 'Kas menipis'] };
  const TYPE = { atm: ['ATM', 'landmark'], crm: ['CRM', 'banknote'], branch: ['Kantor cabang', 'building-2'] };

  /** Muat CSS/JS sekali saja (lazy) — halaman lain tidak terbebani Leaflet. */
  const loaded = {};
  const loadCSS = href => loaded[href] || (loaded[href] = new Promise(res => { const l = Object.assign(document.createElement('link'), { rel: 'stylesheet', href }); l.onload = res; l.onerror = res; document.head.appendChild(l); }));
  const loadJS = src => loaded[src] || (loaded[src] = new Promise((res, rej) => { const s = Object.assign(document.createElement('script'), { src }); s.onload = res; s.onerror = () => rej(new Error('Gagal memuat ' + src)); document.head.appendChild(s); }));
  const ensureLeaflet = async () => {
    await Promise.all([loadCSS('assets/vendor/leaflet/leaflet.css'), loadCSS('assets/vendor/leaflet-markercluster/MarkerCluster.css')]);
    await loadJS('assets/vendor/leaflet/leaflet.js');
    await loadJS('assets/vendor/leaflet-markercluster/leaflet.markercluster.js');
  };

  K.page('maps', {
    render(view) {
      let map, cluster, markers = new Map(), alive = true;
      const filters = { status: new Set(Object.keys(ST)), type: '', q: '' };
      const all = S.all('locations');
      const count = s => all.filter(l => l.status === s).length;
      view.innerHTML = `${K.ui.pageHead({ title: 'Maps', eyebrow: 'Tools', desc: 'Sebaran lokasi beserta status operasional. Klik penanda atau daftar untuk detail.',
        actions: `<button type="button" class="btn btn-secondary btn-sm" id="mp-fit">${icon('maximize')}<span>Tampilkan semua</span></button>` })}
        <div class="grid grid-4">
          ${K.ui.kpi({ label: 'Total lokasi', value: num(all.length), icon: 'map-pin', foot: `${all.filter(l => l.type === 'branch').length} kantor cabang` })}
          ${K.ui.kpi({ label: 'Online', value: num(count('online')), icon: 'wifi', foot: `${num((count('online') / all.length) * 100, 1)}% dari total` })}
          ${K.ui.kpi({ label: 'Offline', value: num(count('offline')), icon: 'wifi-off', foot: 'perlu tindakan segera' })}
          ${K.ui.kpi({ label: 'Maintenance / kas menipis', value: num(count('maintenance') + count('cashlow')), icon: 'wrench', foot: 'dalam penanganan' })}
        </div>
        <div class="map-layout card card--flush mt-4">
          <aside class="map-side">
            <div class="map-side__head">
              <label class="input-icon">${icon('search')}<input type="search" class="input input-sm" placeholder="Cari kode, nama, kota…" aria-label="Cari lokasi" id="mp-q"></label>
              <div class="chip-list mt-3" role="group" aria-label="Filter status">${Object.entries(ST).map(([k, [tone, l]]) => `<label class="chip map-chip"><input type="checkbox" value="${k}" checked data-st><span class="map-dot map-dot--${k}"></span>${l} <span class="text-muted">${count(k)}</span></label>`).join('')}</div>
              <select class="select select-sm mt-3" id="mp-type" aria-label="Filter tipe"><option value="">Semua tipe</option>${Object.entries(TYPE).map(([k, [l]]) => `<option value="${k}">${l}</option>`).join('')}</select>
            </div>
            <p class="text-xs text-secondary map-side__count" id="mp-count" aria-live="polite"></p>
            <ul class="map-list" id="mp-list"></ul>
          </aside>
          <div class="map-wrap"><div id="mp-map" class="map-canvas" role="application" aria-label="Peta lokasi"><div class="map-loading">${icon('loader-circle', 'spin')} Memuat peta…</div></div></div>
        </div>
        <p class="text-xs text-muted mt-2">Tile peta: OpenStreetMap (butuh internet). Ganti <code class="inline-code">K.config.map.tileUrl</code> untuk tile server internal.</p>`;
      const $ = s => view.querySelector(s);

      const visible = () => all.filter(l => filters.status.has(l.status) && (!filters.type || l.type === filters.type) && (!filters.q || (l.code + ' ' + l.name + ' ' + l.city).toLowerCase().includes(filters.q)));
      const popup = l => `<div class="map-pop"><p class="text-xs text-secondary mono">${esc(l.code)}</p><p class="fw-600">${esc(l.name)}</p>
        <p class="mt-1"><span class="badge badge--${ST[l.status][0]}">${ST[l.status][1]}</span> <span class="text-xs text-secondary">${TYPE[l.type][0]} · ${esc(l.city)}</span></p>
        <dl class="dl mt-2" style="grid-template-columns:auto 1fr;gap:4px 12px;font-size:12px"><dt>Uptime 30h</dt><dd>${num(l.uptime, 2)}%</dd>${l.cash != null ? `<dt>Sisa kas</dt><dd>${l.cash}%</dd>` : ''}<dt>Terakhir aktif</dt><dd>${K.util.ago(l.lastSeen)}</dd><dt>Koordinat</dt><dd class="mono">${l.lat}, ${l.lng}</dd></dl></div>`;

      function drawList() {
        const list = visible();
        $('#mp-count').textContent = `${list.length} lokasi ditampilkan`;
        $('#mp-list').innerHTML = list.slice(0, 120).map(l => `<li><button type="button" class="map-item" data-loc="${l.id}"><span class="map-dot map-dot--${l.status}"></span><span class="flex-1" style="min-width:0"><span class="fw-500 truncate" style="display:block">${esc(l.name)}</span><span class="text-xs text-secondary">${esc(l.code)} · ${esc(l.city)}</span></span>${l.cash != null && l.status === 'cashlow' ? `<span class="text-xs text-warning tabular">${l.cash}%</span>` : ''}</button></li>`).join('') || `<li>${K.ui.empty({ icon: 'map-pin-off', title: 'Tidak ada lokasi' })}</li>`;
      }

      function drawMarkers() {
        if (!cluster) return;
        cluster.clearLayers(); markers.clear();
        visible().forEach(l => {
          const m = L.marker([l.lat, l.lng], { icon: L.divIcon({ className: '', html: `<span class="map-pin map-pin--${l.status} map-pin--${l.type}"></span>`, iconSize: [18, 18], iconAnchor: [9, 9] }), title: l.name, keyboard: true });
          m.bindPopup(popup(l), { maxWidth: 260 });
          markers.set(l.id, m); cluster.addLayer(m);
        });
      }

      const apply = () => { drawList(); drawMarkers(); };
      $('#mp-q').addEventListener('input', K.util.debounce(e => { filters.q = e.target.value.toLowerCase().trim(); apply(); }, 150));
      $('#mp-type').addEventListener('change', e => { filters.type = e.target.value; apply(); });
      view.querySelectorAll('[data-st]').forEach(c => c.addEventListener('change', () => { c.checked ? filters.status.add(c.value) : filters.status.delete(c.value); apply(); }));
      $('#mp-list').addEventListener('click', e => {
        const b = e.target.closest('[data-loc]'); if (!b || !map) return;
        const m = markers.get(b.dataset.loc); if (!m) return;
        cluster.zoomToShowLayer(m, () => m.openPopup());
        view.querySelectorAll('.map-item.is-active').forEach(x => x.classList.remove('is-active')); b.classList.add('is-active');
      });
      $('#mp-fit').addEventListener('click', () => { if (map && cluster.getLayers().length) map.fitBounds(cluster.getBounds(), { padding: [30, 30] }); });
      drawList();

      ensureLeaflet().then(() => {
        if (!alive || !view.isConnected) return;
        $('#mp-map').innerHTML = '';
        const c = K.config.map;
        map = L.map($('#mp-map'), { zoomControl: true, attributionControl: true }).setView(c.center, c.zoom);
        L.tileLayer(c.tileUrl, { attribution: c.attribution, maxZoom: 18 }).addTo(map);
        cluster = L.markerClusterGroup({
          showCoverageOnHover: false, maxClusterRadius: 50,
          iconCreateFunction: cl => {
            const ch = cl.getAllChildMarkers(); const bad = ch.filter(m => /offline/.test(m.options.icon.options.html)).length;
            return L.divIcon({ html: `<span class="map-cluster ${bad ? 'has-alert' : ''}">${ch.length}</span>`, className: '', iconSize: [38, 38] });
          },
        });
        map.addLayer(cluster);
        drawMarkers();
        map.fitBounds(cluster.getBounds(), { padding: [30, 30] });
        setTimeout(() => map.invalidateSize(), 200);
      }).catch(err => { $('#mp-map').innerHTML = K.ui.empty({ icon: 'map-pin-off', title: 'Peta gagal dimuat', text: err.message }); });

      const onResize = () => map && map.invalidateSize();
      addEventListener('resize', onResize);
      return () => { alive = false; removeEventListener('resize', onResize); if (map) map.remove(); };
    },
  });
})(window.K);
