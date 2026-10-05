/**
 * @file plugins/download/instagram.js
 * @description Download media dari Instagram (Reels, Post, Story)
 * @version 2.0.0 - Rewrite dengan API yang masih aktif
 */

const axios = require('axios');

const pluginConfig = {
    name: 'instagram',
    alias: ['ig', 'igdl', 'igdownload', 'reels'],
    category: 'download',
    description: 'Download media dari Instagram (Reels/Post/Story)',
    usage: '.ig <url>',
    example: '.ig https://www.instagram.com/reel/xxxxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
};

async function getInstagramMedia(url) {
    const apis = [
        // API 1: saveig.app
        async () => {
            const res = await axios.post('https://saveig.app/api/ajaxSearch',
                `q=${encodeURIComponent(url)}&t=media&lang=id`,
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }
            );
            const html = res.data?.data || '';
            const match = html.match(/href="(https:\/\/[^"]+\.mp4[^"]*?)"/);
            if (match) return { url: match[1], isVideo: true };
            const imgMatch = html.match(/href="(https:\/\/[^"]+\.jpg[^"]*?)"/);
            if (imgMatch) return { url: imgMatch[1], isVideo: false };
            throw new Error('No media found');
        },
        // API 2: getinsta.live
        async () => {
            const res = await axios.get(`https://getinsta.live/api?url=${encodeURIComponent(url)}`,
                { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }
            );
            const data = res.data;
            if (data?.url) return { url: data.url, isVideo: data.type === 'video' || url.includes('/reel/') };
            if (data?.video) return { url: data.video, isVideo: true };
            if (data?.image) return { url: data.image, isVideo: false };
            throw new Error('No media');
        },
        // API 3: igs.needflare.workers.dev
        async () => {
            const res = await axios.get(`https://igs.needflare.workers.dev/?url=${encodeURIComponent(url)}`,
                { timeout: 15000 }
            );
            const data = res.data;
            if (Array.isArray(data) && data[0]?.url) return { url: data[0].url, isVideo: data[0].type === 'video' };
            if (data?.url) return { url: data.url, isVideo: url.includes('/reel/') };
            throw new Error('No media');
        }
    ];

    for (const api of apis) {
        try {
            const result = await api();
            if (result?.url) return result;
        } catch { /* try next */ }
    }
    throw new Error('Semua API gagal');
}

async function handler(m, { sock }) {
    const url = m.text?.trim();

    if (!url) return m.reply('⚠️ Masukkan URL Instagram!\n\nContoh: .ig https://www.instagram.com/reel/xxxxx');
    if (!url.match(/instagram\.com/i)) return m.reply('❌ URL tidak valid! Pastikan URL dari Instagram.');

    await m.react('⏳');

    try {
        const media = await getInstagramMedia(url);

        const buf = await axios.get(media.url, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const content = media.isVideo
            ? { video: Buffer.from(buf.data), caption: '✅ *Instagram Download*\n\n📹 Video berhasil diunduh!' }
            : { image: Buffer.from(buf.data), caption: '✅ *Instagram Download*\n\n🖼️ Gambar berhasil diunduh!' };

        await sock.sendMessage(m.chat, content, { quoted: m.message });
        await m.react('✅');

    } catch (error) {
        console.error('[Instagram]', error.message);
        await m.react('❌');
        await m.reply('❌ Gagal download Instagram.\n\nPastikan URL valid dan konten tidak private.');
    }
}

module.exports = { config: pluginConfig, handler };
