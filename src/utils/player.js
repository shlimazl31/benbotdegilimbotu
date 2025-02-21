import { Player } from 'discord-player';
import { DefaultExtractors } from '@discord-player/extractor';
import { GatewayIntentBits } from 'discord.js';

let player = null;

export async function getPlayer(client) {
    if (!player) {
        player = new Player(client, {
            ytdlOptions: {
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            }
        });
        
        // Yeni extractor yükleme yöntemi
        await player.extractors.loadDefault();
    }
    return player;
}