/**
 * @file plugins/ai/ai-api.js
 * @description API calling functions for AI providers
 * @author Ourin-AI Team
 * @version 1.0.0
 */

const axios = require('axios');
const { SYSTEM_PROMPT, getAIConfig, AI_PROVIDERS } = require('./_ai-utils');

/**
 * Panggil Pollinations AI (gratis, tanpa API key)
 */
async function callPollinations(messages) {
    try {
        const response = await axios.post(
            'https://text.pollinations.ai/openai',
            {
                model: 'openai',
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 60000
            }
        );

        const data = response.data;
        if (!data?.choices?.[0]?.message?.content) {
            throw new Error(`❌ AI tidak memberikan respons. Coba lagi.`);
        }
        return data.choices[0].message.content;
    } catch (error) {
        if (error.response) {
            const status = error.response.status;
            if (status === 429) {
                throw new Error('⏳ Rate limit tercapai! Coba lagi dalam beberapa menit.');
            } else if (status === 500 || status === 502 || status === 503) {
                throw new Error('⚠️ Server AI sedang bermasalah. Coba lagi nanti.');
            } else {
                throw new Error(`❌ AI Error (${status}): ${error.response.data?.error?.message || 'Unknown error'}`);
            }
        } else if (error.code === 'ECONNABORTED') {
            throw new Error('⏱️ Request timeout. AI terlalu lama merespons. Coba lagi.');
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            throw new Error('🌐 Tidak dapat terhubung ke server AI. Periksa koneksi internet.');
        } else {
            throw new Error(`❌ Error: ${error.message}`);
        }
    }
}

/**
 * Panggil OpenRouter API (gratis dengan API key - https://openrouter.ai)
 * Support model: deepseek/deepseek-r1:free, meta-llama/llama-3.3-70b-instruct:free, dll
 */
async function callOpenRouter(messages, apiConfig) {
    try {
        const response = await axios.post(
            `${apiConfig.baseUrl}/chat/completions`,
            {
                model: apiConfig.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiConfig.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://github.com/ourin-md',
                    'X-Title': 'Ourin-MD Bot'
                },
                timeout: 60000
            }
        );

        const data = response.data;

        // OpenRouter kadang return 200 tapi isi body adalah error (provider overloaded, dll)
        if (data?.error) {
            throw new Error(`❌ OpenRouter Error (${data.error.code || 500}): ${data.error.message || 'Provider error'}`);
        }

        if (!data?.choices?.[0]?.message?.content) {
            // DeepSeek R1 kadang pakai reasoning_content
            const reasoning = data?.choices?.[0]?.message?.reasoning_content;
            if (reasoning) return reasoning;
            throw new Error(`❌ AI tidak memberikan respons. Coba model lain atau coba lagi.`);
        }
        return data.choices[0].message.content;
    } catch (error) {
        if (error.response) {
            const status = error.response.status;
            const errorData = error.response.data;
            if (status === 429) {
                throw new Error('⏳ Rate limit tercapai! Coba lagi dalam beberapa menit.');
            } else if (status === 401) {
                throw new Error('🔑 API Key OpenRouter tidak valid. Isi dulu di config.js → openrouterApiKey');
            } else if (status === 402) {
                throw new Error('💳 Saldo OpenRouter habis. Daftar ulang atau gunakan model :free');
            } else if (status === 500 || status === 502 || status === 503) {
                throw new Error('⚠️ Server OpenRouter sedang bermasalah. Coba lagi nanti.');
            } else {
                throw new Error(`❌ OpenRouter Error (${status}): ${errorData?.error?.message || 'Unknown error'}`);
            }
        } else if (error.code === 'ECONNABORTED') {
            throw new Error('⏱️ Request timeout. AI terlalu lama merespons. Coba lagi.');
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            throw new Error('🌐 Tidak dapat terhubung ke OpenRouter. Periksa koneksi internet.');
        } else {
            throw new Error(`❌ Error: ${error.message}`);
        }
    }
}

/**
 * Panggil OpenAI API
 */
