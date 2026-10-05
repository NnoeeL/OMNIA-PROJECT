/**
 * @file plugins/ai/curhat.js
 * @description Command .curhat on / .curhat off - Mode teman curhat AI
 * Bot akan berubah menjadi teman curhat yang asli, natural, dan supportif.
 * Dengan typing delay realistis agar terasa seperti teman beneran lagi ngetik.
 * @author Ourin-AI Team
 * @version 1.0.0
 */

const { callPollinations, callOpenRouter } = require('./_ai-api');
const { getAIConfig } = require('./_ai-utils');

/**
 * System prompt khusus untuk mode curhat
 * Dirancang agar bot berperilaku seperti teman curhat asli
 */
const CURHAT_SYSTEM_PROMPT = `Kamu adalah teman curhat yang sangat dekat dan supportif. Kamu BUKAN bot, kamu adalah teman baik yang sedang chat di WhatsApp.

ATURAN PENTING:
1. Gunakan bahasa Indonesia gaul/santai sehari-hari seperti anak muda (lo/gue, wkwk, anjir, gila, bro/sis, dll) tapi tetap sopan
2. JANGAN pernah bilang kamu AI, bot, atau asisten. Kamu adalah teman.
3. Jawab SINGKAT dan natural seperti chat WhatsApp biasa (1-3 kalimat aja, JANGAN panjang-panjang)
4. Tunjukkan empati yang tulus - validasi perasaan mereka
5. Jangan langsung kasih solusi, dengerin dulu dan tanya lebih lanjut
6. Pakai emoji secukupnya, jangan berlebihan (1-2 emoji per pesan max)
7. Kadang-kadang pakai typo ringan atau singkatan biar natural (gpp, yg, lg, udh, gk, dll)
8. Kalau mereka sedih, jangan langsung "semangat!", tapi validasi dulu perasaannya
9. Sesekali cerita pengalaman (fiktif tapi relatable) biar terasa dua arah
10. Kalau topiknya berat (depresi, self-harm, dll), tetap supportif dan sarankan bicara ke profesional tapi dengan cara yang lembut
11. JANGAN pakai format markdown seperti * atau _ untuk bold/italic
12. Tulis seperti chat biasa, tanpa formatting
13. Jangan pernah memulai jawaban dengan "Hei", "Hey", atau sapaan formal

GAYA BAHASA CONTOH:
- "yaa gue ngerti sih perasaan lo..."
- "wah itu berat bgt ya, lo udh lama ngerasain gitu?"
- "gpp kok, wajar bgt ngerasa gitu"
- "hmm terus gimana kelanjutannya?"
- "gue juga pernah ngalamin yg mirip sih dulu"`;

/**
 * Riwayat percakapan curhat per user (in-memory, max 20 pesan)
 * Format: Map<sender_jid, Array<{role, content}>>
 */
const curhatHistory = new Map();
const MAX_HISTORY = 20;

/**
 * Mendapatkan riwayat curhat user
 */
function getCurhatHistory(sender) {
    if (!curhatHistory.has(sender)) {
        curhatHistory.set(sender, []);
    }
    return curhatHistory.get(sender);
}

/**
 * Menambah pesan ke riwayat curhat
 */
function addToCurhatHistory(sender, role, content) {
    const history = getCurhatHistory(sender);
    history.push({ role, content });

    // Batasi riwayat agar tidak terlalu panjang
    if (history.length > MAX_HISTORY) {
        // Hapus 2 pesan terlama (user + assistant pair)
        history.splice(0, 2);
    }
}

/**
 * Reset riwayat curhat user
 */
function clearCurhatHistory(sender) {
    curhatHistory.delete(sender);
}

/**
 * Hitung delay typing realistis berdasarkan panjang respons
 * Simulasi seperti orang beneran ngetik
 * @param {string} text - Teks respons
 * @returns {number} Delay dalam ms
 */
function calculateTypingDelay(text) {
    const length = text.length;
    // Base delay 1-2 detik (waktu "baca" pesan)
    const readDelay = 1000 + Math.random() * 1500;
    // Typing speed: ~40-70 karakter per detik (cukup cepat kayak anak muda)
    const typingSpeed = 40 + Math.random() * 30;
    const typingDelay = (length / typingSpeed) * 1000;
    // Total, cap di 3-8 detik biar gak kelamaan
    const total = readDelay + typingDelay;
    return Math.min(Math.max(total, 2000), 8000);
}

/**
 * Proses pesan curhat dan dapatkan respons AI
 * @param {string} sender - JID pengirim
 * @param {string} message - Pesan dari user
 * @returns {Promise<string>} Respons AI
 */
