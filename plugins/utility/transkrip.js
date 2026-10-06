/**
 * @file plugins/utility/transkrip.js
 * @description Transkripsi audio dari file, YouTube, TikTok, atau Instagram
 * @author Ourin-AI Team
 * @version 1.0.0
 */

const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { promisify } = require('util');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const PDFDocument = require('pdfkit');
const { getAIConfig } = require('../ai/_ai-utils');
const YTDLP = require('../../src/lib/yt-dlp');

const execFileAsync = promisify(execFile);
const MAX_AUDIO_SIZE = 25 * 1024 * 1024;
const MAX_LINK_DURATION = 10 * 60;
const TRANSCRIPTION_MODEL = 'whisper-large-v3-turbo';
const TRANSCRIPT_FONT = path.join(__dirname, '../../assets/fonts/Kalam-Regular.ttf');

const pluginConfig = {
    name: 'transkrip',
    alias: ['transcrypt', 'transcribe', 'transkripsi', 'transrypt'],
    category: 'utility',
    description: 'Ubah audio atau video YouTube, TikTok, dan Instagram menjadi transkrip PDF atau chat',
    usage: '.transkrip <link YouTube/TikTok/Instagram> [pdf|chat] atau reply/kirim audio [pdf|chat]',
    example: '.transkrip https://youtu.be/xxxxx chat',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
};

function parseSupportedUrl(value) {
    let url;
    try {
        url = new URL(value);
    } catch {
        return null;
    }

    if (url.protocol !== 'https:' || url.username || url.password) return null;

    const hostname = url.hostname.toLowerCase();
    const isYouTube = hostname === 'youtu.be' ||
        hostname === 'youtube.com' ||
        hostname.endsWith('.youtube.com');
    const isTikTok = hostname === 'tiktok.com' ||
        hostname.endsWith('.tiktok.com');
    const isInstagram = hostname === 'instagram.com' ||
        hostname.endsWith('.instagram.com');

    return isYouTube || isTikTok || isInstagram ? url.toString() : null;
}

async function runYtdlp(args) {
    const fullArgs = [];
    if (ffmpegInstaller.path) {
        fullArgs.push('--ffmpeg-location', ffmpegInstaller.path);
    }
    fullArgs.push(...args);

    const { stdout } = await execFileAsync(YTDLP, fullArgs, {
        timeout: 120000,
        maxBuffer: 20 * 1024 * 1024,
        windowsHide: true
    });
    return stdout.trim();
}

async function downloadLinkAudio(url, tempDir) {
    if (!fs.existsSync(YTDLP)) {
        throw new Error('yt-dlp belum terinstall. Hubungi owner bot.');
    }

    const infoOutput = await runYtdlp([
        '--dump-single-json',
        '--no-playlist',
        '--no-warnings',
        url
    ]);
    const info = JSON.parse(infoOutput);

    if (info.duration > MAX_LINK_DURATION) {
        throw new Error(`Durasi video maksimal 10 menit. Durasi tautan ini ${Math.ceil(info.duration / 60)} menit.`);
    }

    const outputTemplate = path.join(tempDir, 'audio.%(ext)s');
    await runYtdlp([
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '5',
        '--no-playlist',
        '--no-warnings',
        '-o', outputTemplate,
        url
    ]);

    const audioPath = path.join(tempDir, 'audio.mp3');
    if (!fs.existsSync(audioPath)) {
        throw new Error('File audio hasil unduhan tidak ditemukan.');
    }

    return {
        buffer: fs.readFileSync(audioPath),
        title: info.title || 'Audio',
        mimetype: 'audio/mpeg',
        filename: 'audio.mp3'
    };
}

