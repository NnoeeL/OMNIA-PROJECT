/**
 * @file plugins/download/facebook.js
 * @description Download video dari Facebook
 * @author Ourin-AI Team
 * @version 1.0.0
 */

const axios = require('axios');

const pluginConfig = {
    name: 'facebook',
    alias: ['fb', 'fbdl', 'fbdownload'],
    category: 'download',
    description: 'Download video dari Facebook',
    usage: '.fb <url>',
    example: '.fb https://www.facebook.com/watch?v=xxxxx',
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
        return m.reply('⚠️ Masukkan URL Facebook!\n\nContoh: .fb https://www.facebook.com/watch?v=xxxxx');
    }

    if (!url.match(/facebook\.com|fb\.watch|fb\.gg/i)) {
        return m.reply('❌ URL tidak valid! Pastikan URL dari Facebook.');
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
            caption: '✅ *Facebook Download*\n\n📥 Video berhasil diunduh!'
        }, { quoted: m.message });

        await m.react('✅');

    } catch (error) {
        console.error('[Facebook]', error.message);
        await m.react('❌');
        await m.reply('❌ Gagal mendownload video Facebook. Coba lagi nanti.');
    }
}

module.exports = { config: pluginConfig, handler };
