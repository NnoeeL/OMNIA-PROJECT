/**
 * @file plugins/owner/delpremium.js
 * @description Plugin untuk menghapus premium user
 * @author Ourin-AI Team
 * @version 1.0.0
 */

/**
 * Konfigurasi plugin delpremium
 * @type {import('../../src/lib/plugins').PluginConfig}
 */
const pluginConfig = {
    name: 'delpremium',
    alias: ['delprem', 'removeprem'],
    category: 'owner',
    description: 'Menghapus premium user',
    usage: '.delpremium <nomor>',
    example: '.delpremium 628123456789',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
};

/**
 * Handler untuk command delpremium
 * @param {Object} m - Serialized message
 * @param {Object} context - Handler context
 * @returns {Promise<void>}
 */
async function handler(m, { db, config: botConfig }) {
    const args = m.args; // Gunakan m.args yang sudah di-parse
    
    // Cek apakah ada mention atau tag
    let targetJid = null;
    let phoneNumber = null;
    
    if (m.mentionedJid && m.mentionedJid.length > 0) {
        // Jika ada mention, gunakan JID yang di-mention
        targetJid = m.mentionedJid[0];
        phoneNumber = targetJid.replace(/@.+/g, '');
    } else if (args.length >= 1) {
        // Jika tidak ada mention, cek dari args
        phoneNumber = args[0].replace(/[^0-9]/g, '');
        
        // Validasi nomor
        if (!phoneNumber || phoneNumber.length < 10) {
            await m.reply('❌ Nomor WhatsApp tidak valid!');
            return;
        }
        
        // Cek apakah user sudah ada di database (untuk mendeteksi format JID yang benar)
        const existingUser = db.getUser(phoneNumber);
        if (existingUser && existingUser.jid) {
            // Gunakan format yang sudah ada
            targetJid = existingUser.jid;
        } else {
            // Default ke format standar
            targetJid = phoneNumber + '@s.whatsapp.net';
        }
    } else {
        await m.reply(`❌ Format salah!\n\n` +
            `📝 Usage:\n` +
            `• .delpremium @user\n` +
            `• .delpremium <nomor>\n\n` +
            `Contoh:\n` +
            `• .delpremium @user\n` +
            `• .delpremium 628123456789\n` +
            `• .delpremium 206789874339982`);
        return;
    }
    
    // Cek apakah user ada
    const user = db.getUser(targetJid);
    if (!user) {
        await m.reply('❌ User tidak ditemukan di database!');
        return;
    }
    
    if (!user.isPremium) {
        await m.reply('⚠️ User ini bukan premium user!');
        return;
    }
    
    // Update user data - remove premium
    db.setUser(targetJid, {
        ...user,
        isPremium: false,
        premiumExpiredAt: null,
        limit: botConfig.limits?.default ?? 10
    });
    
    let successMsg = `╭─「 💎 PREMIUM REMOVED 」─\n`;
    successMsg += `│\n`;
    successMsg += `│ 📱 Nomor: ${phoneNumber}\n`;
    successMsg += `│ 🆔 JID: ${targetJid}\n`;
    successMsg += `│ 👤 Nama: ${user.name}\n`;
    successMsg += `│ ✅ Status: Premium Dihapus\n`;
    successMsg += `│\n`;
    successMsg += `╰────────────────\n\n`;
    successMsg += `✨ Premium user berhasil dihapus!`;
    
    await m.reply(successMsg);
}

module.exports = {
    config: pluginConfig,
    handler
};
