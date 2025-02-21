import { Player } from 'discord-player';
import { YouTubeExtractor } from '@discord-player/extractor';

let player = null;

export const getPlayer = async (client) => {
    if (player) return player;

    player = new Player(client, {
        ytdlOptions: {
            quality: 'highestaudio',
            highWaterMark: 1 << 25
        }
    });

    await player.extractors.register(YouTubeExtractor);

    player.events.on('playerStart', (queue, track) => {
        queue.metadata.send(`🎵 Şimdi çalıyor: **${track.title}**!`);
    });

    player.events.on('error', (queue, error) => {
        console.error('Player hatası:', error);
        queue.metadata?.send('❌ Bir hata oluştu!');
    });

    player.events.on('emptyQueue', (queue) => {
        queue.metadata?.send('✅ Sıra bitti!');
    });

    player.events.on('disconnect', (queue) => {
        queue.metadata.send('🔌 Ses kanalından ayrıldım!');
    });

    return player;
};