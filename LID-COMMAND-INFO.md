# 🔍 LID Checker Command

## Deskripsi
Command untuk melihat LID (Linked Identity) dari nomor WhatsApp. Command ini akan mengecek dan menampilkan informasi JID (Jabber ID) dari nomor WhatsApp yang diberikan.

## File Location
```
plugins/utility/lid.js
```

## Cara Penggunaan

### 1. Menggunakan Nomor Langsung
```
.lid 6282216555691
.lid 08123456789
```

### 2. Menggunakan Mention
```
.lid @user
```

### 3. Reply Pesan
Reply pesan dari user yang ingin dicek, lalu ketik:
```
.lid
```

### 4. Cek JID Sendiri
Ketik tanpa parameter untuk melihat JID Anda sendiri:
```
.lid
```

## Alias Command
Command ini juga bisa dipanggil dengan:
- `.checklid`
- `.getlid`

## Fitur

✅ **Verifikasi WhatsApp**
- Mengecek apakah nomor terdaftar di WhatsApp
- Menampilkan status exists/tidak

✅ **Deteksi LID Format**
- Otomatis mendeteksi format LID (@lid)
- Menampilkan clean LID number
- Membedakan dengan standard JID

✅ **Multiple Input Method**
- Nomor langsung (dengan/tanpa kode negara)
- Mention user di grup
- Reply pesan user
- Cek JID sendiri

✅ **Auto Format**
- Otomatis format nomor Indonesia (0xxx → 62xxx)
- Support berbagai format input

## Output Example

### Jika Nomor Menggunakan LID:
```
╭─「 🔍 LID CHECKER 」─
│
│ 📱 *Nomor Input*: 206789874339982
│
│ ━━━━━━━━━━━━━━━━━━
│
│ ✅ *Status*: Terdaftar di WhatsApp
│
│ 📋 *JID Info*:
│ • JID: 206789874339982@lid
│ • Exists: ✅ Ya
│
│ 🔗 *LID Format Detected*
│ • LID: 206789874339982@lid
│ • Clean LID: 206789874339982
│
│ ━━━━━━━━━━━━━━━━━━
│
│ 💡 *Info*:
│ LID (Linked Identity) adalah format
│ baru dari WhatsApp Multi-Device yang
│ berbeda dengan nomor telepon biasa.
│
╰────────────────
```

### Jika Nomor Standard (Bukan LID):
```
╭─「 🔍 LID CHECKER 」─
│
│ 📱 *Nomor Input*: 6282216555691
│
│ ━━━━━━━━━━━━━━━━━━
│
│ ✅ *Status*: Terdaftar di WhatsApp
│
│ 📋 *JID Info*:
│ • JID: 6282216555691@s.whatsapp.net
│ • Exists: ✅ Ya
│
│ 📞 *Standard JID Format*
│ • Type: Regular WhatsApp Number
│
│ ━━━━━━━━━━━━━━━━━━
│
│ 💡 *Info*:
│ LID (Linked Identity) adalah format
│ baru dari WhatsApp Multi-Device yang
│ berbeda dengan nomor telepon biasa.
│
╰────────────────
```

## Penjelasan LID

### Apa itu LID?
LID (Linked Identity) adalah format identitas baru yang digunakan oleh WhatsApp Multi-Device untuk mengidentifikasi akun yang terhubung di multiple device.

### Perbedaan LID vs JID Biasa:

| Aspek | JID Standard | LID Format |
|-------|--------------|------------|
| Format | `6282216555691@s.whatsapp.net` | `206789874339982@lid` |
| Device | Single device | Multi-device |
| Nomor | Sama dengan nomor HP | ID unik berbeda dari nomor HP |
| Sesi | Tersimpan di HP | Tersimpan di server |

### Kapan Nomor Jadi LID?
Nomor WhatsApp berubah ke format LID ketika:
1. Menggunakan WhatsApp Multi-Device
2. Login di multiple devices (Web, Desktop, Bot)
3. Sesi tersimpan di server, bukan HP

## Technical Details

### Dependencies:
```javascript
const { isLid, extractNumber } = require('../../src/lib/lidHelper');
```

### Config:
- **Cooldown**: 3 detik
- **Limit**: 0 (gratis, tidak pakai limit)
- **Owner Only**: Tidak
- **Premium Only**: Tidak
- **Group Only**: Tidak

### Error Handling:
- Validasi format nomor
- Error handling untuk verify WhatsApp
- Fallback jika tidak bisa fetch data

## Tips Penggunaan

💡 **Untuk Owner:**
- Gunakan command ini untuk mendapatkan LID dari nomor WhatsApp
- Masukkan LID ke `config.js` di array `owner.number`
- LID diperlukan agar owner commands berfungsi dengan benar

💡 **Untuk User:**
- Cek apakah nomor terdaftar di WhatsApp sebelum mengirim pesan
- Ketahui format JID yang digunakan oleh nomor tersebut
- Berguna untuk troubleshooting masalah bot

## Troubleshooting

### Error: "Tidak dapat diverifikasi"
**Penyebab:** Nomor tidak terdaftar di WhatsApp atau koneksi bermasalah
**Solusi:** 
- Cek koneksi internet
- Pastikan nomor valid dan terdaftar di WhatsApp
- Coba lagi beberapa saat

### Nomor tidak terdeteksi sebagai LID padahal menggunakan Multi-Device
**Penyebab:** Nomor mungkin belum fully migrated ke format LID
**Solusi:** 
- Beberapa nomor masih menggunakan format standard meski pakai multi-device
- Ini normal dan tidak ada masalah

## Changelog

### Version 1.0.0 (2026-09-29)
- ✨ Initial release
- ✅ Support multiple input methods (nomor, mention, reply)
- ✅ Auto detect LID format
- ✅ WhatsApp verification
- ✅ Auto format nomor Indonesia
- ✅ Detailed error messages

---

**Created by:** Ourin-AI Team  
**Date:** 29 September 2026  
**Category:** Utility Command
