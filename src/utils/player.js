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

    // Çift event tetiklenmesini önlemek için once kullanıyoruz
    player.events.once('playerStart', (queue, track) => {
        queue.metadata.send(`🎵 Şimdi çalıyor: **${track.title}**!`);
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