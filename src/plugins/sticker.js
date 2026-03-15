const { downloadContentFromMessage, getContentType } = require('@whiskeysockets/baileys');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Convert gambar/gif/video menjadi stiker WhatsApp
 */
async function makeSticker(sock, msg) {
  const { from, _raw, quoted, type, mimetype } = msg;
  const cfg = require('../../config');

  // Ambil media dari pesan yang di-reply atau pesan langsung
  let mediaMsg = null;
  let mediaType = null;

  if (quoted) {
    // Dari pesan yang di-reply
    const quotedType = quoted.type;
    if (['imageMessage', 'videoMessage', 'stickerMessage'].includes(quotedType)) {
      mediaMsg = _raw.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      mediaType = quotedType.replace('Message', '');
    }
  } else if (['imageMessage', 'videoMessage'].includes(type)) {
    // Dari pesan langsung (dengan caption)
    mediaMsg = _raw.message;
    mediaType = type.replace('Message', '');
  }

  if (!mediaMsg || !mediaType) {
    return msg.reply(`❌ Kirim/reply gambar atau video pendek dengan command *${cfg.prefix}sticker*`);
  }

  await msg.react('⏳');

  try {
    // Download media
    const stream = await downloadContentFromMessage(
      mediaMsg[`${mediaType}Message`],
      mediaType
    );
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const tmpDir = '/tmp/kritsbot';
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    let stickerBuffer;

    if (mediaType === 'image') {
      // Convert gambar ke webp
      stickerBuffer = await sharp(buffer)
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 80 })
        .toBuffer();
    } else if (mediaType === 'video') {
      // Convert video ke animated webp via ffmpeg
      const inputPath = path.join(tmpDir, `input_${Date.now()}.mp4`);
      const outputPath = path.join(tmpDir, `sticker_${Date.now()}.webp`);
      fs.writeFileSync(inputPath, buffer);

      const ffmpegPath = require('ffmpeg-static');
      execSync(
        `"${ffmpegPath}" -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15" -vcodec libwebp -lossless 0 -compression_level 6 -q:v 50 -loop 0 -preset picture -an -vsync 0 -t 8 "${outputPath}"`,
        { timeout: 30000 }
      );

      stickerBuffer = fs.readFileSync(outputPath);

      // Cleanup
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    }

    if (!stickerBuffer) throw new Error('Gagal membuat stiker');

    await sock.sendMessage(from, {
      sticker: stickerBuffer
    }, { quoted: _raw });

    await msg.react('✅');

  } catch (err) {
    console.error('[Sticker Error]', err.message);
    await msg.react('❌');
    msg.reply('❌ Gagal buat stiker. Untuk video, pastikan durasinya tidak terlalu panjang.');
  }
}

module.exports = { makeSticker };
