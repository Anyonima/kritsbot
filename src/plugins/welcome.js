const { getGroupSetting } = require('../lib/database');

/**
 * Handle grup events — welcome & goodbye message
 */
async function handleGroupUpdate(sock, update) {
  const { id: groupId, participants, action } = update;

  // Cek apakah welcome diaktifkan di grup ini
  const welcomeEnabled = getGroupSetting(groupId, 'welcome');
  if (!welcomeEnabled) return;

  try {
    const meta = await sock.groupMetadata(groupId);
    const groupName = meta.subject || 'Grup';

    for (const participant of participants) {
      const userNum = participant.split('@')[0];

      if (action === 'add') {
        // Welcome message
        await sock.sendMessage(groupId, {
          text:
            `╔══════════════════╗\n` +
            `║  👋 *SELAMAT DATANG*  ║\n` +
            `╚══════════════════╝\n\n` +
            `Hay @${userNum}! 🎉\n\n` +
            `Selamat bergabung di *${groupName}*!\n` +
            `Semoga betah dan sesuai dengan aturan grup ya~ 😊\n\n` +
            `📌 Baca deskripsi grup untuk aturan!`,
          mentions: [participant]
        });

      } else if (action === 'remove') {
        // Goodbye message
        await sock.sendMessage(groupId, {
          text:
            `👋 *SAMPAI JUMPA*\n\n` +
            `@${userNum} telah meninggalkan grup.\n\n` +
            `Semoga sukses selalu! 🙏`,
          mentions: [participant]
        });
      }
    }
  } catch (err) {
    console.error('[Welcome Error]', err.message);
  }
}

module.exports = { handleGroupUpdate };
