import { Player } from 'discord-player';
import { GatewayIntentBits } from 'discord.js';

export const getPlayer = async (client) => {
    const player = new Player(client);

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