import { Player } from 'discord-player';
import pkg from '@discord-player/extractor';
const { DefaultExtractors } = pkg;

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

    // Extractors yerine events kullan
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

    // Discord Player'ı hazırla
    await player.extractors.register(DefaultExtractors);

    return player;
};