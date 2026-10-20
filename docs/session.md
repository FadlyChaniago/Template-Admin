# Sesi idle & lock screen

Setelah tidak ada aktivitas (mouse, keyboard, sentuh, scroll) selama batas waktu, muncul dialog peringatan dengan hitung mundur. Bila tidak ada respons, pengguna diarahkan ke `lock-screen.html?next=#/halaman-terakhir`, dan setelah membuka kunci kembali ke halaman semula.

| Pengaturan | Sumber |
|---|---|
| Batas idle | `K.config.sessionIdleMinutes`, atau (bila `null`) **Security Settings → Batas waktu sesi idle** |
| Lama peringatan | `K.config.sessionWarnSeconds` (default 60 dtk) |
| Nonaktif | `sessionIdleMinutes: 0` |

Aktivitas di tab lain ikut dihitung (sinkron lewat `localStorage`), jadi pengguna yang aktif di tab A tidak terkunci di tab B.

```js
K.session.preview()  // tampilkan dialog peringatan sekarang (untuk uji/QA)
K.session.lock()     // kunci layar segera
```

Tombol **Coba peringatan sesi** juga ada di Security Settings.

## ⚠️ Batas tanggung jawab

Ini fitur kenyamanan/privasi layar, **bukan** kontrol keamanan. Masa berlaku sesi harus ditegakkan server (mis. `SESSION_LIFETIME` Laravel + `expire_on_close`). Bila server mengembalikan `401`, `K.api` otomatis mengarahkan ke login.
