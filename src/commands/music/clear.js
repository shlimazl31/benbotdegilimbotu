import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';
import { hasDjRole } from './dj.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Müzik sırasını temizler'),

    async execute(interaction) {
        try {
            if (!interaction.member.voice.channel) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Ses Kanalı Gerekli')
                    .setDescription('Önce bir ses kanalına katılmalısın!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            if (!hasDjRole(interaction.member)) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Yetki Gerekli')
                    .setDescription('Bu komutu kullanmak için DJ rolüne sahip olmalısın!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guildId);

            if (!queue || !queue.tracks.size) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Sıra Boş')
                    .setDescription('Sırada temizlenecek şarkı yok!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            queue.tracks.clear();
            const embed = new EmbedBuilder()
                .setTitle('🗑️ Sıra Temizlendi')
                .setDescription('Müzik sırası başarıyla temizlendi!')
                .setColor('#00FF00');
            return await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Clear komutu hatası:', error);
            const embed = new EmbedBuilder()
                .setTitle('❌ Hata')
                .setDescription('Bir hata oluştu!')
                .setColor('#FF0000');
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
}; 