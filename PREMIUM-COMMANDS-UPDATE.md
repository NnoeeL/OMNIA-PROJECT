# Update Premium Commands - Support untuk LID Format

## 📅 Tanggal: 29 September 2026

## 🎯 Perubahan

### 1. **Command Baru: `.cekpremium`**
File: `plugins/utility/cekpremium.js`

Command untuk mengecek status premium user dengan fitur:
- ✅ Cek status diri sendiri atau user lain
- ✅ Support mention (@user)
- ✅ Deteksi status Owner, Premium Active, Premium Expired, atau Free User
- ✅ Tampilkan informasi expired date dan sisa waktu
- ✅ Tampilkan limit tersisa
- ✅ Info untuk upgrade premium

**Cara Menggunakan:**
```
.cekpremium              # Cek status diri sendiri
.premium                 # Alias
.cekprem                 # Alias pendek
.cekpremium @user        # Cek status user lain
```

**Alias:** `premium`, `cekprem`, `premiumcheck`

---

### 2. **Update: `.addpremium`**
File: `plugins/owner/addpremium.js`

**Perubahan:**
- ✅ Support mention (@user) untuk menambah premium
- ✅ Auto-detect format JID (LID atau standar)
- ✅ Jika user sudah ada di database, gunakan format JID yang sama
- ✅ Support format nomor LID seperti `206789874339982`
- ✅ Tampilkan JID yang digunakan dalam response

**Cara Menggunakan:**
```
.addpremium @user 30d                    # Dengan mention
.addpremium 628123456789 30d             # Nomor standar
.addpremium 206789874339982 7d           # Nomor LID
.addpremium @user 24h                    # Durasi jam
.addpremium @user 60m                    # Durasi menit
```

**Format Durasi:**
- `d` = hari (contoh: 30d)
- `h` = jam (contoh: 24h)
- `m` = menit (contoh: 60m)

---

### 3. **Update: `.delpremium`**
File: `plugins/owner/delpremium.js`

**Perubahan:**
- ✅ Support mention (@user) untuk menghapus premium
- ✅ Auto-detect format JID (LID atau standar)
- ✅ Jika user sudah ada di database, gunakan format JID yang sama
- ✅ Support format nomor LID seperti `206789874339982`
- ✅ Tampilkan JID yang digunakan dalam response

**Cara Menggunakan:**
```
.delpremium @user                        # Dengan mention
.delpremium 628123456789                 # Nomor standar
.delpremium 206789874339982              # Nomor LID
```

---

## 🔧 Solusi untuk Format LID

WhatsApp Multi-Device menggunakan dua format nomor:
1. **Format standar:** `628123456789@s.whatsapp.net` (JID)
2. **Format LID:** `206789874339982@lid` (Linked Identity)

**Masalah sebelumnya:**
- Command `.addpremium` hanya support format standar
- Nomor LID tidak bisa ditambahkan sebagai premium

**Solusi yang diterapkan:**
1. Cek apakah user sudah ada di database
2. Jika ada, gunakan format JID yang sudah tersimpan
3. Jika belum ada, gunakan format standar sebagai default
4. Support mention untuk langsung menggunakan JID yang benar

---

## 📝 Contoh Penggunaan

### Menambah Premium dengan Nomor LID
```
.addpremium 206789874339982 30d
```
Response:
```
╭─「 💎 PREMIUM ADDED 」─
│
│ 📱 Nomor: 206789874339982
│ 🆔 JID: 206789874339982
│ ⏰ Durasi: 30 hari
│ 📅 Expired: 29 Oktober 2026 10.47
│ ✅ Status: Premium Aktif
│
╰────────────────

✨ User berhasil ditambahkan sebagai premium!
```

### Cek Status Premium
```
.cekpremium @user
```
Response:
```
╭─「 💎 CEK PREMIUM 」─
│
│ 👤 *Nama*: Username
│ 📱 *Nomor*: 206789874339982
│ 
│ 📌 *Status*: Premium Active ✅
│ ⏰ *Expired*: 29/10/2026 10:47
│ ⏳ *Sisa*: 30 hari 0 jam 0 menit
│
│ 📊 *Limit Tersisa*: 100
│
╰────────────────
```

---

## ✅ Testing

Semua file telah divalidasi dengan `node -c`:
- ✅ `plugins/utility/cekpremium.js` - No syntax errors
- ✅ `plugins/owner/addpremium.js` - No syntax errors
- ✅ `plugins/owner/delpremium.js` - No syntax errors

---

## 📚 Dokumentasi

File README.md telah diupdate dengan:
- ✅ Menambahkan command `.cekpremium` di bagian Perintah Utility
- ✅ Menambahkan informasi Premium System di fitur bot

---

## 🚀 Cara Menggunakan

1. Restart bot atau tunggu plugin auto-reload
2. Gunakan command sesuai kebutuhan
3. Untuk nomor LID, bisa langsung gunakan nomor atau mention user

**Catatan:** Bot akan otomatis mendeteksi format JID yang benar jika user sudah pernah berinteraksi dengan bot.
