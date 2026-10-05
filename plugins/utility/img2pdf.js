/**
 * @file plugins/utility/img2pdf.js
 * @description Konversi gambar ke PDF. Kirim gambar satu per satu lalu ketik .img2pdf done untuk generate
 * @author Ourin-AI Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { downloadContentFromMessage } = require('@rexxhayanasi/elaina-baileys');

const pluginConfig = {
    name: 'img2pdf',
    alias: ['topdf', 'imagetopdf', 'i2p'],
    category: 'utility',
    description: 'Konversi gambar ke PDF (support multi-gambar)',
    usage: '.img2pdf (reply gambar / kirim gambar dengan caption .img2pdf)',
    example: '.img2pdf',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
};

// Temporary storage for multi-image sessions
const sessions = new Map();

async function handler(m, { sock, db }) {
    const args = m.args || [];
    const firstArg = args[0]?.toLowerCase() || '';

    // Check if user wants to finalize PDF from collected images
    if (firstArg === 'done' || firstArg === 'selesai') {
        const userImages = sessions.get(m.sender);
        if (!userImages || userImages.length === 0) {
            return m.reply('⚠️ Belum ada gambar yang dikumpulkan!\n\nKirim gambar dengan caption *.img2pdf* untuk menambahkan gambar.\nSetelah semua gambar terkumpul, ketik *.img2pdf done <nama_file>*');
        }

        // Ambil nama file kustom jika diberikan (misal: .img2pdf done MyDocument)
        let fileName = args.slice(1).join(' ').trim();
        if (fileName) {
            // Bersihkan karakter tak valid pada nama file
            fileName = fileName.replace(/[/\\?%*:|"<>]/g, '');
            if (!fileName.toLowerCase().endsWith('.pdf')) {
                fileName += '.pdf';
            }
        } else {
            fileName = `images_${Date.now()}.pdf`;
        }

        await m.react('⏳');

        try {
            const pdfBuffer = await createPDF(userImages);

            await sock.sendMessage(m.chat, {
                document: pdfBuffer,
                fileName: fileName,
                mimetype: 'application/pdf',
                caption: `✅ *Image to PDF*\n\n📄 PDF berhasil dibuat!\n📁 Nama File: *${fileName}*\n📊 Total Gambar: ${userImages.length}`
            }, { quoted: m.message });

            // Clear session
            sessions.delete(m.sender);
            await m.react('✅');

        } catch (error) {
            console.error('[img2pdf]', error.message);
            await m.react('❌');
            await m.reply('❌ Gagal membuat PDF. Coba lagi.');
        }
        return;
    }

    // Check if user wants to clear session
    if (firstArg === 'clear' || firstArg === 'reset') {
        sessions.delete(m.sender);
        return m.reply('🗑️ Sesi gambar telah direset.');
    }

    // Check for image in the message or quoted message
    let imageBuffer = null;

    if (m.isImage) {
        // Image sent with caption .img2pdf
        imageBuffer = await m.download();
    } else if (m.quoted?.isImage) {
        // Reply to an image with .img2pdf
        imageBuffer = await m.quoted.download();
    }

    if (!imageBuffer) {
        const userImages = sessions.get(m.sender);
        const count = userImages ? userImages.length : 0;

        let txt = '📄 *Image to PDF Converter*\n\n';
        txt += '🔹 *Cara pakai:*\n';
        txt += '│ 1. Kirim gambar + caption *.img2pdf*\n';
        txt += '│ 2. Atau reply gambar + *.img2pdf*\n';
        txt += '│ 3. Ulangi untuk menambah gambar\n';
        txt += '│ 4. Ketik *.img2pdf done <nama_file>* untuk buat PDF\n';
        txt += '│ 5. Ketik *.img2pdf clear* untuk reset\n\n';
        txt += '💡 *Contoh:* `.img2pdf done Tugas_Sekolah`\n\n';
        if (count > 0) {
            txt += `📊 *Gambar terkumpul:* ${count} gambar\n`;
            txt += `💡 Ketik *.img2pdf done <nama_file>* untuk membuat PDF (contoh: *.img2pdf done MyDocument*)`;
        }
        return m.reply(txt);
    }

    // Add image to session
    if (!sessions.has(m.sender)) {
        sessions.set(m.sender, []);
    }
    sessions.get(m.sender).push(imageBuffer);
    const count = sessions.get(m.sender).length;

    await m.react('📄');
    await m.reply(`✅ Gambar ke-*${count}* ditambahkan!\n\n📊 Total: *${count}* gambar\n\n💡 Kirim gambar lagi atau ketik *.img2pdf done <nama_file>* untuk membuat PDF.\nContoh: *.img2pdf done Tugas_Sekolah*`);

    // Auto-expire session after 10 minutes
    setTimeout(() => {
        if (sessions.has(m.sender)) {
            sessions.delete(m.sender);
        }
    }, 10 * 60 * 1000);
}

/**
 * Create PDF from array of image buffers
 * @param {Buffer[]} images - Array of image buffers
 * @returns {Promise<Buffer>} PDF buffer
 */
function createPDF(images) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ autoFirstPage: false });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            for (const imgBuffer of images) {
                const img = doc.openImage(imgBuffer);
                
                // Set page size to match image aspect ratio
                const pageWidth = 595.28; // A4 width
                const pageHeight = 841.89; // A4 height
                
                // Calculate dimensions to fit on page
                const ratio = Math.min(pageWidth / img.width, pageHeight / img.height);
                const imgWidth = img.width * ratio;
                const imgHeight = img.height * ratio;
                
                // Center the image on the page
                const x = (pageWidth - imgWidth) / 2;
                const y = (pageHeight - imgHeight) / 2;

                doc.addPage({ size: [pageWidth, pageHeight] });
                doc.image(imgBuffer, x, y, { width: imgWidth, height: imgHeight });
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = { config: pluginConfig, handler };
