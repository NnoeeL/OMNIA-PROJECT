/**
 * @file plugins/main/donasi.js
 * @description Command .donasi - Mengirim QRIS dan info donasi premium
 * @author Ourin-AI Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

const pluginConfig = {
    name: 'donasi',
    alias: ['donate', 'qris', 'upgrade'],
    category: 'main',
    description: 'Info donasi & upgrade premium',
    usage: '.donasi',
    example: '.donasi',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
};

/**
 * Handler untuk command donasi
 */
async function handler(m, { sock }) {
    const caption =
        '💎 *DONASI — PREMIUM MEMBERSHIP*\n\n' +
        'Donasi seminimal nya *Rp 5.000* untuk mendapatkan premium / membership selama *30 hari*.\n\n' +
        '📝 *Catatan Pembayaran:*\n' +
        'Harap masukkan *Nomor WhatsApp* yang ingin dijadikan premium pada kolom keterangan / catatan donasi.\n\n' +
        '⏳ Membership akan dikirim dalam *2x24 jam* setelah pembayaran dikonfirmasi.\n\n' +
        '📤 *Setelah donasi, kirim foto bukti transfer dengan caption .buktitf <nama rekening>, atau reply foto bukti dengan perintah tersebut.*\n\n' +
        '📌 *Keterangan:*\n' +
        'Tambahkan keterangan nomor WhatsApp yang ingin dijadikan premium.\n\n' +
        'Ketik *.premium* untuk cek apakah kamu sudah premium atau belum ✅';

    // Cari file QRIS
    const qrisExtensions = ['jpg', 'jpeg', 'png'];
    let qrisBuffer = null;

    for (const ext of qrisExtensions) {
        const qrisPath = path.join(process.cwd(), 'assets', 'images', `qris.${ext}`);
        if (fs.existsSync(qrisPath)) {
            qrisBuffer = fs.readFileSync(qrisPath);
            break;
        }
    }

    if (qrisBuffer) {
        // Kirim QRIS dengan caption
        await sock.sendMessage(m.chat, {
            image: qrisBuffer,
            caption: caption
        }, { quoted: m.message });
    } else {
        // Jika file QRIS belum ada, kirim teks saja
        await m.reply(caption + '\n\n⚠️ _QRIS belum tersedia, hubungi owner untuk pembayaran._');
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
