const { addScore, addLoss, getLeaderboard: getLeaderboardDB } = require('../lib/database');

// Storage untuk game sessions yang sedang aktif
const activeSessions = new Map();

// ==================== TEBAK KATA ====================
const wordList = [
  'semangka', 'jerapah', 'komputer', 'indonesia', 'javascript',
  'whatsapp', 'telepon', 'keyboard', 'monitor', 'internet',
  'kucing', 'anjing', 'sepeda', 'mobil', 'pesawat',
  'perpustakaan', 'universitas', 'matematika', 'fisika', 'kimia',
  'matahari', 'bulan', 'bintang', 'pelangi', 'awan',
  'nasi goreng', 'rendang', 'soto', 'bakso', 'gado gado',
  'jakarta', 'surabaya', 'bandung', 'yogyakarta', 'bali'
];

function encodeWord(word) {
  // Sembunyikan huruf random (tampilkan 30% huruf saja)
  return word.split('').map((char, i) => {
    if (char === ' ') return ' ';
    return Math.random() < 0.3 ? char : '_';
  }).join('');
}

async function tebakKata(sock, msg) {
  const { from, sender } = msg;
  const sessionKey = `tk:${from}`;

  if (activeSessions.has(sessionKey)) {
    const session = activeSessions.get(sessionKey);
    const guess = msg.text.toLowerCase().trim();

    if (guess === session.word) {
      activeSessions.delete(sessionKey);
      addScore(sender, 15);
      return msg.reply(
        `🎉 *BENAR!* Selamat!\n\n` +
        `✅ Kata: *${session.word}*\n` +
        `🏆 +15 poin untuk kamu!`
      );
    } else if (msg.isCommand) {
      // Kalau lagi ada game tapi kirim command lain, biarkan lewat
      return;
    } else {
      return msg.reply(`❌ Salah! Coba lagi...\n\nHint: *${session.hint}*`);
    }
  }

  // Mulai game baru
  const word = wordList[Math.floor(Math.random() * wordList.length)];
  const encoded = encodeWord(word);
  const session = { word, hint: encoded, startTime: Date.now() };
  activeSessions.set(sessionKey, session);

  // Auto hapus session setelah timeout
  setTimeout(() => {
    if (activeSessions.has(sessionKey)) {
      activeSessions.delete(sessionKey);
      sock.sendMessage(from, { text: `⏰ Waktu habis! Jawabannya adalah: *${word}*` });
    }
  }, require('../../config').gameTimeout * 1000);

  await msg.reply(
    `🎮 *TEBAK KATA*\n\n` +
    `Tebak kata berikut ini!\n` +
    `*${encoded}*\n\n` +
    `⏱️ Waktu: ${require('../../config').gameTimeout} detik\n` +
    `💡 Ketik jawabanmu langsung di chat!`
  );
}

// ==================== KUIS ====================
const quizQuestions = [
  { q: 'Ibu kota Indonesia adalah?', a: ['jakarta'], options: ['Jakarta', 'Surabaya', 'Bandung', 'Medan'] },
  { q: 'Planet terbesar di tata surya?', a: ['jupiter'], options: ['Saturnus', 'Jupiter', 'Uranus', 'Neptunus'] },
  { q: 'Bahasa pemrograman yang dibuat oleh Brendan Eich?', a: ['javascript', 'js'], options: ['Python', 'JavaScript', 'Java', 'C++'] },
  { q: 'Siapa penemu telepon?', a: ['graham bell', 'alexander graham bell', 'bell'], options: ['Thomas Edison', 'Nikola Tesla', 'Alexander Graham Bell', 'Guglielmo Marconi'] },
  { q: 'Berapa jumlah provinsi di Indonesia (2024)?', a: ['38'], options: ['34', '36', '38', '40'] },
  { q: 'Mata uang Jepang adalah?', a: ['yen'], options: ['Won', 'Yuan', 'Yen', 'Baht'] },
  { q: 'Siapa pencipta WhatsApp?', a: ['jan koum', 'brian acton', 'koum'], options: ['Mark Zuckerberg', 'Jan Koum', 'Jack Dorsey', 'Elon Musk'] },
  { q: 'Negara terluas di dunia?', a: ['rusia', 'russia'], options: ['Kanada', 'Cina', 'Amerika Serikat', 'Rusia'] },
  { q: 'Apa kepanjangan dari HTTP?', a: ['hypertext transfer protocol'], options: ['HyperText Transfer Protocol', 'High Tech Transfer Protocol', 'Hyper Transfer Text Protocol', 'HyperText Text Protocol'] },
  { q: 'Berapa nilai PI (π) hingga 2 desimal?', a: ['3.14'], options: ['3.12', '3.14', '3.16', '3.18'] },
];

