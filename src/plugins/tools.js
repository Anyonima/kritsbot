const axios = require('axios');
const qrcode = require('qrcode');

/**
 * Text to Speech
 */
async function tts(sock, msg) {
  const { arg, from, _raw } = msg;
  if (!arg) return msg.reply(`❌ Contoh: ${msg.prefix}tts Halo semua`);

  await msg.react('⏳');
  try {
    const lang = 'id'; // Default Indonesia
    const text = encodeURIComponent(arg.slice(0, 200)); // Max 200 karakter
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${text}&tl=${lang}&client=tw-ob`;

    const res = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Referer: 'https://translate.google.com/'
      },
      timeout: 15000
    });

    await sock.sendMessage(from, {
      audio: Buffer.from(res.data),
      mimetype: 'audio/mpeg',
      ptt: true
    }, { quoted: _raw });

    await msg.react('✅');
  } catch (err) {
    console.error('[TTS Error]', err.message);
    await msg.react('❌');
    msg.reply('❌ Gagal convert teks ke suara.');
  }
}

/**
 * Translate teks ke bahasa lain
 */
async function translate(sock, msg) {
  const { args, from, _raw } = msg;
  if (args.length < 2) {
    return msg.reply(`❌ Contoh: ${msg.prefix}translate en Halo apa kabar\n\nKode bahasa: *en* (Inggris), *ja* (Jepang), *ko* (Korea), *ar* (Arab), *fr* (Prancis), *de* (Jerman), dll`);
  }

  const lang = args[0].toLowerCase();
  const text = args.slice(1).join(' ');

  await msg.react('⏳');
  try {
    const res = await axios.get(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`,
      { timeout: 10000 }
    );

    const translated = res.data[0].map(item => item[0]).join('');
    const detected = res.data[2];

    await msg.reply(
      `🌐 *Terjemahan*\n\n` +
      `📝 *Bahasa Asal:* ${getLanguageName(detected)}\n` +
      `🎯 *Bahasa Tujuan:* ${getLanguageName(lang)}\n\n` +
      `*Hasil:*\n${translated}`
    );
    await msg.react('✅');
  } catch (err) {
    console.error('[Translate Error]', err.message);
    await msg.react('❌');
    msg.reply('❌ Gagal terjemahkan. Pastikan kode bahasa benar.');
  }
}

/**
 * Cek Cuaca
 */
async function cuaca(sock, msg) {
  const { arg } = msg;
  if (!arg) return msg.reply(`❌ Contoh: ${msg.prefix}cuaca Jakarta`);

  await msg.react('⏳');
  try {
    const cfg = require('../../config');
    const apiKey = cfg.openWeatherKey;

    if (!apiKey) {
      return msg.reply('❌ OPENWEATHER_API_KEY belum diisi di .env\nDaftar gratis di: https://openweathermap.org/api');
    }

    const res = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(arg)}&appid=${apiKey}&units=metric&lang=id`,
      { timeout: 10000 }
    );

    const d = res.data;
    const weather = d.weather[0];
    const emoji = getWeatherEmoji(weather.main);

    await msg.reply(
      `${emoji} *Cuaca di ${d.name}, ${d.sys.country}*\n\n` +
      `🌡️ *Suhu:* ${Math.round(d.main.temp)}°C (Terasa ${Math.round(d.main.feels_like)}°C)\n` +
      `🌡️ *Min/Max:* ${Math.round(d.main.temp_min)}°C / ${Math.round(d.main.temp_max)}°C\n` +
      `☁️ *Kondisi:* ${weather.description}\n` +
      `💧 *Kelembaban:* ${d.main.humidity}%\n` +
      `💨 *Kecepatan Angin:* ${Math.round(d.wind.speed * 3.6)} km/h\n` +
      `👁️ *Visibilitas:* ${(d.visibility / 1000).toFixed(1)} km`
    );
    await msg.react('✅');
  } catch (err) {
    if (err.response?.status === 404) {
      await msg.react('❌');
      return msg.reply(`❌ Kota *${msg.arg}* tidak ditemukan.`);
    }
    console.error('[Cuaca Error]', err.message);
    await msg.react('❌');
    msg.reply('❌ Gagal ambil data cuaca.');
  }
}

/**
 * Generate QR Code
 */
async function qrCode(sock, msg) {
  const { arg, from, _raw } = msg;
  if (!arg) return msg.reply(`❌ Contoh: ${msg.prefix}qr https://example.com`);

  await msg.react('⏳');
  try {
    const qrBuffer = await qrcode.toBuffer(arg, {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' }
    });

    await sock.sendMessage(from, {
      image: qrBuffer,
      caption: `✅ *QR Code*\n\n📝 Teks: ${arg}\n\n${require('../../config').footer}`
    }, { quoted: _raw });

    await msg.react('✅');
  } catch (err) {
    console.error('[QR Error]', err.message);
    await msg.react('❌');
    msg.reply('❌ Gagal buat QR Code.');
  }
}

/**
 * Kalkulator
 */
async function calculate(sock, msg) {
  const { arg } = msg;
  if (!arg) return msg.reply(`❌ Contoh: ${msg.prefix}calc 10 + 5 * 2`);

  try {
    // Sanitize input — hanya izinkan angka dan operator matematika
    const sanitized = arg.replace(/[^0-9+\-*/().,\s^%]/g, '');
    if (!sanitized) return msg.reply('❌ Ekspresi tidak valid!');

    // Eval aman menggunakan Function
    const result = Function(`"use strict"; return (${sanitized})`)();

    if (typeof result !== 'number' || !isFinite(result)) {
      return msg.reply('❌ Hasil tidak valid!');
    }

    await msg.reply(`🧮 *Kalkulator*\n\n📝 ${sanitized}\n✅ = *${result}*`);
  } catch {
    msg.reply('❌ Ekspresi matematika tidak valid!');
  }
}

// Helper functions
function getLanguageName(code) {
  const langs = {
    id: 'Indonesia', en: 'Inggris', ja: 'Jepang', ko: 'Korea',
    zh: 'Mandarin', ar: 'Arab', fr: 'Prancis', de: 'Jerman',
    es: 'Spanyol', ru: 'Rusia', th: 'Thailand', ms: 'Melayu'
  };
  return langs[code] || code.toUpperCase();
}

function getWeatherEmoji(main) {
  const map = {
    Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️',
    Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️', Fog: '🌫️',
    Haze: '🌫️', Smoke: '💨', Dust: '🌪️', Sand: '🏜️',
    Ash: '🌋', Squall: '💨', Tornado: '🌪️'
  };
  return map[main] || '🌡️';
}

module.exports = { tts, translate, cuaca, qrCode, calculate };
