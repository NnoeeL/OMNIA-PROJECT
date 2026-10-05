/**
 * @file plugins/utility/voiceai.js
 * @description Mengubah teks menjadi audio dengan pilihan gaya suara
 */

const axios = require('axios');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { promisify } = require('util');
const { execFile } = require('child_process');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

const execFileAsync = promisify(execFile);
const MAX_TEXT_LENGTH = 1200;
const MAX_CHUNK_LENGTH = 180;

const VOICES = {
    '1': { name: 'Google wanita', filter: 'anull' },
    '2': { name: 'Google pria', filter: 'asetrate=44100*0.84,aresample=44100,atempo=1.1905' },
    '3': {
        name: 'Anime boy — serak dan berat',
        filter: 'asetrate=44100*0.72,aresample=44100,atempo=1.3889,equalizer=f=140:t=q:w=1:g=7,equalizer=f=2200:t=q:w=1:g=-4,acompressor=threshold=0.18:ratio=4:attack=18:release=180,acrusher=bits=12:mix=0.22,tremolo=f=4:d=0.12,aecho=0.8:0.6:55:0.12,volume=2,alimiter=limit=0.9'
    },
    '4': {
        name: 'Anime girl — lembut dan merdu',
        filter: 'asetrate=44100*1.04,aresample=44100,atempo=0.9615,equalizer=f=280:t=q:w=1:g=1,equalizer=f=3200:t=q:w=1:g=2,equalizer=f=7000:t=q:w=1:g=-2,acompressor=threshold=0.18:ratio=2:attack=25:release=220,aecho=0.8:0.45:75:0.12,volume=2,alimiter=limit=0.9'
    },
    '5': { name: 'Robot', filter: 'asetrate=44100*0.82,aresample=44100,atempo=1.2195,tremolo=f=28:d=0.75,aecho=0.8:0.7:35:0.25' }
};

const pluginConfig = {
    name: 'voiceai',
    alias: ['voice', 'tts'],
    category: 'utility',
    description: 'Ubah teks menjadi suara dengan 5 pilihan gaya',
    usage: '.voiceai <kode 1-5> <teks>',
    example: '.voiceai 3 Halo, apa kabar?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 8,
    limit: 1,
    isEnabled: true
};

function splitText(text, maxLength = MAX_CHUNK_LENGTH) {
    const words = text.trim().split(/\s+/);
    const chunks = [];
    let current = '';

    for (const word of words) {
        if (word.length > maxLength) {
            if (current) {
                chunks.push(current);
                current = '';
            }
            let remaining = word;
            while (remaining.length > maxLength) {
                chunks.push(remaining.slice(0, maxLength));
                remaining = remaining.slice(maxLength);
            }
            current = remaining;
            continue;
        }

        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length <= maxLength) {
            current = candidate;
        } else {
            chunks.push(current);
            current = word;
        }
    }

    if (current) chunks.push(current);
    return chunks;
}

async function synthesizeChunk(text) {
    const response = await axios.get('https://translate.google.com/translate_tts', {
        params: {
            ie: 'UTF-8',
            client: 'tw-ob',
            tl: 'id',
            q: text
        },
        headers: { 'User-Agent': 'Mozilla/5.0' },
        responseType: 'arraybuffer',
        timeout: 20000
    });

    const contentType = response.headers['content-type'] || '';
    const audio = Buffer.from(response.data);
    if (!contentType.includes('audio') || audio.length < 100) {
        throw new Error('Layanan suara tidak mengembalikan audio yang valid.');
    }
    return audio;
}

async function renderVoice(chunks, voice, tempDir) {
    if (!ffmpegInstaller.path || !fs.existsSync(ffmpegInstaller.path)) {
        throw new Error('FFmpeg tidak ditemukan. Pastikan dependency @ffmpeg-installer/ffmpeg terpasang.');
    }

    const inputPaths = [];
    for (let index = 0; index < chunks.length; index++) {
        const inputPath = path.join(tempDir, `part-${index}.mp3`);
        fs.writeFileSync(inputPath, chunks[index]);
        inputPaths.push(inputPath);
    }

    const outputPath = path.join(tempDir, 'voice.ogg');
    const filterInputs = inputPaths.map((_, index) => `[${index}:a]`).join('');
    const filter = `${filterInputs}concat=n=${inputPaths.length}:v=0:a=1,${voice.filter},atempo=0.85[voice]`;
    const args = [];

    for (const inputPath of inputPaths) {
        args.push('-i', inputPath);
    }
    args.push(
        '-filter_complex', filter,
        '-map', '[voice]',
        '-ac', '1',
        '-ar', '48000',
        '-c:a', 'libopus',
        '-b:a', '48k',
        '-vbr', 'on',
        '-application', 'voip',
        '-y', outputPath
    );

    await execFileAsync(ffmpegInstaller.path, args, {
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
        windowsHide: true
    });

    if (!fs.existsSync(outputPath)) {
        throw new Error('FFmpeg tidak menghasilkan file audio.');
    }
    return fs.readFileSync(outputPath);
}

async function createVoice(text, voiceCode) {
    const voice = VOICES[voiceCode];
    if (!voice) throw new Error('Kode suara harus berupa angka 1 sampai 5.');

    const normalizedText = text.trim();
    if (!normalizedText) throw new Error('Teks tidak boleh kosong.');
    if (normalizedText.length > MAX_TEXT_LENGTH) {
        throw new Error(`Teks maksimal ${MAX_TEXT_LENGTH} karakter.`);
    }

    const textChunks = splitText(normalizedText);
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omnia-voiceai-'));
    try {
        const audioChunks = [];
        for (let index = 0; index < textChunks.length; index += 3) {
            const batch = textChunks.slice(index, index + 3);
            audioChunks.push(...await Promise.all(batch.map(synthesizeChunk)));
        }
        return await renderVoice(audioChunks, voice, tempDir);
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}

async function handler(m, { sock }) {
    const input = (m.fullArgs || '').trim();
    const match = input.match(/^([1-5])(?:\s+([\s\S]+))?$/);

    if (!match) {
        return m.reply(
            `🎙️ *OMNIA Voice AI*\n\n` +
            `Pilih suara dan tulis teks:\n` +
            `1️⃣ Google wanita\n` +
            `2️⃣ Google pria\n` +
            `3️⃣ Anime boy — serak dan berat\n` +
            `4️⃣ Anime girl — lembut dan merdu\n` +
            `5️⃣ Robot\n\n` +
            `Contoh: *.voiceai 3 Halo, apa kabar?*\n` +
            `Maksimal ${MAX_TEXT_LENGTH} karakter.`
        );
    }

    const voiceCode = match[1];
    const text = match[2]?.trim();
    if (!text) {
        return m.reply(`❌ Teks belum diisi.\nContoh: *${m.prefix}voiceai ${voiceCode} Halo, apa kabar?*`);
    }
    if (text.length > MAX_TEXT_LENGTH) {
        return m.reply(`❌ Teks maksimal ${MAX_TEXT_LENGTH} karakter.`);
    }

    await m.react('⏳');
    try {
        const audio = await createVoice(text, voiceCode);
        await sock.sendMessage(m.chat, {
            audio,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        }, { quoted: m.message });
        await m.react('✅');
    } catch (error) {
        console.error('[VoiceAI Plugin Error]:', error);
        await m.react('❌');
        await m.reply(`❌ Gagal membuat suara:\n_${error.message || 'Error tidak diketahui'}_`);
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    splitText,
    createVoice
};
