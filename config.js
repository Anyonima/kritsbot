require('dotenv').config();

module.exports = {
  // Bot Settings
  botName: process.env.BOT_NAME || 'KritsBot',
  prefix: process.env.PREFIX || '.',
  ownerNumber: process.env.OWNER_NUMBER || '628xxxxxxxxxx',
  ownerName: process.env.OWNER_NAME || 'Owner',

  // API Keys
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openWeatherKey: process.env.OPENWEATHER_API_KEY || '',

  // Bot Behavior
  readMessages: true,       // auto baca pesan
  readStatus: false,        // auto view status
  autoTyping: true,         // tampil "sedang mengetik"

  // Session
  sessionDir: './session',

  // Database
  dataDir: './src/data',

  // Limits
  maxWarn: 3,               // max peringatan sebelum kick
  cooldown: 3,              // cooldown command dalam detik

  // Footer pesan
  footer: '🤖 *KritsBot* | Made with ❤️',

  // Game settings
  gameTimeout: 60,          // timeout game dalam detik
};
