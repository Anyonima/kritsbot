const config = require('../config');

// Load semua plugin
const downloader = require('./plugins/downloader');
const sticker    = require('./plugins/sticker');
const tools      = require('./plugins/tools');
const games      = require('./plugins/games');
const group      = require('./plugins/group');
const ai         = require('./plugins/ai');

// Cooldown tracker
const cooldowns = new Map();

/**
 * Handler utama — router command ke plugin yang sesuai
 */
async function handler(sock, msg, store) {
  const { from, isCommand, command, args, arg, text, isGroup, isAdmin, isBotAdmin, isOwner, sender } = msg;

  // === Cooldown Check ===
  if (isCommand) {
    const cdKey = `${sender}:${command}`;
    const now = Date.now();
    const cooldownMs = config.cooldown * 1000;
    if (cooldowns.has(cdKey)) {
      const expires = cooldowns.get(cdKey);
      if (now < expires) {
        const sisa = ((expires - now) / 1000).toFixed(1);
        return msg.reply(`⏳ Tunggu *${sisa}* detik lagi sebelum pakai command ini.`);
      }
    }
    cooldowns.set(cdKey, now + cooldownMs);
    setTimeout(() => cooldowns.delete(cdKey), cooldownMs);
  }

  // === Command Router ===
  if (isCommand) {
    switch (command) {

      // ─── MENU ───
      case 'menu':
      case 'help':
        return sendMenu(sock, msg);

      // ─── DOWNLOADER ───
      case 'tiktok':
      case 'tt':
        return downloader.tiktok(sock, msg);

      case 'ig':
      case 'instagram':
        return downloader.instagram(sock, msg);

      case 'fb':
      case 'facebook':
        return downloader.facebook(sock, msg);

      case 'yt':
      case 'youtube':
        return downloader.youtube(sock, msg);

      case 'ytmp3':
        return downloader.youtubeAudio(sock, msg);

      // ─── STICKER ───
      case 'sticker':
      case 's':
        return sticker.makeSticker(sock, msg);

      // ─── TOOLS ───
      case 'tts':
        return tools.tts(sock, msg);

      case 'translate':
      case 'tr':
        return tools.translate(sock, msg);

      case 'cuaca':
      case 'weather':
        return tools.cuaca(sock, msg);

      case 'qr':
        return tools.qrCode(sock, msg);

      case 'calc':
      case 'hitung':
        return tools.calculate(sock, msg);

      // ─── GAMES ───
      case 'tebakkata':
      case 'tk':
        return games.tebakKata(sock, msg);

      case 'kuis':
      case 'quiz':
        return games.kuis(sock, msg);

      case 'ttt':
      case 'tictactoe':
        return games.ticTacToe(sock, msg);

      case 'truth':
        return games.truth(sock, msg);

      case 'dare':
        return games.dare(sock, msg);

      case 'leaderboard':
      case 'lb':
        return games.leaderboard(sock, msg);

      // ─── GROUP ───
      case 'tagall':
      case 'everyone':
        if (!isGroup) return msg.reply('❌ Command ini hanya bisa dipakai di grup!');
        return group.tagAll(sock, msg);

      case 'warn':
        if (!isGroup) return msg.reply('❌ Command ini hanya bisa dipakai di grup!');
        if (!isAdmin && !isOwner) return msg.reply('❌ Hanya admin yang bisa menggunakan command ini!');
        return group.warn(sock, msg);

      case 'resetwarn':
        if (!isGroup) return msg.reply('❌ Command ini hanya bisa dipakai di grup!');
        if (!isAdmin && !isOwner) return msg.reply('❌ Hanya admin yang bisa menggunakan command ini!');
        return group.resetWarn(sock, msg);

      case 'kick':
        if (!isGroup) return msg.reply('❌ Command ini hanya bisa dipakai di grup!');
        if (!isAdmin && !isOwner) return msg.reply('❌ Hanya admin yang bisa menggunakan command ini!');
        if (!isBotAdmin) return msg.reply('❌ Bot harus jadi admin dulu!');
        return group.kick(sock, msg);

      case 'promote':
      case 'add':
        if (!isGroup) return msg.reply('❌ Command ini hanya bisa dipakai di grup!');
        if (!isAdmin && !isOwner) return msg.reply('❌ Hanya admin yang bisa menggunakan command ini!');
        if (!isBotAdmin) return msg.reply('❌ Bot harus jadi admin dulu!');
        return group.promote(sock, msg);

      case 'demote':
        if (!isGroup) return msg.reply('❌ Command ini hanya bisa dipakai di grup!');
        if (!isAdmin && !isOwner) return msg.reply('❌ Hanya admin yang bisa menggunakan command ini!');
        if (!isBotAdmin) return msg.reply('❌ Bot harus jadi admin dulu!');
        return group.demote(sock, msg);

      case 'mute':
      case 'unmute':
        if (!isGroup) return msg.reply('❌ Command ini hanya bisa dipakai di grup!');
        if (!isAdmin && !isOwner) return msg.reply('❌ Hanya admin yang bisa menggunakan command ini!');
        if (!isBotAdmin) return msg.reply('❌ Bot harus jadi admin dulu!');
        return group.muteGroup(sock, msg, command === 'mute');

      case 'antilink':
        if (!isGroup) return msg.reply('❌ Command ini hanya bisa dipakai di grup!');
        if (!isAdmin && !isOwner) return msg.reply('❌ Hanya admin yang bisa menggunakan command ini!');
        return group.antiLink(sock, msg);

      case 'welcome':
        if (!isGroup) return msg.reply('❌ Command ini hanya bisa dipakai di grup!');
        if (!isAdmin && !isOwner) return msg.reply('❌ Hanya admin yang bisa menggunakan command ini!');
        return group.setWelcome(sock, msg);

      // ─── AI ───
      case 'ai':
      case 'gpt':
      case 'gemini':
        return ai.chat(sock, msg);

      default:
        // Tidak ada command yang cocok, diam saja
        break;
    }
  }

  // === Anti-Link Handler (non-command) ===
  if (isGroup && !isAdmin && !isOwner) {
    await group.checkAntiLink(sock, msg);
  }
}

