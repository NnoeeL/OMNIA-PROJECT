# AI Chat Feature - README

## 📝 Deskripsi

Fitur AI Chat memungkinkan pengguna bot WhatsApp untuk bertanya ke 3 model AI berbeda:
1. **OpenAI GPT-4o Mini** 🤖 - Model cepat dan efisien dari OpenAI
2. **Google Gemini 1.5 Flash** ✨ - Model multimodal terbaru dari Google
3. **Groq Llama 3.1 70B** ⚡ - Model super cepat dari Groq dengan Llama

Setiap pengguna dapat memilih AI favorit mereka dan preferensi tersebut disimpan secara permanen di database.

## 🚀 Cara Penggunaan

### Command Dasar
```
.ai                          # Tampilkan menu pilihan AI
.ai <pertanyaan>             # Tanya ke AI aktif
.ai pilih <1-3>              # Pilih model AI (1=OpenAI, 2=Gemini, 3=Groq)
.ai reset                    # Reset ke default (OpenAI)
.ai info                     # Tampilkan info AI aktif
```

### Alias Command
Command `.ai` juga bisa dipanggil dengan alias:
- `.ask` - Ask AI a question
- `.tanya` - Tanya AI (Bahasa Indonesia)
- `.gpt` - Directly use GPT
- `.gemini` - Directly use Gemini
- `.groq` - Directly use Groq

### Contoh Penggunaan

#### 1. Memilih Model AI
```
.ai pilih 1    # Pilih OpenAI GPT
.ai pilih 2    # Pilih Google Gemini
.ai pilih 3    # Pilih Groq Llama
```

#### 2. Bertanya ke AI
```
.ai Apa itu machine learning?
.ai Jelaskan tentang fotosintesis
.ai Buatkan contoh kode Python untuk sorting
```

#### 3. Reset Preferensi
```
.ai reset      # Kembali ke default (OpenAI)
```

## ⚙️ Konfigurasi

### 1. Tambahkan API Keys di `config.js`

Edit file `config.js` dan tambahkan API keys Anda:

```javascript
ai: {
    // OpenAI Configuration
    openaiApiKey: 'sk-xxxxxxxxxxxxxxxx',
    openaiBaseUrl: 'https://api.openai.com/v1',
    openaiModel: 'gpt-4o-mini',
    
    // Google Gemini Configuration
    geminiApiKey: 'AIzaxxxxxxxxxxxxxxxx',
    geminiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    geminiModel: 'gemini-1.5-flash',
    
    // Groq Configuration
    groqApiKey: 'gsk_xxxxxxxxxxxxxxxx',
    groqBaseUrl: 'https://api.groq.com/openai/v1',
    groqModel: 'llama-3.1-70b-versatile'
}
```

### 2. Atau Gunakan Environment Variables

Sebagai alternatif, Anda bisa menggunakan environment variables:

```bash
# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx

# Google Gemini
GEMINI_API_KEY=AIzaxxxxxxxxxxxxxxxx

# Groq
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx
```

### 3. Dapatkan API Keys

#### OpenAI GPT
1. Kunjungi: https://platform.openai.com/api-keys
2. Login atau buat akun baru
3. Klik "Create new secret key"
4. Copy API key (format: `sk-...`)

#### Google Gemini
1. Kunjungi: https://aistudio.google.com/app/apikey
2. Login dengan akun Google
3. Klik "Get API key"
4. Copy API key (format: `AIza...`)

#### Groq
1. Kunjungi: https://console.groq.com/
2. Login atau buat akun baru
3. Buka API Keys
4. Create API Key
5. Copy API key (format: `gsk_...`)

## 🎯 Fitur Utama

### 1. Multi-Provider Support
- Support 3 AI provider berbeda dalam satu command
- Setiap provider punya karakteristik dan kekuatan sendiri
- User bebas memilih sesuai kebutuhan

### 2. User Preference Management
- Setiap user punya preferensi AI sendiri
- Preferensi disimpan di database
- Tidak perlu pilih ulang setiap kali bertanya

### 3. Smart Error Handling
- Error message yang jelas dan informatif
- Automatic fallback jika edit message gagal
- Timeout handling untuk request yang lama

### 4. Presence Indicator
- Bot menunjukkan "sedang mengetik..." saat memproses
- User tahu bot sedang bekerja

### 5. Message Editing
- Pesan "loading" di-edit dengan jawaban final
- Lebih clean dan tidak spam chat

## 📂 Struktur File

```
plugins/ai/
├── chat.js           # Main plugin file
├── _ai-utils.js      # Utility functions (preference management)
└── _ai-api.js        # AI API calling functions
```

File yang diawali `_` tidak di-load sebagai command terpisah.

## 🔧 Customization

### Mengganti System Prompt

Edit file `plugins/ai/_ai-utils.js`:

```javascript
const SYSTEM_PROMPT = `Kamu adalah asisten AI yang membantu...
Sesuaikan prompt sesuai kebutuhan Anda`;
```

### Menambah AI Provider Baru

1. Tambahkan provider di `AI_PROVIDERS` (file `_ai-utils.js`)
2. Buat fungsi `call[ProviderName]` di `_ai-api.js`
3. Tambahkan case baru di fungsi `askAI`

### Mengubah Model Default

Edit `config.js`:

```javascript
openaiModel: 'gpt-4o',           // Upgrade ke GPT-4o
geminiModel: 'gemini-1.5-pro',   // Upgrade ke Pro
groqModel: 'llama-3.1-8b-instant'  // Model lebih cepat
```

## ⚠️ Catatan Penting

### Rate Limits
- Setiap AI provider punya rate limit berbeda
- OpenAI: Tergantung tier akun Anda
- Gemini: 15 requests/minute (free tier)
- Groq: 30 requests/minute (free tier)

### Biaya
- OpenAI GPT-4o Mini: ~$0.15 per 1M input tokens
- Google Gemini Flash: Gratis dengan rate limit
- Groq Llama: Gratis dengan rate limit

### Keamanan
- Jangan commit API keys ke Git
- Gunakan `.env` file atau environment variables
- Jangan share API keys dengan orang lain
- Monitor usage untuk menghindari biaya tak terduga

## 🐛 Troubleshooting

### Error: "API Key belum dikonfigurasi"
**Solusi:** Pastikan API key sudah diisi di `config.js` atau environment variables.

### Error: "Waktu habis"
**Solusi:** Server AI sedang sibuk atau pertanyaan terlalu kompleks. Coba lagi atau gunakan AI provider lain.

### Error: "401 Unauthorized"
**Solusi:** API key tidak valid atau sudah expired. Cek dan update API key Anda.

### Error: "429 Too Many Requests"
**Solusi:** Rate limit terlampaui. Tunggu beberapa menit atau upgrade plan Anda.

### Plugin tidak muncul di menu
**Solusi:** 
1. Restart bot
2. Pastikan file `chat.js` ada di folder `plugins/ai/`
3. Cek log untuk error saat loading plugin

## 🔄 Update Log

### v1.0.0 (2026-09-29)
- ✅ Initial release
- ✅ Support 3 AI providers (OpenAI, Gemini, Groq)
- ✅ User preference management
- ✅ Smart error handling
- ✅ Message editing support
- ✅ Multiple aliases

---

**Dibuat dengan ❤️ oleh Ourin-AI Team**