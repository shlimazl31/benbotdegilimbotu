import { Manager } from 'erela.js';
import { Client } from 'discord.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export function createErelaManager(client) {
    const manager = new Manager({
        nodes: [
            {
                host: process.env.LAVALINK_HOST || 'localhost',
                port: parseInt(process.env.LAVALINK_PORT) || 2333,
                password: process.env.LAVALINK_PASSWORD || 'youshallnotpass',
                secure: process.env.LAVALINK_SECURE === 'true',
                retryAmount: 5,
                retryDelay: 5000,
                reconnectTries: 3,
                reconnectInterval: 5000
            }
        ],
        autoPlay: true,
        defaultSearchPlatform: 'youtube',
        useUnresolvedData: true,
        clientName: 'benbotdegilimbotu',
        send: (id, payload) => {
            const guild = client.guilds.cache.get(id);
            if (guild) guild.shard.send(payload);
        }
    });

    manager.on('nodeConnect', node => {
        console.log(`🟢 Lavalink Node bağlandı: ${node.options.identifier}`);
    });

    manager.on('nodeError', (node, error) => {
        console.error(`🔴 Lavalink Node hatası [${node.options.identifier}]:`, error);
    });

    manager.on('nodeDisconnect', node => {
        console.log(`🟡 Lavalink Node bağlantısı kesildi: ${node.options.identifier}`);
    });

    manager.on('trackStart', (player, track) => {
        console.log(`🎵 Şarkı başladı: ${track.title}`);
    });

    manager.on('queueEnd', player => {
        console.log(`⏹️ Sıra bitti: ${player.guild}`);
        player.destroy();
    });

    manager.on('trackError', (player, track, error) => {
        console.error(`🔴 Şarkı hatası [${player.guild}]:`, error);
        player.textChannel?.send(`❌ Şarkı çalınırken bir hata oluştu: ${error.message}`).catch(console.error);
    });

    manager.on('playerError', (player, error) => {
        console.error(`🔴 Player hatası [${player.guild}]:`, error);
        player.textChannel?.send(`❌ Oynatma hatası: ${error.message}`).catch(console.error);
    });

    manager.on('error', (error) => {
        console.error('🔴 Lavalink hatası:', error);
    });

    return manager;
} 