async function sendMenu(sock, msg) {
  const { botName, prefix, footer } = config;
  const menu = `╔══════════════════════╗
║   🤖 *${botName}* Menu   ║
╚══════════════════════╝

📥 *DOWNLOADER*
├ ${prefix}tiktok <url> - Download TikTok
├ ${prefix}ig <url> - Download Instagram
├ ${prefix}fb <url> - Download Facebook
├ ${prefix}yt <url> - Download YouTube (video)
└ ${prefix}ytmp3 <url> - Download YouTube (mp3)

🎮 *GAMES*
├ ${prefix}tebakkata - Tebak kata tersembunyi
├ ${prefix}kuis - Kuis random berhadiah poin
├ ${prefix}ttt - Tic-Tac-Toe
├ ${prefix}truth - Random Truth
├ ${prefix}dare - Random Dare
└ ${prefix}leaderboard - Cek top skor

🛠️ *TOOLS*
├ ${prefix}sticker - Foto/video jadi stiker
├ ${prefix}tts <teks> - Text to Speech
├ ${prefix}translate <lang> <teks> - Terjemah
├ ${prefix}cuaca <kota> - Cek cuaca
├ ${prefix}qr <teks> - Buat QR Code
└ ${prefix}calc <expr> - Kalkulator

👥 *GROUP* _(admin only)_
├ ${prefix}tagall - Mention semua member
├ ${prefix}warn @user - Beri peringatan
├ ${prefix}resetwarn @user - Reset warn
├ ${prefix}kick @user - Keluarkan member
├ ${prefix}promote @user - Jadikan admin
├ ${prefix}demote @user - Copot admin
├ ${prefix}mute / ${prefix}unmute - Kunci grup
├ ${prefix}antilink on/off - Anti link
└ ${prefix}welcome on/off - Welcome msg

🤖 *AI*
└ ${prefix}ai <pertanyaan> - Chat Gemini AI

${footer}`;

  return sock.sendMessage(msg.from, { text: menu }, { quoted: msg._raw });
}

module.exports = handler;
