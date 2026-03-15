const axios = require('axios');

/**
 * TikTok Downloader (tanpa watermark)
 */
async function tiktok(sock, msg) {
  const { arg, from, _raw } = msg;
  if (!arg) return msg.reply(`❌ Kirim link TikTok!\nContoh: ${msg.prefix}tiktok https://vm.tiktok.com/xxx`);

  await msg.react('⏳');
  try {
    // Pakai API publik TikTok downloader
    const res = await axios.get(`https://api.tiklydown.eu.org/api/download/v3?url=${encodeURIComponent(arg)}`, {
      timeout: 30000
    });

    const data = res.data;
    if (!data?.video?.noWatermark) throw new Error('Gagal ambil video');

    const videoUrl = data.video.noWatermark;
    const caption = `✅ *TikTok Downloader*\n\n📌 *Judul:* ${data.title || 'TikTok Video'}\n👤 *Creator:* ${data.author?.name || '-'}\n❤️ *Likes:* ${data.stats?.likeCount?.toLocaleString() || '0'}\n\n${config().footer}`;

    await sock.sendMessage(from, {
      video: { url: videoUrl },
      caption,
      mimetype: 'video/mp4'
    }, { quoted: _raw });

  } catch (err) {
    console.error('[TikTok Error]', err.message);
    await msg.react('❌');
    msg.reply('❌ Gagal download TikTok. Pastikan link valid dan coba lagi.');
  }
}

/**
 * Instagram Downloader
 */
async function instagram(sock, msg) {
  const { arg, from, _raw } = msg;
  if (!arg) return msg.reply(`❌ Kirim link Instagram!\nContoh: ${msg.prefix}ig https://www.instagram.com/p/xxx`);

  await msg.react('⏳');
  try {
    const res = await axios.get(`https://api.instavideosave.com/?url=${encodeURIComponent(arg)}`, {
      timeout: 30000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    // Coba API alternatif jika gagal
    let mediaUrl;
    if (res.data?.media?.[0]?.url) {
      mediaUrl = res.data.media[0].url;
    } else {
      // Fallback ke API lain
      const res2 = await axios.post('https://instagram-saver.p.rapidapi.com/scrape', {
        url: arg
      }, {
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Host': 'instagram-saver.p.rapidapi.com'
        },
        timeout: 15000
      });
      mediaUrl = res2.data?.data?.[0]?.url;
    }

    if (!mediaUrl) throw new Error('Media tidak ditemukan');

    const isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('video');
    const caption = `✅ *Instagram Downloader*\n\n${config().footer}`;

    if (isVideo) {
      await sock.sendMessage(from, { video: { url: mediaUrl }, caption }, { quoted: _raw });
    } else {
      await sock.sendMessage(from, { image: { url: mediaUrl }, caption }, { quoted: _raw });
    }

  } catch (err) {
    console.error('[Instagram Error]', err.message);
    await msg.react('❌');
    msg.reply('❌ Gagal download Instagram. Pastikan postingan tidak private dan link valid.');
  }
}

/**
 * Facebook Downloader
 */
async function facebook(sock, msg) {
  const { arg, from, _raw } = msg;
  if (!arg) return msg.reply(`❌ Kirim link Facebook!\nContoh: ${msg.prefix}fb https://www.facebook.com/watch?v=xxx`);

  await msg.react('⏳');
  try {
    const res = await axios.get(`https://api.vevioz.com/@api/button/videos?url=${encodeURIComponent(arg)}`, {
      timeout: 30000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    let videoUrl;
    if (res.data?.links?.mp4?.HD) {
      videoUrl = res.data.links.mp4.HD;
    } else if (res.data?.links?.mp4?.SD) {
      videoUrl = res.data.links.mp4.SD;
    } else {
      throw new Error('Video tidak ditemukan');
    }

    const caption = `✅ *Facebook Downloader*\n\n📹 Kualitas: HD\n\n${config().footer}`;
    await sock.sendMessage(from, {
      video: { url: videoUrl },
      caption,
      mimetype: 'video/mp4'
    }, { quoted: _raw });

  } catch (err) {
    console.error('[Facebook Error]', err.message);
    await msg.react('❌');
    msg.reply('❌ Gagal download Facebook. Pastikan link video dan tidak private.');
  }
}

/**
 * YouTube Video Downloader
 */
async function youtube(sock, msg) {
  const { arg, from, _raw } = msg;
  if (!arg) return msg.reply(`❌ Kirim link/keyword YouTube!\nContoh: ${msg.prefix}yt https://youtube.com/watch?v=xxx`);

  await msg.react('⏳');
  try {
    const { data } = await axios.get(`https://yt-api.p.rapidapi.com/dl?id=${extractYtId(arg)}&cgeo=US`, {
      headers: {
        'X-RapidAPI-Host': 'yt-api.p.rapidapi.com'
      },
      timeout: 30000
    });

    // Coba pakai ytdl-core sebagai fallback
    const ytdl = require('@distube/ytdl-core');
    const videoUrl = arg.includes('youtube') || arg.includes('youtu.be') ? arg : `https://www.youtube.com/watch?v=${arg}`;

    const info = await ytdl.getInfo(videoUrl);
    const format = ytdl.chooseFormat(info.formats, { quality: 'lowest', filter: 'videoandaudio' });

    if (!format?.url) throw new Error('Format video tidak tersedia');

    const title = info.videoDetails.title;
    const duration = formatDuration(parseInt(info.videoDetails.lengthSeconds));
    const caption = `✅ *YouTube Downloader*\n\n📌 *Judul:* ${title}\n⏱️ *Durasi:* ${duration}\n\n${config().footer}`;

    await sock.sendMessage(from, {
      video: { url: format.url },
      caption,
      mimetype: 'video/mp4'
    }, { quoted: _raw });

  } catch (err) {
    console.error('[YouTube Error]', err.message);
    await msg.react('❌');
    msg.reply('❌ Gagal download YouTube. Video mungkin terlalu panjang atau terkena pembatasan.');
  }
}

/**
 * YouTube Audio (MP3) Downloader
 */
async function youtubeAudio(sock, msg) {
  const { arg, from, _raw } = msg;
  if (!arg) return msg.reply(`❌ Kirim link YouTube!\nContoh: ${msg.prefix}ytmp3 https://youtube.com/watch?v=xxx`);

  await msg.react('⏳');
  try {
    const ytdl = require('@distube/ytdl-core');
    const videoUrl = arg.includes('youtube') || arg.includes('youtu.be') ? arg : `https://www.youtube.com/watch?v=${arg}`;

    const info = await ytdl.getInfo(videoUrl);
    const format = ytdl.chooseFormat(info.formats, { quality: 'lowestaudio', filter: 'audioonly' });

    if (!format?.url) throw new Error('Format audio tidak tersedia');

    const title = info.videoDetails.title;
    const duration = formatDuration(parseInt(info.videoDetails.lengthSeconds));
    const caption = `✅ *YouTube MP3*\n\n🎵 *Judul:* ${title}\n⏱️ *Durasi:* ${duration}\n\n${config().footer}`;

    await sock.sendMessage(from, {
      audio: { url: format.url },
      mimetype: 'audio/mp4',
      ptt: false
    }, { quoted: _raw });

    await msg.reply(caption);

  } catch (err) {
    console.error('[YT Audio Error]', err.message);
    await msg.react('❌');
    msg.reply('❌ Gagal download audio YouTube.');
  }
}

function extractYtId(url) {
  const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : url;
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function config() {
  return require('../../config');
}

module.exports = { tiktok, instagram, facebook, youtube, youtubeAudio };