async function processCurhatMessage(sender, message) {
    // Tambah pesan user ke riwayat
    addToCurhatHistory(sender, 'user', message);

    const history = getCurhatHistory(sender);

    // Build messages array dengan system prompt + riwayat
    const messages = [
        { role: 'system', content: CURHAT_SYSTEM_PROMPT },
        ...history
    ];

    try {
        // Coba Pollinations dulu (gratis)
        try {
            const answer = await callPollinations(messages);
            addToCurhatHistory(sender, 'assistant', answer);
            return answer;
        } catch (pollErr) {
            console.log('[Curhat] Pollinations failed, trying OpenRouter...');

            // Fallback ke OpenRouter
            const aiConfig = getAIConfig();
            if (aiConfig.openrouter?.apiKey) {
                const answer = await callOpenRouter(messages, aiConfig.openrouter);
                addToCurhatHistory(sender, 'assistant', answer);
                return answer;
            }

            throw pollErr;
        }
    } catch (error) {
        console.error('[Curhat Error]', error.message);
        throw error;
    }
}

/**
 * In-memory Set untuk menyimpan JID user yang sedang dalam mode curhat
 * Menggunakan Set (bukan database) agar tidak terganggu oleh db.setUser() di handler
 */
const curhatActiveUsers = new Set();

/**
 * Cek apakah user sedang dalam mode curhat
 * @param {string} sender - JID user
 * @returns {boolean}
 */
function isCurhatMode(sender) {
    return curhatActiveUsers.has(sender);
}

/**
 * Set mode curhat user
 * @param {string} sender - JID user
 * @param {boolean} enabled - true untuk on, false untuk off
 */
function setCurhatMode(sender, enabled) {
    if (enabled) {
        curhatActiveUsers.add(sender);
    } else {
        curhatActiveUsers.delete(sender);
    }
}

// ─── Plugin Config ───────────────────────────────────────────────────

const pluginConfig = {
    name: 'curhat',
    alias: [],
    category: 'ai',
    description: 'Mode teman curhat AI - bot jadi teman curhat asli',
    usage: '.curhat on / .curhat off',
    example: [
        '.curhat on',
        '.curhat off'
    ],
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: true,  // Curhat hanya di private chat
    cooldown: 3,
    limit: 0,
    isEnabled: true
};

module.exports = {
    config: pluginConfig,

    // Export fungsi untuk dipakai di handler.js
    isCurhatMode,
    setCurhatMode,
    processCurhatMessage,
    calculateTypingDelay,
    clearCurhatHistory,

    handler: async function handler(m, { sock, config: botConfig, db }) {
        const args = m.args;
        const prefix = botConfig.command?.prefix || '.';

        // Tanpa argumen - tampilkan status
        if (!args || args.length === 0) {
            const isActive = isCurhatMode(m.sender);
            const statusText = isActive ? '🟢 Aktif' : '🔴 Nonaktif';

            return await m.reply(
                `💬 *Mode Curhat*\n\n` +
                `Status: ${statusText}\n\n` +
                `Mode curhat membuat bot jadi teman curhat kamu yang asli dan supportif. ` +
                `Bot akan merespons dengan natural seperti teman biasa.\n\n` +
                `📝 *Cara pakai:*\n` +
                `• \`${prefix}curhat on\` - Aktifkan mode curhat\n` +
                `• \`${prefix}curhat off\` - Matikan mode curhat\n\n` +
                `⚠️ *Note:* Mode curhat hanya bisa digunakan di private chat.`
            );
        }

        const action = args[0].toLowerCase();

        if (action === 'on') {
            if (isCurhatMode(m.sender)) {
                return await m.reply('udh aktif kok mode curhatnya 😊\nlangsung aja cerita, gue dengerin~');
            }

            setCurhatMode(m.sender, true);
            clearCurhatHistory(m.sender);

            // Delay sebentar biar natural
            await sock.sendPresenceUpdate('composing', m.chat);
            await new Promise(r => setTimeout(r, 1500));

            return await m.reply(
                'haii! 👋\n\n' +
                'mode curhat aktif nih, gue siap dengerin cerita lo kapan aja.\n' +
                'mau curhat soal apa? cerita aja bebas, gue gk bakal judge kok 😊\n\n' +
                '_ketik .curhat off kalo mau berhenti_'
            );
        }

        if (action === 'off') {
            if (!isCurhatMode(m.sender)) {
                return await m.reply('mode curhat emg lg off kok 😅');
            }

            setCurhatMode(m.sender, false);
            clearCurhatHistory(m.sender);

            await sock.sendPresenceUpdate('composing', m.chat);
            await new Promise(r => setTimeout(r, 1000));

            return await m.reply(
                'oke mode curhat dimatiin ya 👋\n\n' +
                'makasih udh mau cerita, semoga lo ngerasa lebih baik.\n' +
                'kalo butuh temen curhat lagi, tinggal ketik .curhat on aja ya! 💙'
            );
        }

        // Argumen tidak dikenal
        return await m.reply(
            `❌ Argumen tidak dikenal: *${action}*\n\n` +
            `Gunakan:\n` +
            `• \`${prefix}curhat on\` - Aktifkan\n` +
            `• \`${prefix}curhat off\` - Matikan`
        );
    }
};
