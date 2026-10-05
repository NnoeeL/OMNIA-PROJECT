/**
 * @file plugins/group/kick.js
 * @description Command .kick @tag - Mengeluarkan member dari grup
 * @author Ourin-AI Team
 * @version 1.0.0
 */

const pluginConfig = {
    name: 'kick',
    alias: ['remove', 'tendang', 'keluarkan'],
    category: 'group',
    description: 'Mengeluarkan member dari grup',
    usage: '.kick @tag',
    example: '.kick @user',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    isBotAdmin: true,
    cooldown: 5,
    limit: 0,
    isEnabled: true
};

/**
 * Handler untuk command kick
 * @param {Object} m - Serialized message
 * @param {Object} context - Handler context
 */
async function handler(m, { sock }) {
    // Cek apakah pengirim adalah admin
    if (!m.isAdmin && !m.isOwner) {
        return m.reply('⚠️ Hanya admin grup yang bisa menggunakan perintah ini!');
    }

    // Cek apakah bot adalah admin
    if (!m.isBotAdmin) {
        return m.reply('⚠️ Bot harus menjadi admin grup untuk bisa mengeluarkan member!');
    }

    // Ambil target user dari mention atau quoted message
    let targetJid = null;

    // Prioritas 1: dari mention
    if (m.mentionedJid && m.mentionedJid.length > 0) {
        targetJid = m.mentionedJid[0];
    }
    // Prioritas 2: dari quoted message (reply)
    else if (m.quoted && m.quoted.sender) {
        targetJid = m.quoted.sender;
    }

    if (!targetJid) {
        return m.reply(
            '❌ *Tag atau reply pesan member yang ingin di-kick!*\n\n' +
            '📝 *Cara pakai:*\n' +
            '│ ◦ `.kick @user` — Tag member\n' +
            '│ ◦ Reply pesan member lalu ketik `.kick`\n'
        );
    }

    // Jangan izinkan kick diri sendiri
    if (targetJid === m.sender) {
        return m.reply('❌ Kamu tidak bisa mengeluarkan diri sendiri!');
    }

    // Jangan izinkan kick bot
    const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
    if (targetJid === botJid || targetJid.includes(sock.user?.id?.split(':')[0])) {
        return m.reply('❌ Bot tidak bisa mengeluarkan diri sendiri!');
    }

    // Cek apakah target adalah admin
    const groupAdmins = m.groupAdmins || [];
    if (groupAdmins.includes(targetJid)) {
        return m.reply('❌ Tidak bisa mengeluarkan admin grup!');
    }

    try {
        await m.react('⏳');

        // Kick member dari grup
        await sock.groupParticipantsUpdate(m.chat, [targetJid], 'remove');

        await m.react('✅');

        const targetName = targetJid.split('@')[0];
        return m.reply(`✅ *Berhasil mengeluarkan* @${targetName} dari grup!`, {
            mentions: [targetJid]
        });
    } catch (error) {
        await m.react('❌');
        return m.reply(`❌ *Gagal mengeluarkan member!*\n\n⚠️ Error: ${error.message || 'Unknown error'}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
