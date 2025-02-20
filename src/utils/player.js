import { Player } from 'discord-player';
import { DefaultExtractors } from '@discord-player/extractor';

let player = null;

export async function getPlayer(client) {
    if (!player) {
        player = new Player(client);
        await player.extractors.loadMulti(DefaultExtractors);
    }
    return player;
}