const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const YTDLP = require('./yt-dlp');

const execFileAsync = promisify(execFile);

async function runYtdlp(args, options = {}) {
    const fullArgs = [];
    if (options.ffmpegPath) {
        fullArgs.push('--ffmpeg-location', options.ffmpegPath);
    }

    const cookiesFile = process.env.YTDLP_COOKIES_FILE?.trim();
    if (cookiesFile) {
        const cookiesPath = path.resolve(cookiesFile);
        if (!fs.existsSync(cookiesPath)) {
            throw new Error(`File cookies yt-dlp tidak ditemukan: ${cookiesPath}`);
        }
        fullArgs.push('--cookies', cookiesPath);
    }

    fullArgs.push(...args);
    let stdout;
    try {
        ({ stdout } = await execFileAsync(YTDLP, fullArgs, {
            timeout: options.timeout || 120000,
            maxBuffer: options.maxBuffer || 20 * 1024 * 1024,
            windowsHide: true
        }));
    } catch (error) {
        if (error.stderr?.trim()) {
            error.message = error.stderr.trim();
        }
        throw error;
    }

    return stdout.trim();
}

function getYtdlpAuthErrorMessage(error) {
    const message = error?.message || '';
    if (/sign in to confirm|confirm you're not a bot/i.test(message)) {
        return 'YouTube meminta autentikasi. Atur YTDLP_COOKIES_FILE di .env ke path cookies.txt yang valid, lalu restart bot.';
    }
    if (/file cookies yt-dlp tidak ditemukan/i.test(message)) {
        return message;
    }
    return null;
}

module.exports = runYtdlp;
module.exports.getYtdlpAuthErrorMessage = getYtdlpAuthErrorMessage;
