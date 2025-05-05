import { Player } from 'discord-player';
import { YoutubeiExtractor } from 'discord-player-youtubei';

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
            leaveOnEmpty: false,
            leaveOnEnd: false,
            leaveOnStop: false
        }
    });

    // Sadece YouTubei extractoru kullan
    await player.extractors.register(YoutubeiExtractor, {
        overrideBridgeMode: "yt",
        streamOptions: {
            highWaterMark: 1 << 25,
            dlChunkSize: 0
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

    player.events.on('playerError', (queue, error) => {
        console.error('Player hatası:', error);
        queue.metadata?.send('❌ Bir hata oluştu!');
    });

    player.events.on('emptyQueue', (queue) => {
        queue.metadata?.send('✅ Sıra bitti!');
    });

    return player;
};