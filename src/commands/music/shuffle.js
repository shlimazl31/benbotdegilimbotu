import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Şarkı sırasını karıştırır'),

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

            if (queue.tracks.size < 2) {
                return await interaction.reply({
                    content: '❌ Sırada karıştırılacak yeterli şarkı yok!',
                    ephemeral: true
                });
            }

            queue.tracks.shuffle();
            await interaction.reply('🔀 Şarkı sırası karıştırıldı!');
        } catch (error) {
            console.error('Shuffle hatası:', error);
            await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
}; 