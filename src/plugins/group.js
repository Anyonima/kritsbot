const { getWarns, addWarn, resetWarn: resetWarnDB, getGroupSetting, setGroupSetting } = require('../lib/database');

/**
 * Tag semua member grup
 */
async function tagAll(sock, msg) {
  const { from, groupMembers, _raw } = msg;
  if (!groupMembers || groupMembers.length === 0) {
    return msg.reply('❌ Tidak bisa ambil daftar member.');
  }

  const mentions = groupMembers.map(p => p.id);
  const mentionText = mentions.map(id => `@${id.split('@')[0]}`).join(' ');
  const customText = msg.arg || '📢 *Perhatian semua!*';

  await sock.sendMessage(from, {
    text: `${customText}\n\n${mentionText}`,
    mentions
  }, { quoted: _raw });
}

/**
 * Beri peringatan ke user
 */
async function warn(sock, msg) {
  const { from, _raw } = msg;
  const cfg = require('../../config');

  const mentioned = msg._raw.message?.extendedTextMessage?.contextInfo?.mentionedJid ||
                    msg._raw.message?.extendedTextMessage?.contextInfo?.participant
                    ? [msg._raw.message.extendedTextMessage.contextInfo.participant]
                    : [];

  let target = mentioned[0];
  if (!target && msg.arg) {
    const num = msg.arg.replace(/[^0-9]/g, '');
    if (num) target = `${num}@s.whatsapp.net`;
  }

  if (!target) return msg.reply('❌ Tag/mention user yang mau diberi peringatan!\nContoh: .warn @user');

  const warns = addWarn(from, target);
  const targetNum = target.split('@')[0];

  if (warns >= cfg.maxWarn) {
    // Kick user
    try {
      await sock.groupParticipantsUpdate(from, [target], 'remove');
      resetWarnDB(from, target);
      return sock.sendMessage(from, {
        text: `⚠️ @${targetNum} telah mendapat *${warns} peringatan* dan telah dikeluarkan dari grup!`,
        mentions: [target]
      }, { quoted: _raw });
    } catch {
      return msg.reply(`⚠️ @${targetNum} sudah ${warns}x warn tapi gagal kick (bot bukan admin?)`);
    }
  }

  await sock.sendMessage(from, {
    text: `⚠️ *PERINGATAN* untuk @${targetNum}\n\n📊 Peringatan: *${warns}/${cfg.maxWarn}*\n\n${warns >= cfg.maxWarn - 1 ? '🚨 Peringatan berikutnya = KICK!' : ''}`,
    mentions: [target]
  }, { quoted: _raw });
}

/**
 * Reset warn user
 */
async function resetWarn(sock, msg) {
  const { from, _raw } = msg;

  const mentioned = msg._raw.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  let target = mentioned[0];
  if (!target && msg.arg) {
    const num = msg.arg.replace(/[^0-9]/g, '');
    if (num) target = `${num}@s.whatsapp.net`;
  }

  if (!target) return msg.reply('❌ Tag/mention user yang mau direset warnnya!');

  resetWarnDB(from, target);
  const targetNum = target.split('@')[0];

  await sock.sendMessage(from, {
    text: `✅ Peringatan untuk @${targetNum} telah direset!`,
    mentions: [target]
  }, { quoted: _raw });
}

/**
 * Kick member dari grup
 */
async function kick(sock, msg) {
  const { from, _raw } = msg;

  const mentioned = msg._raw.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  let target = mentioned[0];
  if (!target && msg.arg) {
    const num = msg.arg.replace(/[^0-9]/g, '');
    if (num) target = `${num}@s.whatsapp.net`;
  }

  if (!target) return msg.reply('❌ Tag user yang mau dikick!\nContoh: .kick @user');

  try {
    await sock.groupParticipantsUpdate(from, [target], 'remove');
    const targetNum = target.split('@')[0];
    await sock.sendMessage(from, {
      text: `✅ @${targetNum} telah dikeluarkan dari grup!`,
      mentions: [target]
    }, { quoted: _raw });
  } catch (err) {
    msg.reply('❌ Gagal kick. Pastikan bot adalah admin!');
  }
}

/**
 * Promote member jadi admin
 */
