/* ==========================================================================
   K.seed (v3) — data demo untuk Kanban, Calendar, Inbox, Import, Invoices.
   Dimuat setelah data.js dan sebelum store.js.
   ========================================================================== */
(function (K) {
  'use strict';
  const r = K.util.rng(303);
  const pick = a => a[Math.floor(r() * a.length)];
  const ago = m => new Date(K.NOW - m * 60000).toISOString();
  const day = (d, h = 9, min = 0) => { const t = new Date('2026-10-01T00:00:00+07:00'); t.setDate(d); t.setHours(h, min, 0, 0); return t.toISOString(); };
  const users = K.seed.users;
  const uid = i => users[i % users.length].id;

  /* ---------- Kanban ---------- */
  const labels = [['bug', 'rose'], ['fitur', 'blue'], ['desain', 'violet'], ['backend', 'emerald'], ['dokumentasi', 'amber'], ['riset', 'sky']];
  const cards = [
    ['todo', 'Integrasi notifikasi WhatsApp untuk tiket ATM', ['fitur', 'backend'], 'high'],
    ['todo', 'Rancang ulang halaman onboarding', ['desain'], 'medium'],
    ['backlog', 'Riset penyedia OCR untuk faktur', ['riset'], 'low'],
    ['backlog', 'Dark mode untuk email transaksional', ['desain'], 'low'],
    ['backlog', 'Ekspor laporan ke Google Sheets', ['fitur'], 'medium'],
    ['progress', 'Migrasi tabel audit_logs ke partisi bulanan', ['backend'], 'high'],
    ['progress', 'Perbaiki filter tanggal di laporan SLA', ['bug'], 'urgent'],
    ['review', 'API v2: endpoint bulk update pengguna', ['backend', 'fitur'], 'medium'],
    ['review', 'Panduan setup SSO SAML', ['dokumentasi'], 'low'],
    ['done', 'Rate limit per API key', ['backend'], 'high'],
    ['done', 'Komponen DataTable reusable', ['fitur'], 'medium'],
    ['todo', 'Halaman status publik', ['fitur', 'desain'], 'medium'],
  ].map(([status, title, lbl, priority], i) => ({
    id: 'card_' + (i + 1), status, title, labels: lbl, priority, assignee: uid(i + 2), order: i,
    due: i % 3 === 0 ? day(18 + (i % 10)) : null, comments: Math.floor(r() * 6), checklist: [Math.floor(r() * 4), 4],
    description: 'Deskripsi singkat tugas. Tambahkan kriteria selesai (definition of done) di sini.',
  }));

  /* ---------- Calendar ---------- */
  const cats = { meeting: ['Rapat', 'blue'], deploy: ['Deploy', 'emerald'], maintenance: ['Pemeliharaan', 'amber'], leave: ['Cuti', 'rose'], event: ['Acara', 'violet'] };
  const events = [
    [2, 9, 'Sprint planning', 'meeting', 60], [3, 14, 'Review keamanan Q4', 'meeting', 90], [6, 2, 'Pemeliharaan database', 'maintenance', 30],
    [8, 10, 'Deploy Customer Portal v3.8', 'deploy', 30], [9, 13, 'Demo ke PT Sinar Logistik', 'event', 60], [13, 9, 'Sprint planning', 'meeting', 60],
    [15, 15, 'Deploy Billing Service', 'deploy', 45], [16, 9, 'Cuti — Dewi', 'leave', 480], [17, 9, 'Cuti — Dewi', 'leave', 480],
    [20, 13, 'Retro sprint', 'meeting', 60], [20, 16, 'Webinar Otomasi Q4', 'event', 90], [22, 10, 'Audit akses bulanan', 'meeting', 60],
    [23, 2, 'Upgrade PostgreSQL 17', 'maintenance', 120], [27, 9, 'Sprint planning', 'meeting', 60], [28, 11, 'Deploy Mobile App 2.15', 'deploy', 30],
    [30, 15, 'Town hall Oktober', 'event', 60],
  ].map(([d, h, title, cat, dur], i) => ({ id: 'evt_' + (i + 1), title, category: cat, start: day(d, h), duration: dur, location: cat === 'meeting' ? 'Ruang Garuda / Meet' : '', notes: '' }));

  /* ---------- Inbox ---------- */
  const convs = [
    ['whatsapp', 'Andi Pratama', 'Halo, invoice bulan ini sudah bisa diunduh?', 3, 2],
    ['email', 'PT Sinar Logistik', 'Permintaan penambahan 20 kursi pengguna', 25, 1],
    ['internal', 'Tim Engineering', 'Deploy Billing Service ditunda ke jam 15.00', 48, 0],
    ['whatsapp', 'Siti Nurhaliza', 'Terima kasih, masalah login sudah teratasi 🙏', 120, 0],
    ['email', 'Koperasi Sejahtera', 'Pertanyaan soal perpanjangan trial', 300, 0],
    ['internal', 'Dewi Lestari', 'Bisa review draft panduan SSO?', 600, 0],
    ['whatsapp', 'Budi Santoso', 'Pembayaran saya masih pending dari kemarin', 1500, 0],
  ];
  const threads = {
    0: [['in', 'Selamat pagi, saya Andi dari PT Nusantara Digital.', 30], ['out', 'Pagi Pak Andi, ada yang bisa kami bantu?', 25], ['in', 'Halo, invoice bulan ini sudah bisa diunduh?', 3]],
    1: [['in', 'Kami ingin menambah 20 kursi pengguna untuk tim operasional. Mohon info biayanya.', 25]],
    2: [['in', 'Deploy Billing Service ditunda ke jam 15.00 karena menunggu hasil load test.', 48], ['out', 'Siap, saya informasikan ke tim finance.', 40]],
    3: [['out', 'Sudah kami reset ya Bu, silakan coba login kembali.', 130], ['in', 'Terima kasih, masalah login sudah teratasi 🙏', 120]],
    4: [['in', 'Trial kami habis minggu depan. Apakah bisa diperpanjang 7 hari?', 300]],
    5: [['in', 'Bisa review draft panduan SSO? Linknya ada di halaman Docs.', 600]],
    6: [['in', 'Pembayaran saya masih pending dari kemarin', 1500], ['out', 'Baik Pak, kami cek dulu ke payment gateway.', 1490]],
  };
  const conversations = convs.map(([channel, name, last, m, unread], i) => ({
    id: 'conv_' + (i + 1), channel, name, unread, starred: i === 1, status: i === 6 ? 'pending' : 'open', assignee: i % 2 ? 'usr_me' : uid(i + 3),
    phone: channel === 'whatsapp' ? '+62 81' + (2000000000 + Math.floor(r() * 8e8)).toString().slice(0, 9) : null,
    email: channel === 'email' ? 'cs@' + K.util.slugify(name).replace(/^pt-|^cv-/, '') + '.id' : null,
    updatedAt: ago(m),
    messages: threads[i].map(([dir, text, mm], j) => ({ id: `msg_${i}_${j}`, dir, text, at: ago(mm), author: dir === 'out' ? 'usr_me' : null })),
  }));

  /* ---------- Invoices ---------- */
  const orgs = K.seed.organizations;
  const items = [['Paket Professional (bulanan)', 1250000], ['Add-on Team Seats ×10', 750000], ['Paket Enterprise (bulanan)', 2850000], ['Implementasi & onboarding', 3500000], ['Paket Starter (bulanan)', 450000], ['Penyimpanan tambahan 100 GB', 300000]];
  const invStatus = ['paid', 'paid', 'paid', 'unpaid', 'overdue', 'draft'];
  const invoices = Array.from({ length: 18 }, (_, i) => {
    const o = orgs[i % orgs.length];
    const lines = Array.from({ length: 1 + Math.floor(r() * 3) }, () => { const [desc, price] = pick(items); return { desc, qty: 1 + Math.floor(r() * 2), price }; });
    const issue = new Date(K.NOW - (i * 9 + 2) * 86400000);
    const st = i < 2 ? (i ? 'overdue' : 'unpaid') : pick(invStatus);
    return {
      id: 'inv_' + (i + 1), number: `INV-2026-${String(1042 - i).padStart(4, '0')}`, orgId: o.id, client: o.name, email: 'finance@' + o.domain,
      address: o.city + ', Indonesia', lines, discount: i % 5 === 0 ? 10 : 0, tax: 11,
      issueDate: issue.toISOString(), dueDate: new Date(issue.getTime() + 14 * 86400000).toISOString(), status: st, notes: 'Pembayaran melalui transfer ke rekening yang tercantum. Terima kasih atas kerja samanya.',
      paidAt: st === 'paid' ? new Date(issue.getTime() + 5 * 86400000).toISOString() : null,
    };
  });

  const importHistory = [
    { id: 'imp_1', file: 'pengguna-cabang-bandung.csv', target: 'users', rows: 48, ok: 46, failed: 2, by: 'usr_me', createdAt: ago(1440 * 3) },
    { id: 'imp_2', file: 'kontak-mitra-q3.csv', target: 'users', rows: 120, ok: 120, failed: 0, by: uid(3), createdAt: ago(1440 * 12) },
    { id: 'imp_3', file: 'organisasi-baru.csv', target: 'organizations', rows: 9, ok: 8, failed: 1, by: 'usr_me', createdAt: ago(1440 * 20) },
  ];

  Object.assign(K.seed, { kanban: cards, kanbanLabels: labels.map(([name, color]) => ({ id: name, name, color })), events, eventCategories: Object.entries(cats).map(([id, [name, color]]) => ({ id, name, color })), conversations, invoices, importHistory });
})(window.K);
