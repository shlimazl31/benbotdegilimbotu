import { Player } from 'discord-player';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import play from 'play-dl';

let player = null;

export const getPlayer = async (client) => {
    if (player) return player;

    player = new Player(client, {
        ytdlOptions: {
            quality: 'highestaudio',
            highWaterMark: 1 << 25,
            dlChunkSize: 0
        },
        connectionOptions: {
            selfDeaf: true,
            leaveOnEmpty: true,
            leaveOnEmptyCooldown: 300000, // 5 dakika
            leaveOnEnd: false,
            leaveOnStop: true
        }
    });

    try {
        // Önce default extractorları yükle
        await player.extractors.loadDefault();
        console.log('✅ Default extractorlar yüklendi');
    } catch (error) {
        console.error('❌ Default extractorlar yüklenemedi:', error);
    }

    try {
        // Sonra YouTube extractoru yükle
        await player.extractors.register(YoutubeiExtractor, {
            overrideBridgeMode: "yt",
            streamOptions: {
                highWaterMark: 1 << 25,
                dlChunkSize: 0
            }
        });
        console.log('✅ YouTubei extractor yüklendi');
    } catch (error) {
        console.error('❌ YouTubei extractor yüklenemedi:', error);
    }
    
    // Debug için player'daki extractorları kontrol et
    console.log(`Yüklenen extractor sayısı: ${player.extractors.size}`);
    
    // Player event'lerini ayarla
    player.events.on('playerStart', (queue, track) => {
        try {
            queue.metadata?.send(`🎵 Şimdi çalıyor: **${track.title}**!`);
            console.log(`🎵 Şarkı çalınıyor: ${track.title}`);
        } catch (error) {
            console.error('playerStart event hatası:', error);
        }
    });
    
    player.events.on('error', (queue, error) => {
        console.error('Player hatası:', error);
        queue.metadata?.send('❌ Bir hata oluştu! Tekrar deneyiniz.');
    });

    player.events.on('playerError', (queue, error) => {
        console.error('Player hatası:', error);
        queue.metadata?.send('❌ Oynatıcı hatası oluştu! Lütfen başka bir şarkı deneyiniz.');
    });

    player.events.on('emptyQueue', (queue) => {
        queue.metadata?.send('✅ Sıra bitti!');
        console.log(`⏲️ Sıra bitti, 5 dakika sonra kanaldan ayrılacak.`);
    });
    
    // Debug mesajlarını etkinleştir
    player.events.on('debug', (message) => {
        console.log(`[Player Debug] ${message}`);
    });
    
    player.events.on('connectionError', (queue, error) => {
        console.error('Bağlantı hatası:', error);
        queue.metadata?.send('❌ Ses kanalına bağlanırken bir hata oluştu. Tekrar deneyiniz.');
    });

    return player;
};