async function promote(sock, msg) {
  const { from, _raw } = msg;

  const mentioned = msg._raw.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  let target = mentioned[0];
  if (!target && msg.arg) {
    const num = msg.arg.replace(/[^0-9]/g, '');
    if (num) target = `${num}@s.whatsapp.net`;
  }

  if (!target) return msg.reply('❌ Tag user yang mau dijadikan admin!\nContoh: .promote @user');

  try {
    await sock.groupParticipantsUpdate(from, [target], 'promote');
    const targetNum = target.split('@')[0];
    await sock.sendMessage(from, {
      text: `⬆️ @${targetNum} sekarang menjadi *admin* grup!`,
      mentions: [target]
    }, { quoted: _raw });
  } catch {
    msg.reply('❌ Gagal promote. Pastikan bot adalah admin!');
  }
}

/**
 * Demote admin jadi member biasa
 */
async function demote(sock, msg) {
  const { from, _raw } = msg;

  const mentioned = msg._raw.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  let target = mentioned[0];
  if (!target && msg.arg) {
    const num = msg.arg.replace(/[^0-9]/g, '');
    if (num) target = `${num}@s.whatsapp.net`;
  }

  if (!target) return msg.reply('❌ Tag admin yang mau dicopot!\nContoh: .demote @user');

  try {
    await sock.groupParticipantsUpdate(from, [target], 'demote');
    const targetNum = target.split('@')[0];
    await sock.sendMessage(from, {
      text: `⬇️ @${targetNum} tidak lagi menjadi *admin* grup.`,
      mentions: [target]
    }, { quoted: _raw });
  } catch {
    msg.reply('❌ Gagal demote. Pastikan bot adalah admin!');
  }
}

/**
 * Mute/Unmute grup
 */
async function muteGroup(sock, msg, mute) {
  const { from, _raw } = msg;
  try {
    await sock.groupSettingUpdate(from, mute ? 'announcement' : 'not_announcement');
    await msg.reply(mute
      ? '🔇 Grup telah di-*mute*. Hanya admin yang bisa mengirim pesan.'
      : '🔊 Grup telah di-*unmute*. Semua member bisa mengirim pesan.'
    );
  } catch {
    msg.reply('❌ Gagal ubah pengaturan grup. Pastikan bot adalah admin!');
  }
}

/**
 * Toggle Anti-Link
 */
async function antiLink(sock, msg) {
  const { from } = msg;
  const status = msg.args[0]?.toLowerCase();

  if (!['on', 'off'].includes(status)) {
    const current = getGroupSetting(from, 'antilink') ? 'ON ✅' : 'OFF ❌';
    return msg.reply(`🔗 *Anti-Link* sekarang: *${current}*\n\nGunakan:\n.antilink on — Aktifkan\n.antilink off — Matikan`);
  }

  const enabled = status === 'on';
  setGroupSetting(from, 'antilink', enabled);
  await msg.reply(enabled
    ? '✅ *Anti-Link* diaktifkan!\nMember yang kirim link akan dihapus pesannya.'
    : '❌ *Anti-Link* dimatikan.'
  );
}

/**
 * Cek dan hapus link (dipanggil dari handler untuk setiap pesan non-command)
 */
async function checkAntiLink(sock, msg) {
  const { from, text, sender, _raw } = msg;
  if (!getGroupSetting(from, 'antilink')) return;

  const linkRegex = /(https?:\/\/|www\.|bit\.ly|t\.me|wa\.me|tiktok\.com|instagram\.com|fb\.com)/gi;
  if (!linkRegex.test(text)) return;

  try {
    await sock.sendMessage(from, { delete: msg.key });
    await sock.sendMessage(from, {
      text: `🔗 @${sender.split('@')[0]} Dilarang kirim link di grup ini!`,
      mentions: [sender]
    });
  } catch (err) {
    console.error('[AntiLink Error]', err.message);
  }
}

/**
 * Toggle Welcome Message
 */
async function setWelcome(sock, msg) {
  const { from } = msg;
  const status = msg.args[0]?.toLowerCase();

  if (!['on', 'off'].includes(status)) {
    const current = getGroupSetting(from, 'welcome') ? 'ON ✅' : 'OFF ❌';
    return msg.reply(`👋 *Welcome Message* sekarang: *${current}*\n\nGunakan:\n.welcome on — Aktifkan\n.welcome off — Matikan`);
  }

  const enabled = status === 'on';
  setGroupSetting(from, 'welcome', enabled);
  await msg.reply(enabled
    ? '✅ *Welcome Message* diaktifkan!'
    : '❌ *Welcome Message* dimatikan.'
  );
}

module.exports = { tagAll, warn, resetWarn, kick, promote, demote, muteGroup, antiLink, checkAntiLink, setWelcome };
