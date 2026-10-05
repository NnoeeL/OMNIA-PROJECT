/**
 * @file src/lib/lidHelper.js
 * @description Helper untuk konversi LID (Linked ID) ke format nomor telepon
 * @author Ourin-AI Team
 * @version 1.2.0
 */

const { jidDecode } = require('@rexxhayanasi/elaina-baileys');

/**
 * Cek apakah JID adalah format LID
 * @param {string} jid - JID untuk dicek
 * @returns {boolean} True jika LID
 */
function isLid(jid) {
    if (!jid) return false;
    return jid.endsWith('@lid');
}

/**
 * Convert LID ke format JID standard
 * @param {string} jid - JID yang mungkin LID
 * @returns {string} JID dalam format @s.whatsapp.net
 */
function lidToJid(jid) {
    // Mengganti @lid dengan @s.whatsapp.net secara langsung itu salah, karena LID
    // adalah jenis ID yang berbeda, bukan nomor telepon.
    // Kalau tidak bisa di-resolve lewat metadata, JID harus tetap @lid supaya
    // Baileys bisa merutekannya dengan benar.
    return jid;
}

/**
 * Extract nomor dari JID apapun (termasuk LID)
 * @param {string} jid - JID
 * @returns {string} Nomor telepon
 */
function extractNumber(jid) {
    if (!jid) return '';
    return jid.replace(/@.+/g, '');
}

/**
 * Cari pasangan nomor telepon dan LID dari daftar peserta grup.
 * Mendukung beberapa bentuk data peserta (id, lid, jid, phoneNumber).
 * @param {string} jid - JID (nomor atau LID) yang dicari
 * @param {Object[]} participants - Array participant dari group metadata
 * @returns {{pn: string|null, lid: string|null}}
 */
function findInParticipants(jid, participants = []) {
    const result = { pn: null, lid: null };
    if (!jid || !Array.isArray(participants)) return result;

    const found = participants.find(p =>
        p.id === jid || p.lid === jid || p.jid === jid || p.phoneNumber === jid
    );
    if (!found) return result;

    const candidates = [found.id, found.lid, found.jid, found.phoneNumber].filter(Boolean);
    result.lid = candidates.find(isLid) || null;
    result.pn = candidates.find(c => !isLid(c)) || null;

    return result;
}

/**
 * Resolve LID menggunakan group metadata jika tersedia
 * @param {string} jid - JID yang mungkin LID
 * @param {Object} participants - Array participant dari group metadata
 * @returns {string} JID yang sudah resolve
 */
function resolveLidFromParticipants(jid, participants = []) {
    if (!jid || !isLid(jid)) return jid;

    const { pn } = findInParticipants(jid, participants);
    if (pn) return pn;

    // Fallback: kembalikan apa adanya
    return lidToJid(jid);
}

/**
 * Convert array of JIDs, replacing any LIDs
 * @param {string[]} jids - Array of JIDs
 * @param {Object[]} participants - Optional group participants
 * @returns {string[]} Array of converted JIDs
 */
function convertLidArray(jids, participants = []) {
    if (!Array.isArray(jids)) return [];

    return jids.map(jid => {
        if (isLid(jid)) {
            return resolveLidFromParticipants(jid, participants);
        }
        return jid;
    });
}

/**
 * Decode JID dan kembalikan dalam format standard
 * @param {string} jid - JID untuk didecode
 * @returns {string|null} JID yang sudah didecode atau null
 */
function decodeAndNormalize(jid) {
    if (!jid) return null;

    // Handle LID format first
    if (isLid(jid)) {
        jid = lidToJid(jid);
    }

    // Handle device suffix
    if (/:\d+@/gi.test(jid)) {
        const decoded = jidDecode(jid) || {};
        if (decoded.user && decoded.server) {
            return decoded.user + '@' + decoded.server;
        }
    }

    return jid;
}

/**
 * Konversi participant JID dari message
 * @param {Object} msg - Message object
 * @param {Object} sock - Socket connection
 * @returns {Promise<string>} Resolved participant JID
 */
async function resolveParticipant(msg, sock) {
    const participant = msg.key?.participant;

    if (!participant) return null;
    if (!isLid(participant)) return participant;

    // Coba ambil dari atribut node kalau tersedia
    if (msg.participantPn) {
        return msg.participantPn;
    }

    // Coba lewat group metadata
    if (msg.key?.remoteJid?.endsWith('@g.us') && sock) {
        try {
            const metadata = await sock.groupMetadata(msg.key.remoteJid);
            const { pn } = findInParticipants(participant, metadata.participants);
            if (pn) return pn;
        } catch {
            // Gagal diam-diam
        }
    }

    // Fallback
    return lidToJid(participant);
}

module.exports = {
    isLid,
    lidToJid,
    extractNumber,
    findInParticipants,
    resolveLidFromParticipants,
    convertLidArray,
    decodeAndNormalize,
    resolveParticipant
};