async function kuis(sock, msg) {
  const { from, sender } = msg;
  const sessionKey = `kuis:${from}`;

  if (activeSessions.has(sessionKey)) {
    const session = activeSessions.get(sessionKey);
    const answer = msg.text.toLowerCase().trim();

    const isCorrect = session.answers.some(a => answer.includes(a));

    if (isCorrect) {
      activeSessions.delete(sessionKey);
      addScore(sender, 20);
      return msg.reply(
        `🎉 *BENAR!* Hebat!\n\n` +
        `✅ Jawaban: *${session.correctAnswer}*\n` +
        `🏆 +20 poin untuk kamu!`
      );
    } else if (!msg.isCommand) {
      addLoss(sender);
      activeSessions.delete(sessionKey);
      return msg.reply(
        `❌ *Salah!*\n\n` +
        `Jawaban yang benar: *${session.correctAnswer}*`
      );
    }
    return;
  }

  const question = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
  const session = {
    answers: question.a,
    correctAnswer: question.options.find(o => question.a.some(a => o.toLowerCase().includes(a))),
    startTime: Date.now()
  };
  activeSessions.set(from + ':kuis', session);
  activeSessions.set(sessionKey, session);

  setTimeout(() => {
    if (activeSessions.has(sessionKey)) {
      activeSessions.delete(sessionKey);
      sock.sendMessage(from, { text: `⏰ Waktu habis!\n\nJawaban: *${session.correctAnswer}*` });
    }
  }, 30000);

  const optText = question.options.map((o, i) => `${['A', 'B', 'C', 'D'][i]}. ${o}`).join('\n');

  await msg.reply(
    `🧠 *KUIS RANDOM*\n\n` +
    `❓ ${question.q}\n\n` +
    `${optText}\n\n` +
    `⏱️ Waktu: 30 detik\n` +
    `💡 Ketik jawaban kamu!`
  );
}

// ==================== TIC-TAC-TOE ====================
function createBoard() {
  return [['⬜', '⬜', '⬜'], ['⬜', '⬜', '⬜'], ['⬜', '⬜', '⬜']];
}

function renderBoard(board) {
  return board.map(row => row.join('')).join('\n');
}

function checkWinner(board) {
  const X = '❌', O = '⭕';
  for (let i = 0; i < 3; i++) {
    if (board[i][0] === board[i][1] && board[i][1] === board[i][2] && board[i][0] !== '⬜') return board[i][0];
    if (board[0][i] === board[1][i] && board[1][i] === board[2][i] && board[0][i] !== '⬜') return board[0][i];
  }
  if (board[0][0] === board[1][1] && board[1][1] === board[2][2] && board[0][0] !== '⬜') return board[0][0];
  if (board[0][2] === board[1][1] && board[1][1] === board[2][0] && board[0][2] !== '⬜') return board[0][2];
  const isDraw = board.flat().every(c => c !== '⬜');
  if (isDraw) return 'draw';
  return null;
}

function botMove(board) {
  const empty = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      if (board[r][c] === '⬜') empty.push([r, c]);
  if (empty.length === 0) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = '⭕';
}

