if (!globalThis.crypto) {
  globalThis.crypto = require('crypto').webcrypto;
}
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore, jidDecode } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { serialize } = require('./src/lib/serialize');
const handler = require('./src/handler');

// Buat folder session kalau belum ada
if (!fs.existsSync('./session')) fs.mkdirSync('./session');
if (!fs.existsSync('./src/data')) fs.mkdirSync('./src/data', { recursive: true });

const logger = pino({ level: 'silent' });

// In-memory store untuk cache pesan
const store = makeInMemoryStore({ logger });
store.readFromFile('./session/store.json');
setInterval(() => store.writeToFile('./session/store.json'), 10_000);

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: true,
    auth: state,
    browser: ['KritsBot', 'Chrome', '3.0'],
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    getMessage: async (key) => {
      if (store) {
        const msg = await store.loadMessage(key.remoteJid, key.id);
        return msg?.message || undefined;
      }
      return { conversation: 'hello' };
    },
  });

  store.bind(sock.ev);

  // Event: Update Koneksi
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📱 Scan QR Code di atas untuk menghubungkan WhatsApp!\n');
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error instanceof Boom)
        ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
        : true;

      console.log(`[KritsBot] Koneksi terputus. Alasan: ${lastDisconnect?.error?.message}`);

      if (shouldReconnect) {
        console.log('[KritsBot] Mencoba reconnect...');
        setTimeout(startBot, 3000);
      } else {
        console.log('[KritsBot] Session logout. Hapus folder session dan restart.');
        process.exit(1);
      }
    } else if (connection === 'open') {
      console.log('\n========================================');
      console.log(`  ✅ ${config.botName} berhasil terhubung!`);
      console.log('========================================\n');
    }
  });

  // Event: Update Credentials
  sock.ev.on('creds.update', saveCreds);

  // Event: Pesan Masuk
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const rawMsg of messages) {
      if (!rawMsg.message) continue;
      if (rawMsg.key.fromMe && !config.ownerNumber) continue;

      try {
        const msg = await serialize(sock, rawMsg, store);
        if (!msg) continue;

        // Auto baca pesan
        if (config.readMessages && !msg.key.fromMe) {
          await sock.readMessages([msg.key]);
        }

        // Auto typing indicator
        if (config.autoTyping && msg.isCommand) {
          await sock.sendPresenceUpdate('composing', msg.from);
        }

        // Handle command
        await handler(sock, msg, store);

      } catch (err) {
        console.error('[Message Error]', err);
      }
    }
  });

  // Event: Member grup join/keluar
  sock.ev.on('group-participants.update', async (update) => {
    try {
      const welcomePlugin = require('./src/plugins/welcome');
      await welcomePlugin.handleGroupUpdate(sock, update);
    } catch (err) {
      console.error('[Group Update Error]', err);
    }
  });

  return sock;
}

// Handle crash global
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

startBot().catch(console.error);
