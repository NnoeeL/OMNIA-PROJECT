/**
 * @file plugins/utility/resolution.js
 * @description Meningkatkan resolusi foto atau video
 * @author Ourin-AI Team
 * @version 1.0.0
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const sharp = require('sharp');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const { formatFileSize } = require('../../src/lib/formatter');

const MAX_RESULT_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_INPUT_SIZE = 10 * 1024 * 1024;  // Input juga dibatasi 10 MB
const MAX_VIDEO_SIZE = 64 * 1024 * 1024;
const execFileAsync = promisify(execFile);

/**
 * Konfigurasi plugin resolution
 * @type {import('../../src/lib/plugins').PluginConfig}
 */
const pluginConfig = {
    name: 'resolution',
    alias: ['res', 'hd', 'upscale', 'enhance', 'enhancephoto'],
    category: 'utility',
    description: 'Tingkatkan resolusi foto atau video (upscale 2x/3x/4x)',
    usage: '.resolution [2|3|4] (reply foto/video atau kirim dengan caption)',
    example: '.resolution 2',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
};

/**
 * Tingkatkan resolusi gambar menggunakan sharp dengan Lanczos3 + sharpening
 * @param {Buffer} buffer - Buffer gambar asli
 * @param {number} scale - Skala perbesaran (2, 3, atau 4)
 * @returns {Promise<{ buffer: Buffer, origWidth: number, origHeight: number, newWidth: number, newHeight: number, scale: number, format: string, warning?: string }>}
 */
async function upscaleImage(buffer, scale) {
    const metadata = await sharp(buffer).metadata();
    const origWidth = metadata.width;
    const origHeight = metadata.height;
    const origFormat = (metadata.format || 'jpeg').toLowerCase();
    const hasAlpha = metadata.hasAlpha || false;

    let targetWidth = 0;
    let targetHeight = 0;
    let actualScale = scale;
    let resultBuffer = null;
    let outputFormat = origFormat;
    let warning = null;

    for (let candidateScale = scale; candidateScale >= 2 && !resultBuffer; candidateScale--) {
        const candidateWidth = Math.round(origWidth * candidateScale);
        const candidateHeight = Math.round(origHeight * candidateScale);
        const createPipeline = () => sharp(buffer)
            .resize(candidateWidth, candidateHeight, {
                kernel: sharp.kernel.lanczos3,
                fit: 'fill'
            })
            .sharpen({ sigma: 1.5, m1: 1.5, m2: 0.7 })
            .modulate({ brightness: 1.01, saturation: 1.04 });

        let candidate;
        let candidateFormat;

        if (hasAlpha || origFormat === 'png') {
            candidate = await createPipeline().png({ compressionLevel: 8 }).toBuffer();
            candidateFormat = 'png';
        } else if (origFormat === 'webp') {
            candidate = await createPipeline().webp({ quality: 90 }).toBuffer();
            candidateFormat = 'webp';
        } else {
            candidate = await createPipeline().jpeg({ quality: 92, mozjpeg: true }).toBuffer();
            candidateFormat = 'jpeg';
        }

        if (candidate.length <= MAX_RESULT_SIZE) {
            resultBuffer = candidate;
            outputFormat = candidateFormat;
        } else {
            const fallbackFormat = hasAlpha || origFormat === 'webp' ? 'webp' : 'jpeg';

            for (const quality of [82, 72, 62, 52, 42, 32]) {
                const fallbackPipeline = createPipeline();
                const fallback = fallbackFormat === 'webp'
                    ? await fallbackPipeline.webp({ quality, effort: 6 }).toBuffer()
                    : await fallbackPipeline.jpeg({ quality, mozjpeg: true }).toBuffer();

                if (fallback.length <= MAX_RESULT_SIZE) {
                    resultBuffer = fallback;
                    outputFormat = fallbackFormat;
                    break;
                }
            }
        }

        if (resultBuffer) {
            targetWidth = candidateWidth;
            targetHeight = candidateHeight;
            actualScale = candidateScale;
            if (candidateScale < scale) {
                warning = `Skala diturunkan dari ${scale}x menjadi ${candidateScale}x agar ukuran hasil tidak melebihi 10 MB.`;
            } else if (candidate.length > MAX_RESULT_SIZE) {
                warning = 'Kualitas gambar disesuaikan otomatis agar ukuran hasil tidak melebihi 10 MB.';
            }
        }
    }

    if (!resultBuffer || resultBuffer.length > MAX_RESULT_SIZE) {
        throw new Error('Gambar tidak dapat di-upscale menjadi file di bawah 10 MB. Coba gambar lain atau skala yang lebih kecil.');
    }

    const metaAfter = await sharp(resultBuffer).metadata();

    return {
        buffer: resultBuffer,
        origWidth,
        origHeight,
        newWidth: metaAfter.width || targetWidth,
        newHeight: metaAfter.height || targetHeight,
        scale: actualScale,
        format: outputFormat,
        warning
    };
}

/**
 * Handler command resolution
 * @param {Object} m - Serialized message
 * @param {Object} context - Handler context
 */
