import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Bot ses kanalından ayrılır'),

    async execute(interaction) {
        try {
            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guildId);

            if (!queue) {
                return await interaction.reply({
                    content: '❌ Zaten bir ses kanalında değilim!',
                    ephemeral: true
                });
            }

            queue.delete();
            await interaction.reply('👋 Ses kanalından ayrıldım!');
        } catch (error) {
            console.error('Leave hatası:', error);
            await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
}; 