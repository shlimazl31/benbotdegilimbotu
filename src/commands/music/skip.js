import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Çalan şarkıyı atlar'),

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

            const currentTrack = queue.currentTrack;
            queue.node.skip();

            await interaction.reply(`⏭️ **${currentTrack.title}** atlandı!`);
        } catch (error) {
            console.error('Skip hatası:', error);
            await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
};
