/**
 * @file plugins/utility/resolution.js
 * @description Meningkatkan resolusi (upscale) foto dengan batas maksimal hasil 10MB
 * @author Ourin-AI Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { formatFileSize } = require('../../src/lib/formatter');

const MAX_RESULT_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_INPUT_SIZE = 10 * 1024 * 1024;  // Input juga dibatasi 10 MB

/**
 * Konfigurasi plugin resolution
 * @type {import('../../src/lib/plugins').PluginConfig}
 */
const pluginConfig = {
    name: 'resolution',
    alias: ['res', 'hd', 'upscale', 'enhance', 'enhancephoto'],
    category: 'utility',
    description: 'Tingkatkan resolusi foto (upscale 2x/3x/4x) dengan batas hasil 10MB',
    usage: '.resolution [2|3|4] (reply gambar atau kirim gambar dengan caption)',
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
    // Deteksi apakah ada gambar (pesan langsung maupun quoted)
    const isImage = m.isImage || (m.quoted && m.quoted.isImage) ||
                    (m.quoted?.isDocument && m.quoted?.mimetype?.startsWith('image/')) ||
                    (m.isDocument && m.mimetype?.startsWith('image/'));

    if (!isImage) {
        let helpText = `🔍 *Image Resolution Enhancer*\n\n`;
        helpText += `Meningkatkan resolusi foto secara otomatis menggunakan algoritma *Lanczos3 + Unsharp Masking*.\n\n`;
        helpText += `📌 *Cara Penggunaan:*\n`;
        helpText += `• \`${m.prefix}resolution 2\` → Upscale 2x (default)\n`;
        helpText += `• \`${m.prefix}resolution 3\` → Upscale 3x\n`;
        helpText += `• \`${m.prefix}resolution 4\` → Upscale 4x\n\n`;
        helpText += `💡 *Tips:*\n`;
        helpText += `Kirim gambar + caption *${m.prefix}resolution [skala]*, atau\n`;
        helpText += `balas (reply) gambar dengan *${m.prefix}resolution [skala]*\n\n`;
        helpText += `⚠️ *Ketentuan:*\n`;
        helpText += `• Hanya mendukung *foto/gambar* (bukan video)\n`;
        helpText += `• Input maks: *10 MB*\n`;
        helpText += `• Hasil maks: *10 MB* (disesuaikan otomatis jika melebihi)\n`;
        helpText += `• Rekomendasi: gunakan *2x* untuk hasil terbaik`;
        return m.reply(helpText);
    }

    // Parse argumen scale (default: 2)
    const rawScale = parseInt(m.args[0]) || 2;
    const scale = Math.min(Math.max(rawScale, 2), 4); // Klem di antara 2-4

    // Pra-cek ukuran input
    const estimatedSize = m.quoted?.fileLength || m.fileLength;
    if (estimatedSize && estimatedSize > MAX_INPUT_SIZE) {
        return m.reply(`❌ Ukuran gambar terlalu besar (*${formatFileSize(estimatedSize)}*)!\nBatas input maksimal adalah *10 MB*.`);
    }

    await m.react('⏳');

    try {
        // Unduh buffer
        let buffer = null;
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download();
        } else if (m.isMedia) {
            buffer = await m.download();
        }

        if (!buffer || buffer.length === 0) {
            await m.react('❌');
            return m.reply('❌ Gagal mengunduh gambar. Silakan coba lagi.');
        }

        if (buffer.length > MAX_INPUT_SIZE) {
            await m.react('❌');
            return m.reply(`❌ Ukuran gambar terlalu besar (*${formatFileSize(buffer.length)}*)!\nBatas input maksimal adalah *10 MB*.`);
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
        await m.reply(`❌ Terjadi kesalahan saat memproses gambar:\n_${error.message || 'Error tidak diketahui'}_`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
