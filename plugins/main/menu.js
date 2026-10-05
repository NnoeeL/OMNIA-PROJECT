/**
 * @file plugins/main/menu.js
 * @description Plugin menu dengan desain baru - semua command ditampilkan di menu utama
 * @author Ourin-AI Team
 * @version 6.0.0
 */

const config = require('../../config');
const { formatUptime, getTimeGreeting } = require('../../src/lib/formatter');
const { getCommandsByCategory, getCommandsWithDescByCategory, getCategories } = require('../../src/lib/plugins');
const { getDatabase } = require('../../src/lib/database');
const fs = require('fs');
const path = require('path');

/**
 * Konfigurasi plugin menu
 */
const pluginConfig = {
    name: 'menu',
    alias: ['help', 'bantuan', 'commands', 'm'],
    category: 'main',
    description: 'Menampilkan menu utama bot',
    usage: '.menu',
    example: '.menu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
};

/**
 * Emoji untuk setiap kategori
 */
const CATEGORY_EMOJIS = {
    owner: '👑',
    main: '🏠',
    utility: '🔧',
    fun: '🎮',
    group: '👥',
    download: '📥',
    search: '🔍',
    tools: '🛠️',
    sticker: '🖼️',
    ai: '🤖',
    game: '🎯',
    media: '🎬',
    info: 'ℹ️'
};

/**
 * Format waktu compact
 */
function formatTime(date) {
    return date.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
    });
}

/**
 * Format tanggal compact
 */
function formatDateShort(date) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Handler untuk command menu
 */
async function handler(m, { sock, config: botConfig, db, uptime }) {
    const prefix = botConfig.command?.prefix || '.';
    
    const user = db.getUser(m.sender);
    const now = new Date();
    const timeStr = formatTime(now);
    const dateStr = formatDateShort(now);
    
    const categories = getCategories();
    const commandsByCategory = getCommandsWithDescByCategory();
    
    // Hitung total commands
    let totalCommands = 0;
    for (const category of categories) {
        totalCommands += (commandsByCategory[category] || []).length;
    }
    
    // Tentukan role user
    let userRole = 'User';
    let roleEmoji = '👤';
    if (m.isOwner) {
        userRole = 'Owner';
        roleEmoji = '👑';
    } else if (m.isPremium) {
        userRole = 'Premium';
        roleEmoji = '💎';
    }
    
    const greeting = getTimeGreeting();
    const uptimeFormatted = formatUptime(uptime);
    const totalUsers = db.getUserCount();
    
    let txt = `⭐ *Rekomendasi Outfit, Barang Murah & Skincare*\n`;
    txt += `🛍️ Temukan rekomendasinya di sini:\n`;
    txt += `🔗 https://www.tiktok.com/@cobadulu.in\n\n`;
    
    // Header greeting
    txt += `*H E L L O* ${m.pushName} ${greeting.includes('pagi') ? '🌅' : greeting.includes('siang') ? '☀️' : greeting.includes('sore') ? '🌇' : '🌙'}\n`;
    txt += `${greeting}!\n\n`;
    
    // ═══════════════════════════════
    // INFO PANEL
    // ═══════════════════════════════
    txt += `┌  *I N F O R M A T I O N*\n`;
    txt += `│ ◦ *Bot:* ${botConfig.bot?.name || 'OMNIA - PROJECT'}\n`;
    txt += `│ ◦ *Version:* v${botConfig.bot?.version || '1.1.0'}\n`;
    txt += `│ ◦ *Mode:* ${botConfig.mode || 'public'}\n`;
    txt += `│ ◦ *Prefix:* [ ${prefix} ]\n`;
    txt += `│ ◦ *Uptime:* ${uptimeFormatted}\n`;
    txt += `└  *Role:* ${roleEmoji} ${userRole}\n\n`;
    
    // ═══════════════════════════════
    // ALL COMMANDS BY CATEGORY
    // ═══════════════════════════════
    
    // Urutan kategori yang diinginkan
    const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'info'];
    
    // Sort categories berdasarkan order
    const sortedCategories = categories.sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
    
    for (const category of sortedCategories) {
        // Skip owner category jika bukan owner
        if (category === 'owner' && !m.isOwner) continue;
        
        const commands = commandsByCategory[category] || [];
        if (commands.length === 0) continue;
        
        const emoji = CATEGORY_EMOJIS[category] || '🔹';
        const categoryName = category.toUpperCase();
        
        txt += `┌  *${categoryName}* ${emoji}\n`;
        
        for (const cmd of commands) {
            txt += `│ ◦ ${prefix}${cmd.name} — _${cmd.description}_\n`;
        }
        
        txt += `└───────────\n\n`;
    }
    
    // ═══════════════════════════════
    // FOOTER
    // ═══════════════════════════════
    txt += `© ${botConfig.bot?.name || 'OMNIA - PROJECT'}\n`;
    txt += `📷 Owner: ${botConfig.owner?.instagram || 'https://www.instagram.com/nnoelfr'}`;
    
    // Kirim menu
    await sendMenuWithUI(m, sock, txt.trim(), botConfig);
}

/**
 * Mengirim menu dengan UI premium
 */
async function sendMenuWithUI(m, sock, text, botConfig) {
    const botName = botConfig.bot?.name || 'OMNIA - PROJECT';
    const saluranId = botConfig.saluran?.id || '120363208449943317@newsletter';
    let imagePath = path.join(process.cwd(), 'assets', 'images', 'ourin.jpg');
    let imageBuffer = null;
    
    if (fs.existsSync(imagePath)) {
        imageBuffer = fs.readFileSync(imagePath);
    }
    
    // Remove externalAdReply completely to ensure compatibility with WhatsApp Desktop
    // Desktop clients often fail to render complex Ad replies
    
    const messageContent = {};
    if (imageBuffer) {
        messageContent.image = imageBuffer;
        messageContent.caption = text;
    } else {
        messageContent.text = text;
    }

    try {
        await sock.sendMessage(m.chat, messageContent, { quoted: m.message });
    } catch (error) {
        console.error('Menu send error:', error);
        await m.reply(text);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
