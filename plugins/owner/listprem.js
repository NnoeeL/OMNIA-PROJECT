/**
 * @file plugins/owner/listprem.js
 * @description Plugin untuk melihat daftar premium user
 * @author Ourin-AI Team
 * @version 2.0.0
 */

/**
 * Konfigurasi plugin listprem
 * @type {import('../../src/lib/plugins').PluginConfig}
 */
const pluginConfig = {
    name: 'listprem',
    alias: ['listpremium', 'premlist'],
    category: 'owner',
    description: 'Melihat daftar premium user',
    usage: '.listprem',
    example: '.listprem',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
};

/**
 * Format waktu remaining
 * @param {number} ms - Milidetik
 * @returns {string} Format readable
 */
function formatTimeRemaining(ms) {
    const now = Date.now();
    const remaining = ms - now;
    
    if (remaining <= 0) return '⚠️ Expired';
    
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

/**
 * Handler untuk command listprem
 * @param {Object} m - Serialized message
 * @param {Object} context - Handler context
 * @returns {Promise<void>}
 */
async function handler(m, { db }) {
    const premiumUsers = db.getPremiumUsers();
    
    if (premiumUsers.length === 0) {
        await m.reply('💎 Tidak ada premium user yang terdaftar');
        return;
    }
    
    let listText = `╭─「 💎 PREMIUM USERS 」─\n`;
    listText += `│\n`;
    
    for (let i = 0; i < premiumUsers.length; i++) {
        const user = premiumUsers[i];
        const status = user.isExpired ? '⚠️ Expired' : '✅ Active';
        const timeInfo = user.expiredAt ? formatTimeRemaining(user.expiredAt) : '♾️ Permanent';
        
        listText += `│ ${i + 1}. ${user.name || user.number}\n`;
        listText += `│    📱 ${user.number}\n`;
        listText += `│    ⏰ ${timeInfo}\n`;
        listText += `│    ${status}\n`;
        listText += `│\n`;
    }
    
    listText += `╰────────────────\n\n`;
    listText += `📊 Total: ${premiumUsers.length} premium user`;
    
    await m.reply(listText);
}

module.exports = {
    config: pluginConfig,
    handler
};
