import { Player } from 'discord-player';
import { DefaultExtractors } from '@discord-player/extractor';
import { GatewayIntentBits } from 'discord.js';

let player = null;

const getPlayer = async (client) => {
    const player = new Player(client);
    
    // Eski kod:
    // await player.extractors.loadDefault();
    
    // Yeni kod:
    await player.extractors.loadMulti(DefaultExtractors);
    
    return player;
}

export async function getPlayer(client) {
    if (!player) {
        player = new Player(client, {
            ytdlOptions: {
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            }
        });
        
        // Yeni extractor yükleme yöntemi
        await player.extractors.loadMulti(DefaultExtractors);
    }
    return player;
}