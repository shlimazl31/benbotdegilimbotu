import { Events } from 'discord.js';

export const event = {
    name: Events.PlayerStateUpdate,
    once: false,
    async execute(queue, oldState, newState) {
        try {
            // Eğer bot kanaldan ayrıldıysa
            if (oldState.status === 'ready' && newState.status === 'disconnected') {
                const channel = queue.metadata;
                if (channel) {
                    await channel.send('🎵 10 dakika boyunca müzik çalmadığım için kanaldan ayrıldım!');
                }
            }
        } catch (error) {
            console.error('Player state update hatası:', error);
        }
    }
}; 