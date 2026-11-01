# Potong Studio — demo pemesanan jasa edit video

Demo PHP sederhana untuk landing page, registrasi/login, pemesanan, dan panel admin. Tampilan menggunakan PHP templates, CSS, dan JavaScript terpisah. Data lokal disimpan pada SQLite; pada runtime tanpa SQLite demo beralih ke localStorage di browser.

## Menjalankan

Kebutuhan lokal: PHP 8.1+ dengan ekstensi `pdo_sqlite` aktif.

```sh
php database/seed.php
php -S 127.0.0.1:8000 -t public
```

Untuk menjalankan entry point proyek dari folder ini, gunakan:

```sh
php -S 127.0.0.1:8000 router.php
```

Buka `http://127.0.0.1:8000`. Akun demo: pelanggan `a` / `a`; admin `admin` / `admin`.

## Deploy ke Vercel

`vercel.json` mengaktifkan runtime komunitas `vercel-php` untuk entry point `index.php` dan endpoint di `api/`, menyajikan aset dari `public/assets`, serta mengarahkan halaman utama ke `index.php`. Halaman login ditampilkan dari beranda hanya setelah tombol Masuk dipilih. Import folder ini sebagai project Vercel lalu deploy.

Vercel tidak menyimpan perubahan ke SQLite lokal secara persisten. Tanpa database hosted, situs memakai mode demo browser: data hanya terlihat pada browser/perangkat yang sama. Jangan gunakan mode ini untuk data pelanggan sungguhan. Untuk penggunaan multi-user, hubungkan database hosted dan sesuaikan koneksi `app/config.php` sebelum deploy.

## Struktur

```text
api/                 Endpoint JSON untuk autentikasi dan pesanan
app/config.php       Koneksi SQLite dan helper server
app/includes/       Kerangka HTML
app/services/       Ruang untuk logika layanan
app/views/pages/    Halaman home, autentikasi, dan dashboard
app/views/partials/ Header dan footer
database/           Skema, seed, dan database SQLite lokal
public/assets/      CSS dan JavaScript antarmuka
tests/               Pemeriksaan manual/API
```

## Catatan demo

- Registrasi dan login menggunakan sesi PHP; password disimpan dengan `password_hash`.
- Pelanggan hanya melihat pesanan miliknya. Admin dapat melihat semua pesanan dan mengubah status.
- Tidak ada payment gateway. Angka harga hanya estimasi pada demo.
- `database/potong.sqlite` dibuat saat `database/seed.php` dijalankan secara lokal dan dikecualikan dari Git.
- Ganti kata sandi admin demo sebelum demo di jaringan publik.
