const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../../config');

// Simpan riwayat chat per user (max 10 pesan)
const chatHistory = new Map();

/**
 * AI Chat dengan Gemini
 */
async function chat(sock, msg) {
  const { arg, sender } = msg;

  if (!arg) {
    return msg.reply(
      `🤖 *KritsBot AI (Gemini)*\n\n` +
      `Tanyakan apa saja!\nContoh: ${msg.prefix}ai Apa itu JavaScript?\n\n` +
      `Ketik ${msg.prefix}ai reset untuk reset riwayat chat.`
    );
  }

  if (arg.toLowerCase() === 'reset') {
    chatHistory.delete(sender);
    return msg.reply('✅ Riwayat chat AI telah direset!');
  }

  if (!config.geminiApiKey) {
    return msg.reply(
      '❌ *GEMINI_API_KEY* belum diisi!\n\n' +
      'Cara dapat API key GRATIS:\n' +
      '1. Buka https://aistudio.google.com/app/apikey\n' +
      '2. Login dengan Google\n' +
      '3. Klik "Create API Key"\n' +
      '4. Copy dan isi di file .env'
    );
  }

  await msg.react('🤔');

  try {
    const genAI = new GoogleGenerativeAI(config.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Ambil atau buat riwayat chat
    if (!chatHistory.has(sender)) {
      chatHistory.set(sender, []);
    }
    const history = chatHistory.get(sender);

    // Batasi history ke 10 pesan terakhir
    const recentHistory = history.slice(-10);

    const chat = model.startChat({
      history: recentHistory,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.9,
      },
      systemInstruction: `Kamu adalah ${config.botName}, asisten AI yang cerdas, ramah, dan suka membantu. 
Kamu berbicara dalam Bahasa Indonesia yang natural dan casual. 
Jawab pertanyaan dengan jelas, informatif, dan kadang bisa sedikit humor.
Jangan terlalu panjang, usahakan jawaban padat dan mudah dipahami.`
    });

    const result = await chat.sendMessage(arg);
    const response = result.response.text();

    // Simpan ke history
    history.push(
      { role: 'user', parts: [{ text: arg }] },
      { role: 'model', parts: [{ text: response }] }
    );

    // Batasi history maksimal 20 entry
    if (history.length > 20) history.splice(0, 2);

    await msg.react('✅');
    await msg.reply(`🤖 *${config.botName} AI*\n\n${response}`);

  } catch (err) {
    console.error('[AI Error]', err.message);
    await msg.react('❌');

    if (err.message?.includes('API_KEY')) {
      return msg.reply('❌ API Key tidak valid. Cek kembali GEMINI_API_KEY di .env');
    }
    msg.reply('❌ AI sedang error. Coba lagi nanti.');
  }
}

module.exports = { chat };
