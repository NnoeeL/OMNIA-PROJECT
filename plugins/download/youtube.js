/**
 * @file plugins/download/youtube.js
 * @description Download video dari YouTube menggunakan yt-dlp
 * @version 4.0.0
 */

const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const YTDLP = require('../../src/lib/yt-dlp');

const FFMPEG_PATH = ffmpegInstaller.path;

const pluginConfig = {
    name: 'youtube',
    alias: ['yt', 'ytdl', 'ytdownload'],
    category: 'download',
    description: 'Download video dari YouTube',
    usage: '.yt <url>',
    example: '.yt https://youtu.be/xxxxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 20,
    limit: 1,
    isEnabled: true
};

function runYtdlp(args) {
    return new Promise((resolve, reject) => {
        const fullArgs = [];
        if (FFMPEG_PATH) {
            fullArgs.push('--ffmpeg-location', FFMPEG_PATH);
        }
        fullArgs.push(...args);
        execFile(YTDLP, fullArgs, { timeout: 120000, maxBuffer: 100 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) reject(new Error(stderr || err.message));
            else resolve(stdout.trim());
        });
    });
}

async function handler(m, { sock }) {
    const url = m.text?.trim();
    if (!url) return m.reply('⚠️ Masukkan URL YouTube!\n\nContoh: .yt https://youtu.be/xxxxx');
    if (!url.match(/youtu(\.be|be\.com)/i)) return m.reply('❌ URL tidak valid! Pastikan URL dari YouTube.');

    if (!fs.existsSync(YTDLP)) {
        return m.reply('❌ yt-dlp belum terinstall. Hubungi owner bot.');
    }

    await m.react('⏳');

    let info;
    try {
        const json = await runYtdlp(['--dump-json', '--no-playlist', url]);
        info = JSON.parse(json);
    } catch (e) {
        await m.react('❌');
        return m.reply('❌ Gagal mengambil info video. Pastikan URL valid dan video tidak private.');
    }

    const title = info.title || 'video';
    const duration = info.duration || 0;

    if (duration > 300) {
        await m.react('❌');
        return m.reply(`❌ Video terlalu panjang (${Math.round(duration/60)} menit). Maksimal 5 menit.\n\n💡 Gunakan .ytmp3 untuk audio hingga 10 menit.`);
    }

    await m.reply(`⏳ _Mengunduh video: *${title}*..._`);

    const tmpFile = path.join(os.tmpdir(), `ytvideo_${Date.now()}.mp4`);

    try {
        await runYtdlp([
            '-f', 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best[height<=720]',
            '--merge-output-format', 'mp4',
            '--no-playlist',
            '-o', tmpFile,
            url
        ]);

        if (!fs.existsSync(tmpFile)) throw new Error('File output tidak ditemukan');

        const videoBuffer = fs.readFileSync(tmpFile);

        if (videoBuffer.length > 64 * 1024 * 1024) {
            await m.react('❌');
            return m.reply('❌ Video terlalu besar (>64MB). Coba video lebih pendek.');
        }

        await sock.sendMessage(m.chat, {
            video: videoBuffer,
            caption: `✅ *YouTube Download*\n\n📹 *${title}*\n📥 Berhasil diunduh!`
        }, { quoted: m.message });

        await m.react('✅');

    } catch (error) {
        console.error('[YouTube]', error.message);
        await m.react('❌');
        await m.reply('❌ Gagal download video.\n\n💡 Pastikan video tidak private atau age-restricted.');
    } finally {
        try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch {}
    }
}

module.exports = { config: pluginConfig, handler };
