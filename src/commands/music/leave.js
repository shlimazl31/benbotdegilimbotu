import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { leaveVoiceChannel } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Ses kanalından ayrılır'),

    async execute(interaction) {
        try {
            if (!interaction.guild) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Sunucu Gerekli')
                    .setDescription('Bu komut sadece sunucularda kullanılabilir!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Özel leave fonksiyonumuzu kullanalım
            const success = leaveVoiceChannel(interaction.guild.id);
            console.log('Leave komutu çalıştırıldı, sonuç:', success); // Hata ayıklama için log

            if (success) {
                const embed = new EmbedBuilder()
                    .setTitle('👋 Ayrıldım')
                    .setDescription('Ses kanalından ayrıldım!')
                    .setColor('#00C851');
                return await interaction.reply({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Kanalda Değilim')
                    .setDescription('Şu anda bir ses kanalında değilim!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } catch (error) {
            console.error('Leave komutu hatası:', error);
            const embed = new EmbedBuilder()
                .setTitle('❌ Hata')
                .setDescription('Bir hata oluştu!')
                .setColor('#FF0000');
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
}; 