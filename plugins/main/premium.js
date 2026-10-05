/**
 * @file plugins/main/premium.js
 * @description Command .premium - Cek status premium user
 * @author Ourin-AI Team
 * @version 1.0.0
 */

const pluginConfig = {
    name: 'premium',
    alias: ['prem', 'cekpremium', 'membership'],
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
async function handler(m, { db, config: botConfig }) {
    const prefix = botConfig.command?.prefix || '.';
    const user = db.getUser(m.sender);

    if (m.isPremium || m.isOwner) {
        // User adalah premium
        let expiredText = 'Lifetime';

        // Cek apakah ada data expired premium
        if (user?.premiumExpired) {
            const expDate = new Date(user.premiumExpired);
            const now = new Date();
            const diffMs = expDate - now;
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
                expiredText = `${diffDays} hari lagi (${expDate.toLocaleDateString('id-ID')})`;
            } else {
                expiredText = 'Expired';
            }
        }

        if (m.isOwner) {
            expiredText = 'Lifetime (Owner)';
        }

        return m.reply(
            '┌──「 💎 *STATUS PREMIUM* 」\n' +
            '│\n' +
            '│ ✅ *Status:* Aktif\n' +
            `│ 👤 *Nama:* ${m.pushName || 'User'}\n` +
            `│ ⏳ *Expired:* ${expiredText}\n` +
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
