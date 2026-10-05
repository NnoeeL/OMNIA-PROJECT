/**
 * @file plugins/group/grupchat.js
 * @description Toggle bot command aktif/non-aktif di grup
 * @author Ourin-AI Team
 * @version 1.0.0
 */

const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'grupchat',
    alias: ['groupchat', 'botchat', 'gchat'],
    category: 'group',
    description: 'Aktifkan/nonaktifkan bot di grup ini',
    usage: '.grupchat on/off',
    example: '.grupchat off',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    // Only admin or owner can use this
    if (!m.isAdmin && !m.isOwner) {
        return m.reply('⚠️ Hanya admin grup atau owner bot yang bisa menggunakan perintah ini!');
    }

    const option = m.text?.trim().toLowerCase();

    if (!option || (option !== 'on' && option !== 'off')) {
        const db = getDatabase();
        const group = db.getGroup(m.chat);
        const currentStatus = group?.botEnabled !== false ? 'ON ✅' : 'OFF ❌';

        let txt = '🔧 *Group Chat Setting*\n\n';
        txt += `📊 Status saat ini: *${currentStatus}*\n\n`;
        txt += '🔹 *Cara pakai:*\n';
        txt += '│ ◦ *.grupchat on* — Aktifkan bot di grup\n';
        txt += '│ ◦ *.grupchat off* — Nonaktifkan bot di grup\n\n';
        txt += '💡 Jika OFF, bot tidak akan merespons command di grup ini.';
        return m.reply(txt);
    }

    const db = getDatabase();

    if (option === 'on') {
        db.setGroup(m.chat, { botEnabled: true });
        await m.react('✅');
        return m.reply('✅ *Bot telah diaktifkan* di grup ini!\n\nSemua anggota sekarang bisa menggunakan command.');
    }

    if (option === 'off') {
        db.setGroup(m.chat, { botEnabled: false });
        await m.react('🔇');
        return m.reply('🔇 *Bot telah dinonaktifkan* di grup ini!\n\nBot tidak akan merespons command di grup ini.\nGunakan *.grupchat on* untuk mengaktifkan kembali.');
    }
}

module.exports = { config: pluginConfig, handler };
