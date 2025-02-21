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
            highWaterMark: 1 << 25,
            dlChunkSize: 0, // Chunk boyutunu sıfırla
        },
        connectionTimeout: 999_999,
        smoothVolume: true,
        debug: true
    });

    // Extractors'ı yükle
    await player.extractors.loadMulti(DefaultExtractors);

    // Player event'lerini dinle
    player.events.on('debug', (message) => {
        if (typeof message === 'object') {
            console.log('Player Debug:', JSON.stringify(message, null, 2));
        } else {
            console.log('Player Debug:', message);
        }
    });

    player.events.on('error', (queue, error) => {
        console.error('Player Error:', error.message);
        if (queue) {
            console.error('Queue state:', {
                playing: queue.isPlaying(),
                connection: queue.connection ? 'connected' : 'disconnected',
                tracks: queue.tracks.length
            });
        }
    });

    player.events.on('connectionError', (queue, error) => {
        console.error('Connection Error:', error.message);
    });

    player.events.on('playerStart', (queue, track) => {
        console.log('Track Info:', {
            title: track.title,
            duration: track.duration,
            url: track.url,
            source: track.source
        });
        queue.metadata.channel.send(`🎵 Şimdi çalıyor: **${track.title}**`);
    });

    // FFmpeg ayarlarını kontrol et
    player.events.on('debug', (message) => {
        if (message.includes('FFmpeg')) {
            console.log('FFmpeg Debug:', message);
        }
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