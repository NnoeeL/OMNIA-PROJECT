/**
 * @file plugins/download/tiktok.js
 * @description Download video TikTok tanpa watermark
 * @author Ourin-AI Team
 * @version 1.0.0
 */

const axios = require('axios');

const pluginConfig = {
    name: 'tiktok',
    alias: ['tt', 'ttdl', 'tiktokdl'],
    category: 'download',
    description: 'Download video TikTok tanpa watermark',
    usage: '.tiktok <url>',
    example: '.tiktok https://vt.tiktok.com/xxxxx',
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
        return m.reply('⚠️ Masukkan URL TikTok!\n\nContoh: .tiktok https://vt.tiktok.com/xxxxx');
    }

    if (!url.match(/tiktok\.com/i)) {
        return m.reply('❌ URL tidak valid! Pastikan URL dari TikTok.');
    }

    await m.react('⏳');

    try {
        // Try primary API
        let videoUrl = null;
        
        try {
            const res = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`, {
                timeout: 15000
            });
            if (res.data?.video?.noWatermark) {
                videoUrl = res.data.video.noWatermark;
            }
        } catch {
            // Try fallback API
            try {
                const res2 = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`, {
                    timeout: 15000
                });
                if (res2.data?.data?.play) {
                    videoUrl = res2.data.data.play;
                }
            } catch {
                // Silent
            }
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
            caption: `✅ *TikTok Download*\n\n📥 Berhasil diunduh tanpa watermark!`
        }, { quoted: m.message });

        await m.react('✅');

    } catch (error) {
        console.error('[TikTok]', error.message);
        await m.react('❌');
        await m.reply('❌ Gagal mendownload video TikTok. Coba lagi nanti.');
    }
}

module.exports = { config: pluginConfig, handler };
