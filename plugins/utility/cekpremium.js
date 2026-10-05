/**
 * @file plugins/utility/cekpremium.js
 * @description Plugin untuk mengecek status premium user
 * @author Ourin-AI Team
 * @version 1.0.0
 */

/**
 * Konfigurasi plugin cekpremium
 * @type {import('../../src/lib/plugins').PluginConfig}
 */
const pluginConfig = {
    name: 'cekpremium',
    alias: ['premium', 'cekprem', 'premiumcheck'],
    category: 'utility',
    description: 'Mengecek status premium user',
    usage: '.cekpremium [@user]',
    example: '.cekpremium\n.cekpremium @user',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
};

/**
 * Format waktu remaining
 * @param {number} ms - Milidetik expired time
 * @returns {string} Format readable
 */
function formatTimeRemaining(ms) {
    const now = Date.now();
    const remaining = ms - now;
    
    if (remaining <= 0) return '⚠️ Sudah Expired';
    
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    let result = '';
    if (days > 0) result += `${days} hari `;
    if (hours > 0) result += `${hours} jam `;
    if (minutes > 0) result += `${minutes} menit`;
    
    return result.trim() || '< 1 menit';
}

/**
 * Format tanggal expired
 * @param {number} ms - Milidetik expired time
 * @returns {string} Format tanggal
 */
function formatExpiredDate(ms) {
    const date = new Date(ms);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Handler untuk command cekpremium
 * @param {Object} m - Serialized message
 * @param {Object} context - Handler context
 * @returns {Promise<void>}
 */
async function handler(m, { sock, db, config }) {
    let targetJid = m.sender;
    let targetName = m.pushName;
    let isSelf = true;
    
    // Cek apakah ada mention
    if (m.mentionedJid && m.mentionedJid.length > 0) {
        targetJid = m.mentionedJid[0];
        targetName = targetJid.split('@')[0];
        isSelf = false;
    }
    
    // Ambil data user dari database
    const user = db.getUser(targetJid);
    
    // Cek status owner
    const isOwnerUser = config.isOwner(targetJid);
    
    // Cek status premium
    const isPremiumUser = config.isPremium(targetJid, db);
    
    let statusText = '';
    let statusEmoji = '';
    let premiumInfo = '';
    
    if (isOwnerUser) {
        statusEmoji = '👑';
        statusText = 'Owner';
        premiumInfo = '\n📌 *Status*: Owner (Premium Unlimited)';
    } else if (isPremiumUser) {
        statusEmoji = '💎';
        statusText = 'Premium User';
        
        // Cek expired time
        if (user && user.premiumExpiredAt) {
            const now = Date.now();
            if (now > user.premiumExpiredAt) {
                // Premium sudah expired
                statusEmoji = '⚠️';
                statusText = 'Premium Expired';
                premiumInfo = `\n📌 *Status*: Premium Expired`;
                premiumInfo += `\n⏰ *Expired*: ${formatExpiredDate(user.premiumExpiredAt)}`;
            } else {
                // Premium masih aktif
                premiumInfo = `\n📌 *Status*: Premium Active ✅`;
                premiumInfo += `\n⏰ *Expired*: ${formatExpiredDate(user.premiumExpiredAt)}`;
                premiumInfo += `\n⏳ *Sisa*: ${formatTimeRemaining(user.premiumExpiredAt)}`;
            }
        } else {
            // Premium permanent
            premiumInfo = `\n📌 *Status*: Premium Permanent ♾️`;
        }
    } else {
        statusEmoji = '🆓';
        statusText = 'Free User';
        premiumInfo = '\n📌 *Status*: Bukan Premium User';
    }
    
    // Format pesan
    let message = `╭─「 ${statusEmoji} CEK PREMIUM 」─\n│\n`;
    message += `│ 👤 *Nama*: ${targetName}\n`;
    message += `│ 📱 *Nomor*: ${targetJid.split('@')[0]}\n`;
    message += `│ ${premiumInfo.replace(/\n/g, '\n│ ')}\n`;
    
    // Tambah informasi limit
    if (user) {
        message += `│\n│ 📊 *Limit Tersisa*: ${user.limit || 25}\n`;
    }
    
    message += `│\n╰────────────────\n`;
    
    // Tambah info cara upgrade jika bukan premium
    if (!isPremiumUser && !isOwnerUser) {
        message += `\n💡 *Info*: Hubungi owner untuk upgrade ke premium!`;
    }
    
    await m.reply(message);
}

module.exports = {
    config: pluginConfig,
    handler
};
