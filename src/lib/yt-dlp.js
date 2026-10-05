const path = require('path')

module.exports = path.join(
    process.cwd(),
    'bin',
    process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
)
