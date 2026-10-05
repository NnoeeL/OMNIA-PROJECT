/**
 * @file plugins/owner/addpremium.js
 * @description Plugin untuk menambahkan premium user dengan durasi tertentu menggunakan LID
 * @author Ourin-AI Team
 * @version 1.1.0
 */

/**
 * Konfigurasi plugin addpremium
 * @type {import('../../src/lib/plugins').PluginConfig}
 */
const pluginConfig = {
    name: 'addpremium',
    alias: ['addprem'],
    category: 'owner',
    description: 'Menambahkan premium user dengan durasi tertentu (Via LID/Mention)',
    usage: '.addpremium <lid> <durasi>\nContoh: .addpremium 206789874339982 30d',
    example: '.addpremium 206789874339982 30d',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
};

/**
 * Parse durasi dari string seperti "30d", "7d", "1d"
 * @param {string} duration - String durasi
 * @returns {number|null} Waktu dalam milidetik atau null jika invalid
 */
function parseDuration(duration) {
    const match = duration.match(/^(\d+)(d|h|m)$/i);
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    const multipliers = {
        'm': 60 * 1000,           // menit
        'h': 60 * 60 * 1000,      // jam
        'd': 24 * 60 * 60 * 1000  // hari
    };
    
    return value * multipliers[unit];
}

/**
 * Format durasi untuk display
 * @param {number} ms - Milidetik
 * @returns {string} String format readable
 */
function formatDuration(ms) {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    
    const parts = [];
    if (days > 0) parts.push(`${days} hari`);
    if (hours > 0) parts.push(`${hours} jam`);
    if (minutes > 0) parts.push(`${minutes} menit`);
    
    return parts.join(' ') || '0 menit';
}

/**
 * Handler untuk command addpremium
 * @param {Object} m - Serialized message
 * @param {Object} context - Handler context
 * @returns {Promise<void>}
 */
async function handler(m, { db, sock }) {
    const args = m.args; // Gunakan m.args yang sudah di-parse
    
    // Cek apakah ada mention atau tag
    let targetJid = null;
    let lidNumber = null;
    
    if (m.mentionedJid && m.mentionedJid.length > 0) {
        // Jika ada mention, gunakan JID yang di-mention
        targetJid = m.mentionedJid[0];
        lidNumber = targetJid.replace(/@.+/g, '');
    } else if (args.length >= 1) {
        // Jika tidak ada mention, cek dari args dan treat sebagai LID
        lidNumber = args[0].replace(/[^0-9]/g, '');
        
        // Validasi input
        if (!lidNumber) {
            await m.reply('❌ LID tidak valid! Pastikan hanya memasukkan angka LID.');
            return;
        }
        
        // Format langsung menjadi @lid
        targetJid = `${lidNumber}@lid`;
    }
    
    // Cek durasi
    const durationStr = m.mentionedJid && m.mentionedJid.length > 0 ? args[0] : args[1];
    
    if (!durationStr || !targetJid) {
        await m.reply(`❌ Format salah!\n\n` +
            `📝 Usage:\n` +
            `• .addpremium @user <durasi>\n` +
            `• .addpremium <lid> <durasi>\n\n` +
            `Contoh:\n` +
            `• .addpremium @user 30d (30 hari)\n` +
            `• .addpremium 206789874339982 30d (30 hari)\n` +
            `• .addpremium 206789874339982 7d (7 hari)\n` +
            `• .addpremium @user 24h (24 jam)\n` +
            `• .addpremium @user 60m (60 menit)`);
        return;
    }
    
    // Parse durasi
    const durationMs = parseDuration(durationStr);
    if (!durationMs) {
        await m.reply(`❌ Format durasi tidak valid!\n\n` +
            `Format yang benar:\n` +
            `• d = hari (contoh: 30d)\n` +
            `• h = jam (contoh: 24h)\n` +
            `• m = menit (contoh: 60m)`);
        return;
    }
    
    // Hitung waktu expired
    const expiredAt = Date.now() + durationMs;
    
    // Update user data ke database
    const user = db.getUser(targetJid) || {};
    db.setUser(targetJid, {
        ...user,
        isPremium: true,
        premiumExpiredAt: expiredAt,
        limit: -1
    });
    
    // Format response
    const expiredDate = new Date(expiredAt);
    const formattedDate = expiredDate.toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    let successMsg = `╭─「 💎 PREMIUM ADDED 」─\n`;
    successMsg += `│\n`;
    successMsg += `│ 🆔 Target: ${targetJid}\n`;
    successMsg += `│ 🔢 LID: ${lidNumber}\n`;
    successMsg += `│ ⏰ Durasi: ${formatDuration(durationMs)}\n`;
    successMsg += `│ 📅 Expired: ${formattedDate}\n`;
    successMsg += `│ ✅ Status: Premium Aktif\n`;
    successMsg += `│\n`;
    successMsg += `╰────────────────\n\n`;
    successMsg += `✨ User berhasil ditambahkan sebagai premium!`;
    
    await m.reply(successMsg);
}

module.exports = {
    config: pluginConfig,
    handler
};