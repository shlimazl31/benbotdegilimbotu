import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';
import { hasDjRole } from './dj.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('previous')
        .setDescription('Önceki şarkıya döner'),

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

            if (!queue || !queue.history.previousTrack) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Önceki Şarkı Yok')
                    .setDescription('Önceki şarkı bulunamadı!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            await queue.history.previous();
            const embed = new EmbedBuilder()
                .setTitle('⏮️ Önceki Şarkı')
                .setDescription('Önceki şarkıya dönüldü!')
                .setColor('#00FF00');
            return await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Previous komutu hatası:', error);
            const embed = new EmbedBuilder()
                .setTitle('❌ Hata')
                .setDescription('Bir hata oluştu!')
                .setColor('#FF0000');
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
}; 