/**
 * @file plugins/main/owner.js
 * @description Plugin untuk menampilkan informasi kontak owner
 * @author Ourin-AI Team
 * @version 1.0.0
 */

const config = require('../../config');

/**
 * Konfigurasi plugin owner
 * @type {import('../../src/lib/plugins').PluginConfig}
 */
const pluginConfig = {
    name: 'owner',
    alias: ['creator', 'dev', 'developer'],
    category: 'main',
    description: 'Menampilkan Instagram owner bot',
    usage: '.owner',
    example: '.owner',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 0,
    isEnabled: true
};

/**
 * Handler untuk command owner
 * @param {Object} m - Serialized message
 * @param {Object} context - Handler context
 * @returns {Promise<void>}
 */
async function handler(m, { sock, config: botConfig }) {
    const ownerName = botConfig.owner?.name || 'Owner';
    const ownerInstagram = botConfig.owner?.instagram || 'https://www.instagram.com/nnoelfr';
    
    let ownerText = `👑 *Instagram Owner Bot*\n\n`;
    ownerText += `Nama: ${ownerName}\n`;
    ownerText += `Bot: ${botConfig.bot?.name || 'OMNIA - PROJECT'}\n\n`;
    ownerText += `Instagram: ${ownerInstagram}`;

    await m.reply(ownerText);
}

module.exports = {
    config: pluginConfig,
    handler
};
