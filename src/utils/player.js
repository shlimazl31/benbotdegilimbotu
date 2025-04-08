import { Player } from 'discord-player';
import { YoutubeiExtractor } from 'discord-player-youtubei';

let player = null;

export const getPlayer = async (client) => {
    if (player) return player;

    player = new Player(client, {
        ytdlOptions: {
            quality: 'highestaudio',
            highWaterMark: 1 << 25
        },
        connectionOptions: {
            selfDeaf: true
        }
    });

    // Sadece YouTubei extractoru kullan
    await player.extractors.register(YoutubeiExtractor, {
        overrideBridgeMode: "yt",
        streamOptions: {
            highWaterMark: 1 << 25
        }
    });
    
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
        queue.metadata?.send('❌ Bir hata oluştu!');
    });

    player.events.on('emptyQueue', (queue) => {
        queue.metadata?.send('✅ Sıra bitti!');
    });

    return player;
};