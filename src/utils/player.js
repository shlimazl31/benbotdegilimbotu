import { Player } from 'discord-player';
import { DefaultExtractors } from '@discord-player/extractor';
import { GatewayIntentBits } from 'discord.js';

export const getPlayer = async (client) => {
    const player = new Player(client);
    await player.extractors.loadMulti(DefaultExtractors);
    return player;
}