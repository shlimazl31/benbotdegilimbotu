import { Player } from 'discord-player';

let player = null;

export const getPlayer = async (client) => {
    if (player) return player;

    player = new Player(client, {
        ytdlOptions: {
            quality: 'highestaudio',
            highWaterMark: 1 << 25
        }
    });

    player.events.on('playerStart', (queue, track) => {
        queue.metadata.channel.send(`🎵 Şimdi çalıyor: **${track.title}**`);
    });

    player.events.on('error', (queue, error) => {
        console.error(`Player hatası: ${error.message}`);
    });

    player.events.on('connectionError', (queue, error) => {
        console.error(`Bağlantı hatası: ${error.message}`);
    });

    return player;
};