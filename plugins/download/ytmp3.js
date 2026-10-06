/**
 * @file plugins/download/ytmp3.js
 * @description Download audio MP3 dari YouTube menggunakan yt-dlp
 * @version 4.0.0
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const YTDLP = require('../../src/lib/yt-dlp');
const runYtdlpCommand = require('../../src/lib/yt-dlp-runner');
const { getYtdlpAuthErrorMessage } = runYtdlpCommand;

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
    return runYtdlpCommand(args, {
        ffmpegPath: FFMPEG_PATH,
        maxBuffer: 100 * 1024 * 1024
    });
}

async function handler(m, { sock }) {
    const input = m.text?.trim();
    if (!input) return m.reply('⚠️ Masukkan URL YouTube!\n\nContoh: .ytmp3 https://youtu.be/xxxxx');

    let url;
    try {
        const parsedUrl = new URL(input);
        const hostname = parsedUrl.hostname.toLowerCase();
        if (!['http:', 'https:'].includes(parsedUrl.protocol) ||
            !(hostname === 'youtu.be' || hostname === 'youtube.com' || hostname.endsWith('.youtube.com'))) {
            throw new Error('invalid URL');
        }
        url = parsedUrl.toString();
    } catch {
        return m.reply('❌ URL tidak valid! Masukkan link dari YouTube.');
    }

    if (!fs.existsSync(YTDLP)) {
        return m.reply('❌ yt-dlp belum terinstall. Hubungi owner bot.');
    }

    await m.react('⏳');

    // Ambil info dulu
    let info;
    try {
        const json = await runYtdlp(['--dump-json', '--no-playlist', url]);
        info = JSON.parse(json);
    } catch (error) {
        console.error('[YTmp3] Gagal mengambil info video:', error.message);
        await m.react('❌');
        return m.reply(getYtdlpAuthErrorMessage(error) || '❌ Gagal mengambil info video. Pastikan URL valid dan video tidak private.');
    }

    const title = info.title || 'audio';
    const duration = info.duration || 0;

    if (duration > 600) {
        await m.react('❌');
        return m.reply(`❌ Video terlalu panjang (${Math.round(duration/60)} menit). Maksimal 10 menit.`);
    }

    await m.reply(`⏳ _Mengunduh audio: *${title}*..._`);

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ourin-ytmp3-'));
    const outputTemplate = path.join(tempDir, 'audio.%(ext)s');
    const outputFile = path.join(tempDir, 'audio.mp3');

    try {
        await runYtdlp([
            '-x', '--audio-format', 'mp3',
            '--audio-quality', '0',
            '--no-playlist',
            '-o', outputTemplate,
            url
        ]);

        if (!fs.existsSync(outputFile)) throw new Error('File output tidak ditemukan');

        const audioBuffer = fs.readFileSync(outputFile);

        if (audioBuffer.length > 64 * 1024 * 1024) {
            await m.react('❌');
            return m.reply('❌ File terlalu besar (>64MB).');
        }

        await sock.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: false,
            fileName: `${title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').slice(0, 120) || 'audio'}.mp3`
        }, { quoted: m.message });

        await m.react('✅');

    } catch (error) {
        console.error('[YTmp3]', error.message);
        await m.react('❌');
        await m.reply(getYtdlpAuthErrorMessage(error) || '❌ Gagal download audio.\n\n💡 Pastikan video tidak private atau age-restricted.');
    } finally {
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (error) {
            console.error('[YTmp3] Gagal menghapus direktori sementara:', error.message);
        }
    }
}

module.exports = { config: pluginConfig, handler };
