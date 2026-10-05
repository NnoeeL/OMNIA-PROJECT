/**
 * @file plugins/main/infobot.js
 * @description Plugin untuk menampilkan informasi lengkap bot dengan context info
 * @author Ourin-AI Team
 * @version 2.0.0
 */

const config = require('../../config');
const { formatUptime } = require('../../src/lib/formatter');
const { getCommandsByCategory, getCategories } = require('../../src/lib/plugins');
const { getDatabase } = require('../../src/lib/database');
const fs = require('fs');
const path = require('path');

/**
 * Konfigurasi plugin infobot
 * @type {import('../../src/lib/plugins').PluginConfig}
 */
const pluginConfig = {
    name: 'infobot',
    alias: ['botinfo', 'info', 'about'],
    category: 'main',
    description: 'Menampilkan informasi lengkap tentang bot',
    usage: '.infobot',
    example: '.infobot',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
};

/**
 * Handler untuk command infobot
 * @param {Object} m - Serialized message
 * @param {Object} context - Handler context
 * @returns {Promise<void>}
 */
async function handler(m, { sock, config: botConfig, db, uptime }) {
    const uptimeFormatted = formatUptime(uptime);
    const totalUsers = db.getUserCount();
    const commandsByCategory = getCommandsByCategory();
    
    let totalCommands = 0;
    for (const category of Object.keys(commandsByCategory)) {
        totalCommands += commandsByCategory[category].length;
    }
    
    const stats = db.getStats();
    const userStatus = m.isOwner ? 'Owner' : m.isPremium ? 'Premium' : 'Free User';
    const statusEmoji = m.isOwner ? '👑' : m.isPremium ? '💎' : '🆓';
    
    let infoText = '';
    
    infoText += `┌──「 🤖 *INFORMASI BOT* 」\n`;
    infoText += `│  ◦ \`Nama\`: ${botConfig.bot?.name || 'OMNIA - PROJECT'}\n`;
    infoText += `│  ◦ \`Versi\`: ${botConfig.bot?.version || '1.0.0'}\n`;
    infoText += `│  ◦ \`Developer\`: ${botConfig.bot?.developer || 'OMNIA - PROJECT'}\n`;
    infoText += `│  ◦ \`Owner\`: ${botConfig.owner?.name || 'Owner'}\n`;
    infoText += `│  ◦ \`Mode\`: ${(botConfig.mode || 'public').charAt(0).toUpperCase() + (botConfig.mode || 'public').slice(1)}\n`;
    infoText += `│  ◦ \`Prefix\`: [ ${botConfig.command?.prefix || '.'} ]\n`;
    infoText += `│  ◦ \`Library\`: Baileys MD\n`;
    infoText += `│  ◦ \`Platform\`: Node.js\n`;
    infoText += `└────────────────\n\n`;
    
    infoText += `┌──「 📊 *STATISTIK* 」\n`;
    infoText += `│  ◦ \`Uptime\`: ${uptimeFormatted}\n`;
    infoText += `│  ◦ \`Total Users\`: ${totalUsers}\n`;
    infoText += `│  ◦ \`Total Fitur\`: ${totalCommands}\n`;
    infoText += `│  ◦ \`CMD Executed\`: ${stats.commandsExecuted || 0}\n`;
    infoText += `└────────────────\n\n`;
    
    infoText += `┌──「 💻 *RUNTIME* 」\n`;
    infoText += `│  ◦ \`RAM\`: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\n`;
    infoText += `│  ◦ \`Node\`: ${process.version}\n`;
    infoText += `│  ◦ \`Status\`: Online \n`;
    infoText += `└────────────────`;
    
    const contextInfo = {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        externalAdReply: {
            showAdAttribution: false,
            title: `${botConfig.bot?.name || 'OMNIA - PROJECT'} `,
            body: `${statusEmoji} ${userStatus} • v${botConfig.bot?.version || '1.0.0'}`,
            mediaType: 1,
            renderLargerThumbnail: true,
            thumbnail: fs.readFileSync(path.join(__dirname, '../../assets/images/ourin.jpg')),
            sourceUrl: botConfig.bot?.website || '',
            previewType: 'PHOTO'
        }
    };
    
    await sock.sendMessage(m.chat, {
        text: infoText,
        contextInfo: contextInfo
    }, {
        quoted: m.raw
    });
}

module.exports = {
    config: pluginConfig,
    handler
};
