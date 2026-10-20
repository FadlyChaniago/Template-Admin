/* ==========================================================================
   K.seed (v4) — Approvals (workflow berjenjang) & lokasi peta.
   ========================================================================== */
(function (K) {
  'use strict';
  const r = K.util.rng(404);
  const pick = a => a[Math.floor(r() * a.length)];
  const ago = m => new Date(K.NOW - m * 60000).toISOString();
  const U = K.seed.users;

  /* ---------- Approvals ----------
     Rantai persetujuan ditentukan tipe & nominal (lihat K.approvals.chainFor di approvals.js). */
  const types = {
    procurement: 'Pengadaan', leave: 'Cuti', access: 'Akses sistem', budget: 'Anggaran', expense: 'Reimburse',
  };
  const raw = [
    ['procurement', 'Pengadaan 20 unit laptop tim Engineering', 285000000, U[5].id, 'pending', 1],
    ['access', 'Akses produksi database untuk audit Q4', 0, U[8].id, 'pending', 0],
    ['leave', 'Cuti tahunan 5 hari (3–7 Nov)', 0, U[11].id, 'pending', 0],
    ['expense', 'Reimburse perjalanan dinas Surabaya', 4850000, U[3].id, 'approved', 2],
    ['budget', 'Tambahan anggaran kampanye Q4', 120000000, U[14].id, 'pending', 2],
    ['procurement', 'Lisensi tools monitoring 1 tahun', 64000000, U[6].id, 'rejected', 1],
    ['expense', 'Reimburse internet kerja jarak jauh', 750000, U[9].id, 'approved', 1],
    ['access', 'Akses admin ke Billing Service', 0, U[12].id, 'pending', 1],
    ['leave', 'Cuti sakit 2 hari', 0, U[4].id, 'approved', 1],
    ['budget', 'Anggaran pelatihan sertifikasi cloud', 38000000, U[7].id, 'cancelled', 0],
  ];
  const levelsFor = (type, amount) => {
    const L = [{ name: 'Atasan langsung', approver: 'usr_me' }];
    if (type === 'access') L.push({ name: 'Security Officer', approver: U[2].id });
    if (amount >= 10e6) L.push({ name: 'Finance', approver: U[10].id });
    if (amount >= 100e6) L.push({ name: 'Direktur', approver: U[1].id });
    return L;
  };
  const approvals = raw.map(([type, title, amount, requester, status, doneSteps], i) => {
    const levels = levelsFor(type, amount);
    const created = 60 * (6 + i * 19);
    // Untuk item "pending" milik saya, buat langkah aktif ada di saya (agar badge "menunggu saya" terisi)
    const steps = levels.map((l, j) => {
      let st = 'waiting';
      if (status === 'approved') st = 'approved';
      else if (status === 'rejected') st = j < doneSteps ? 'approved' : j === doneSteps ? 'rejected' : 'waiting';
      else if (status === 'cancelled') st = 'waiting';
      else st = j < doneSteps ? 'approved' : j === doneSteps ? 'pending' : 'waiting';
      return { ...l, status: st, at: st === 'approved' || st === 'rejected' ? ago(created - 60 * (j + 1) * 3) : null, comment: st === 'rejected' ? 'Anggaran tahun ini sudah terpakai. Ajukan ulang di Q1.' : st === 'approved' && j === 0 ? 'Disetujui, sesuai kebutuhan tim.' : '' };
    });
    if (status === 'pending' && steps.findIndex(s => s.status === 'pending') < 0) steps[0].status = 'pending';
    return {
      id: 'apr_' + (i + 1), code: `APR-2026-${String(318 - i).padStart(4, '0')}`, type, typeLabel: types[type], title, amount, requester, status,
      description: 'Rincian kebutuhan, alasan bisnis, dan dampak bila tidak disetujui. Lampiran pendukung tersedia di bawah.',
      attachments: type === 'procurement' ? ['penawaran-vendor-a.pdf', 'perbandingan-harga.xlsx'] : type === 'expense' ? ['struk-hotel.jpg', 'tiket-pesawat.pdf'] : [],
      createdAt: ago(created), steps,
      comments: i % 3 === 0 ? [{ by: requester, text: 'Mohon dipercepat karena terkait jadwal proyek.', at: ago(created - 30) }] : [],
    };
  });

  /* ---------- Lokasi (peta) ---------- */
  const cities = [
    ['Jakarta', -6.2, 106.82, 22], ['Surabaya', -7.26, 112.75, 10], ['Bandung', -6.91, 107.61, 9], ['Medan', 3.59, 98.67, 7], ['Semarang', -6.97, 110.42, 6],
    ['Makassar', -5.15, 119.43, 5], ['Yogyakarta', -7.8, 110.36, 5], ['Denpasar', -8.65, 115.22, 5], ['Palembang', -2.98, 104.76, 4], ['Balikpapan', -1.24, 116.85, 3],
    ['Pontianak', -0.03, 109.33, 3], ['Manado', 1.47, 124.84, 3], ['Jayapura', -2.53, 140.72, 2], ['Banda Aceh', 5.55, 95.32, 2], ['Kupang', -10.18, 123.6, 2],
  ];
  const statuses = ['online', 'online', 'online', 'online', 'online', 'online', 'offline', 'maintenance', 'cashlow'];
  const locations = [];
  cities.forEach(([city, lat, lng, n]) => {
    for (let i = 0; i < n; i++) {
      const type = i === 0 ? 'branch' : r() < 0.2 ? 'crm' : 'atm';
      const st = type === 'branch' ? 'online' : pick(statuses);
      locations.push({
        id: `loc_${locations.length + 1}`, code: (type === 'branch' ? 'BR' : type === 'crm' ? 'CRM' : 'ATM') + '-' + String(1000 + locations.length),
        name: type === 'branch' ? `Kantor Cabang ${city}` : `${type === 'crm' ? 'CRM' : 'ATM'} ${city} ${pick(['Mall', 'Stasiun', 'Bandara', 'Pasar', 'Kampus', 'RS', 'SPBU', 'Plaza'])} ${i}`,
        type, city, status: st,
        lat: +(lat + (r() - 0.5) * (city === 'Jakarta' ? 0.25 : 0.12)).toFixed(5), lng: +(lng + (r() - 0.5) * (city === 'Jakarta' ? 0.3 : 0.14)).toFixed(5),
        uptime: st === 'online' ? +(99 + r()).toFixed(2) : +(90 + r() * 8).toFixed(2), lastSeen: ago(st === 'offline' ? 60 + Math.floor(r() * 900) : Math.floor(r() * 5)),
        cash: type === 'branch' ? null : st === 'cashlow' ? Math.round(r() * 15) : Math.round(25 + r() * 70),
      });
    }
  });

  /* ---------- Starter CRUD (contoh resource generik "projects") ---------- */
  const projects = ['Migrasi data warehouse', 'Aplikasi mobile v3', 'Portal mitra', 'Otomasi laporan SLA', 'Integrasi WhatsApp gateway', 'Dashboard eksekutif', 'Upgrade keamanan SSO', 'Monitoring jaringan ATM', 'Sistem tiket internal', 'Rebranding situs']
    .map((name, i) => ({ id: 'prj_' + (i + 1), name, owner: U[(i * 3) % U.length].id, status: ['planning', 'active', 'active', 'on_hold', 'done'][i % 5], budget: 25e6 + Math.round(r() * 40) * 5e6, dueDate: new Date(K.NOW + (i - 3) * 12 * 86400000).toISOString(), description: 'Deskripsi singkat proyek, tujuan, dan ruang lingkup.', createdAt: ago(1440 * (40 - i * 3)) }));

  Object.assign(K.seed, { projects, approvals, approvalTypes: Object.entries(types).map(([id, name]) => ({ id, name })), locations });
})(window.K);
