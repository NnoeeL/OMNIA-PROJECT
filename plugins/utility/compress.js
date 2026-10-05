/**
 * @file plugins/utility/compress.js
 * @description Kompres ukuran gambar atau video tanpa mengubah resolusi (Maksimal 10MB)
 * @author Ourin-AI Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const sharp = require('sharp');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');
const { formatFileSize } = require('../../src/lib/formatter');

// Inisialisasi path FFmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB dalam bytes

/**
 * Konfigurasi plugin compress
 * @type {import('../../src/lib/plugins').PluginConfig}
 */
const pluginConfig = {
    name: 'compress',
    alias: ['kompres', 'comp', 'compressmedia'],
    category: 'utility',
    description: 'Kompres ukuran gambar/video tanpa menurunkan resolusi (Maks 10MB)',
    usage: '.compress (reply gambar/video atau kirim media dengan caption .compress)',
    example: '.compress',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 1,
    isEnabled: true
};

/**
 * Dapatkan direktori temp untuk operasi file
 * @returns {string} Path direktori temp
 */
function getTempDir() {
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }
    return tmpDir;
}

/**
 * Ekstrak resolusi video dari metadata ffmpeg
 * @param {string} filePath - Path file video
 * @returns {string} String resolusi (misal: "1280 × 720")
 */
function getVideoResolution(filePath) {
    try {
        const probe = spawnSync(ffmpegInstaller.path, ['-i', filePath]);
        const stderr = probe.stderr ? probe.stderr.toString() : '';
        const match = stderr.match(/Stream.*Video:.*,\s*(\d{2,5})x(\d{2,5})/);
        if (match) {
            return `${match[1]} × ${match[2]}`;
        }
    } catch {
        // Fallback jika gagal probe
    }
    return 'Resolusi Asli (Tetap)';
}

/**
 * Kompres gambar tanpa mengubah resolusi
 * @param {Buffer} buffer - Buffer gambar asli
 * @returns {Promise<{ buffer: Buffer, width: number, height: number, format: string }>}
 */
async function compressImage(buffer) {
    const metadata = await sharp(buffer).metadata();
    const origWidth = metadata.width;
    const origHeight = metadata.height;
    const origFormat = (metadata.format || '').toLowerCase();

    let compressed;

    if (origFormat === 'png') {
        // Coba kompresi PNG dengan quantize palette dan kompresi level 9
        if (metadata.hasAlpha) {
            compressed = await sharp(buffer)
                .png({ compressionLevel: 9, effort: 8, palette: true, quality: 75 })
                .toBuffer();
        } else {
            // Jika PNG tanpa transparansi, bandingkan PNG terkompresi vs MozJPEG
            const pngCompressed = await sharp(buffer)
                .png({ compressionLevel: 9, effort: 8, palette: true, quality: 75 })
                .toBuffer();

            const jpegCompressed = await sharp(buffer)
                .jpeg({ quality: 70, mozjpeg: true, chromaSubsampling: '4:2:0' })
                .toBuffer();

            compressed = jpegCompressed.length < pngCompressed.length ? jpegCompressed : pngCompressed;
        }
    } else if (origFormat === 'webp') {
        compressed = await sharp(buffer)
            .webp({ quality: 65, effort: 6 })
            .toBuffer();
    } else {
        // Default JPEG / JPG
        compressed = await sharp(buffer)
            .jpeg({ quality: 65, mozjpeg: true, chromaSubsampling: '4:2:0' })
            .toBuffer();
    }

    // Jika hasil kompresi ternyata belum lebih kecil dari aslinya, coba turunkan quality sedikit
    if (compressed.length >= buffer.length) {
        if (origFormat === 'png' && metadata.hasAlpha) {
            compressed = await sharp(buffer)
                .png({ compressionLevel: 9, effort: 9, palette: true, quality: 60 })
                .toBuffer();
        } else {
            compressed = await sharp(buffer)
                .jpeg({ quality: 50, mozjpeg: true, chromaSubsampling: '4:2:0' })
                .toBuffer();
        }
    }

    const metaAfter = await sharp(compressed).metadata();

    return {
        buffer: compressed,
        width: origWidth,
        height: origHeight,
        format: metaAfter.format || origFormat
    };
}

/**
 * Kompres video tanpa mengubah resolusi menggunakan FFmpeg
 * @param {Buffer} buffer - Buffer video asli
 * @returns {Promise<{ buffer: Buffer, resolution: string }>}
 */
function compressVideo(buffer) {
    return new Promise((resolve, reject) => {
        const tmpDir = getTempDir();
        const randId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const inputPath = path.join(tmpDir, `comp_in_${randId}.mp4`);
        const outputPath = path.join(tmpDir, `comp_out_${randId}.mp4`);

        try {
            fs.writeFileSync(inputPath, buffer);
        } catch (err) {
            return reject(new Error('Gagal menyimpan file video sementara: ' + err.message));
        }

        const resolution = getVideoResolution(inputPath);

        // FFmpeg tanpa filter -vf scale memastikan resolusi video 100% sama dengan aslinya
        ffmpeg(inputPath)
            .outputOptions([
                '-c:v', 'libx264',
                '-crf', '28',
                '-preset', 'faster',
                '-c:a', 'aac',
                '-b:a', '96k',
                '-pix_fmt', 'yuv420p',
                '-movflags', '+faststart'
            ])
            .save(outputPath)
            .on('end', () => {
                try {
                    let outBuffer = fs.readFileSync(outputPath);

                    // Pembersihan file sementara
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

                    resolve({
                        buffer: outBuffer,
                        resolution
                    });
                } catch (readErr) {
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    reject(readErr);
                }
            })
            .on('error', (err) => {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                reject(err);
            });
    });
}

