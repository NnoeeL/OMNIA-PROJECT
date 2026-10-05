/**
 * @file plugins/utility/saran.js
 * @description Mengirim saran pengguna ke grup saran OMNIA - PROJECT
 */

const SUGGESTION_GROUP_CODE = 'Jwro4iHfeoU5GYQ9zdvmnu';
const MAX_SUGGESTION_LENGTH = 2000;

const pluginConfig = {
    name: 'saran',
    alias: ['suggest', 'feedback'],
    category: 'utility',
    description: 'Kirim saran untuk OMNIA - PROJECT',
    usage: '.saran <isi saran>',
    example: '.saran Tambahkan fitur pencarian lagu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 6 * 60 * 60,
    limit: 0,
    isEnabled: true
};

async function handler(m, { sock, db }) {
    const suggestion = (m.text || '').trim();
    if (!suggestion) {
        return m.reply(`💡 Tulis saranmu setelah command.\nContoh: *${m.prefix}saran Tambahkan fitur pencarian lagu*`);
    }
    if (suggestion.length > MAX_SUGGESTION_LENGTH) {
        return m.reply(`❌ Saran terlalu panjang. Maksimal ${MAX_SUGGESTION_LENGTH} karakter.`);
    }

    let groupInfo;
    try {
        groupInfo = await sock.groupGetInviteInfo(SUGGESTION_GROUP_CODE);
    } catch (error) {
        console.error('[Saran] Gagal membuka tautan grup saran:', error);
        return m.reply('❌ Grup saran tidak dapat diakses. Hubungi owner bot.');
    }

    const groupJid = groupInfo?.id;
    if (typeof groupJid !== 'string' || !groupJid.endsWith('@g.us')) {
        console.error('[Saran] Invite info tidak memberikan ID grup yang valid.');
        return m.reply('❌ Grup saran belum dapat ditemukan. Hubungi owner bot.');
    }

    const suggestionNumber = db.incrementStat('suggestionCount');
    if (!Number.isInteger(suggestionNumber) || suggestionNumber < 1) {
        throw new Error('Nomor saran tidak dapat dibuat. Periksa status database bot.');
    }

    const name = (m.pushName || 'Pengguna')
        .replace(/[\r\n]+/g, ' ')
        .replace(/[()]/g, '')
        .trim()
        .slice(0, 80) || 'Pengguna';
    const message = `💡 *SARAN NO ${String(suggestionNumber).padStart(4, '0')} - (${name})*\n\n${suggestion}`;

    try {
        await sock.sendMessage(groupJid, { text: message });
    } catch (error) {
        console.error('[Saran] Gagal mengirim ke grup saran:', error);
        throw new Error('Saran gagal dikirim. Pastikan bot masih menjadi anggota grup saran.');
    }

    await m.reply(`✅ Saranmu berhasil dikirim!\nNomor saran: *${String(suggestionNumber).padStart(4, '0')}*`);
}

module.exports = {
    config: pluginConfig,
    handler
};
