/**
 * @file plugins/utility/lid.js
 * @description Melihat LID (Linked Identity) dari nomor WhatsApp (khusus owner)
 * @version 2.0.0
 */

const fs = require('fs');
const path = require('path');
const { isLid } = require('../../src/lib/lidHelper');

/**
 * Lokasi file penyimpanan pasangan nomor -> LID.
 * Ubah sesuai struktur folder botmu.
 */
const DB_PATH = path.join(process.cwd(), 'database', 'lid.json');

/**
 * Konfigurasi plugin
 */
const pluginConfig = {
    name: 'lid',
    alias: ['checklid', 'getlid'],
    category: 'owner',
    description: 'Melihat LID dari nomor WhatsApp (khusus owner)',
    usage: '.lid <nomor> / @mention / reply',
    example: '.lid 6282216555691\n.lid @user\n(reply pesan) .lid',
    isOwner: true, // hanya owner yang bisa memakai
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true
};

/**
 * Ubah nomor menjadi JID
 * @param {string} number
 * @returns {string}
 */
function formatToJid(number) {
    number = String(number).replace(/\D/g, '');
    if (number.startsWith('0')) number = '62' + number.slice(1);
    return number + '@s.whatsapp.net';
}

/**
 * Simpan pasangan nomor -> LID ke file JSON
 * @param {string} number
 * @param {string} lid
 */
function saveToDb(number, lid) {
    try {
        fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
        const db = fs.existsSync(DB_PATH)
            ? JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
            : {};
        db[number] = lid;
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    } catch (e) {
        console.error('Gagal menyimpan lid.json:', e);
    }
}

/**
 * Cari pasangan nomor dan LID dari sebuah JID
 * @param {Object} sock
 * @param {string} jid
 * @returns {Promise<{pn: string|null, lid: string|null}>}
 */
async function resolveIds(sock, jid) {
    let pn = null;
    let lid = null;

    if (isLid(jid)) {
        // Target sudah berupa LID, cari nomor teleponnya
        lid = jid;
        try {
            pn = await sock.signalRepository.lidMapping.getPNForLID(jid);
        } catch {}
    } else {
        // Target berupa nomor, cari LID-nya
        pn = jid;

        // 1. Dari pemetaan yang sudah tersimpan di bot
        try {
            lid = await sock.signalRepository.lidMapping.getLIDForPN(jid);
        } catch {}

        // 2. Kalau belum ada, tanya ke server WhatsApp
        if (!lid) {
            try {
                const res = await sock.onWhatsApp(jid.split('@')[0]);
                // console.log(JSON.stringify(res, null, 2)); // aktifkan untuk debug
                if (res?.[0]?.exists) lid = res[0].lid || null;
            } catch (e) {
                console.error('onWhatsApp error:', e);
            }
        }

        // 3. Terakhir, cek database lokal
        if (!lid && fs.existsSync(DB_PATH)) {
            try {
                const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
                lid = db[jid.split('@')[0]] || null;
            } catch {}
        }
    }

    return { pn, lid };
}

/**
 * Handler command .lid
 * @param {Object} m - Serialized message
 * @param {Object} context
 */
async function handler(m, { sock }) {
    const args = m.args || [];
    let targetJid;

    // Prioritas: nomor yang diketik > reply > mention
    if (args.length > 0) targetJid = formatToJid(args[0]);
    else if (m.quoted?.sender) targetJid = m.quoted.sender;
    else if (m.mentionedJid?.length) targetJid = m.mentionedJid[0];
    else {
        return m.reply(
            `❌ *Format salah!*\n\n` +
            `*Cara pakai:*\n` +
            `• .lid <nomor>\n` +
            `• .lid @mention\n` +
            `• Reply pesan lalu .lid\n\n` +
            `*Contoh:* .lid 6282216555691`
        );
    }

    try {
        const { pn, lid } = await resolveIds(sock, targetJid);

        if (!pn && !lid) {
            return m.reply('❌ Nomor tidak terdaftar di WhatsApp.');
        }

        const number = pn ? pn.split('@')[0] : null;

        if (number && lid) saveToDb(number, lid);

        let text = `🔍 *LID CHECKER*\n\n`;
        text += `📱 Nomor: ${number || '-'}\n`;
        text += `🔗 LID: ${lid || 'Belum ditemukan'}`;

        if (!lid) {
            text += `\n\n💡 Minta orang tersebut mengirim satu pesan ke bot, lalu coba lagi.`;
        }

        await m.reply(text);
    } catch (error) {
        console.error('Error in lid command:', error);
        await m.reply(`❌ Terjadi kesalahan: ${error.message}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};