/**
 * @file plugins/utility/stikergif.js
 * @description Membuat sticker animasi persegi 1:1 dari video atau GIF
 */

const config = require('../../config');

const pluginConfig = {
    name: 'stikergif',
    alias: ['gifstiker', 'animatedsticker'],
    category: 'utility',
    description: 'Membuat sticker animasi persegi 1:1 dari video atau GIF',
    usage: '.stikergif (reply video/GIF atau kirim media dengan caption)',
    example: '.stikergif',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 1,
    isEnabled: true
};

function getAnimatedMedia(message, isQuoted = false) {
    if (!message) return null;

    const type = message.type;
    const content = message.message?.[type];
    const mimetype = content?.mimetype || message.mimetype || '';
    const isAnimated = type === 'videoMessage' ||
        (type === 'imageMessage' && mimetype === 'image/gif') ||
        (type === 'documentMessage' && (/^video\//i.test(mimetype) || mimetype === 'image/gif'));

    if (!isAnimated) return null;

    return { download: () => message.download() };
}

async function handler(m, { sock, config: botConfig }) {
    const media = getAnimatedMedia(m) || getAnimatedMedia(m.quoted);
    if (!media) {
        return m.reply(
            `🎞️ *Sticker GIF 1:1*\n\n` +
            `Kirim atau reply video/GIF dengan caption *${m.prefix}stikergif*.\n` +
            `Video akan dipotong maksimal 5 detik dan dikirim dalam kanvas persegi.`
        );
    }

    await m.react('⏳');
    try {
        const buffer = await media.download();
        if (!buffer?.length) {
            throw new Error('Gagal mengunduh video/GIF atau file kosong.');
        }

        const packname = botConfig.sticker?.packname || botConfig.bot?.name || config.bot?.name;
        const author = botConfig.sticker?.author || botConfig.owner?.name || 'Bot';
        await sock.sendVideoAsSticker(m.chat, buffer, {
            packname,
            author,
            quoted: m.raw
        });
        await m.react('✅');
    } catch (error) {
        console.error('[Sticker GIF] Error:', error);
        await m.react('❌');
        await m.reply(`❌ Gagal membuat sticker GIF:\n_${error.message || 'Error tidak diketahui'}_`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
