# Dokumentasi Kontrol

Panduan teknis untuk memakai, memperluas, dan menyambungkan template ke backend.

| Dokumen | Isi | Baca bila… |
|---|---|---|
| [getting-started.md](getting-started.md) | Menjalankan, `config.js`, deploy GitHub Pages, mode offline | Baru pertama kali memakai |
| [architecture.md](architecture.md) | Lapisan `core/` vs `pages/`, urutan script, router, store, siklus render | Ingin memahami cara kerja |
| [crud-pattern.md](crud-pattern.md) | Membuat modul baru dari `example.js` langkah demi langkah | Menambah modul bisnis |
| [api.md](api.md) | `K.api`, mode demo ↔ API, kontrak REST, error 401/403/422/5xx | Menyambung backend |
| [permissions.md](permissions.md) | `K.can`, `data-perm`, pratinjau peran, batas tanggung jawab server | Mengatur hak akses |
| [i18n.md](i18n.md) | `K.t`, atribut `data-i18n*`, menambah bahasa | Menerjemahkan UI |
| [session.md](session.md) | Kunci layar otomatis saat idle | Mengatur keamanan sesi |
| [components.md](components.md) | Referensi `K.ui`, `K.DataTable`, `K.charts`, `K.validate`, kelas CSS | Membangun halaman |
| [accessibility.md](accessibility.md) | Standar a11y, hasil audit, checklist modul baru | Review sebelum rilis |

> Prinsip utama: **frontend hanya menyaring tampilan**. Otorisasi, validasi akhir, perhitungan uang, dan masa berlaku sesi selalu ditegakkan di server.
