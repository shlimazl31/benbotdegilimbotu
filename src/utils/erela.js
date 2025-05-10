import { Manager } from 'erela.js';
import { Client } from 'discord.js';

export function createErelaManager(client) {
    const manager = new Manager({
        nodes: [
            {
                host: process.env.LAVALINK_HOST || 'localhost',
                port: parseInt(process.env.LAVALINK_PORT) || 2333,
                password: process.env.LAVALINK_PASSWORD || 'youshallnotpass',
                secure: process.env.LAVALINK_SECURE === 'true' || false,
            }
        ],
        send: (id, payload) => {
            const guild = client.guilds.cache.get(id);
            if (guild) guild.shard.send(payload);
        },
        autoPlay: true,
    });

    // Node bağlantı olayları
    manager.on('nodeConnect', node => {
        console.log(`Lavalink Node bağlandı: ${node.options.identifier}`);
    });

    manager.on('nodeError', (node, error) => {
        console.error(`Lavalink Node hatası: ${node.options.identifier}`, error);
    });

    // Müzik olayları
    manager.on('trackStart', (player, track) => {
        const channel = client.channels.cache.get(player.textChannel);
        if (channel) {
            channel.send({
                embeds: [{
                    title: '🎵 Şimdi Çalıyor',
                    description: `**${track.title}**`,
                    color: 0x00FF00,
                    fields: [
                        { name: '👤 Sanatçı', value: track.author, inline: true },
                        { name: '⏱️ Süre', value: track.duration, inline: true }
                    ],
                    thumbnail: { url: track.thumbnail }
                }]
            });
        }
    });

    manager.on('queueEnd', (player) => {
        const channel = client.channels.cache.get(player.textChannel);
        if (channel) {
            channel.send({
                embeds: [{
                    title: '⏹️ Sıra Bitti',
                    description: 'Sıradaki tüm şarkılar çalındı!',
                    color: 0xFF0000
                }]
            });
        }
        player.destroy();
    });

    manager.on('trackError', (player, track, error) => {
        console.error(`Şarkı çalma hatası: ${error.message}`);
        const channel = client.channels.cache.get(player.textChannel);
        if (channel) {
            channel.send({
                embeds: [{
                    title: '❌ Hata',
                    description: `Şarkı çalınırken bir hata oluştu: ${error.message}`,
                    color: 0xFF0000
                }]
            });
        }
    });

    return manager;
} 