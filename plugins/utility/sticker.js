/**
 * @file plugins/utility/sticker.js
 * @description Plugin untuk membuat sticker dari gambar
 * @author Ourin-AI Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const config = require('../../config');

/**
 * Konfigurasi plugin sticker
 * @type {import('../../src/lib/plugins').PluginConfig}
 */
const pluginConfig = {
    name: 'sticker',
    alias: ['s', 'stiker'],
    category: 'utility',
    description: 'Membuat sticker persegi 1:1 dari gambar atau video',
    usage: '.sticker [packname] [author]',
    example: '.sticker BotName Author',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 1,
    isEnabled: true
};

/**
 * Handler untuk command sticker
 * @param {Object} m - Serialized message
 * @param {Object} context - Handler context
 * @returns {Promise<void>}
 */
async function handler(m, { sock, config: botConfig }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage');
    const isVideo = m.isVideo || (m.quoted && m.quoted.type === 'videoMessage');
    const isSticker = m.isSticker || (m.quoted && m.quoted.type === 'stickerMessage');
    
    if (!isImage && !isVideo) {
        await m.reply(`🖼️ *Sticker Maker*\n\nKirim/reply gambar atau video dengan caption:\n${m.prefix}sticker\n\nAtau:\n${m.prefix}sticker PackName AuthorName`);
        return;
    }
    
    await m.react('⏳');
    
    try {
        let buffer;
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download();
        } else if (m.isMedia) {
            buffer = await m.download();
        }
        
        if (!buffer) {
            await m.reply('❌ Gagal mendownload media!');
            await m.react('❌');
            return;
        }
        
        const packname = m.args[0] || botConfig.sticker?.packname || botConfig.bot?.name || 'OMNIA - PROJECT';
        const author = m.args[1] || botConfig.sticker?.author || botConfig.owner?.name || 'Bot';
        
        if (isImage) {
            await sock.sendImageAsSticker(m.chat, buffer, { 
                packname, 
                author,
                quoted: m.raw 
            });
        } else if (isVideo) {
            await sock.sendVideoAsSticker(m.chat, buffer, { 
                packname, 
                author,
                quoted: m.raw 
            });
        }
        
        await m.react('✅');
        
    } catch (error) {
        console.error('[Sticker] Error:', error.message);
        await m.reply(`❌ Gagal membuat sticker!\n\n_${error.message}_`);
        await m.react('❌');
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