async function callOpenAI(messages, apiConfig) {
    try {
        const response = await axios.post(
            `${apiConfig.baseUrl}/chat/completions`,
            {
                model: apiConfig.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiConfig.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        );
        
        return response.data.choices[0].message.content;
    } catch (error) {
        if (error.response) {
            const status = error.response.status;
            const errorData = error.response.data;
            
            if (status === 429) {
                throw new Error('⏳ Rate limit tercapai! API OpenAI sedang sibuk. Coba lagi dalam beberapa menit atau gunakan AI lain dengan command `.ai pilih 2` (Gemini) atau `.ai pilih 3` (Groq).');
            } else if (status === 401) {
                throw new Error('🔑 API Key OpenAI tidak valid. Silakan hubungi owner bot.');
            } else if (status === 403) {
                throw new Error('🚫 Akses ditolak. API Key mungkin tidak memiliki akses ke model ini.');
            } else if (status === 500 || status === 502 || status === 503) {
                throw new Error('⚠️ Server OpenAI sedang bermasalah. Coba lagi nanti atau gunakan AI lain.');
            } else {
                throw new Error(`❌ OpenAI Error (${status}): ${errorData?.error?.message || 'Unknown error'}`);
            }
        } else if (error.code === 'ECONNABORTED') {
            throw new Error('⏱️ Request timeout. OpenAI terlalu lama merespons. Coba lagi.');
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            throw new Error('🌐 Tidak dapat terhubung ke OpenAI. Periksa koneksi internet.');
        } else {
            throw new Error(`❌ Error: ${error.message}`);
        }
    }
}

/**
 * Panggil Gemini API
 */
async function callGemini(messages, apiConfig) {
    try {
        // Pisahkan system prompt dari pesan user
        const systemMsg = messages.find(m => m.role === 'system');
        const userMessages = messages.filter(m => m.role !== 'system');

        const contents = userMessages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const requestBody = {
            contents: contents,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2000
            }
        };

        // Kirim system prompt via systemInstruction jika ada
        if (systemMsg) {
            requestBody.systemInstruction = {
                parts: [{ text: systemMsg.content }]
            };
        }

        const response = await axios.post(
            `${apiConfig.baseUrl}/models/${apiConfig.model}:generateContent?key=${apiConfig.apiKey}`,
            requestBody,
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 60000
            }
        );
        
        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        if (error.response) {
            const status = error.response.status;
            const errorData = error.response.data;
            
            if (status === 429) {
                throw new Error('⏳ Rate limit tercapai! API Gemini sedang sibuk. Coba lagi dalam beberapa menit atau gunakan AI lain.');
            } else if (status === 400) {
                throw new Error('⚠️ Request tidak valid. API Key Gemini mungkin salah atau expired.');
            } else if (status === 403) {
                throw new Error('🚫 Akses ditolak. Periksa API Key Gemini Anda.');
            } else if (status === 500 || status === 502 || status === 503) {
                throw new Error('⚠️ Server Gemini sedang bermasalah. Coba lagi nanti.');
            } else {
                throw new Error(`❌ Gemini Error (${status}): ${errorData?.error?.message || 'Unknown error'}`);
            }
        } else if (error.code === 'ECONNABORTED') {
            throw new Error('⏱️ Request timeout. Gemini terlalu lama merespons. Coba lagi.');
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            throw new Error('🌐 Tidak dapat terhubung ke Gemini. Periksa koneksi internet.');
        } else {
            throw new Error(`❌ Error: ${error.message}`);
        }
    }
}

/**
 * Panggil Groq API
 */
