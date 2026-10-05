/**
 * @file plugins/group/chatgroup.js
 * @description Command .chatgroup open/close - Buka atau tutup grup
 * @author Ourin-AI Team
 * @version 1.0.0
 */

const pluginConfig = {
    name: 'chatgroup',
    alias: ['group', 'openchat', 'closechat', 'bukagrup', 'tutupgrup'],
    category: 'group',
    description: 'Buka atau tutup grup (hanya admin bisa chat)',
    usage: '.chatgroup <open/close>',
    example: '.chatgroup close',
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
 * Handler untuk command chatgroup
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
        return m.reply('⚠️ Bot harus menjadi admin grup untuk bisa mengubah pengaturan grup!');
    }

    const option = (m.text?.trim() || m.args?.[0] || '').toLowerCase();

    if (!option || (option !== 'open' && option !== 'close')) {
        // Cek status saat ini
        let currentStatus = 'Unknown';
        try {
            const metadata = m.groupMetadata || await sock.groupMetadata(m.chat);
            currentStatus = metadata.announce ? '🔒 Tertutup (Close)' : '🔓 Terbuka (Open)';
        } catch (e) {
            // ignore
        }

        return m.reply(
            '🔧 *Chat Group Setting*\n\n' +
            `📊 Status saat ini: *${currentStatus}*\n\n` +
            '📝 *Cara pakai:*\n' +
            '│ ◦ `.chatgroup open` — Buka grup (semua bisa chat)\n' +
            '│ ◦ `.chatgroup close` — Tutup grup (hanya admin bisa chat)\n'
        );
    }

    try {
        await m.react('⏳');

        if (option === 'open') {
            // not_announcement = semua member bisa kirim pesan
            await sock.groupSettingUpdate(m.chat, 'not_announcement');
            await m.react('🔓');
            return m.reply(
                '🔓 *Grup telah dibuka!*\n\n' +
                'Sekarang semua member bisa mengirim pesan di grup ini.'
            );
        }

        if (option === 'close') {
            // announcement = hanya admin yang bisa kirim pesan
            await sock.groupSettingUpdate(m.chat, 'announcement');
            await m.react('🔒');
            return m.reply(
                '🔒 *Grup telah ditutup!*\n\n' +
                'Sekarang hanya admin yang bisa mengirim pesan di grup ini.'
            );
        }
    } catch (error) {
        await m.react('❌');
        return m.reply(`❌ *Gagal mengubah pengaturan grup!*\n\n⚠️ Error: ${error.message || 'Unknown error'}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