async function handler(m, { sock }) {
    const media = m.quoted?.isMedia ? m.quoted : m.isMedia ? m : null;
    const isImage = m.isImage || (m.quoted && m.quoted.isImage) ||
                    (m.quoted?.isDocument && m.quoted?.mimetype?.startsWith('image/')) ||
                    (m.isDocument && m.mimetype?.startsWith('image/'));
    const isVideo = m.isVideo || m.quoted?.isVideo ||
                    m.quoted?.mimetype?.startsWith('video/') ||
                    m.mimetype?.startsWith('video/');

    if (!isImage && !isVideo) {
        let helpText = `🔍 *Media Resolution Enhancer*\n\n`;
        helpText += `Meningkatkan resolusi foto dengan *Lanczos3* atau video dengan FFmpeg.\n\n`;
        helpText += `📌 *Cara Penggunaan:*\n`;
        helpText += `• Kirim atau reply foto/video dengan *${m.prefix}resolution [2|3|4]*\n\n`;
        helpText += `⚠️ *Ketentuan:*\n`;
        helpText += `• Foto: input dan hasil maksimal *10 MB*\n`;
        helpText += `• Video: input dan hasil maksimal *64 MB*\n`;
        helpText += `• Rekomendasi: gunakan *2x* untuk hasil terbaik`;
        return m.reply(helpText);
    }

    // Parse argumen scale (default: 2)
    const rawScale = parseInt(m.args[0]) || 2;
    const scale = Math.min(Math.max(rawScale, 2), 4); // Klem di antara 2-4

    // Pra-cek ukuran input
    const inputLimit = isVideo ? MAX_VIDEO_SIZE : MAX_INPUT_SIZE;
    const estimatedSize = media?.fileLength || m.quoted?.fileLength || m.fileLength;
    if (estimatedSize && estimatedSize > inputLimit) {
        return m.reply(`❌ Ukuran ${isVideo ? 'video' : 'gambar'} terlalu besar (*${formatFileSize(estimatedSize)}*)!\nBatas input maksimal adalah *${formatFileSize(inputLimit)}*.`);
    }

    await m.react('⏳');

    try {
        // Unduh buffer
        const buffer = media ? await media.download() : null;

        if (!buffer || buffer.length === 0) {
            await m.react('❌');
            return m.reply(`❌ Gagal mengunduh ${isVideo ? 'video' : 'gambar'}. Silakan coba lagi.`);
        }

        if (buffer.length > inputLimit) {
            await m.react('❌');
            return m.reply(`❌ Ukuran ${isVideo ? 'video' : 'gambar'} terlalu besar (*${formatFileSize(buffer.length)}*)!\nBatas input maksimal adalah *${formatFileSize(inputLimit)}*.`);
        }

        if (isVideo) {
            if (!ffmpegInstaller.path || !fs.existsSync(ffmpegInstaller.path)) {
                throw new Error('FFmpeg tidak tersedia di server; video tidak dapat diproses.');
            }

            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ourin-resolution-'));
            const inputPath = path.join(tempDir, 'input-video');
            const outputPath = path.join(tempDir, 'upscaled.mp4');
            try {
                fs.writeFileSync(inputPath, buffer);
                await execFileAsync(ffmpegInstaller.path, [
                    '-y',
                    '-i', inputPath,
                    '-vf', `scale=trunc(iw*${scale}/2)*2:trunc(ih*${scale}/2)*2:flags=lanczos`,
                    '-c:v', 'libx264',
                    '-preset', 'veryfast',
                    '-crf', '24',
                    '-c:a', 'aac',
                    '-b:a', '128k',
                    '-movflags', '+faststart',
                    outputPath
                ], { timeout: 180000, maxBuffer: 10 * 1024 * 1024, windowsHide: true });

                const output = fs.readFileSync(outputPath);
                if (output.length > MAX_VIDEO_SIZE) {
                    throw new Error('Ukuran video hasil melebihi 64 MB. Coba skala lebih kecil atau video yang lebih pendek.');
                }

                await m.replyVideo(output, `🎬 *Upscale Video Berhasil!*\n\n📐 Skala: *${scale}x*\n📦 Ukuran hasil: *${formatFileSize(output.length)}*`);
                await m.react('✅');
            } finally {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
            return;
        }

        // Cek resolusi asli — jika sudah sangat besar, larang scale 4x
        const meta = await sharp(buffer).metadata();
        const origPixels = (meta.width || 0) * (meta.height || 0);

        if (origPixels >= 2073600 && scale >= 4) { // >= 1920x1080 = 2,073,600 px
            await m.react('⚠️');
            return m.reply(`⚠️ Resolusi asli sudah cukup besar (*${meta.width}×${meta.height}*).\nCoba gunakan *${m.prefix}resolution 2* atau *${m.prefix}resolution 3* agar hasil tetap di bawah 10MB.`);
        }

        const inputSize = buffer.length;

        await m.react('🔍');

        const result = await upscaleImage(buffer, scale);

        let caption = `🔍 *Upscale Resolusi Berhasil!*\n\n`;
        caption += `📊 *Detail Peningkatan:*\n`;
        caption += `│ ◦ *Resolusi Asli:* ${result.origWidth} × ${result.origHeight} px\n`;
        caption += `│ ◦ *Resolusi Baru:* ${result.newWidth} × ${result.newHeight} px\n`;
        caption += `│ ◦ *Skala:* ${result.scale}x\n`;
        caption += `│ ◦ *Format:* ${result.format.toUpperCase()}\n`;
        caption += `│ ◦ *Ukuran Input:* ${formatFileSize(inputSize)}\n`;
        caption += `│ ◦ *Ukuran Hasil:* ${formatFileSize(result.buffer.length)}\n`;
        caption += `└──────────────────`;

        if (result.warning) {
            caption += `\n\n⚠️ _${result.warning}_`;
        }

        await m.replyImage(result.buffer, caption);
        await m.react('✅');

    } catch (error) {
        console.error('[Resolution Plugin Error]:', error);
        await m.react('❌');
        await m.reply(`❌ Terjadi kesalahan saat memproses ${isVideo ? 'video' : 'gambar'}:\n_${error.message || 'Error tidak diketahui'}_`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
