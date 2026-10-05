/**
 * @file plugins/download/ytmp3.js
 * @description Download audio MP3 dari YouTube menggunakan yt-dlp
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
    name: 'ytmp3',
    alias: ['ytaudio', 'yta', 'mp3'],
    category: 'download',
    description: 'Download audio MP3 dari YouTube',
    usage: '.ytmp3 <url>',
    example: '.ytmp3 https://youtu.be/xxxxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
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
    if (!url) return m.reply('⚠️ Masukkan URL YouTube!\n\nContoh: .ytmp3 https://youtu.be/xxxxx');
    if (!url.match(/youtu(\.be|be\.com)/i)) return m.reply('❌ URL tidak valid! Pastikan URL dari YouTube.');

    if (!fs.existsSync(YTDLP)) {
        return m.reply('❌ yt-dlp belum terinstall. Hubungi owner bot.');
    }

    await m.react('⏳');

    // Ambil info dulu
    let info;
    try {
        const json = await runYtdlp(['--dump-json', '--no-playlist', url]);
        info = JSON.parse(json);
    } catch (e) {
        await m.react('❌');
        return m.reply('❌ Gagal mengambil info video. Pastikan URL valid dan video tidak private.');
    }

    const title = info.title || 'audio';
    const duration = info.duration || 0;

    if (duration > 600) {
        await m.react('❌');
        return m.reply(`❌ Video terlalu panjang (${Math.round(duration/60)} menit). Maksimal 10 menit.`);
    }

    await m.reply(`⏳ _Mengunduh audio: *${title}*..._`);

    const tmpFile = path.join(os.tmpdir(), `ytmp3_${Date.now()}.mp3`);

    try {
        await runYtdlp([
            '-x', '--audio-format', 'mp3',
            '--audio-quality', '0',
            '--no-playlist',
            '-o', tmpFile,
            url
        ]);

        if (!fs.existsSync(tmpFile)) {
            // yt-dlp mungkin tambah ekstensi
            const altFile = tmpFile.replace('.mp3', '') + '.mp3';
            if (!fs.existsSync(altFile)) throw new Error('File output tidak ditemukan');
        }

        const audioBuffer = fs.readFileSync(tmpFile);

        if (audioBuffer.length > 64 * 1024 * 1024) {
            await m.react('❌');
            return m.reply('❌ File terlalu besar (>64MB).');
        }

        await sock.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: false,
            fileName: `${title}.mp3`
        }, { quoted: m.message });

        await m.react('✅');

    } catch (error) {
        console.error('[YTmp3]', error.message);
        await m.react('❌');
        await m.reply('❌ Gagal download audio.\n\n💡 Pastikan video tidak private atau age-restricted.');
    } finally {
        try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch {}
    }
}

module.exports = { config: pluginConfig, handler };
