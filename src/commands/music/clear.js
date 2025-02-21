import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Müzik sırasını temizler'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guildId);

            if (!queue) {
                return await interaction.followUp({
                    content: '❌ Şu anda aktif bir sıra yok!',
                    ephemeral: true
                });
            }

            queue.tracks.clear();
            return await interaction.followUp('🗑️ Müzik sırası temizlendi!');
        } catch (error) {
            console.error('Clear hatası:', error);
            return await interaction.followUp({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
}; 