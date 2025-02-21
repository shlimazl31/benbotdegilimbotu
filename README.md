# 🎵 Discord Müzik Botu

Modern ve kullanıcı dostu bir Discord müzik botu. YouTube ve Spotify desteği ile müzik çalma, playlist yönetimi ve moderasyon özellikleri sunar.

## 🚀 Özellikler

### 🎵 Müzik Komutları
- `/play` - YouTube veya Spotify'dan müzik çalar
- `/pause` - Şarkıyı duraklatır
- `/resume` - Duraklatılmış şarkıyı devam ettirir
- `/stop` - Müziği durdurur
- `/skip` - Sıradaki şarkıya geçer
- `/leave` - Bot ses kanalından ayrılır

### 📑 Sıra Yönetimi
- `/queue` - Şarkı sırasını gösterir
- `/clear` - Sırayı temizler
- `/shuffle` - Sırayı karıştırır
- `/loop` - Tekrar modunu ayarlar (şarkı/sıra/kapalı)

### ⚙️ Gelişmiş Kontroller
- `/volume` - Ses seviyesini ayarlar (1-100)
- `/seek` - Şarkının belirli bir saniyesine atlar
- `/nowplaying` - Çalan şarkının detaylı bilgilerini gösterir

### 📋 Playlist Özellikleri
- `/playlist play` - YouTube veya Spotify playlistlerini çalar
- `/playlist info` - Playlist bilgilerini gösterir

### 👮 Moderasyon
- `/purge` - Belirtilen sayıda mesajı siler (1-100)

### 🔍 Genel
- `/help` - Tüm komutları ve açıklamalarını gösterir

## 🛠️ Teknik Özellikler

- Discord.js v14
- Discord Player kütüphanesi
- YouTube ve Spotify desteği
- ESM modül sistemi
- Hata yönetimi ve loglama
- Kategorize edilmiş komut yapısı

## 📦 Kurulum

1. Repoyu klonlayın:

bash

git clone https://github.com/shlimazl31/benbotdegilimbotu.git

cd benbotdegilimbotu

bash

npm install

env

TOKEN=discord_bot_token

CLIENT_ID=bot_client_id

bash

npm start

src/
├── commands/
│ ├── general/
│ │ └── help.js
│ ├── moderation/
│ │ └── purge.js
│ └── music/
│ ├── play.js
│ ├── pause.js
│ └── ...
├── events/
│ ├── ready.js
│ └── interactionCreate.js
└── utils/
└── player.js


## 🤝 Katkıda Bulunma

1. Bu repoyu forklayın
2. Yeni bir branch oluşturun (`git checkout -b feature/yeniOzellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik: XYZ'`)
4. Branch'inizi push edin (`git push origin feature/yeniOzellik`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🙏 Teşekkürler