import { SlashCommandBuilder } from 'discord.js';
import { leaveVoiceChannel } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Ses kanalından ayrılır'),

    async execute(interaction) {
        try {
            if (!interaction.guild) {
                return await interaction.reply({
                    content: '❌ Bu komut sadece sunucularda kullanılabilir!',
                    ephemeral: true
                });
            }

            // Özel leave fonksiyonumuzu kullanalım
            const success = leaveVoiceChannel(interaction.guild.id);
            console.log('Leave komutu çalıştırıldı, sonuç:', success); // Hata ayıklama için log

            if (success) {
                return await interaction.reply('👋 Ses kanalından ayrıldım!');
            } else {
                return await interaction.reply({
                    content: '❌ Şu anda bir ses kanalında değilim!',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Leave komutu hatası:', error);
            return await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
}; 