import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Müziği durdurur ve botu kanaldan çıkarır'),

    async execute(interaction) {
        try {
            const player = interaction.client.manager.get(interaction.guild.id);

            if (!player) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Şu Anda Şarkı Yok')
                    .setDescription('Şu anda çalan bir şarkı yok!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            player.destroy();
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