async function ticTacToe(sock, msg) {
  const { from, sender } = msg;
  const sessionKey = `ttt:${from}:${sender}`;

  if (activeSessions.has(sessionKey)) {
    const session = activeSessions.get(sessionKey);
    const input = msg.text.trim();
    const pos = parseInt(input);

    if (isNaN(pos) || pos < 1 || pos > 9) {
      return msg.reply('❌ Pilih angka 1-9 sesuai posisi di papan!');
    }

    const r = Math.floor((pos - 1) / 3);
    const c = (pos - 1) % 3;

    if (session.board[r][c] !== '⬜') {
      return msg.reply('❌ Posisi itu sudah terisi! Pilih posisi lain.');
    }

    session.board[r][c] = '❌';
    let winner = checkWinner(session.board);

    if (winner) {
      activeSessions.delete(sessionKey);
      if (winner === 'draw') {
        return msg.reply(`🎮 *Tic-Tac-Toe*\n\n${renderBoard(session.board)}\n\n🤝 *SERI!*`);
      } else if (winner === '❌') {
        addScore(sender, 25);
        return msg.reply(`🎮 *Tic-Tac-Toe*\n\n${renderBoard(session.board)}\n\n🎉 *KAMU MENANG! +25 poin!*`);
      }
    }

    // Bot move
    botMove(session.board);
    winner = checkWinner(session.board);

    if (winner) {
      activeSessions.delete(sessionKey);
      if (winner === 'draw') {
        return msg.reply(`🎮 *Tic-Tac-Toe*\n\n${renderBoard(session.board)}\n\n🤝 *SERI!*`);
      } else {
        addLoss(sender);
        return msg.reply(`🎮 *Tic-Tac-Toe*\n\n${renderBoard(session.board)}\n\n🤖 *BOT MENANG!* Coba lagi!`);
      }
    }

    return msg.reply(
      `🎮 *Tic-Tac-Toe* (Giliranmu)\n\n${renderBoard(session.board)}\n\n` +
      `Posisi:\n1️⃣2️⃣3️⃣\n4️⃣5️⃣6️⃣\n7️⃣8️⃣9️⃣\n\nKetik angka posisi kamu!`
    );
  }

  // Mulai game baru
  const board = createBoard();
  activeSessions.set(sessionKey, { board });

  setTimeout(() => activeSessions.delete(sessionKey), 300000); // 5 menit

  await msg.reply(
    `🎮 *Tic-Tac-Toe*\n\n${renderBoard(board)}\n\n` +
    `Kamu: ❌ | Bot: ⭕\n\n` +
    `Posisi:\n1️⃣2️⃣3️⃣\n4️⃣5️⃣6️⃣\n7️⃣8️⃣9️⃣\n\nKetik angka posisi kamu!`
  );
}

// ==================== TRUTH OR DARE ====================
const truthList = [
  'Apa hal paling memalukan yang pernah kamu lakukan?',
  'Siapa orang yang paling kamu kagumi dalam hidupmu?',
  'Apa rahasiamu yang belum pernah kamu ceritakan ke siapapun?',
  'Apa kebohongan terbesar yang pernah kamu ucapkan?',
  'Kalau bisa ulang waktu, apa yang akan kamu ubah?',
  'Apa hal terkonyol yang pernah kamu lakukan karena suka seseorang?',
  'Berapa lama kamu tidak mandi terlama?',
  'Apa yang kamu lakukan kalau tahu dunia akan berakhir besok?',
  'Siapa artis/seleb yang pengen banget kamu temui?',
  'Apa hobi tersembunyimu yang jarang orang tahu?'
];

const dareList = [
  'Kirim foto selfie dengan ekspresi paling konyol!',
  'Tulis pesan ke orang yang kamu suka sekarang!',
  'Kirim suara menyanyikan lagu favoritmu!',
  'Ganti foto profil WA kamu selama 1 jam!',
  'Tag 3 orang temanmu dan bilang sesuatu yang manis!',
  'Kirim voice note sambil tertawa selama 10 detik!',
  'Ceritakan jokes paling garing yang kamu tau!',
  'Kirim pesan ke contact teratas kamu sekarang!',
  'Screenshot chat terlucu kamu dan kirim ke sini!',
  'Buat caption foto paling kreatif dalam 1 menit!'
];

async function truth(sock, msg) {
  const question = truthList[Math.floor(Math.random() * truthList.length)];
  await msg.reply(`🎭 *TRUTH*\n\n❓ ${question}`);
}

async function dare(sock, msg) {
  const challenge = dareList[Math.floor(Math.random() * dareList.length)];
  await msg.reply(`🎯 *DARE*\n\n💪 ${challenge}`);
}

// ==================== LEADERBOARD ====================
async function leaderboard(sock, msg) {
  const top = getLeaderboardDB(10);
  if (top.length === 0) {
    return msg.reply('📊 Belum ada data skor. Main game dulu yuk!');
  }

  const medals = ['🥇', '🥈', '🥉'];
  const text = top.map((user, i) => {
    const medal = medals[i] || `${i + 1}.`;
    const num = user.id.split('@')[0];
    return `${medal} *+${num}* — ${user.points} poin (${user.wins}W/${user.losses}L)`;
  }).join('\n');

  await msg.reply(`🏆 *LEADERBOARD*\n\n${text}\n\n${require('../../config').footer}`);
}

module.exports = { tebakKata, kuis, ticTacToe, truth, dare, leaderboard };
