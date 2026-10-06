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
    alias: ['cekprem', 'premiumcheck'],
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
    
    // LID may be supplied directly as digits or as a full JID.
    if (m.mentionedJid && m.mentionedJid.length > 0) {
        targetJid = m.mentionedJid[0];
    } else if (m.args?.[0]) {
        const target = m.args[0].trim();
        if (/^\d+$/.test(target)) {
            targetJid = `${target}@lid`;
        } else if (/^\d+@(lid|s\.whatsapp\.net)$/.test(target)) {
            targetJid = target;
        } else {
            return m.reply('❌ Masukkan LID berupa angka, JID, atau mention pengguna.');
        }
    }
    
    let phoneJid = targetJid.endsWith('@s.whatsapp.net') ? targetJid : null;
    let lidJid = targetJid.endsWith('@lid') ? targetJid : null;

    try {
        if (lidJid && sock.signalRepository?.lidMapping?.getPNForLID) {
            phoneJid = await sock.signalRepository.lidMapping.getPNForLID(lidJid);
        } else if (phoneJid && sock.signalRepository?.lidMapping?.getLIDForPN) {
            lidJid = await sock.signalRepository.lidMapping.getLIDForPN(phoneJid);
        }
    } catch (error) {
        console.error('[CekPremium] Gagal mencari pasangan LID/nomor:', error.message);
    }

    const targetUser = db.getUser(targetJid);
    const phoneUser = phoneJid ? db.getUser(phoneJid) : null;
    const userCandidates = [targetUser, phoneUser].filter(Boolean);

    if (targetJid !== m.sender) {
        targetName = userCandidates.find(candidate => candidate.isPremium)?.name ||
            phoneUser?.name ||
            targetUser?.name ||
            targetJid.split('@')[0];
    }
    
    // Cek status owner
    const isOwnerUser = config.isOwner(targetJid) || (phoneJid && config.isOwner(phoneJid));
    
    // Cek status premium
    const isPremiumUser = config.isPremium(targetJid, db) ||
        (phoneJid && config.isPremium(phoneJid, db));
    const refreshedCandidates = [db.getUser(targetJid), phoneJid ? db.getUser(phoneJid) : null]
        .filter(Boolean);
    const user = refreshedCandidates.find(candidate => candidate.isPremium) ||
        (phoneJid ? db.getUser(phoneJid) : null) ||
        db.getUser(targetJid);
    
    let statusEmoji = '';
    let premiumInfo = '';
    
    if (isOwnerUser) {
        statusEmoji = '👑';
        premiumInfo = '\n📌 *Status*: Owner (Premium Unlimited)';
    } else if (isPremiumUser) {
        statusEmoji = '💎';
        
        // Cek expired time
        if (user && user.premiumExpiredAt) {
            const now = Date.now();
            if (now > user.premiumExpiredAt) {
                // Premium sudah expired
                statusEmoji = '⚠️';
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
        premiumInfo = '\n📌 *Status*: Bukan Premium User';
    }
    
    // Format pesan
    let message = `╭─「 ${statusEmoji} CEK PREMIUM 」─\n│\n`;
    message += `│ 👤 *Nama*: ${targetName}\n`;
    message += `│ 🆔 *LID*: ${lidJid?.split('@')[0] || '-'}\n`;
    message += `│ 📱 *Nomor WhatsApp*: ${phoneJid?.split('@')[0] || (targetJid.endsWith('@s.whatsapp.net') ? targetJid.split('@')[0] : '-')}\n`;
    message += `│ ${premiumInfo.replace(/\n/g, '\n│ ')}\n`;
    
    // Tambah informasi limit
    const remainingLimit = isPremiumUser || isOwnerUser ? '∞' : String(user?.limit ?? 0);
    message += `│\n│ 📊 *Limit Tersisa*: ${remainingLimit}\n`;
    
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
