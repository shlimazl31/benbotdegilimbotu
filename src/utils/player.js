import { Player } from 'discord-player';
import { DefaultExtractors } from '@discord-player/extractor';
import { GatewayIntentBits } from 'discord.js';
import play from 'play-dl';

// play-dl'i ayarla
await play.setToken({
    youtube: {
        cookie: process.env.YOUTUBE_COOKIE || ''
    }
});

export const getPlayer = async (client) => {
    const player = new Player(client, {
        ytdlOptions: {
            quality: 'highestaudio',
            highWaterMark: 1 << 25
        },
        connectionTimeout: 999_999
    });

    // Extractors'ı yükle
    await player.extractors.loadDefault();

    // Player event'lerini dinle
    player.events.on('error', (queue, error) => {
        console.error(`Player hatası: ${error.message}`);
        console.error(error);
    });

    player.events.on('playerError', (queue, error) => {
        console.error(`Oynatıcı hatası: ${error.message}`);
        console.error(error);
    });

    player.events.on('playerStart', (queue, track) => {
        queue.metadata.channel.send(`🎵 Şimdi çalıyor: **${track.title}**`);
    });

    player.events.on('audioTrackAdd', (queue, track) => {
        queue.metadata.channel.send(`🎵 Sıraya eklendi: **${track.title}**`);
    });

    player.events.on('disconnect', (queue) => {
        queue.metadata.channel.send('❌ Ses kanalından çıkıldı!');
    });

    player.events.on('emptyChannel', (queue) => {
        queue.metadata.channel.send('❌ Ses kanalı boş kaldığı için çıkıldı!');
    });

    return player;
};