/**
 * Handler command compress
 * @param {Object} m - Serialized message
 * @param {Object} context - Handler context
 */
async function handler(m, { sock }) {
    // Deteksi media baik pesan langsung maupun quoted
    const isImage = m.isImage || (m.quoted && m.quoted.isImage) ||
                    (m.quoted?.isDocument && m.quoted?.mimetype?.startsWith('image/')) ||
                    (m.isDocument && m.mimetype?.startsWith('image/'));

    const isVideo = m.isVideo || (m.quoted && m.quoted.isVideo) ||
                    (m.quoted?.isDocument && m.quoted?.mimetype?.startsWith('video/')) ||
                    (m.isDocument && m.mimetype?.startsWith('video/'));

    if (!isImage && !isVideo) {
        let helpText = `🗜️ *Media Compressor*\n\n`;
        helpText += `Kompres ukuran file gambar atau video *tanpa menurunkan resolusi* (lebar & tinggi tetap sama).\n\n`;
        helpText += `📌 *Cara Penggunaan:*\n`;
        helpText += `• Kirim gambar/video dengan caption *${m.prefix}compress*\n`;
        helpText += `• Atau balas (reply) gambar/video dengan *${m.prefix}compress*\n\n`;
        helpText += `⚠️ *Ketentuan:*\n`;
        helpText += `• Batas maksimal ukuran media: *10 MB*\n`;
        helpText += `• Resolusi asli tetap dipertahankan 100%`;
        return m.reply(helpText);
    }

    // Pra-cek ukuran dari metadata jika tersedia
    const estimatedSize = m.quoted?.fileLength || m.fileLength;
    if (estimatedSize && estimatedSize > MAX_FILE_SIZE) {
        return m.reply(`❌ Ukuran file terlalu besar (*${formatFileSize(estimatedSize)}*)!\nBatas maksimal yang diperbolehkan adalah *10 MB*.`);
    }

    await m.react('⏳');

    try {
        let buffer = null;
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download();
        } else if (m.isMedia) {
            buffer = await m.download();
        }

        if (!buffer || buffer.length === 0) {
            await m.react('❌');
            return m.reply('❌ Gagal mengunduh media. Silakan coba lagi.');
        }

        // Cek ukuran aktual buffer
        if (buffer.length > MAX_FILE_SIZE) {
            await m.react('❌');
            return m.reply(`❌ Ukuran file terlalu besar (*${formatFileSize(buffer.length)}*)!\nBatas maksimal yang diperbolehkan adalah *10 MB*.`);
        }

        const originalSize = buffer.length;

        if (isImage) {
            const result = await compressImage(buffer);
            const compressedSize = result.buffer.length;

            // Jika hasil kompresi ternyata tidak lebih kecil (sudah sangat efisien sebelumnya)
            if (compressedSize >= originalSize) {
                await m.react('ℹ️');
                return m.reply(`⚠️ Gambar ini sudah terkompresi secara optimal (*${formatFileSize(originalSize)}*).\nUkuran tidak dapat diperkecil lagi tanpa menurunkan resolusi.`);
            }

            const savedBytes = originalSize - compressedSize;
            const savedPercent = ((savedBytes / originalSize) * 100).toFixed(2);

            let caption = `🗜️ *Kompresi Gambar Berhasil!*\n\n`;
            caption += `📊 *Detail Kompresi:*\n`;
            caption += `│ ◦ *Resolusi:* ${result.width} × ${result.height} px (Tetap 100%)\n`;
            caption += `│ ◦ *Format:* ${result.format.toUpperCase()}\n`;
            caption += `│ ◦ *Ukuran Awal:* ${formatFileSize(originalSize)}\n`;
            caption += `│ ◦ *Ukuran Akhir:* ${formatFileSize(compressedSize)}\n`;
            caption += `│ ◦ *Hemat:* ${savedPercent}% (${formatFileSize(savedBytes)})\n`;
            caption += `└──────────────────`;

            await m.replyImage(result.buffer, caption);
            await m.react('✅');

        } else if (isVideo) {
            const result = await compressVideo(buffer);
            const compressedSize = result.buffer.length;

            if (compressedSize >= originalSize) {
                await m.react('ℹ️');
                return m.reply(`⚠️ Video ini sudah sangat optimal (*${formatFileSize(originalSize)}*).\nUkuran tidak dapat diperkecil lagi tanpa menurunkan resolusi.`);
            }

            const savedBytes = originalSize - compressedSize;
            const savedPercent = ((savedBytes / originalSize) * 100).toFixed(2);

            let caption = `🗜️ *Kompresi Video Berhasil!*\n\n`;
            caption += `📊 *Detail Kompresi:*\n`;
            caption += `│ ◦ *Resolusi:* ${result.resolution} (Tetap 100%)\n`;
            caption += `│ ◦ *Ukuran Awal:* ${formatFileSize(originalSize)}\n`;
            caption += `│ ◦ *Ukuran Akhir:* ${formatFileSize(compressedSize)}\n`;
            caption += `│ ◦ *Hemat:* ${savedPercent}% (${formatFileSize(savedBytes)})\n`;
            caption += `└──────────────────`;

            await m.replyVideo(result.buffer, caption);
            await m.react('✅');
        }

    } catch (error) {
        console.error('[Compress Plugin Error]:', error);
        await m.react('❌');
        await m.reply(`❌ Terjadi kesalahan saat mengompres media:\n_${error.message || 'Error tidak diketahui'}_`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
