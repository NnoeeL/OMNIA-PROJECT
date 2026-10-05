/**
 * @file plugins/fun/confess.js
 * @description Command .fess - Kirim pesan anonim (confess) ke seseorang
 * @author Ourin-AI Team
 * @version 1.0.0
 */

const pluginConfig = {
    name: 'fess',
    alias: ['confess', 'menfess', 'anonymous', 'anon'],
    category: 'fun',
    description: 'Kirim pesan anonim ke seseorang',
    usage: '.fess @tag <pesan>',
    example: '.fess @6281234567890 Hai, aku suka kamu!',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: true,  // Hanya bisa di private chat agar lebih anonim
    cooldown: 30,
    limit: 0,
    isEnabled: true
};

/**
 * Handler untuk command fess (confess)
 * @param {Object} m - Serialized message
 * @param {Object} context - Handler context
 */
async function handler(m, { sock, config: botConfig }) {
    const prefix = botConfig.command?.prefix || '.';
    const args = m.args || [];
    const fullText = m.fullArgs || m.text || '';

    // Tanpa argumen - tampilkan bantuan
    if (!fullText.trim()) {
        return m.reply(
            '💌 *CONFESS — Pesan Anonim*\n\n' +
            'Kirim pesan ke seseorang tanpa ketahuan identitasmu!\n\n' +
            '📝 *Cara pakai:*\n' +
            `│ ◦ \`${prefix}fess @tag pesan kamu\`\n` +
            `│ ◦ \`${prefix}fess 6281234567890 pesan kamu\`\n\n` +
            '📌 *Contoh:*\n' +
            `│ ◦ \`${prefix}fess @6281234567890 Hai, aku penggemar rahasiamu!\`\n` +
            `│ ◦ \`${prefix}fess 6281234567890 Semangat ya buat hari ini!\`\n\n` +
            '⚠️ *Catatan:*\n' +
            '│ ◦ Command ini hanya bisa digunakan di private chat\n' +
            '│ ◦ Identitasmu dijamin *100% rahasia*\n' +
            '│ ◦ Jangan digunakan untuk hal negatif!'
        );
    }

    // Parse target: bisa dari mention atau nomor langsung
    let targetJid = null;
    let message = '';

    // Cek mention dulu
    if (m.mentionedJid && m.mentionedJid.length > 0) {
        targetJid = m.mentionedJid[0];
        // Hapus mention dari pesan untuk mendapatkan isi pesan saja
        message = fullText.replace(/@\d+/g, '').trim();
    } else {
        // Parse nomor dari argumen pertama
        const firstArg = args[0] || '';
        // Bersihkan nomor dari karakter non-digit
        const cleanNumber = firstArg.replace(/[^0-9]/g, '');

        if (cleanNumber.length >= 10) {
            // Format ke JID WhatsApp
            let number = cleanNumber;
            // Jika dimulai dengan 0, ganti ke 62 (Indonesia)
            if (number.startsWith('0')) {
                number = '62' + number.substring(1);
            }
            targetJid = number + '@s.whatsapp.net';
            // Pesan adalah sisa argumen setelah nomor
            message = args.slice(1).join(' ').trim();
        }
    }

    if (!targetJid) {
        return m.reply(
            '❌ *Target tidak ditemukan!*\n\n' +
            'Tag seseorang atau masukkan nomor tujuan.\n\n' +
            `📌 Contoh: \`${prefix}fess 6281234567890 Hai kamu!\``
        );
    }

    if (!message) {
        return m.reply(
            '❌ *Pesan tidak boleh kosong!*\n\n' +
            `📌 Contoh: \`${prefix}fess @target Hai, pesan rahasia nih!\``
        );
    }

    // Jangan izinkan kirim ke diri sendiri
    if (targetJid === m.sender) {
        return m.reply('❌ Gak bisa kirim pesan anonim ke diri sendiri dong 😅');
    }

    // Jangan izinkan kirim ke bot
    const botNumber = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
    if (targetJid === botNumber || targetJid.includes(sock.user?.id?.split(':')[0])) {
        return m.reply('❌ Gak bisa kirim pesan anonim ke bot 🤖');
    }

    try {
        await m.react('⏳');

        // Cek apakah nomor terdaftar di WhatsApp
        let isRegistered = false;
        try {
            const [result] = await sock.onWhatsApp(targetJid.split('@')[0]);
            isRegistered = result?.exists || false;
        } catch (e) {
            // Jika gagal cek, tetap coba kirim
            isRegistered = true;
        }

        if (!isRegistered) {
            await m.react('❌');
            return m.reply('❌ *Nomor tidak terdaftar di WhatsApp!*\n\nPastikan nomor yang kamu masukkan benar.');
        }

        // Kirim pesan anonim ke target
        const botName = botConfig.bot?.name || 'OMNIA - PROJECT';
        const confessMessage =
            '┌──「 💌 *PESAN ANONIM* 」\n' +
            '│\n' +
            '│ Seseorang mengirimkan pesan\n' +
            '│ untukmu secara anonim:\n' +
            '│\n' +
            `│ 💬 "${message}"\n` +
            '│\n' +
            '│ ─────────────────\n' +
            '│ 🕵️ *Dari:* Seseorang\n' +
            '│ 📌 *Via:* ' + botName + '\n' +
            '│\n' +
            '└──────────────────\n\n' +
            `_Balas pesan ini dengan \`${prefix}fess\` untuk\nmengirim pesan anonim juga!_`;

        await sock.sendMessage(targetJid, {
            text: confessMessage
        });

        await m.react('✅');
        return m.reply(
            '✅ *Pesan anonim terkirim!*\n\n' +
            '🕵️ Identitasmu tetap aman dan rahasia.\n' +
            '_Penerima tidak akan tahu siapa pengirimnya._'
        );

    } catch (error) {
        await m.react('❌');
        console.error('[Confess] Error:', error.message);
        return m.reply(`❌ *Gagal mengirim pesan anonim!*\n\n⚠️ Error: ${error.message || 'Unknown error'}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
