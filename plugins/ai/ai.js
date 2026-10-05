/**
 * @file plugins/ai/ai.js
 * @description Command .ai - Pollinations (primary, gratis) + OpenRouter (fallback jika ada key)
 * @author Ourin-AI Team
 * @version 1.4.0
 */

const { callPollinations, callOpenRouter } = require('./_ai-api');
const { getAIConfig, SYSTEM_PROMPT } = require('./_ai-utils');

const pluginConfig = {
    name: 'ai',
    alias: ['ask'],
    category: 'ai',
    description: 'Tanya AI (gratis)',
    usage: '.ai <pertanyaan>',
    example: [
        '.ai Apa itu machine learning?',
        '.ai Buatkan kode Python untuk sorting',
        '.ai Jelaskan teori relativitas Einstein'
    ],
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 1,
    isEnabled: true
};

module.exports = {
    config: pluginConfig,
    handler: async function handler(m, { sock, config: botConfig, db, uptime }) {
        const args = m.args;
        const prefix = botConfig.command?.prefix || '.';

        if (!args || args.length === 0) {
            return await m.reply(
                `🤖 *AI Chat*\n\n` +
                `Tanya apa aja ke AI!\n\n` +
                `💡 *Cara menggunakan:*\n` +
                `\`${prefix}ai <pertanyaanmu>\`\n\n` +
                `📝 *Contoh:*\n` +
                `• \`${prefix}ai Apa itu AI?\`\n` +
                `• \`${prefix}ai Buatkan kode Python sorting\`\n` +
                `• \`${prefix}ai Jelaskan teori relativitas\``
            );
        }

        const question = args.join(' ');
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: question }
        ];

        try {
            await m.reply('⏳ _Sedang memproses pertanyaan..._');

            // Coba Pollinations dulu (gratis, tanpa API key, reliable)
            try {
                const answer = await callPollinations(messages);
                return await m.reply(`🤖 *AI:*\n\n${answer}`);
            } catch (pollErr) {
                console.log('[AI] Pollinations failed, trying OpenRouter...');

                // Fallback ke OpenRouter jika ada API key
                const aiConfig = getAIConfig();
                if (aiConfig.openrouter?.apiKey) {
                    const answer = await callOpenRouter(messages, aiConfig.openrouter);
                    return await m.reply(`🤖 *AI:*\n\n${answer}`);
                }

                throw pollErr;
            }
        } catch (error) {
            console.error('[AI Error]', error.message);
            return await m.reply(`❌ *Terjadi kesalahan*:\n${error.message}`);
        }
    }
};
