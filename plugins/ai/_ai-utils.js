/**
 * @file plugins/ai/ai-utils.js
 * @description Utility functions for AI Chat
 * @author Ourin-AI Team
 * @version 1.0.0
 */

const axios = require('axios');
const config = require('../../config');
const { getDatabase } = require('../../src/lib/database');

/**
 * Konfigurasi AI Providers
 */
const AI_PROVIDERS = {
    '1': {
        id: 'openai',
        name: 'OpenAI GPT-4o Mini',
        emoji: '🤖',
        description: 'Model cepat dan efisien dari OpenAI',
        color: '🟢'
    },
    '2': {
        id: 'gemini',
        name: 'Google Gemini 1.5 Flash',
        emoji: '✨',
        description: 'Model multimodal terbaru dari Google',
        color: '🔵'
    },
    '3': {
        id: 'groq',
        name: 'Groq Llama 3.1 70B',
        emoji: '⚡',
        description: 'Model super cepat dari Groq dengan Llama',
        color: '🟠'
    }
};

/**
 * System prompt untuk AI
 */
const SYSTEM_PROMPT = `Kamu adalah asisten AI yang membantu menjawab pertanyaan pengguna melalui WhatsApp.
Jawab dalam bahasa Indonesia yang natural dan mudah dipahami.
Jangan terlalu formal, gunakan gaya santai tapi informatif.
Batasi jawaban maksimal 3-4 paragraf agar tidak terlalu panjang untuk WhatsApp.`;

let aiApiCache = null;

/**
 * Ambil konfigurasi API dari config atau environment
 */
function getAIConfig() {
    if (aiApiCache) return aiApiCache;
    
    const cfg = config.ai || {};
    
    aiApiCache = {
        openai: {
            apiKey: cfg.openaiApiKey || process.env.OPENAI_API_KEY,
            baseUrl: cfg.openaiBaseUrl || 'https://api.openai.com/v1',
            model: cfg.openaiModel || 'gpt-4o-mini'
        },
        gemini: {
            apiKey: cfg.geminiApiKey || process.env.GEMINI_API_KEY,
            baseUrl: cfg.geminiBaseUrl || 'https://generativelanguage.googleapis.com/v1beta',
            model: cfg.geminiModel || 'gemini-3.8-flash'
        },
        groq: {
            apiKey: cfg.groqApiKey || process.env.GROQ_API_KEY,
            baseUrl: cfg.groqBaseUrl || 'https://api.groq.com/openai/v1',
            model: cfg.groqModel || 'llama-3.3-70b-versatile'
        },
        openrouter: {
            apiKey: cfg.openrouterApiKey || process.env.OPENROUTER_API_KEY,
            baseUrl: cfg.openrouterBaseUrl || 'https://openrouter.ai/api/v1',
            model: cfg.openrouterModel || 'deepseek/deepseek-r1:free'
        }
    };
    
    return aiApiCache;
}

/**
 * Simpan preferensi AI user ke database
 */
async function setUserAIPreference(sender, providerId) {
    const db = getDatabase();
    const user = db.getUser(sender) || {};
    db.setUser(sender, {
        ...user,
        aiProvider: providerId
    });
}

/**
 * Ambil preferensi AI user dari database
 */
function getUserAIPreference(sender) {
    const db = getDatabase();
    const user = db.getUser(sender);
    return user?.aiProvider || 'openai';
}

/**
 * Reset preferensi AI user
 */
async function resetUserAIPreference(sender) {
    const db = getDatabase();
    const user = db.getUser(sender);
    if (user && user.aiProvider) {
        delete user.aiProvider;
        db.setUser(sender, user);
    }
}

module.exports = {
    AI_PROVIDERS,
    SYSTEM_PROMPT,
    getAIConfig,
    setUserAIPreference,
    getUserAIPreference,
    resetUserAIPreference
};