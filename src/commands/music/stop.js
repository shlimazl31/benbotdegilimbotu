import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Müziği durdurur ve botu kanaldan çıkarır'),

    async execute(interaction) {
        try {
            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guildId);

            if (!queue) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Şu Anda Şarkı Yok')
                    .setDescription('Şu anda çalan bir şarkı yok!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            queue.delete();
            const embed = new EmbedBuilder()
                .setTitle('⏹️ Müzik Durduruldu')
                .setDescription('Müzik durduruldu ve sıra temizlendi!')
                .setColor('#1976D2');
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Stop hatası:', error);
            const embed = new EmbedBuilder()
                .setTitle('❌ Hata')
                .setDescription('Bir hata oluştu!')
                .setColor('#FF0000');
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
