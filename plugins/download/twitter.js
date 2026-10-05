/**
 * @file plugins/download/twitter.js
 * @description Download video dari Twitter/X
 * @author Ourin-AI Team
 * @version 1.0.0
 */

const axios = require('axios');

const pluginConfig = {
    name: 'twitter',
    alias: ['tw', 'twdl', 'x', 'xdl'],
    category: 'download',
    description: 'Download video dari Twitter/X',
    usage: '.tw <url>',
    example: '.tw https://x.com/user/status/xxxxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
};

async function handler(m, { sock }) {
    const url = m.text?.trim();

    if (!url) {
        return m.reply('⚠️ Masukkan URL Twitter/X!\n\nContoh: .tw https://x.com/user/status/xxxxx');
    }

    if (!url.match(/twitter\.com|x\.com/i)) {
        return m.reply('❌ URL tidak valid! Pastikan URL dari Twitter/X.');
    }

    await m.react('⏳');

    try {
        let videoUrl = null;

        try {
            const res = await axios.post('https://api.cobalt.tools/api/json', {
                url: url,
                vCodec: 'h264',
                vQuality: '720'
            }, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            
            if (res.data?.url) {
                videoUrl = res.data.url;
            }
        } catch {
            // Silent
        }

        if (!videoUrl) {
            await m.react('❌');
            return m.reply('❌ Gagal mengambil video. Server sedang sibuk atau URL tidak valid.');
        }

        const videoBuffer = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            timeout: 60000
        });

        await sock.sendMessage(m.chat, {
            video: Buffer.from(videoBuffer.data),
            caption: '✅ *Twitter/X Download*\n\n📥 Video berhasil diunduh!'
        }, { quoted: m.message });

        await m.react('✅');

    } catch (error) {
        console.error('[Twitter]', error.message);
        await m.react('❌');
        await m.reply('❌ Gagal mendownload video Twitter. Coba lagi nanti.');
    }
}

module.exports = { config: pluginConfig, handler };
