import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Çalan şarkıyı duraklatır'),

    async execute(interaction) {
        try {
            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guildId);

            if (!queue || !queue.isPlaying()) {
                return await interaction.reply({
                    content: '❌ Şu anda çalan bir şarkı yok!',
                    ephemeral: true
                });
            }

            queue.node.pause();
            await interaction.reply('⏸️ Şarkı duraklatıldı!');
        } catch (error) {
            console.error('Pause hatası:', error);
            await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
}; 