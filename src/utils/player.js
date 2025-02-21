import { Player } from 'discord-player';
import { DefaultExtractors } from '@discord-player/extractor';

let player = null;

export const getPlayer = async (client) => {
    if (player) return player;

    // Ana player instance'ı oluştur
    player = new Player(client);

    // Tüm default extractorları yükle
    await player.extractors.loadMulti(DefaultExtractors);

    // Player eventlerini ayarla
    player.events.on('playerStart', (queue, track) => {
        queue.metadata.send(`🎵 Şimdi çalıyor: **${track.title}**!`);
    });

    player.events.on('error', (queue, error) => {
        console.error('Player hatası:', error);
        queue.metadata.send('❌ Bir hata oluştu!');
    });

    player.events.on('emptyQueue', (queue) => {
        queue.metadata.send('✅ Sıra bitti!');
    });

    player.events.on('disconnect', (queue) => {
        queue.metadata.send('🔌 Ses kanalından ayrıldım!');
    });

    return player;
};