# OMNIA - PROJECT — WhatsApp Bot

<p align="center">
  <img src="https://img.shields.io/badge/versi-1.2.0-blue.svg" alt="Versi">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg" alt="Node">
  <img src="https://img.shields.io/badge/lisensi-ISC-yellow.svg" alt="Lisensi">
</p>

Halo! Selamat datang di OMNIA - PROJECT, sebuah bot WhatsApp yang dibangun dengan penuh cinta menggunakan Node.js. Bot ini dirancang untuk memudahkan kamu dalam mengelola WhatsApp, baik untuk keperluan pribadi maupun grup.

Apa yang membuat OMNIA - PROJECT spesial? Bot ini menggunakan sistem plugin yang modular, artinya kamu bisa dengan mudah menambah atau menghapus fitur sesuai kebutuhan. Tidak perlu jadi programmer handal untuk menggunakannya!

---

## Daftar Isi

Sebelum mulai, ini dia peta navigasi untuk membantu kamu menemukan informasi yang dibutuhkan:

1. [Kenapa Harus OMNIA - PROJECT?](#kenapa-harus-omnia---project)
2. [Apa Saja Fiturnya?](#apa-saja-fiturnya)
3. [Sebelum Memulai](#sebelum-memulai)
4. [Cara Instalasi](#cara-instalasi)
5. [Mengatur Bot](#mengatur-bot)
6. [Menjalankan Bot](#menjalankan-bot)
7. [Daftar Perintah](#daftar-perintah)
8. [Membuat Plugin Sendiri](#membuat-plugin-sendiri)
9. [Struktur Folder](#struktur-folder)
10. [Kalau Ada Masalah](#kalau-ada-masalah)
11. [Pertanyaan Umum](#pertanyaan-umum)

---

## Kenapa Harus OMNIA - PROJECT?

Mungkin kamu bertanya-tanya, kenapa harus pakai OMNIA - PROJECT? Kan banyak bot WhatsApp lain di luar sana. Nah, ini beberapa alasannya:

**Mudah Digunakan**
Tidak perlu gelar IT untuk menjalankan bot ini. Cukup ikuti panduan ini step by step, dalam hitungan menit bot kamu sudah jalan.

**Modular dan Fleksibel**
Setiap fitur adalah file terpisah yang disebut "plugin". Mau tambah fitur? Tinggal buat file baru. Mau hapus? Tinggal delete filenya. Simpel!

**Stabil dan Teruji**
OMNIA - PROJECT menggunakan library Baileys yang sudah teruji dan digunakan banyak developer. Ditambah sistem auto-reconnect, bot kamu tidak akan mudah mati.

**Gratis dan Open Source**
Tidak ada biaya tersembunyi. Kode sumbernya terbuka, kamu bisa modifikasi sesuka hati.

---

## Apa Saja Fiturnya?

### Fitur Inti

**Multi-Device Support**
Bot ini menggunakan teknologi WhatsApp Multi-Device. Apa artinya? Artinya bot tetap jalan meskipun HP kamu mati atau tidak ada koneksi internet. Sesi tersimpan di server/komputer, bukan di HP.

**Sistem Plugin Modular**
Setiap command adalah file JavaScript terpisah di folder `plugins/`. Kamu bisa mengedit, menambah, atau menghapus plugin tanpa harus restart bot. Keren kan?

**Database Otomatis**
OMNIA - PROJECT menggunakan LowDB untuk menyimpan data. Setiap perubahan langsung tersimpan secara otomatis. Data user, grup, pengaturan, semuanya aman.

**Auto Backup**
Takut data hilang? Tenang, bot ini backup database secara otomatis setiap 24 jam. Backup lama dihapus otomatis setelah 7 hari untuk menghemat ruang.

**Auto Reconnect**
Kalau koneksi terputus (misalnya internet mati sebentar), bot akan otomatis mencoba menyambung kembali. Tidak perlu restart manual.

### Fitur Grup

**Welcome Message**
Ketika ada member baru masuk grup, bot akan menyapa mereka dengan pesan selamat datang yang heboh. Bisa diaktifkan atau dinonaktifkan per grup.

**Goodbye Message**
Ketika ada member yang keluar, bot akan mengirim pesan perpisahan. Sama seperti welcome, bisa di-toggle.

### Sistem Keamanan

**Mode Self dan Public**
Ada dua mode operasi:
- **Public**: Semua orang bisa pakai bot
- **Self**: Hanya kamu (pemilik nomor) yang bisa pakai

**Anti-Spam**
Bot otomatis mendeteksi spam dan mengabaikannya. Tidak perlu khawatir bot kamu di-abuse.

**Anti-Call**
Ada yang iseng nelpon? Bot otomatis menolak dan mengirim pesan bahwa bot tidak menerima panggilan.

### Fitur Tambahan

**Sticker Maker**
Kirim gambar atau video dengan caption `.sticker`, jadilah sticker! Tidak di-crop, gambar utuh.

**Limit Penggunaan Permanen**
Pengguna gratis mendapatkan maksimal 10 limit untuk command yang memakai limit. Sisa limit tidak di-reset otomatis; pengguna Premium dan owner mendapat limit tanpa batas.

**Premium System**
Bot memiliki sistem premium untuk memberikan akses unlimited dan fitur khusus. Owner bisa menambah/menghapus premium user dengan mudah.

**Scheduled Messages**
Mau kirim pesan jam tertentu? Bisa! Bahkan bisa diatur repeat harian.

---

## Sebelum Memulai

Sebelum kita mulai instalasi, pastikan komputer atau server kamu sudah memenuhi persyaratan berikut.

### Yang Wajib Ada

**Node.js versi 18 atau lebih baru**
Node.js adalah "mesin" yang menjalankan bot ini. Tanpa Node.js, bot tidak bisa jalan.

Cara cek apakah sudah terinstall:
```bash
node --version
```
Hasilnya harus v18.0.0 atau lebih tinggi.

**NPM (Node Package Manager)**
NPM biasanya sudah terinstall otomatis bersama Node.js. NPM digunakan untuk menginstall library yang dibutuhkan bot.

Cara cek:
```bash
npm --version
```

**Git (Opsional tapi Disarankan)**
Git digunakan untuk mendownload dan mengupdate bot. Sebenarnya bisa juga download manual, tapi dengan Git lebih mudah.

Cara cek:
```bash
git --version
```

### Spesifikasi Komputer

Bot ini cukup ringan, tapi tetap ada minimum spesifikasi:

- RAM: Minimal 512 MB (1 GB lebih baik)
- Storage: Minimal 500 MB ruang kosong
- Internet: Harus stabil, upload 1 Mbps cukup
- OS: Windows 10/11, Linux (Ubuntu/Debian), macOS, bahkan Android (Termux)

---

## Cara Instalasi

Oke, mari kita mulai! Ikuti langkah-langkah berikut dengan teliti.

### Langkah 1: Install Node.js

**Untuk Pengguna Windows**

1. Buka browser, pergi ke https://nodejs.org/
2. Kamu akan lihat dua tombol download. Pilih yang bertuliskan "LTS" (biasanya warna hijau) karena ini versi stabil
3. Setelah download selesai, buka file installer-nya
4. Klik Next, Next, Next sampai selesai (biarkan default)
5. Buka Command Prompt (tekan Windows + R, ketik `cmd`, Enter)
6. Ketik `node --version` dan tekan Enter
7. Kalau muncul versi seperti `v18.17.0`, berarti berhasil!

**Untuk Pengguna Linux (Ubuntu/Debian)**

Gunakan installer VPS pada bagian **Instalasi VPS Ubuntu/Debian** di bawah. Installer memasang Node.js 22 LTS, FFmpeg, dan yt-dlp.

**Untuk Pengguna Termux (Android)**

```bash
pkg update && pkg upgrade
pkg install nodejs git
```

### Langkah 2: Download OMNIA - PROJECT

**Cara 1: Menggunakan Git (Disarankan)**

Buka terminal atau Command Prompt, lalu jalankan:

```bash
git clone https://github.com/NnoeeL/OMNIA-PROJECT.git
```

Perintah ini akan membuat folder baru bernama `OMNIA-PROJECT` yang berisi semua file bot.

Setelah selesai, masuk ke folder:
```bash
cd OMNIA-PROJECT
```

**Cara 2: Download Manual**

Kalau tidak mau pakai Git, bisa download manual:

1. Buka https://github.com/NnoeeL/OMNIA-PROJECT
2. Klik tombol hijau "Code" di pojok kanan atas
3. Pilih "Download ZIP"
4. Extract file ZIP tersebut
5. Buka terminal di folder hasil extract

### Langkah 3: Install Dependencies

Dependencies adalah library-library yang dibutuhkan bot untuk berjalan. Ini seperti bahan-bahan yang diperlukan untuk memasak.

Jalankan perintah berikut di dalam folder OMNIA-PROJECT:

```bash
npm ci
```

Proses ini akan menginstall sekitar 50+ package. Biasanya memakan waktu 2-5 menit tergantung kecepatan internet kamu.

Kalau muncul warning berwarna kuning, biasanya tidak apa-apa. Yang penting tidak ada error berwarna merah.

---

### Instalasi VPS Ubuntu/Debian

Jalankan sebagai pengguna biasa yang memiliki akses `sudo` dari direktori bot:

```bash
chmod +x scripts/install-vps.sh
./scripts/install-vps.sh
```

Installer memasang Node.js 22 LTS, FFmpeg, dan yt-dlp, lalu menginstall dependency dari `package-lock.json`. Saat pertama dijalankan, installer menyalin `.env.example` menjadi `.env`.

Isi pengaturan pribadi dan API key di `.env`, lalu jalankan bot:

```bash
nano .env
npm start
```

Jangan jalankan bot sebagai root untuk penggunaan sehari-hari. Untuk pemasangan update selanjutnya, gunakan `git pull` lalu `npm ci --omit=dev`. File `.env`, sesi WhatsApp, database, backup, dan QRIS lokal tidak disertakan di Git. Jika ingin memakai QRIS pada `.donasi`, letakkan QR milikmu sendiri di `assets/images/qris.jpg`; tanpa file itu bot mengirim instruksi untuk menghubungi owner.

## Mengatur Bot

Sekarang bagian yang sangat penting: mengatur konfigurasi bot.

Buka file `.env` menggunakan text editor. Jangan masukkan nomor telepon atau API key ke `config.js` dan jangan mengunggah `.env`.

### Yang Wajib Diubah

**Nomor Owner**

Atur nama dan nomor owner pada `.env` (nomor lebih dari satu dipisahkan koma):

```dotenv
OWNER_NAME=Nama Owner
OWNER_NUMBERS=6281234567890,6289876543210
OWNER_INSTAGRAM=
```

Gunakan format nomor:
- Diawali dengan kode negara (62 untuk Indonesia)
- Tidak pakai tanda + atau 0 di depan
- Contoh: `6281234567890`

Jika memakai pairing code, isi `PAIRING_NUMBER` dengan nomor WhatsApp bot. `BOT_NUMBER` boleh dikosongkan; nomor bot akan dikenali setelah koneksi berhasil.

API key layanan AI diatur pada variabel `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, dan `OPENROUTER_API_KEY` di `.env`. Simpan file ini dengan izin terbatas (misalnya `chmod 600 .env` di Linux).

> Jika API key pernah tersimpan langsung di `config.js` atau pernah diunggah ke Git, cabut dan buat API key baru di dashboard penyedia layanan.

**Mode Bot**

Cari bagian ini:
```javascript
mode: 'public'
```

Pilihan:
- `'public'` = Semua orang bisa pakai bot
- `'self'` = Hanya kamu yang bisa pakai

Untuk testing awal, disarankan pakai `'self'` dulu.

### Yang Bisa Diubah (Opsional)

**Nama Bot**
```javascript
bot: {
    name: 'OMNIA - PROJECT'
}
```

**Prefix Command**
```javascript
command: {
    prefix: '.'
}
```
Ubah ke `'!'` kalau mau command jadi `!menu`, `!ping`, dll.

**Limit Penggunaan Permanen**
```javascript
limits: {
    default: 10,
    premium: -1,
    owner: -1
}
```

**Sticker Metadata**
```javascript
sticker: {
    packname: 'OMNIA - PROJECT',
    author: 'OMNIA - PROJECT'
}
```

Untuk mengubah mode bot, prefix, atau pengaturan non-rahasia lainnya, edit `config.js` lalu simpan.

---

## Menjalankan Bot

Akhirnya kita sampai di tahap yang ditunggu-tunggu!

### Start Bot

Jalankan perintah berikut:
```bash
npm start
```

atau

```bash
node index.js
```

### Proses Pairing

Karena ini pertama kali, bot perlu dipasangkan dengan WhatsApp kamu. Kamu akan melihat kode pairing di terminal seperti ini:

```
╔════════════════════════════════════╗
║         PAIRING CODE               ║
║                                    ║
║         1234-5678                  ║
║                                    ║
╚════════════════════════════════════╝
```

Sekarang buka WhatsApp di HP:

1. Ketuk ikon titik tiga (⋮) di pojok kanan atas
2. Pilih "Perangkat tertaut" atau "Linked Devices"
3. Ketuk "Tautkan perangkat" atau "Link a Device"
4. Pilih "Tautkan dengan nomor telepon" atau "Link with Phone Number"
5. Masukkan kode pairing yang muncul di terminal

Tunggu beberapa detik...

### Berhasil!

Kalau berhasil, di terminal akan muncul:
```
✓ Terhubung ke WhatsApp!
✓ Bot: OMNIA - PROJECT
✓ Ready to receive messages!
```

Selamat! Bot kamu sudah jalan!

Coba kirim `.ping` ke nomor bot untuk memastikan semuanya berjalan lancar.

---

## Daftar Perintah

Berikut daftar lengkap perintah yang tersedia di OMNIA - PROJECT.

### Perintah Utama

| Perintah | Kegunaan |
|----------|----------|
| `.menu` | Menampilkan daftar semua perintah yang tersedia |
| `.ping` | Mengecek apakah bot masih aktif dan berapa response time-nya |
| `.runtime` | Melihat sudah berapa lama bot berjalan tanpa restart |
| `.infobot` | Menampilkan informasi detail tentang bot |

### Perintah Owner

Perintah ini hanya bisa digunakan oleh owner yang terdaftar di config.

| Perintah | Kegunaan |
|----------|----------|
| `.self on` | Mengaktifkan mode self (hanya owner yang bisa pakai) |
| `.self off` | Menonaktifkan mode self (semua bisa pakai) |
| `.broadcast teks` | Mengirim pesan ke semua chat |
| `.listowner` | Melihat daftar owner yang terdaftar |
| `.listprem` | Melihat daftar user premium |

### Perintah Scheduler

| Perintah | Kegunaan |
|----------|----------|
| `.schedule add 08:00 nomor Pesan` | Menambah pesan terjadwal |
| `.schedule list` | Melihat semua jadwal yang aktif |
| `.schedule del id` | Menghapus jadwal tertentu |
| `.schedule status` | Melihat status scheduler |

### Perintah Grup

| Perintah | Kegunaan |
|----------|----------|
| `.welcome on` | Mengaktifkan pesan selamat datang |
| `.welcome off` | Menonaktifkan pesan selamat datang |
| `.goodbye on` | Mengaktifkan pesan perpisahan |
| `.goodbye off` | Menonaktifkan pesan perpisahan |

### Perintah Utility

| Perintah | Kegunaan |
|----------|----------|
| `.sticker` | Mengubah gambar atau video menjadi sticker |
| `.stikergif` | Mengubah video/GIF menjadi sticker animasi persegi 1:1 |
| `.profile` | Melihat informasi profile user |
| `.cekpremium` | Mengecek status premium user (apakah premium atau tidak) |
| `.saran <isi saran>` | Mengirim saran bernomor ke grup saran OMNIA - PROJECT |
| `.voiceai` | Melihat pilihan suara text-to-speech |
| `.voiceai <1-5> <teks>` | Mengirim teks sebagai voice note dengan gaya suara pilihan |
| `.saran <isi saran>` | Mengirim saran ke grup saran OMNIA - PROJECT |

Pilihan `.voiceai`: `1` Google wanita, `2` Google pria, `3` anime boy bersuara berat dan serak, `4` anime girl bersuara lembut dan merdu, `5` robot. Contoh: `.voiceai 3 Halo, apa kabar?`.

### Perintah Fun

| Perintah | Kegunaan |
|----------|----------|
| `.dice` | Melempar dadu virtual (hasil 1-6) |
| `.flip` | Melempar koin virtual (heads atau tails) |

---

## Membuat Plugin Sendiri

Salah satu kelebihan OMNIA - PROJECT adalah kemudahan dalam membuat plugin. Kamu tidak perlu jadi programmer handal untuk ini!

### Konsep Dasar

Plugin adalah file JavaScript yang berisi satu command. File ini disimpan di folder `plugins/` dan dikelompokkan berdasarkan kategori (main, owner, utility, fun, dll).

### Struktur Plugin

Setiap plugin punya dua bagian utama:
1. **Config**: Pengaturan plugin (nama, deskripsi, permission, dll)
2. **Handler**: Fungsi yang dijalankan ketika command dipanggil

### Contoh Plugin Sederhana

Buat file baru `plugins/fun/sapa.js`:

```javascript
const pluginConfig = {
    name: 'sapa',
    alias: ['hi', 'hello'],
    category: 'fun',
    description: 'Menyapa bot',
    usage: '.sapa',
    isOwner: false,
    cooldown: 5,
    limit: 1,
    isEnabled: true
}

async function handler(m) {
    const responses = [
        'Halo! Apa kabar?',
        'Hai! Senang bertemu denganmu!',
        'Yoo! Ada yang bisa dibantu?'
    ]
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)]
    await m.reply(randomResponse)
}

module.exports = {
    config: pluginConfig,
    handler
}
```

Simpan, dan plugin langsung aktif! Coba kirim `.sapa` ke bot.

### Penjelasan Config

| Property | Tipe | Keterangan |
|----------|------|------------|
| `name` | String | Nama command utama |
| `alias` | Array | Nama alternatif untuk command |
| `category` | String | Kategori di menu |
| `description` | String | Deskripsi singkat |
| `usage` | String | Cara penggunaan |
| `isOwner` | Boolean | True jika khusus owner |
| `cooldown` | Number | Jeda antar penggunaan (detik) |
| `limit` | Number | Berapa limit yang dikurangi |
| `isEnabled` | Boolean | True untuk mengaktifkan |

---

## Struktur Folder

Berikut penjelasan setiap folder dan file penting:

```
Ourin-MD/
│
├── index.js           # File utama yang dijalankan
├── config.js          # Semua pengaturan bot
├── package.json       # Info project dan dependencies
├── CHANGELOG.md       # Catatan perubahan setiap versi
├── README.md          # Dokumentasi (file ini)
│
├── src/
│   ├── connection.js  # Kode untuk koneksi WhatsApp
│   ├── handler.js     # Handler untuk pesan masuk
│   │
│   └── lib/
│       ├── backup.js      # Sistem backup otomatis
│       ├── colors.js      # Logger dan warna console
│       ├── database.js    # Database LowDB
│       ├── exif.js        # Metadata sticker
│       ├── lidHelper.js   # Bantuan konversi LID
│       ├── plugins.js     # Loader plugin
│       ├── reconnect.js   # Sistem auto reconnect
│       ├── scheduler.js   # Penjadwalan
│       └── serialize.js   # Serializer pesan
│
├── plugins/
│   ├── main/          # Command utama
│   ├── owner/         # Command khusus owner
│   ├── utility/       # Command utility
│   ├── group/         # Command grup
│   └── fun/           # Command hiburan
│
├── sessions/          # Data sesi WhatsApp
├── backups/           # Backup database
└── tmp/               # File temporary
```

---

## Kalau Ada Masalah

Kadang ada masalah yang muncul. Berikut beberapa masalah umum dan cara mengatasinya.

### Bot tidak merespon setelah pairing

Ini masalah yang paling sering terjadi. Penyebabnya biasanya sesi yang corrupt.

Solusi:
1. Stop bot (tekan `Ctrl + C`)
2. Hapus folder `sessions/`
3. Jalankan lagi `npm start`
4. Lakukan pairing ulang

### Error "Module not found"

Ini berarti ada dependency yang belum terinstall.

Solusi:
```bash
npm install
```

### Error "ECONNREFUSED"

Ini masalah koneksi internet atau server WhatsApp sedang maintenance.

Solusi:
1. Cek koneksi internet
2. Tunggu beberapa menit
3. Coba jalankan ulang

### Bot crash terus-menerus

Kemungkinan ada plugin yang error atau memory penuh.

Solusi:
1. Cek log error untuk mengetahui plugin mana yang bermasalah
2. Hapus atau perbaiki plugin tersebut
3. Restart bot

### Sticker tidak jadi

Ini biasanya masalah FFmpeg.

Solusi:
```bash
npm uninstall @ffmpeg-installer/ffmpeg
npm install @ffmpeg-installer/ffmpeg
```

---

## Pertanyaan Umum

**Apakah bot ini aman?**
Selama kamu tidak membagikan folder `sessions/` ke orang lain, bot ini aman. Folder tersebut berisi kredensial WhatsApp kamu.

**Apakah bisa kena banned?**
Bisa, kalau kamu menggunakan bot untuk spam atau melanggar ketentuan WhatsApp. Gunakan dengan bijak!

**Bagaimana cara update bot?**
```bash
git pull origin main
npm install
npm start
```

**Bisa jalan di HP langsung?**
Bisa, menggunakan Termux di Android. Tapi untuk performa terbaik, gunakan VPS atau komputer.

**Apa itu limit?**
Limit adalah batas penggunaan command tertentu untuk mencegah abuse. Pengguna gratis mendapatkan maksimal 10 limit dan sisa limit tidak di-reset otomatis. Command kategori `main` dan `group` tidak menggunakan limit.

- **Free user**: maksimal 10 limit, tanpa reset otomatis
- **Premium user**: Unlimited limit
- **Owner**: Unlimited limit

**Bagaimana cara jadi premium user?**
Owner bisa menambahkan premium user menggunakan command `.addpremium`:

```
.addpremium <nomor> <durasi>
```

Contoh:
```
.addpremium 628123456789 30d   # 30 hari
.addpremium 628123456789 7d    # 7 hari
.addpremium 628123456789 24h   # 24 jam
.addpremium 628123456789 60m   # 60 menit
```

**Cek daftar premium**: `.listprem`

**Menghapus premium**: `.delpremium <nomor>`

**Bot bisa untuk multi-nomor?**
Saat ini satu folder hanya untuk satu nomor. Kalau mau multi-nomor, buat folder terpisah untuk setiap nomor.

---

## Penutup

Terima kasih sudah menggunakan OMNIA - PROJECT! Kalau kamu suka dengan project ini, jangan lupa kasih bintang di GitHub.

Punya pertanyaan atau saran? Silakan buat issue di repository GitHub.

Selamat menggunakan! 🚀

---

<p align="center">
  Dibuat dengan ❤️ oleh Lucky Archz
</p>
