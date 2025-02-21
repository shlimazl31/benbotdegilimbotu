import { Player } from 'discord-player';
import { YouTubeExtractor } from '@discord-player/extractor';
import * as youtubei from 'discord-player-youtubei';

let player = null;

export const getPlayer = async (client) => {
    if (player) return player;

    player = new Player(client, {
        ytdlOptions: {
            quality: 'highestaudio',
            highWaterMark: 1 << 25,
            dlChunkSize: 0
        }
    });

    // Önce YouTubei, sonra yedek olarak YouTube extractor'ı ekle
    await player.extractors.register(youtubei.default);
    await player.extractors.register(YouTubeExtractor);

    player.events.on('playerStart', (queue, track) => {
        queue.metadata.channel.send(`🎵 Şimdi çalıyor: **${track.title}**\n🔗 ${track.url}`);
    });

    player.events.on('error', (queue, error) => {
        console.error(`Player hatası: ${error.message}`);
        console.error(error);
        queue?.metadata?.channel?.send('❌ Müzik çalarken bir hata oluştu!');
    });

    player.events.on('connectionError', (queue, error) => {
        console.error(`Bağlantı hatası: ${error.message}`);
        console.error(error);
        queue?.metadata?.channel?.send('❌ Bağlantı hatası oluştu!');
    });

    player.events.on('emptyQueue', (queue) => {
        queue.metadata.channel.send('✅ Sıra bitti!');
    });

    return player;
};