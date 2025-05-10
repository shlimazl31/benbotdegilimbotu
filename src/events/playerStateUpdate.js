import { Events, EmbedBuilder } from 'discord.js';

export const event = {
    name: Events.PlayerStateUpdate,
    once: false,
    async execute(player, oldState, newState) {
        try {
            // Eğer bot kanaldan ayrıldıysa
            if (oldState.status === 'ready' && newState.status === 'disconnected') {
                const channel = player.textChannel;
                if (channel) {
                    const embed = new EmbedBuilder()
                        .setTitle('👋 Otomatik Ayrılma')
                        .setDescription('10 dakika boyunca müzik çalmadığım için kanaldan ayrıldım!')
                        .setColor('#FF0000');
                    await channel.send({ embeds: [embed] });
                }
            }
        } catch (error) {
            console.error('Player state update hatası:', error);
        }
    }
}; 