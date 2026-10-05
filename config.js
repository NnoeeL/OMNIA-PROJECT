/**
 * ═══════════════════════════════════════════════════════════════════
 *                       OMNIA - PROJECT CONFIG
 *                          Version 1.2.0
 * ═══════════════════════════════════════════════════════════════════
 * 
 * File ini berisi semua pengaturan bot.
 * Bagian yang WAJIB diubah ditandai dengan [WAJIB]
 * Bagian lainnya sudah memiliki default yang baik.
 * 
 * ═══════════════════════════════════════════════════════════════════
 */

require('dotenv').config()

const config = {

    // ═══════════════════════════════════════════════════════════════
    // [WAJIB] PENGATURAN OWNER
    // ═══════════════════════════════════════════════════════════════
    // 
    // Nomor owner adalah nomor yang memiliki akses PENUH ke bot.
    // Format: 628xxxxxxxxxx (tanpa + atau 0 di depan)
    // Contoh: ['6281234567890'] atau ['6281234567890', '6289876543210']
    //
    owner: {
        name: process.env.OWNER_NAME || 'OMNIA Owner',
        number: (process.env.OWNER_NUMBERS || '').split(',').map(number => number.trim()).filter(Boolean),
        instagram: process.env.OWNER_INSTAGRAM || ''
    },

    // ═══════════════════════════════════════════════════════════════
    // [WAJIB] MODE BOT
    // ═══════════════════════════════════════════════════════════════
    //
    // 'public' = Semua orang bisa menggunakan bot
    // 'self'   = Hanya bot sendiri (fromMe) yang bisa menggunakan
    //
    mode: 'public',

    // ═══════════════════════════════════════════════════════════════
    // INFORMASI BOT
    // ═══════════════════════════════════════════════════════════════
    bot: {
        name: 'OMNIA - PROJECT',
        version: '1.0.0',
        description: 'WhatsApp Multi-Device Bot',
        developer: 'Nnoel',
        number: process.env.BOT_NUMBER || ''
    },

    // ═══════════════════════════════════════════════════════════════
    // PENGATURAN COMMAND
    // ═══════════════════════════════════════════════════════════════
    command: {
        // Prefix untuk command (misal: .menu, .ping)
        prefix: '.',

        // Prefix alternatif yang diizinkan
        alternativePrefix: ['!', '#', '/']
    },

    // ═══════════════════════════════════════════════════════════════
    // LIMIT PENGGUNAAN
    // ═══════════════════════════════════════════════════════════════
    limits: {
        // 10 limit untuk pengguna gratis, permanen dan tidak reset otomatis
        default: 10,

        // Limit untuk premium user (unlimited)
        premium: -1,

        // Limit untuk owner (-1 = unlimited)
        owner: -1
    },

    // ═══════════════════════════════════════════════════════════════
    // DAFTAR PREMIUM & BANNED
    // ═══════════════════════════════════════════════════════════════
    premiumUsers: [],
    bannedUsers: [],

    // ═══════════════════════════════════════════════════════════════
    // FITUR ON/OFF
    // ═══════════════════════════════════════════════════════════════
    features: {
        // Anti spam - blokir user yang spam command
        antiSpam: true,
        antiSpamInterval: 3000,

        // Anti call - tolak panggilan masuk
        antiCall: true,

        // Auto read - tandai pesan sudah dibaca
        autoRead: false,

        // Auto typing - tampilkan "sedang mengetik..."
        autoTyping: true,

        // Log pesan ke console
        logMessage: true,

        // Reset limit otomatis dinonaktifkan; limit gratis berlaku permanen
        dailyLimitReset: false
    },

    // ═══════════════════════════════════════════════════════════════
    // WELCOME & GOODBYE
    // ═══════════════════════════════════════════════════════════════
    welcome: {
        // Default status untuk group baru
        defaultEnabled: true
    },

    goodbye: {
        // Default status untuk group baru
        defaultEnabled: true
    },

    // ═══════════════════════════════════════════════════════════════
    // STICKER
    // ═══════════════════════════════════════════════════════════════
    sticker: {
        packname: 'OMNIA - PROJECT',
        author: 'OMNIA - PROJECT'
    },

    // ═══════════════════════════════════════════════════════════════
    // PESAN BOT
    // ═══════════════════════════════════════════════════════════════
    messages: {
        wait: '⏳ Tunggu sebentar...',
        success: '✅ Berhasil!',
        error: '❌ Terjadi kesalahan!',
        ownerOnly: '🚫 Command ini khusus owner!',
        premiumOnly: '💎 Command ini khusus premium!',
        groupOnly: '👥 Command ini hanya untuk grup!',
        privateOnly: '📱 Command ini hanya untuk private chat!',
        cooldown: '⏱️ Tunggu %time% detik lagi!',
        limitExceeded: '📊 Limit harian kamu sudah habis!',
        banned: '🚫 Kamu dibanned dari bot ini!'
    },

    // ═══════════════════════════════════════════════════════════════
    // SCHEDULER
    // ═══════════════════════════════════════════════════════════════
    scheduler: {
        // Jam reset limit (0-23)
        resetHour: 0,
        resetMinute: 0
    },

    // ═══════════════════════════════════════════════════════════════
    // BACKUP
    // ═══════════════════════════════════════════════════════════════
    backup: {
        // Backup otomatis
        enabled: true,

        // Interval backup dalam jam
        intervalHours: 24,

        // Berapa hari backup disimpan
        retainDays: 7
    },

    // ═══════════════════════════════════════════════════════════════
    // DATABASE
    // ═══════════════════════════════════════════════════════════════
    database: {
        path: './src/database'
    },

    // ═══════════════════════════════════════════════════════════════
    // SESSION
    // ═══════════════════════════════════════════════════════════════
    session: {
        path: './sessions',
        usePairingCode: false,
        pairingNumber: process.env.PAIRING_NUMBER || ''
    },

    // ═══════════════════════════════════════════════════════════════
    // AI CONFIGURATION
    // ═══════════════════════════════════════════════════════════════
    // 
    // Simpan API key di file .env; jangan commit file tersebut.
    //
    ai: {
        // OpenAI Configuration
        openaiApiKey: process.env.OPENAI_API_KEY || '',
        openaiBaseUrl: 'https://api.openai.com/v1',
        openaiModel: 'gpt-4o-mini', // Model: gpt-4o-mini, gpt-4o, gpt-3.5-turbo

        // Google Gemini Configuration
        geminiApiKey: process.env.GEMINI_API_KEY || '',
        geminiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        geminiModel: 'gemini-3.8-flash', // Model aktif: gemini-3.8-flash, gemini-3.5-flash

        // Groq Configuration
        groqApiKey: process.env.GROQ_API_KEY || '',
        groqBaseUrl: 'https://api.groq.com/openai/v1',
        groqModel: 'llama-3.3-70b-versatile', // Model: llama-3.3-70b-versatile (aktif), llama-3.1-8b-instant

        // OpenRouter Configuration (GRATIS - daftar di https://openrouter.ai)
        openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
        openrouterBaseUrl: 'https://openrouter.ai/api/v1',
        openrouterModel: 'nvidia/nemotron-3-super-120b-a12b:free' // Model aktif & gratis (120B params)
    },

    // ═══════════════════════════════════════════════════════════════
    // SALURAN (NEWSLETTER)
    // ═══════════════════════════════════════════════════════════════
    saluran: {
        id: '120363208449943317@newsletter',
        name: 'OMNIA - PROJECT',
        link: ''
    }
}

