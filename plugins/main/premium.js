/**
 * @file plugins/main/premium.js
 * @description Command .premium - Cek status premium user
 * @author Ourin-AI Team
 * @version 1.0.0
 */

const pluginConfig = {
    name: 'premium',
    alias: ['prem', 'membership'],
    category: 'main',
    description: 'Cek status premium kamu',
    usage: '.premium',
    example: '.premium',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
};

/**
 * Handler untuk command premium
 */
async function handler(m, { sock, db, config: botConfig }) {
    const prefix = botConfig.command?.prefix || '.';
    let alternateJid = null;
    const mapping = sock?.signalRepository?.lidMapping;

    try {
        if (m.sender.endsWith('@lid') && mapping?.getPNForLID) {
            alternateJid = await mapping.getPNForLID(m.sender);
        } else if (m.sender.endsWith('@s.whatsapp.net') && mapping?.getLIDForPN) {
            alternateJid = await mapping.getLIDForPN(m.sender);
        }
    } catch (error) {
        console.error('[Premium] Gagal mencari pasangan LID/nomor:', error.message);
    }

    const userJids = [...new Set([m.sender, alternateJid].filter(Boolean))];
    const isOwner = m.isOwner || userJids.some(jid => botConfig.isOwner(jid));
    const isPremium = m.isPremium || userJids.some(jid => botConfig.isPremium(jid, db));
    const users = userJids.map(jid => db.getUser(jid));
    const phoneJid = userJids.find(jid => jid.endsWith('@s.whatsapp.net'));
    const user = users.find(candidate => candidate?.isPremium) ||
        (phoneJid ? db.getUser(phoneJid) : null) ||
        users.find(Boolean);

    if (isPremium || isOwner) {
        // User adalah premium
        let expiredText = 'Lifetime';

        // Cek apakah ada data expired premium
        if (user?.premiumExpiredAt) {
            const expDate = new Date(user.premiumExpiredAt);
            const now = new Date();
            const diffMs = expDate - now;
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
                expiredText = `${diffDays} hari lagi (${expDate.toLocaleDateString('id-ID')})`;
            } else {
                expiredText = 'Expired';
            }
        }

        if (isOwner) {
            expiredText = 'Lifetime (Owner)';
        }

        return m.reply(
            '┌──「 💎 *STATUS PREMIUM* 」\n' +
            '│\n' +
            '│ ✅ *Status:* Aktif\n' +
            `│ 👤 *Nama:* ${m.pushName || 'User'}\n` +
            `│ ⏳ *Expired:* ${expiredText}\n` +
            '│ 📊 *Limit:* ∞\n' +
            '│\n' +
            '│ Kamu bisa menikmati semua\n' +
            '│ fitur bot tanpa batas! 🚀\n' +
            '│\n' +
            '└──────────────────'
        );
    } else {
        // User bukan premium
        const currentLimit = user?.limit ?? 0;

        return m.reply(
            '┌──「 💎 *STATUS PREMIUM* 」\n' +
            '│\n' +
            '│ ❌ *Status:* Tidak Aktif\n' +
            `│ 👤 *Nama:* ${m.pushName || 'User'}\n` +
            `│ 📊 *Sisa Limit:* ${currentLimit}\n` +
            '│\n' +
            '│ Upgrade ke premium untuk\n' +
            '│ menikmati fitur tanpa batas!\n' +
            '│\n' +
            `│ Ketik *${prefix}donasi* untuk info\n` +
            '│ cara upgrade premium 💎\n' +
            '│\n' +
            '└──────────────────'
        );
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
