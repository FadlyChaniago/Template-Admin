/* ==========================================================================
   K.seed — data demo (ilustratif). Dibangkitkan deterministik dari seed
   sehingga setiap reload menghasilkan data yang sama.
   Ganti modul ini dengan panggilan API saat integrasi backend.
   ========================================================================== */
(function (K) {
  'use strict';
  const r = K.util.rng(2026);
  const pick = arr => arr[Math.floor(r() * arr.length)];
  const between = (a, b) => Math.floor(a + r() * (b - a + 1));
  const ago = (minutes) => new Date(K.NOW - minutes * 60000).toISOString();
  const DAY = 1440;

  /* ---------- Roles & permissions ---------- */
  const permissionModules = [
    { key: 'dashboard', label: 'Dashboard', actions: ['view'] },
    { key: 'analytics', label: 'Analytics', actions: ['view', 'export'] },
    { key: 'reports', label: 'Reports', actions: ['view', 'create', 'export', 'delete'] },
    { key: 'users', label: 'Users', actions: ['view', 'create', 'update', 'delete'] },
    { key: 'teams', label: 'Teams', actions: ['view', 'create', 'update', 'delete'] },
    { key: 'organizations', label: 'Organizations', actions: ['view', 'create', 'update', 'delete'] },
    { key: 'roles', label: 'Roles & Permissions', actions: ['view', 'create', 'update', 'delete'] },
    { key: 'content', label: 'Content (Pages, Media, Taxonomy)', actions: ['view', 'create', 'update', 'delete', 'publish'] },
    { key: 'applications', label: 'Applications', actions: ['view', 'create', 'update', 'delete', 'deploy'] },
    { key: 'integrations', label: 'Integrations & Webhooks', actions: ['view', 'create', 'update', 'delete'] },
    { key: 'api', label: 'API Management', actions: ['view', 'create', 'revoke'] },
    { key: 'system', label: 'System (Tasks, Health)', actions: ['view', 'update'] },
    { key: 'audit', label: 'Audit Logs', actions: ['view', 'export'] },
    { key: 'settings', label: 'Settings', actions: ['view', 'update'] },
    { key: 'billing', label: 'Billing & Plan', actions: ['view', 'update'] },
  ];
  const allPerms = permissionModules.flatMap(m => m.actions.map(a => `${m.key}.${a}`));
  const viewPerms = allPerms.filter(p => p.endsWith('.view'));

  const roles = [
    { id: 'role_owner', name: 'Owner', description: 'Akses penuh termasuk billing dan penghapusan workspace.', system: true, permissions: [...allPerms], color: 'violet' },
    { id: 'role_admin', name: 'Workspace Admin', description: 'Mengelola pengguna, konten, aplikasi, dan pengaturan.', system: true, permissions: allPerms.filter(p => !p.startsWith('billing.update')), color: 'blue' },
    { id: 'role_editor', name: 'Editor', description: 'Membuat dan menerbitkan konten serta laporan.', system: false, permissions: [...viewPerms.filter(p => !['roles.view', 'billing.view', 'audit.view'].includes(p)), 'content.create', 'content.update', 'content.publish', 'reports.create', 'reports.export'], color: 'emerald' },
    { id: 'role_developer', name: 'Developer', description: 'Mengelola aplikasi, integrasi, API key, dan webhook.', system: false, permissions: [...viewPerms, 'applications.create', 'applications.update', 'applications.deploy', 'integrations.create', 'integrations.update', 'api.create', 'api.revoke', 'system.update'], color: 'sky' },
    { id: 'role_analyst', name: 'Analyst', description: 'Melihat dan mengekspor analitik serta laporan.', system: false, permissions: ['dashboard.view', 'analytics.view', 'analytics.export', 'reports.view', 'reports.create', 'reports.export'], color: 'amber' },
    { id: 'role_viewer', name: 'Viewer', description: 'Akses baca saja ke dashboard dan konten.', system: true, permissions: ['dashboard.view', 'analytics.view', 'reports.view', 'content.view'], color: 'rose' },
  ];

  /* ---------- Users ---------- */
  const first = ['Andi', 'Siti', 'Budi', 'Dewi', 'Rizky', 'Maya', 'Agus', 'Putri', 'Hendra', 'Ayu', 'Fajar', 'Nadia', 'Yoga', 'Intan', 'Rudi', 'Laras', 'Dimas', 'Citra', 'Bayu', 'Rina', 'Teguh', 'Wulan', 'Arif', 'Sari', 'Galih', 'Nurul', 'Eko', 'Fitri', 'Joko', 'Melati', 'Reza', 'Tasya', 'Ilham', 'Kartika', 'Wahyu'];
  const last = ['Pratama', 'Nurhaliza', 'Santoso', 'Lestari', 'Ramadhan', 'Putri', 'Wijaya', 'Saputra', 'Hidayat', 'Kusuma', 'Siregar', 'Nasution', 'Halim', 'Permana', 'Gunawan', 'Utami', 'Setiawan', 'Anggraini', 'Firmansyah', 'Simanjuntak'];
  const teamNames = ['Engineering', 'Product', 'Design', 'Marketing', 'Operations', 'Customer Success', 'Finance'];
  const statuses = ['active', 'active', 'active', 'active', 'active', 'invited', 'suspended'];

  const users = [{
    id: 'usr_me', name: 'Fadly Ahmad', email: 'fadly@kontrol.id', roleId: 'role_admin', team: 'Engineering',
    status: 'active', lastActive: ago(0), createdAt: ago(DAY * 420), twoFA: true, phone: '+62 812-3456-7890', title: 'Workspace Admin', location: 'Jakarta, Indonesia',
  }];
  const usedNames = new Set(['Fadly Ahmad']);
  while (users.length < 38) {
    const name = pick(first) + ' ' + pick(last);
    if (usedNames.has(name)) continue;
    usedNames.add(name);
    const st = pick(statuses);
    users.push({
      id: 'usr_' + users.length.toString().padStart(3, '0'),
      name,
      email: K.util.slugify(name).replace('-', '.') + '@kontrol.id',
      roleId: pick(['role_editor', 'role_editor', 'role_developer', 'role_developer', 'role_analyst', 'role_viewer', 'role_viewer', 'role_admin']),
      team: pick(teamNames),
      status: st,
      lastActive: st === 'invited' ? null : ago(between(2, DAY * 20)),
      createdAt: ago(between(DAY * 10, DAY * 400)),
      twoFA: r() > 0.35,
    });
  }
  users[1].roleId = 'role_owner'; users[1].status = 'active';
  [7, 19, 30].forEach(i => { users[i].status = 'invited'; users[i].lastActive = null; });

  /* ---------- Teams ---------- */
  const teamDesc = {
    'Engineering': 'Membangun dan memelihara platform inti.',
    'Product': 'Merancang roadmap dan prioritas fitur.',
    'Design': 'Sistem desain, riset, dan pengalaman pengguna.',
    'Marketing': 'Akuisisi, kampanye, dan konten brand.',
    'Operations': 'Proses internal, vendor, dan kepatuhan.',
    'Customer Success': 'Onboarding dan retensi pelanggan.',
    'Finance': 'Anggaran, penagihan, dan pelaporan keuangan.',
  };
  const teams = teamNames.map((name, i) => {
    const members = users.filter(u => u.team === name).map(u => u.id);
    return {
      id: 'team_' + (i + 1), name, description: teamDesc[name], lead: members[0] || 'usr_me',
      members, color: K.util.tone(name), createdAt: ago(DAY * (300 - i * 25)), visibility: i % 3 === 2 ? 'private' : 'public',
    };
  });

  /* ---------- Organizations ---------- */
  const organizations = [
    ['PT Nusantara Digital', 'nusantaradigital.co.id', 'Enterprise', 'Jakarta'],
    ['CV Maju Bersama', 'majubersama.id', 'Professional', 'Bandung'],
    ['PT Sinar Logistik', 'sinarlogistik.com', 'Enterprise', 'Surabaya'],
    ['Koperasi Sejahtera', 'kopsejahtera.or.id', 'Starter', 'Yogyakarta'],
    ['PT Teknologi Kreatif', 'tekreatif.id', 'Professional', 'Jakarta'],
    ['Yayasan Pendidikan Cerdas', 'ypcerdas.sch.id', 'Starter', 'Semarang'],
    ['PT Agro Lestari', 'agrolestari.co.id', 'Professional', 'Medan'],
    ['PT Kesehatan Prima', 'kesehatanprima.id', 'Enterprise', 'Makassar'],
    ['CV Kopi Kenangan Lama', 'kopilama.id', 'Starter', 'Denpasar'],
    ['PT Energi Hijau', 'energihijau.co.id', 'Professional', 'Balikpapan'],
  ].map(([name, domain, plan, city], i) => ({
    id: 'org_' + (i + 1), name, domain, plan, city,
    members: plan === 'Enterprise' ? between(120, 640) : plan === 'Professional' ? between(25, 110) : between(3, 20),
    status: i === 3 ? 'trial' : i === 8 ? 'suspended' : 'active',
    createdAt: ago(DAY * between(30, 600)),
    owner: pick(users).name,
  }));

  /* ---------- Content ---------- */
  const categories = [
    ['Pengumuman', 'Berita dan rilis resmi', 'blue'],
    ['Panduan', 'Tutorial langkah demi langkah', 'emerald'],
    ['Produk', 'Halaman fitur dan harga', 'violet'],
    ['Studi Kasus', 'Cerita sukses pelanggan', 'amber'],
    ['Engineering', 'Catatan teknis tim', 'sky'],
    ['Kebijakan', 'Dokumen legal dan privasi', 'rose'],
  ].map(([name, description, color], i) => ({ id: 'cat_' + (i + 1), name, slug: K.util.slugify(name), description, color, parent: null }));
  categories.push({ id: 'cat_7', name: 'Rilis Fitur', slug: 'rilis-fitur', description: 'Sub-kategori pengumuman fitur', color: 'blue', parent: 'cat_1' });

  const tags = ['onboarding', 'keamanan', 'api', 'performa', 'integrasi', 'tips', 'changelog', 'webinar', 'enterprise', 'mobile', 'otomasi', 'laporan', 'billing', 'aksesibilitas']
    .map((name, i) => ({ id: 'tag_' + (i + 1), name, slug: name, color: K.util.tone(name), createdAt: ago(DAY * between(5, 300)) }));

  const pageTitles = ['Beranda', 'Tentang Kami', 'Harga', 'Kontak', 'Kebijakan Privasi', 'Syarat & Ketentuan', 'Memulai dengan Kontrol', 'Mengelola Peran Pengguna', 'Integrasi Webhook', 'Rilis Oktober 2026', 'Studi Kasus: PT Sinar Logistik', 'Panduan Keamanan Akun', 'Optimasi Laporan Bulanan', 'Karier', 'Blog', 'Status Layanan', 'Mengenal API v2', 'Webinar Otomasi Q4', 'FAQ Billing', 'Aksesibilitas', 'Studi Kasus: Koperasi Sejahtera', 'Catatan Rilis September', 'Panduan Migrasi Data', 'Tim Kami'];
  const pageStatus = ['published', 'published', 'published', 'draft', 'scheduled', 'archived'];
  const pages = pageTitles.map((title, i) => {
    const cat = pick(categories);
    const st = i < 6 ? 'published' : pick(pageStatus);
    return {
      id: 'page_' + (i + 1), title, slug: '/' + K.util.slugify(title), categoryId: cat.id,
      tags: [pick(tags).id, pick(tags).id].filter((v, j, a) => a.indexOf(v) === j),
      authorId: pick(users.slice(0, 15)).id, status: st,
      views: st === 'published' ? between(120, 48000) : 0,
      updatedAt: ago(between(30, DAY * 60)),
      publishAt: st === 'scheduled' ? new Date(K.NOW + between(1, 14) * 86400000).toISOString() : null,
      excerpt: 'Ringkasan singkat halaman "' + title + '" untuk mesin pencari dan kartu pratinjau.',
    };
  });

  const mediaNames = [
    ['hero-beranda.jpg', 'image', '1920×1080'], ['logo-kontrol.svg', 'image', '512×512'], ['tim-engineering.jpg', 'image', '2400×1600'],
    ['dashboard-preview.png', 'image', '1440×900'], ['panduan-onboarding.pdf', 'document', null], ['demo-produk.mp4', 'video', '1920×1080'],
    ['ikon-fitur-01.svg', 'image', '96×96'], ['ikon-fitur-02.svg', 'image', '96×96'], ['laporan-q3-2026.pdf', 'document', null],
    ['banner-webinar.png', 'image', '1200×628'], ['podcast-ep12.mp3', 'audio', null], ['kantor-jakarta.jpg', 'image', '2048×1365'],
    ['studi-kasus-sinar.pdf', 'document', null], ['tutorial-webhook.mp4', 'video', '1280×720'], ['avatar-default.png', 'image', '256×256'],
    ['og-image.png', 'image', '1200×630'], ['harga-2026.xlsx', 'document', null], ['ilustrasi-keamanan.svg', 'image', '800×600'],
    ['event-q4.jpg', 'image', '1600×900'], ['brand-guideline.pdf', 'document', null],
  ];
  const media = mediaNames.map(([name, type, dims], i) => ({
    id: 'med_' + (i + 1), name, type, dims,
    size: type === 'video' ? between(18e6, 140e6) : type === 'audio' ? between(4e6, 28e6) : type === 'document' ? between(220e3, 6e6) : between(18e3, 2.4e6),
    uploadedBy: pick(users.slice(0, 12)).id, createdAt: ago(between(60, DAY * 90)),
    tone: K.util.tone(name), alt: name.replace(/\.[a-z0-9]+$/, '').replace(/-/g, ' '),
  }));

  /* ---------- Applications ---------- */
  const applications = [
    ['Customer Portal', 'Portal swalayan untuk pelanggan', 'web', 'production', 'v3.8.2', 'healthy', 'layout-dashboard'],
    ['Mobile App', 'Aplikasi Android & iOS', 'mobile', 'production', 'v2.14.0', 'healthy', 'smartphone'],
    ['Billing Service', 'Penagihan & invoice berulang', 'service', 'production', 'v1.22.5', 'degraded', 'receipt'],
    ['Notification Hub', 'Email, WhatsApp, push', 'service', 'production', 'v4.1.0', 'healthy', 'bell'],
    ['Internal CMS', 'Manajemen konten internal', 'web', 'staging', 'v0.9.3', 'healthy', 'file-text'],
    ['Data Pipeline', 'ETL harian ke data warehouse', 'service', 'production', 'v2.3.1', 'healthy', 'database'],
    ['Partner API', 'Gateway API untuk mitra', 'service', 'production', 'v2.0.7', 'healthy', 'network'],
    ['Admin Mobile', 'Persetujuan cepat untuk admin', 'mobile', 'development', 'v0.4.0', 'paused', 'tablet-smartphone'],
  ].map(([name, description, type, env, version, status, icon], i) => ({
    id: 'app_' + (i + 1), name, description, type, env, version, status, icon,
    ownerTeam: pick(['Engineering', 'Product', 'Operations']), lastDeploy: ago(between(40, DAY * 12)),
    requests: between(12e3, 2.4e6), uptime: status === 'degraded' ? 98.72 : 99.9 + r() * 0.09, clientId: 'kt_' + r().toString(36).slice(2, 14),
  }));

  const integrations = [
    ['Slack Workspace', 'Komunikasi', 'Kirim notifikasi dan alert ke channel tim.', true, 'message-square'],
    ['WhatsApp Business', 'Komunikasi', 'Notifikasi transaksional via WhatsApp Cloud API.', true, 'message-circle'],
    ['Telegram Bot', 'Komunikasi', 'Bot alert untuk insiden dan laporan harian.', true, 'send'],
    ['Email SMTP', 'Komunikasi', 'Pengiriman email via server SMTP Anda.', true, 'mail'],
    ['Google Workspace', 'Produktivitas', 'Single sign-on dan sinkronisasi direktori.', false, 'globe'],
    ['Microsoft Entra ID', 'Identitas', 'SSO SAML/OIDC dan provisioning SCIM.', false, 'shield-check'],
    ['PostgreSQL', 'Data', 'Sinkronisasi data ke database PostgreSQL.', true, 'database'],
    ['S3 Compatible Storage', 'Data', 'Simpan media dan ekspor ke bucket objek.', true, 'hard-drive'],
    ['Payment Gateway', 'Pembayaran', 'Terima pembayaran VA, QRIS, dan kartu.', false, 'credit-card'],
    ['Accounting Sync', 'Keuangan', 'Ekspor invoice ke sistem akuntansi.', false, 'calculator'],
    ['Git Repository', 'Developer', 'Deploy otomatis dari branch repositori.', true, 'git-branch'],
    ['Error Tracking', 'Developer', 'Kirim exception ke platform monitoring.', false, 'bug'],
  ].map(([name, category, description, connected, icon], i) => ({
    id: 'int_' + (i + 1), name, category, description, connected, icon, tone: K.util.tone(name),
    connectedAt: connected ? ago(between(DAY, DAY * 200)) : null,
  }));

  const scopesAll = ['users:read', 'users:write', 'content:read', 'content:write', 'reports:read', 'webhooks:write', 'analytics:read'];
  const apiKeys = [
    ['Production — Partner API', 'live', ['users:read', 'content:read', 'analytics:read']],
    ['Data Pipeline ETL', 'live', ['reports:read', 'analytics:read']],
    ['Mobile App Backend', 'live', ['users:read', 'users:write', 'content:read']],
    ['Staging QA', 'test', [...scopesAll]],
    ['Notification Hub', 'live', ['users:read', 'webhooks:write']],
    ['Legacy Integration', 'live', ['content:read']],
  ].map(([name, env, scopes], i) => ({
    id: 'key_' + (i + 1), name, env, scopes,
    prefix: `kt_${env}_` + r().toString(36).slice(2, 6),
    createdAt: ago(DAY * between(10, 300)), lastUsed: i === 5 ? ago(DAY * 94) : ago(between(1, 600)),
    status: i === 5 ? 'revoked' : 'active', createdBy: pick(users.slice(0, 10)).id,
  }));

  const webhookEvents = ['user.created', 'user.updated', 'user.deleted', 'page.published', 'transaction.succeeded', 'transaction.failed', 'report.generated', 'app.deployed'];
  const webhooks = [
    ['https://hooks.nusantaradigital.co.id/kontrol', ['user.created', 'user.updated'], 'active', 99.8],
    ['https://api.sinarlogistik.com/webhooks/events', ['transaction.succeeded', 'transaction.failed'], 'active', 97.4],
    ['https://notify.internal.kontrol.id/wa', ['transaction.failed', 'report.generated'], 'active', 100],
    ['https://ci.kontrol.id/hooks/deploy', ['app.deployed'], 'active', 100],
    ['https://old-crm.majubersama.id/inbound', ['user.created'], 'failing', 41.2],
    ['https://analytics.tekreatif.id/collect', ['page.published'], 'disabled', 0],
  ].map(([url, events, status, rate], i) => ({
    id: 'wh_' + (i + 1), url, events, status, successRate: rate, lastDelivery: status === 'disabled' ? null : ago(between(1, 400)),
    secret: 'whsec_' + r().toString(36).slice(2, 18), createdAt: ago(DAY * between(10, 200)), description: '',
  }));

  /* ---------- Notifications ---------- */
  const notifications = [
    ['Laporan bulanan siap ditinjau', 'Laporan Pendapatan September 2026 telah dibuat otomatis.', 'report', false, 5],
    ['3 anggota bergabung ke workspace', 'Citra, Bayu, dan Rina menerima undangan.', 'user', false, 20],
    ['Sinkronisasi aplikasi selesai', 'Data Pipeline menyinkronkan 182.430 baris.', 'system', false, 32],
    ['Pengaturan keamanan diperbarui', 'Kebijakan kata sandi diubah oleh Fadly Ahmad.', 'security', false, 60],
    ['Webhook gagal terkirim', 'Endpoint old-crm.majubersama.id merespons 503 sebanyak 12 kali.', 'alert', true, 180],
    ['Deploy Customer Portal v3.8.2', 'Deploy produksi berhasil dalam 2m 14d.', 'system', true, 320],
    ['Kuota API mencapai 80%', 'Partner API menggunakan 80% kuota bulanan.', 'alert', true, 600],
    ['Komentar baru di "Rilis Oktober 2026"', 'Dewi Lestari menambahkan 2 komentar.', 'content', true, DAY + 120],
    ['Tagihan Oktober diterbitkan', 'Invoice INV-2026-10 sebesar Rp4.990.000.', 'billing', true, DAY * 2],
    ['Sertifikat SSL diperpanjang', 'Sertifikat *.kontrol.id berlaku hingga Okt 2027.', 'security', true, DAY * 3],
  ].map(([title, text, type, read, m], i) => ({ id: 'ntf_' + (i + 1), title, text, type, read, createdAt: ago(m) }));

  /* ---------- Tasks & jobs ---------- */
  const tasks = [
    ['Sinkronisasi data harian', 'ETL', '0 2 * * *', 'success', 100, 14],
    ['Kirim laporan mingguan', 'Report', '0 8 * * 1', 'scheduled', 0, 0],
    ['Backup database', 'Maintenance', '0 1 * * *', 'success', 100, 22],
    ['Reindex pencarian', 'Maintenance', '30 3 * * *', 'running', 64, 0],
    ['Ekspor transaksi Oktober', 'Export', 'manual', 'running', 38, 0],
    ['Pembersihan sesi kedaluwarsa', 'Maintenance', '*/30 * * * *', 'success', 100, 1],
    ['Kirim notifikasi WhatsApp antrean', 'Queue', '* * * * *', 'running', 81, 0],
    ['Rotasi log aplikasi', 'Maintenance', '0 0 * * 0', 'scheduled', 0, 0],
    ['Hitung ulang metrik analitik', 'Analytics', '0 */6 * * *', 'queued', 0, 0],
    ['Retry webhook gagal', 'Queue', '*/5 * * * *', 'failed', 100, 2],
    ['Generate thumbnail media', 'Queue', 'event', 'running', 52, 0],
    ['Sinkronisasi SCIM direktori', 'Integration', '0 */4 * * *', 'paused', 0, 0],
    ['Arsip halaman kedaluwarsa', 'Content', '0 4 1 * *', 'scheduled', 0, 0],
    ['Validasi kunci API', 'Security', '0 5 * * *', 'success', 100, 3],
    ['Agregasi data per jam', 'Analytics', '0 * * * *', 'queued', 0, 0],
  ].map(([name, type, schedule, status, progress, durMin], i) => ({
    id: 'job_' + (i + 1), name, type, schedule, status, progress,
    lastRun: status === 'scheduled' || status === 'queued' ? ago(DAY * between(1, 6)) : ago(between(1, 300)),
    nextRun: status === 'paused' ? null : new Date(K.NOW + between(5, 600) * 60000).toISOString(),
    duration: durMin ? durMin * 60 + between(0, 59) : null,
    attempts: status === 'failed' ? 5 : 1, owner: pick(users.slice(0, 8)).id,
    lastError: status === 'failed' ? 'HTTP 503 Service Unavailable dari endpoint tujuan setelah 5 percobaan.' : null,
  }));

  /* ---------- Audit logs ---------- */
  const auditActions = [
    ['user.login', 'Login berhasil', 'info', 'Session'], ['user.login_failed', 'Login gagal', 'warning', 'Session'],
    ['user.invite', 'Mengundang pengguna', 'info', 'User'], ['user.role_change', 'Mengubah peran pengguna', 'warning', 'User'],
    ['user.suspend', 'Menangguhkan pengguna', 'danger', 'User'], ['role.update', 'Memperbarui izin peran', 'warning', 'Role'],
    ['page.publish', 'Menerbitkan halaman', 'info', 'Page'], ['page.delete', 'Menghapus halaman', 'danger', 'Page'],
    ['api_key.create', 'Membuat API key', 'warning', 'API Key'], ['api_key.revoke', 'Mencabut API key', 'danger', 'API Key'],
    ['settings.update', 'Mengubah pengaturan', 'warning', 'Settings'], ['webhook.create', 'Membuat webhook', 'info', 'Webhook'],
    ['report.export', 'Mengekspor laporan', 'info', 'Report'], ['app.deploy', 'Deploy aplikasi', 'info', 'Application'],
    ['security.2fa_enabled', 'Mengaktifkan 2FA', 'info', 'Security'],
  ];
  const ips = ['103.28.12.44', '36.84.51.207', '114.4.82.19', '182.253.9.140', '125.160.17.88', '202.43.177.5'];
  const agents = ['Chrome 129 · macOS', 'Edge 129 · Windows', 'Firefox 131 · Ubuntu', 'Safari 18 · iOS', 'Chrome 129 · Android', 'API · kontrol-cli/2.1'];
  const auditLogs = Array.from({ length: 72 }, (_, i) => {
    const [action, label, severity, resourceType] = pick(auditActions);
    const actor = pick(users.slice(0, 14));
    return {
      id: 'aud_' + (1000 + 72 - i), action, label, severity, resourceType,
      resource: resourceType === 'Page' ? pick(pages).title : resourceType === 'User' ? pick(users).name : resourceType === 'API Key' ? pick(apiKeys).name : resourceType === 'Application' ? pick(applications).name : resourceType,
      actorId: actor.id, ip: pick(ips), userAgent: pick(agents), createdAt: ago(i * 37 + between(0, 30)),
    };
  });

  /* ---------- Activity feed ---------- */
  const verbs = [
    ['menerbitkan halaman', 'file-text', 'content'], ['mengunggah media', 'image', 'content'], ['mengomentari', 'message-square', 'content'],
    ['membuat laporan', 'chart-column', 'report'], ['bergabung ke tim', 'user-plus', 'team'], ['men-deploy', 'rocket', 'app'],
    ['memperbarui profil', 'user-pen', 'user'], ['menutup tugas', 'circle-check', 'task'], ['menambahkan webhook', 'webhook', 'app'],
  ];
  const activity = Array.from({ length: 48 }, (_, i) => {
    const [verb, icon, type] = pick(verbs);
    const target = type === 'content' ? pick(pages).title : type === 'report' ? 'Laporan ' + pick(['Pendapatan', 'Pengguna', 'Konversi', 'Produk']) : type === 'team' ? pick(teamNames) : type === 'app' ? pick(applications).name : type === 'task' ? pick(tasks).name : 'akunnya';
    return { id: 'act_' + i, userId: pick(users.slice(0, 20)).id, verb, target, icon, type, createdAt: ago(i * 52 + between(1, 40)) };
  });

  /* ---------- Products & transactions ---------- */
  const products = [
    { id: 'prd_pro', name: 'Paket Professional', price: 1250000, icon: 'layers', revenue: 42800000, sold: 613 },
    { id: 'prd_start', name: 'Paket Starter', price: 450000, icon: 'square-plus', revenue: 35600000, sold: 510 },
    { id: 'prd_seats', name: 'Add-on Team Seats', price: 750000, icon: 'user-plus', revenue: 28400000, sold: 408 },
    { id: 'prd_ent', name: 'Paket Enterprise', price: 2850000, icon: 'building-2', revenue: 21650000, sold: 311 },
  ];
  const txSeed = [
    ['Andi Pratama', 'prd_pro', 'success', 10 * 60 + 42], ['Siti Nurhaliza', 'prd_start', 'success', 10 * 60 + 35],
    ['Budi Santoso', 'prd_ent', 'pending', 10 * 60 + 21], ['Dewi Lestari', 'prd_seats', 'success', 9 * 60 + 58],
    ['Rizky Ramadhan', 'prd_start', 'failed', 9 * 60 + 47], ['Maya Putri', 'prd_pro', 'success', 9 * 60 + 32],
  ];
  const transactions = [];
  for (let i = 0; i < 64; i++) {
    let name, productId, status, minutesOfDay, dayOffset = 0;
    if (i < txSeed.length) { [name, productId, status, minutesOfDay] = txSeed[i]; }
    else {
      name = pick(first) + ' ' + pick(last); productId = pick(products).id;
      status = pick(['success', 'success', 'success', 'success', 'success', 'pending', 'failed', 'refunded']);
      dayOffset = Math.floor((i - 6) / 4) + (i > 6 ? 0 : 0); minutesOfDay = between(8 * 60, 21 * 60);
    }
    const p = products.find(x => x.id === productId);
    const d = new Date('2026-10-20T00:00:00+07:00').getTime() - dayOffset * 86400000 + minutesOfDay * 60000;
    transactions.push({
      id: '#TRX-' + String(1842 - i).padStart(5, '0'), customer: name, email: K.util.slugify(name).replace('-', '.') + '@gmail.com',
      productId, amount: p.price, status, createdAt: new Date(d).toISOString(), method: pick(['QRIS', 'Virtual Account', 'Kartu Kredit', 'E-Wallet']),
    });
  }

  /* ---------- Reports ---------- */
  const reports = [
    ['Pendapatan Bulanan', 'Keuangan', 'Bulanan', 'PDF', 'ready'], ['Pertumbuhan Pengguna', 'Pengguna', 'Mingguan', 'XLSX', 'ready'],
    ['Konversi per Kanal', 'Marketing', 'Mingguan', 'CSV', 'ready'], ['Performa Produk', 'Produk', 'Bulanan', 'PDF', 'generating'],
    ['Ringkasan Eksekutif Q3', 'Eksekutif', 'Kuartalan', 'PDF', 'ready'], ['Retensi Kohort', 'Pengguna', 'Bulanan', 'XLSX', 'ready'],
    ['SLA Tiket Dukungan', 'Operasional', 'Harian', 'CSV', 'failed'], ['Penggunaan API per Mitra', 'Developer', 'Mingguan', 'CSV', 'ready'],
    ['Audit Akses Bulanan', 'Keamanan', 'Bulanan', 'PDF', 'ready'], ['Transaksi Gagal', 'Keuangan', 'Harian', 'XLSX', 'scheduled'],
  ].map(([name, category, schedule, format, status], i) => ({
    id: 'rpt_' + (i + 1), name, category, schedule, format, status, ownerId: pick(users.slice(0, 12)).id,
    lastGenerated: status === 'scheduled' ? null : ago(between(30, DAY * 20)), size: between(80e3, 4.8e6), favorite: i < 3,
  }));

  /* ---------- Security ---------- */
  const sessions = [
    { id: 'ses_1', device: 'MacBook Pro · Chrome 129', location: 'Jakarta, ID', ip: '103.28.12.44', lastActive: ago(0), current: true, icon: 'laptop' },
    { id: 'ses_2', device: 'iPhone 15 · Safari', location: 'Jakarta, ID', ip: '36.84.51.207', lastActive: ago(95), current: false, icon: 'smartphone' },
    { id: 'ses_3', device: 'Windows · Edge 129', location: 'Bandung, ID', ip: '114.4.82.19', lastActive: ago(DAY * 2), current: false, icon: 'monitor' },
  ];

  const feedback = [
    { id: 'fb_1', type: 'idea', title: 'Filter tanggal kustom di laporan', status: 'planned', votes: 42, createdAt: ago(DAY * 6) },
    { id: 'fb_2', type: 'bug', title: 'Ekspor CSV memotong karakter aksen', status: 'in_progress', votes: 17, createdAt: ago(DAY * 3) },
    { id: 'fb_3', type: 'idea', title: 'Mode gelap otomatis mengikuti jadwal', status: 'shipped', votes: 88, createdAt: ago(DAY * 40) },
    { id: 'fb_4', type: 'question', title: 'Bagaimana membatasi IP untuk API key?', status: 'answered', votes: 9, createdAt: ago(DAY * 1) },
  ];

  const settings = {
    workspaceName: 'Kontrol Workspace', workspaceUrl: 'kontrol', supportEmail: 'support@kontrol.id', industry: 'Teknologi',
    timezone: 'Asia/Jakarta', language: 'id', currency: 'IDR', dateFormat: 'DD/MM/YYYY', timeFormat: '24h', weekStart: 'monday', numberFormat: 'id-ID',
    passwordMinLength: 12, requireSymbols: true, enforce2FA: false, sessionTimeout: 60, ipAllowlist: '', ssoEnabled: false,
    emailDigest: true, productUpdates: true, securityAlerts: true, weeklyReport: true,
    plan: 'Professional', seatsUsed: 37, seatsTotal: 50, storageUsed: 38.4, storageTotal: 100, apiCallsUsed: 812400, apiCallsTotal: 1000000,
  };

  K.seed = {
    permissionModules, roles, users, teams, organizations, categories, tags, pages, media,
    applications, integrations, apiKeys, webhooks, webhookEvents, notifications, tasks, auditLogs, activity,
    products, transactions, reports, sessions, feedback, settings, scopesAll,
  };
})(window.K);