function isOwner(number) {
    if (!number) return false
    const cleanNumber = number.replace(/[^0-9]/g, '')

    if (config.bot.number) {
        const botClean = String(config.bot.number).replace(/[^0-9]/g, '')
        if (cleanNumber.includes(botClean) || botClean.includes(cleanNumber)) {
            return true
        }
    }

    return config.owner.number.some(owner => {
        const cleanOwner = owner.replace(/[^0-9]/g, '')
        return cleanNumber.includes(cleanOwner) || cleanOwner.includes(cleanNumber)
    })
}

function isPremium(number, db = null) {
    if (!number) return false
    if (isOwner(number)) return true

    // If db is provided, check from database
    if (db) {
        const user = db.getUser(number)
        if (user && user.isPremium) {
            // Check if premium expired
            if (user.premiumExpiredAt && Date.now() > user.premiumExpiredAt) {
                return false
            }
            return true
        }
        return false
    }

    // Fallback to config.premiumUsers for backward compatibility
    const cleanNumber = number.replace(/[^0-9]/g, '')
    return config.premiumUsers.some(premium => {
        const cleanPremium = premium.replace(/[^0-9]/g, '')
        return cleanNumber.includes(cleanPremium) || cleanPremium.includes(cleanNumber)
    })
}

function isBanned(number) {
    if (!number) return false
    if (isOwner(number)) return false

    const cleanNumber = number.replace(/[^0-9]/g, '')
    return config.bannedUsers.some(banned => {
        const cleanBanned = banned.replace(/[^0-9]/g, '')
        return cleanNumber.includes(cleanBanned) || cleanBanned.includes(cleanNumber)
    })
}

function setBotNumber(number) {
    if (number) {
        config.bot.number = number.replace(/[^0-9]/g, '')
    }
}

function isSelf(number) {
    if (!number || !config.bot.number) return false
    const cleanNumber = number.replace(/[^0-9]/g, '')
    const botNumber = String(config.bot.number).replace(/[^0-9]/g, '')
    return cleanNumber.includes(botNumber) || botNumber.includes(cleanNumber)
}

function getConfig() {
    return config
}

module.exports = {
    ...config,
    config,
    getConfig,
    isOwner,
    isPremium,
    isBanned,
    setBotNumber,
    isSelf
}
