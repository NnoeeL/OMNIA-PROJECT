/**
 * @file plugins/utility/tulis.js
 * @description Render teks bergaya tulisan tangan pada kertas folio
 */

const fs = require('fs');
const path = require('path');
const fontkit = require('fontkit');
const sharp = require('sharp');

const PAPER_PATH = path.join(__dirname, '../../assets/images/folio.jpg');
const FONT_PATH = path.join(__dirname, '../../assets/fonts/Kalam-Regular.ttf');
const MAX_ROWS = 39;
const MAX_PAGES = 4;
const MAX_TEXT_LENGTH = 3000;
const LEFT_MARGIN = 32;
const RIGHT_MARGIN = 676;
const FIRST_BASELINE = 120;
const ROW_SPACING = 23.4;
const FONT_SIZE = 16;
const INK_COLOR = '#193858';
const font = fontkit.openSync(FONT_PATH);

const pluginConfig = {
    name: 'tulis',
    alias: ['tuliskertas', 'handwriting'],
    category: 'utility',
    description: 'Tulis teks dengan font tulisan tangan pada kertas folio',
    usage: '.tulis <teks> atau reply pesan teks dengan .tulis',
    example: '.tulis Belajar dengan tekun untuk meraih cita-cita.',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 1,
    isEnabled: true
};

function measureText(text) {
    const run = font.layout(text);
    const width = run.positions.reduce((sum, position) => sum + position.xAdvance, 0);
    return width * FONT_SIZE / font.unitsPerEm;
}

function wrapText(text, maxWidth) {
    const lines = [];

    for (const paragraph of text.replace(/\r\n?/g, '\n').split('\n')) {
        if (!paragraph.trim()) {
            lines.push('');
            continue;
        }

        let line = '';
        for (const word of paragraph.trim().split(/\s+/)) {
            const candidate = line ? `${line} ${word}` : word;
            if (measureText(candidate) <= maxWidth) {
                line = candidate;
                continue;
            }

            if (line) lines.push(line);
            line = '';

            if (measureText(word) <= maxWidth) {
                line = word;
                continue;
            }

            for (const character of Array.from(word)) {
                const next = line + character;
                if (line && measureText(next) > maxWidth) {
                    lines.push(line);
                    line = character;
                } else {
                    line = next;
                }
            }
        }
        lines.push(line);
    }

    while (lines.length && !lines[lines.length - 1]) lines.pop();
    return lines;
}

function jitter(seed) {
    const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return (value - Math.floor(value)) * 2 - 1;
}

function renderLine(text, y, row) {
    const run = font.layout(text);
    const scale = FONT_SIZE / font.unitsPerEm;
    let cursorX = LEFT_MARGIN;
    let paths = '';

    run.glyphs.forEach((glyph, index) => {
        const position = run.positions[index];
        const x = cursorX + position.xOffset * scale;
        const baseline = y + jitter(row * 101 + index) * 0.35 + (x - LEFT_MARGIN) * 0.005;
        const rotation = jitter(row * 211 + index) * 0.45;
        const pathData = glyph.path.toSVG();

        if (pathData) {
            paths += `<path d="${pathData}" transform="translate(${x.toFixed(2)} ${baseline.toFixed(2)}) rotate(${rotation.toFixed(2)}) scale(${scale.toFixed(5)} ${(-scale).toFixed(5)})"/>`;
        }
        cursorX += position.xAdvance * scale;
    });

    return paths;
}

async function createHandwritingPages(text, maxPages) {
    if (text.length > MAX_TEXT_LENGTH) {
        throw new Error(`Teks terlalu panjang. Maksimal ${MAX_TEXT_LENGTH} karakter per gambar.`);
    }

    const availableWidth = RIGHT_MARGIN - LEFT_MARGIN;
    const lines = wrapText(text, availableWidth);

    const maxTotalRows = MAX_ROWS * maxPages;
    if (lines.length > maxTotalRows) {
        throw new Error(`Teks terlalu panjang. Maksimal ${maxTotalRows} baris (${maxPages} lembar folio), teks ini menjadi ${lines.length} baris.`);
    }

    const unsupported = Array.from(new Set(
        Array.from(text).filter(character =>
            !/[\s]/u.test(character) && !font.hasGlyphForCodePoint(character.codePointAt(0))
        )
    ));
    if (unsupported.length) {
        throw new Error(`Font tulisan tangan belum mendukung karakter: ${unsupported.slice(0, 8).join(' ')}`);
    }

    const paper = await sharp(PAPER_PATH).metadata();
    const pages = [];
    for (let offset = 0; offset < lines.length; offset += MAX_ROWS) {
        const pageLines = lines.slice(offset, offset + MAX_ROWS);
        const paths = pageLines.map((line, row) =>
            renderLine(line, FIRST_BASELINE + row * ROW_SPACING, row)
        ).join('');

        const overlay = Buffer.from(
            `<svg xmlns="http://www.w3.org/2000/svg" width="${paper.width}" height="${paper.height}"><g fill="${INK_COLOR}">${paths}</g></svg>`
        );

        pages.push(
            await sharp(PAPER_PATH)
                .composite([{ input: overlay }])
                .jpeg({ quality: 92, mozjpeg: true })
                .toBuffer()
        );
    }

    return pages;
}

async function createHandwritingImage(text) {
    const pages = await createHandwritingPages(text, 1);
    return pages[0];
}

async function createHandwritingImages(text) {
    return createHandwritingPages(text, MAX_PAGES);
}

async function handler(m) {
    const text = (m.fullArgs || '').trim() || m.quoted?.body?.trim();
    if (!text) {
        return m.reply(
            `✍️ *Tulisan Tangan di Kertas Folio*\n\n` +
            `Gunakan *.tulis <teks>* atau reply pesan teks dengan *.tulis*.\n` +
            `Font Kalam memberi tampilan tulisan tangan. Maksimal ${MAX_ROWS} baris per gambar dan ${MAX_PAGES} gambar folio per perintah.`
        );
    }

    await m.react('✍️');
    try {
        const images = await createHandwritingImages(text);
        for (let index = 0; index < images.length; index += 1) {
            const caption = images.length > 1
                ? `✍️ Tulisan folio (${index + 1}/${images.length})`
                : '✍️ Tulisanmu sudah dibuat di kertas folio.';
            await m.replyImage(images[index], caption);
        }
        await m.react('✅');
    } catch (error) {
        console.error('[Tulis Plugin Error]:', error);
        await m.react('❌');
        await m.reply(`❌ Tidak dapat membuat tulisan:\n_${error.message || 'Error tidak diketahui'}_`);
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    createHandwritingImage,
    createHandwritingImages,
    wrapText
};
