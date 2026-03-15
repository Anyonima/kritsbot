# 🤖 KritsBot - WhatsApp Bot

Bot WhatsApp lengkap berbasis **Baileys** + **Node.js** dengan fitur:
- 📥 Media Downloader (TikTok, Instagram, Facebook, YouTube)
- 🎮 Mini Games (Tebak Kata, Kuis, Tic-Tac-Toe, Truth & Dare)
- 👥 Group Management (tagall, warn, antilink, welcome)
- 🛠️ Tools (TTS, Translate, Cuaca, QR Code, Kalkulator)
- 🤖 AI Chatbot (Gemini)

## ⚡ Quick Start

### 1. Clone & Install
```bash
git clone <repo-url>
cd kritsbot
npm install --legacy-peer-deps
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env dengan data kamu
nano .env
```

### 3. Jalankan Bot
```bash
node index.js
```
Scan QR Code yang muncul di terminal dengan WhatsApp kamu.

## 📋 Environment Variables

| Variable | Wajib | Keterangan |
|---|---|---|
| `OWNER_NUMBER` | ✅ | Nomor WA kamu (format: 628xxx) |
| `BOT_NAME` | ❌ | Nama bot (default: KritsBot) |
| `PREFIX` | ❌ | Prefix command (default: .) |
| `GEMINI_API_KEY` | ❌ | Dari [Google AI Studio](https://aistudio.google.com/app/apikey) (gratis) |
| `OPENWEATHER_API_KEY` | ❌ | Dari [OpenWeatherMap](https://openweathermap.org/api) (gratis) |

## 📦 Command List

### 📥 Downloader
| Command | Fungsi |
|---|---|
| `.tiktok <url>` | Download TikTok tanpa watermark |
| `.ig <url>` | Download foto/video Instagram |
| `.fb <url>` | Download video Facebook |
| `.yt <url>` | Download video YouTube |
| `.ytmp3 <url>` | Download audio YouTube (MP3) |

### 🎮 Games
| Command | Fungsi |
|---|---|
| `.tebakkata` | Game tebak kata tersembunyi |
| `.kuis` | Kuis random berhadiah poin |
| `.ttt` | Tic-Tac-Toe vs bot |
| `.truth` | Random pertanyaan truth |
| `.dare` | Random tantangan dare |
| `.leaderboard` | Cek top skor |

### 🛠️ Tools
| Command | Fungsi |
|---|---|
| `.sticker` | Gambar/video jadi stiker |
| `.tts <teks>` | Text to Speech |
| `.translate <lang> <teks>` | Terjemah bahasa |
| `.cuaca <kota>` | Cek cuaca kota |
| `.qr <teks>` | Generate QR Code |
| `.calc <ekspresi>` | Kalkulator |

### 👥 Group (Admin Only)
| Command | Fungsi |
|---|---|
| `.tagall` | Mention semua member |
| `.warn @user` | Beri peringatan (3x = kick) |
| `.resetwarn @user` | Reset peringatan |
| `.kick @user` | Keluarkan member |
| `.promote @user` | Jadikan admin |
| `.demote @user` | Copot admin |
| `.mute / .unmute` | Kunci/buka grup |
| `.antilink on/off` | Toggle anti-link |
| `.welcome on/off` | Toggle welcome message |

### 🤖 AI
| Command | Fungsi |
|---|---|
| `.ai <pertanyaan>` | Chat dengan Gemini AI |
| `.ai reset` | Reset riwayat chat AI |

## 🚂 Deploy ke Railway

1. Push project ke GitHub
2. Buka [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Pilih repo ini
4. Buka tab **Variables** → isi semua env variable
5. Bot akan auto-deploy setiap push ke GitHub ✅

## 📁 Struktur Project

```
kritsbot/
├── index.js          # Entry point
├── config.js         # Konfigurasi
├── Procfile          # Railway worker
├── railway.json      # Railway config
├── .env.example      # Template env
└── src/
    ├── handler.js    # Router command
    ├── lib/
    │   ├── serialize.js    # Message parser
    │   └── database.js     # JSON database
    ├── data/         # Database files (auto-generated)
    └── plugins/
        ├── downloader.js   # TikTok/IG/FB/YT
        ├── sticker.js      # Sticker maker
        ├── tools.js        # TTS/Translate/dll
        ├── games.js        # Mini games
        ├── group.js        # Group management
        ├── ai.js           # Gemini AI
        └── welcome.js      # Welcome/goodbye
```
