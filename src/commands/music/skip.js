import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Çalan şarkıyı atlar'),

    async execute(interaction) {
        try {
            if (!interaction.guild) {
                return await interaction.reply({
                    content: '❌ Bu komut sadece sunucularda kullanılabilir!',
                    ephemeral: true
                });
            }

            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guild.id);

            if (!queue) {
                return await interaction.reply({
                    content: '❌ Şu anda çalan bir şarkı yok!',
                    ephemeral: true
                });
            }

            if (!queue.isPlaying()) {
                return await interaction.reply({
                    content: '❌ Şu anda çalan bir şarkı yok!',
                    ephemeral: true
                });
            }

            const currentTrack = queue.currentTrack;
            const success = await queue.node.skip();

            if (!success) {
                return await interaction.reply({
                    content: '❌ Şarkı atlanırken bir hata oluştu!',
                    ephemeral: true
                });
            }

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