async function transcribeAudio(buffer, mimetype = 'audio/mpeg', filename = 'audio.mp3') {
    const apiConfig = getAIConfig().groq;
    if (!apiConfig?.apiKey) {
        throw new Error('API key Groq belum dikonfigurasi. Isi GROQ_API_KEY atau config.ai.groqApiKey.');
    }
    if (buffer.length > MAX_AUDIO_SIZE) {
        throw new Error('Ukuran audio melebihi batas 25 MB untuk transkripsi.');
    }

    const form = new FormData();
    form.append('file', new Blob([buffer], { type: mimetype }), filename);
    form.append('model', TRANSCRIPTION_MODEL);
    form.append('response_format', 'json');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    try {
        const baseUrl = (apiConfig.baseUrl || 'https://api.groq.com/openai/v1').replace(/\/+$/, '');
        const response = await fetch(`${baseUrl}/audio/transcriptions`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiConfig.apiKey}` },
            body: form,
            signal: controller.signal
        });

        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch {
            throw new Error(`Respons transkripsi tidak valid (HTTP ${response.status}).`);
        }

        if (!response.ok) {
            throw new Error(result.error?.message || `Layanan transkripsi gagal (HTTP ${response.status}).`);
        }
        if (typeof result.text !== 'string' || !result.text.trim()) {
            throw new Error('Tidak ada ucapan yang terdeteksi di audio tersebut.');
        }

        return result.text.trim();
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Proses transkripsi melewati batas waktu. Coba lagi nanti.');
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

function createTranscriptPdf(transcript, title) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 56, bottom: 56, left: 58, right: 58 },
            info: {
                Title: title || 'Hasil Transkripsi',
                Author: 'Ourin-MD',
                Subject: 'Transkripsi audio'
            }
        });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.fillColor('#334155')
            .font('Helvetica')
            .fontSize(10)
            .text('OURIN-MD  /  TRANSKRIPSI AUDIO', { characterSpacing: 0.6 });
        doc.moveDown(0.8);
        doc.fillColor('#0f172a')
            .font('Helvetica-Bold')
            .fontSize(22)
            .text(title || 'Hasil Transkripsi', { lineGap: 3 });
        doc.moveDown(0.35);
        doc.fillColor('#64748b')
            .font('Helvetica')
            .fontSize(10)
            .text(`Dibuat ${new Date().toLocaleString('id-ID')}`);
        doc.moveDown(0.7);
        doc.strokeColor('#e2e8f0')
            .lineWidth(1)
            .moveTo(doc.page.margins.left, doc.y)
            .lineTo(doc.page.width - doc.page.margins.right, doc.y)
            .stroke();
        doc.moveDown(1);
        doc.fillColor('#1e293b')
            .font(fs.existsSync(TRANSCRIPT_FONT) ? TRANSCRIPT_FONT : 'Helvetica')
            .fontSize(11)
            .text(transcript, {
                align: 'left',
                lineGap: 5,
                paragraphGap: 8
            });
        doc.end();
    });
}

function getAudioMessage(m) {
    if (m.isAudio || (m.isDocument && m.mimetype?.startsWith('audio/'))) {
        return {
            message: m,
            download: () => m.download(),
            fileLength: m.fileLength,
            mimetype: m.mimetype
        };
    }

    const quoted = m.quoted;
    if (!quoted?.isMedia) return null;

    const mediaContent = quoted.message?.[quoted.type];
    const mimetype = mediaContent?.mimetype || '';
    if (quoted.isAudio || (quoted.isDocument && mimetype.startsWith('audio/'))) {
        return {
            message: quoted,
            download: () => quoted.download(),
            fileLength: mediaContent?.fileLength,
            mimetype
        };
    }

    return null;
}

async function handler(m) {
    const args = [...(m.args || [])];
    const formatArg = args.at(-1)?.toLowerCase();
    const outputFormat = ['pdf', 'chat'].includes(formatArg) ? args.pop().toLowerCase() : 'pdf';
    const input = args.join(' ').trim();
    const audioMessage = getAudioMessage(m);
    const url = input ? parseSupportedUrl(input) : null;

    if (input && !url) {
        return m.reply('❌ Link tidak valid. Gunakan link HTTPS dari YouTube, TikTok, atau Instagram, lalu pilih `pdf` atau `chat` (opsional).');
    }
    if (!url && !audioMessage) {
        return m.reply(
            `🎙️ *Transkripsi Audio*\n\n` +
            `• Kirim/reply file audio dengan caption *${m.prefix}transkrip [pdf|chat]*\n` +
            `• Atau kirim *${m.prefix}transkrip <link YouTube/TikTok/Instagram> [pdf|chat]*\n\n` +
            `Format default: PDF. Batas: audio maksimal 25 MB, video dari link maksimal 10 menit.`
        );
    }

    const config = getAIConfig().groq;
    if (!config?.apiKey) {
        return m.reply('❌ API key Groq belum dikonfigurasi. Hubungi owner bot.');
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ourin-transrypt-'));
    await m.react('⏳');

    try {
        let buffer;
        let title = '';
        let mimetype;
        let filename;
        if (url) {
            const downloaded = await downloadLinkAudio(url, tempDir);
            buffer = downloaded.buffer;
            title = downloaded.title;
            mimetype = downloaded.mimetype;
            filename = downloaded.filename;
        } else {
            const declaredSize = Number(audioMessage.fileLength) || 0;
            if (declaredSize > MAX_AUDIO_SIZE) {
                throw new Error('Ukuran audio melebihi batas 25 MB untuk transkripsi.');
            }
            buffer = await audioMessage.download();
            mimetype = (audioMessage.mimetype || 'audio/ogg').split(';')[0].trim();
            const extensions = {
                'audio/aac': 'aac',
                'audio/flac': 'flac',
                'audio/mp3': 'mp3',
                'audio/mpeg': 'mp3',
                'audio/mp4': 'm4a',
                'audio/ogg': 'ogg',
                'audio/opus': 'ogg',
                'audio/wav': 'wav',
                'audio/webm': 'webm',
                'audio/x-m4a': 'm4a',
                'audio/x-wav': 'wav'
            };
            filename = `audio.${extensions[mimetype] || 'ogg'}`;
        }

        if (!buffer?.length) {
            throw new Error('Audio tidak berhasil diunduh atau file kosong.');
        }

        const transcript = await transcribeAudio(buffer, mimetype, filename);
        const pdfTitle = title || 'Hasil Transkripsi';
        if (outputFormat === 'chat') {
            const maxChunkLength = 3500;
            const chunks = [];
            let remaining = transcript;
            while (remaining.length > maxChunkLength) {
                let splitAt = remaining.lastIndexOf('\n', maxChunkLength);
                if (splitAt < maxChunkLength / 2) {
                    splitAt = remaining.lastIndexOf(' ', maxChunkLength);
                }
                if (splitAt < maxChunkLength / 2) splitAt = maxChunkLength;
                else splitAt += 1;
                chunks.push(remaining.slice(0, splitAt));
                remaining = remaining.slice(splitAt);
            }
            chunks.push(remaining);

            for (let i = 0; i < chunks.length; i += 1) {
                const part = chunks.length > 1 ? ` (${i + 1}/${chunks.length})` : '';
                const heading = `📝 Transkripsi${title ? `: ${title}` : ''}${part}\n\n`;
                await m.reply(`${heading}${chunks[i]}`);
            }
        } else {
            const pdfBuffer = await createTranscriptPdf(transcript, pdfTitle);
            const safeTitle = pdfTitle
                .normalize('NFKD')
                .replace(/[^\w -]/g, '')
                .trim()
                .replace(/\s+/g, '_')
                .slice(0, 80) || 'transkrip';
            await m.replyDocument(
                pdfBuffer,
                `${safeTitle}_transkrip.pdf`,
                'application/pdf',
                { caption: `📝 Transkripsi selesai${title ? `: ${title}` : ''}` }
            );
        }
        await m.react('✅');
    } catch (error) {
        console.error('[Transkrip Plugin Error]:', error);
        await m.react('❌');
        await m.reply(`❌ Gagal mentranskripsi audio:\n_${error.message || 'Error tidak diketahui'}_`);
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    parseSupportedUrl,
    createTranscriptPdf
};
