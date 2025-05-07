import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Çalan şarkıyı atlar'),

    async execute(interaction) {
        try {
            if (!interaction.guild) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Sunucu Gerekli')
                    .setDescription('Bu komut sadece sunucularda kullanılabilir!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guild.id);

            if (!queue || !queue.isPlaying()) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Şu Anda Şarkı Yok')
                    .setDescription('Şu anda çalan bir şarkı yok!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const currentTrack = queue.currentTrack;
            const success = await queue.node.skip();

            if (!success) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Atlanamadı')
                    .setDescription('Şarkı atlanırken bir hata oluştu!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('⏭️ Şarkı Atlandı')
                .setDescription(`**${currentTrack.title}** atlandı!`)
                .setColor('#1976D2');
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Skip hatası:', error);
            const embed = new EmbedBuilder()
                .setTitle('❌ Hata')
                .setDescription('Bir hata oluştu!')
                .setColor('#FF0000');
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
