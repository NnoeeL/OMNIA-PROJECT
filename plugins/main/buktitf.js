const { isLid } = require('../../src/lib/lidHelper');

const pluginConfig = {
    name: 'buktitf',
    alias: [],
    category: 'main',
    description: 'Mengirim bukti transfer donasi',
    usage: '.buktitf <nama rekening> (dengan foto atau reply foto)',
    example: '.buktitf Budi Santoso',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 12 * 60 * 60,
    limit: 0,
    isEnabled: true
};

async function getSenderIds(sock, sender) {
    let phoneJid = sender.endsWith('@s.whatsapp.net') ? sender : null;
    let lidJid = isLid(sender) ? sender : null;
    const mapping = sock.signalRepository?.lidMapping;

    try {
        if (lidJid && mapping?.getPNForLID) {
            phoneJid = await mapping.getPNForLID(lidJid);
        } else if (phoneJid && mapping?.getLIDForPN) {
            lidJid = await mapping.getLIDForPN(phoneJid);
        }
    } catch (error) {
        console.error('[BuktiTF] Gagal mencari pasangan LID/nomor:', error.message);
    }

    return { phoneJid, lidJid };
}

async function findProofGroup(sock) {
    if (typeof sock.groupFetchAllParticipating !== 'function') {
        throw new Error('Bot tidak dapat memeriksa daftar grup. Pastikan versi WhatsApp bot mendukung groupFetchAllParticipating.');
    }

    const groups = await sock.groupFetchAllParticipating();
    const matches = Object.entries(groups || {}).filter(([, group]) =>
        group.subject?.trim().toLocaleLowerCase('id-ID') === 'bukti-tf'
    );

    if (matches.length === 0) {
        throw new Error('Grup dengan nama persis “BUKTI-TF” tidak ditemukan. Pastikan bot sudah bergabung ke grup tersebut.');
    }
    if (matches.length > 1) {
        throw new Error('Ada lebih dari satu grup bernama “BUKTI-TF”; ubah nama salah satu grup agar tujuan pengiriman tidak ambigu.');
    }

    return matches[0][0];
}

async function handler(m, { sock }) {
    const imageMessage = m.isImage ? m : m.quoted?.isImage ? m.quoted : null;
    if (!imageMessage) {
        return m.reply('❌ Sertakan foto bukti transfer atau reply foto, lalu gunakan `.buktitf <nama rekening>`.');
    }

    const accountName = (m.args || []).join(' ').trim();
    if (!accountName) {
        return m.reply('❌ Nama rekening wajib disertakan.\nContoh: kirim/reply foto dengan caption `.buktitf Budi Santoso`.');
    }

    await m.react('⏳');
    try {
        const [{ phoneJid, lidJid }, groupJid] = await Promise.all([
            getSenderIds(sock, m.sender),
            findProofGroup(sock)
        ]);

        if (!phoneJid || !lidJid) {
            throw new Error('Nomor WhatsApp dan LID pengirim belum dapat dipasangkan. Pastikan bot sudah pernah melihat pesan pengguna ini.');
        }

        const image = await imageMessage.download();
        if (!image?.length) {
            throw new Error('Foto bukti transfer gagal diunduh.');
        }

        const caption =
            '🧾 *BUKTI TRANSFER*\n\n' +
            '📷 Bukti Gambar terlampir\n' +
            `👤 Nama Pengguna TF: ${accountName}\n` +
            `🆔 No LID: ${lidJid.split('@')[0]}\n` +
            `📱 No WhatsApp: ${phoneJid.split('@')[0]}`;

        await sock.sendMessage(groupJid, { image, caption });
        await m.react('✅');
        await m.reply('✅ Bukti transfer berhasil dikirim ke grup BUKTI-TF.');
    } catch (error) {
        console.error('[BuktiTF] Gagal mengirim bukti transfer:', error);
        await m.react('❌');
        await m.reply(`❌ Gagal mengirim bukti transfer:\n_${error.message}_`);
    }
}

module.exports = { config: pluginConfig, handler, findProofGroup, getSenderIds };
