import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Çalan şarkıyı duraklatır'),

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

            if (!player.playing) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Şarkı Zaten Duraklatılmış')
                    .setDescription('Şarkı zaten duraklatılmış durumda!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            player.pause(true);
            const embed = new EmbedBuilder()
                .setTitle('⏸️ Duraklatıldı')
                .setDescription('Şarkı duraklatıldı!')
                .setColor('#1976D2');
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Pause hatası:', error);
            const embed = new EmbedBuilder()
                .setTitle('❌ Hata')
                .setDescription('Bir hata oluştu!')
                .setColor('#FF0000');
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
}; 