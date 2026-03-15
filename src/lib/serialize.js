const { jidDecode, downloadContentFromMessage, getContentType } = require('@whiskeysockets/baileys');
const { Readable } = require('stream');
const config = require('../../config');

/**
 * Serialize pesan WhatsApp agar lebih mudah diproses
 */
async function serialize(sock, msg, store) {
  const m = {};

  m.key = msg.key;
  m.id = msg.key.id;
  m.from = msg.key.remoteJid;
  m.fromMe = msg.key.fromMe;
  m.isGroup = m.from?.endsWith('@g.us') || false;
  m.timestamp = msg.messageTimestamp ? new Date(msg.messageTimestamp * 1000) : new Date();
  m.pushName = msg.pushName || '';

  // Decode sender
  if (m.isGroup) {
    m.sender = msg.key.participant || msg.participant || '';
  } else {
    m.sender = m.from;
  }
  m.senderNumber = m.sender?.split('@')[0] || '';

  // Cek apakah owner
  m.isOwner = config.ownerNumber.split(',').map(n => n.trim()).includes(m.senderNumber);

  // Ambil tipe konten pesan
  const contentType = getContentType(msg.message);
  m.type = contentType;

  // Ekstrak pesan
  const content = msg.message?.[contentType];

  if (contentType === 'conversation') {
    m.text = msg.message.conversation;
  } else if (contentType === 'extendedTextMessage') {
    m.text = content?.text || '';
    m.quoted = content?.contextInfo?.quotedMessage ? await buildQuoted(content.contextInfo, store, msg.key.remoteJid) : null;
  } else if (['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'].includes(contentType)) {
    m.text = content?.caption || '';
    m.mimetype = content?.mimetype || '';
    m.mediaType = contentType.replace('Message', '');
  } else if (contentType === 'buttonsResponseMessage') {
    m.text = content?.selectedButtonId || '';
  } else if (contentType === 'listResponseMessage') {
    m.text = content?.singleSelectReply?.selectedRowId || '';
  } else {
    m.text = '';
  }

  // Normalize text
  m.text = (m.text || '').trim();
  m.body = m.text;

  // Detect command
  const prefix = config.prefix;
  m.prefix = prefix;
  m.isCommand = m.text.startsWith(prefix);

  if (m.isCommand) {
    const withoutPrefix = m.text.slice(prefix.length).trim();
    const args = withoutPrefix.split(/\s+/);
    m.command = args[0]?.toLowerCase() || '';
    m.args = args.slice(1);
    m.arg = m.args.join(' ');
    m.argsAll = withoutPrefix.slice(m.command.length).trim();
  } else {
    m.command = '';
    m.args = [];
    m.arg = '';
    m.argsAll = '';
  }

  // Info grup
  if (m.isGroup) {
    try {
      const metadata = await sock.groupMetadata(m.from);
      m.groupName = metadata.subject || '';
      m.groupMembers = metadata.participants || [];
      m.groupAdmins = metadata.participants
        .filter(p => p.admin)
        .map(p => p.id);
      m.isAdmin = m.groupAdmins.includes(m.sender);
      m.isBotAdmin = m.groupAdmins.some(a => a.includes(sock.user?.id?.split(':')[0]));
    } catch {
      m.groupName = '';
      m.groupMembers = [];
      m.groupAdmins = [];
      m.isAdmin = false;
      m.isBotAdmin = false;
    }
  }

  // Helper: reply
  m.reply = async (text, options = {}) => {
    return sock.sendMessage(m.from, {
      text: `${text}`,
      ...options
    }, { quoted: msg });
  };

  // Helper: react
  m.react = async (emoji) => {
    return sock.sendMessage(m.from, {
      react: { text: emoji, key: m.key }
    });
  };

  // Helper: download media
  m.downloadMedia = async () => {
    const stream = await downloadContentFromMessage(
      msg.message[contentType],
      m.mediaType
    );
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  };

  // Quoted message builder
  m.message = msg.message;
  m._raw = msg;

  return m;
}

async function buildQuoted(contextInfo, store, from) {
  if (!contextInfo?.quotedMessage) return null;
  const quotedType = getContentType(contextInfo.quotedMessage);
  const quoted = {
    type: quotedType,
    message: contextInfo.quotedMessage,
    stanzaId: contextInfo.stanzaId,
    participant: contextInfo.participant,
  };
  const content = contextInfo.quotedMessage?.[quotedType];
  quoted.text = content?.text || content?.caption || content?.conversation || '';
  quoted.mimetype = content?.mimetype || '';
  return quoted;
}

module.exports = { serialize };
