# Izin & pratinjau peran

## Model

Peran (`roles`) berisi daftar izin `modul.aksi`, mis. `users.view`, `users.create`, `billing.update`. Matriksnya diatur di **Management → Roles & Permissions**.

```js
K.can('users.delete')   // → true/false untuk pengguna aktif (atau peran yang sedang dipratinjau)
```

## Tiga lapis penyaringan di UI

| Lapis | Cara | Efek |
|---|---|---|
| Menu & palette | `perm` pada item `K.nav` | Item disembunyikan |
| Route | `perm` pada item `K.nav` | Akses langsung via URL → halaman 403 |
| Elemen | atribut `data-perm` | Dihapus (default) atau dinonaktifkan |

```html
<!-- disembunyikan bila tidak berizin -->
<button class="btn btn-danger" data-perm="users.delete">Hapus</button>

<!-- tetap tampil tapi nonaktif + tooltip alasan -->
<button class="btn btn-primary" data-perm="settings.update" data-perm-mode="disable">Simpan</button>
```

`K.applyPerms(root)` dijalankan otomatis setelah setiap render halaman **dan** setiap kali `K.DataTable` menggambar ulang, jadi tombol di baris tabel ikut tersaring. Untuk HTML yang Anda sisipkan sendiri setelah render (mis. isi modal), panggil `K.applyPerms(el)`.

**Kapan hide vs disable?** Sembunyikan aksi yang memang bukan wewenang peran tersebut (mengurangi kebingungan). Nonaktifkan bila pengguna perlu tahu fiturnya ada (mis. tombol Simpan di Settings untuk Viewer).

## Pratinjau peran ("lihat sebagai")

Di **Roles & Permissions**, setiap kartu peran punya tombol *Pratinjau sebagai peran ini*. UI langsung berperilaku seperti peran tersebut, dengan banner biru di atas dan tombol **Keluar pratinjau**.

```js
K.viewAs.set('role_viewer');  // mulai
K.viewAs.set(null);           // selesai
```

Disimpan di `sessionStorage` (hilang saat tab ditutup) dan **tidak mengubah data apa pun**.

## ⚠️ Penting

Semua ini hanya **penyaringan tampilan**. Pengguna bisa memanggil API langsung, jadi setiap endpoint wajib dicek di server (Laravel Policy / Gate, middleware `can:`). Server juga sumber kebenaran daftar izin — di mode API, isi peran pengguna dari endpoint profil (mis. `GET /me`).