async function callGroq(messages, apiConfig) {
    try {
        const response = await axios.post(
            `${apiConfig.baseUrl}/chat/completions`,
            {
                model: apiConfig.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiConfig.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        );
        
        return response.data.choices[0].message.content;
    } catch (error) {
        if (error.response) {
            const status = error.response.status;
            const errorData = error.response.data;
            
            if (status === 429) {
                throw new Error('⏳ Rate limit tercapai! API Groq sedang sibuk. Coba lagi dalam beberapa menit atau gunakan AI lain.');
            } else if (status === 401) {
                throw new Error('🔑 API Key Groq tidak valid. Silakan hubungi owner bot.');
            } else if (status === 403) {
                throw new Error('🚫 Akses ditolak. API Key mungkin tidak memiliki akses ke model ini.');
            } else if (status === 500 || status === 502 || status === 503) {
                throw new Error('⚠️ Server Groq sedang bermasalah. Coba lagi nanti.');
            } else {
                throw new Error(`❌ Groq Error (${status}): ${errorData?.error?.message || 'Unknown error'}`);
            }
        } else if (error.code === 'ECONNABORTED') {
            throw new Error('⏱️ Request timeout. Groq terlalu lama merespons. Coba lagi.');
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            throw new Error('🌐 Tidak dapat terhubung ke Groq. Periksa koneksi internet.');
        } else {
            throw new Error(`❌ Error: ${error.message}`);
        }
    }
}

/**
 * Panggil Free AI API sebagai fallback
 */
async function callFreeAI(question) {
    try {
        // Menggunakan API gratis dari Aivvm
        const response = await axios.post(
            'https://api.aivvm.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: question }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        );
        
        if (response.data && response.data.choices && response.data.choices[0]) {
            return response.data.choices[0].message.content;
        }
        
        throw new Error('Invalid response from Free AI API');
    } catch (error) {
        // Try alternative free API
        try {
            const altResponse = await axios.get(
                `https://api.vhtear.com/ai?query=${encodeURIComponent(question)}`,
                { timeout: 60000 }
            );
            
            if (altResponse.data && altResponse.data.result) {
                return altResponse.data.result;
            }
        } catch (altError) {
            // If all fails, throw original error
            throw error;
        }
    }
}

/**
 * Fungsi utama untuk memanggil AI berdasarkan provider
 */
async function askAI(providerId, question, sender) {
    const aiConfig = getAIConfig();
    const provider = AI_PROVIDERS[providerId] || AI_PROVIDERS['1'];
    const apiConfig = aiConfig[provider.id];
    
    // Check if API key is configured
    if (!apiConfig.apiKey) {
        console.log(`[AI] No API key for ${provider.name}, using free AI fallback...`);
        const answer = await callFreeAI(question);
        return {
            provider: { ...provider, name: provider.name + ' (Free)' },
            answer: answer
        };
    }
    
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: question }
    ];
    
    let answer;
    
    try {
        switch (provider.id) {
            case 'openai':
                answer = await callOpenAI(messages, apiConfig);
                break;
            case 'gemini':
                answer = await callGemini(messages, apiConfig);
                break;
            case 'groq':
                answer = await callGroq(messages, apiConfig);
                break;
            default:
                throw new Error('Provider AI tidak dikenal');
        }
    } catch (error) {
        // If paid API fails, try free AI as fallback
        console.log(`[AI] ${provider.name} failed, trying free AI fallback...`);
        console.log(`[AI] Error: ${error.message}`);
        
        try {
            answer = await callFreeAI(question);
            return {
                provider: { ...provider, name: 'Free AI (Fallback)' },
                answer: answer
            };
        } catch (fallbackError) {
            // If fallback also fails, throw original error
            throw error;
        }
    }
    
    return {
        provider: provider,
        answer: answer
    };
}

/**
 * Tampilkan menu pemilihan AI
 */
function generateAIMenu(currentProvider) {
    let text = `╭──「 🤖 *PILIH AI MODEL* 」\n`;
    text += `│ Pilih model AI yang ingin digunakan:\n`;
    text += `╰───────────\n\n`;
    
    for (const [key, provider] of Object.entries(AI_PROVIDERS)) {
        const isCurrent = currentProvider === provider.id ? ' ✅' : '';
        text += `${provider.color} *${key}. ${provider.name}*${isCurrent}\n`;
        text += `   ${provider.emoji} ${provider.description}\n\n`;
    }
    
    text += `💡 *Cara menggunakan:*\n`;
    text += `• \`.ai pilih 1\` - Pilih OpenAI GPT\n`;
    text += `• \`.ai pilih 2\` - Pilih Google Gemini\n`;
    text += `• \`.ai pilih 3\` - Pilih Groq Llama\n`;
    text += `• \`.ai reset\` - Reset ke default (OpenAI)\n`;
    text += `• \`.ai <pertanyaan>\` - Tanya langsung ke AI aktif\n\n`;
    text += `📝 *Catatan:* Setiap user punya preferensi AI sendiri.`;
    
    return text;
}

module.exports = {
    callPollinations,
    callOpenRouter,
    callOpenAI,
    callGemini,
    callGroq,
    callFreeAI,
    askAI,
    generateAIMenu
};