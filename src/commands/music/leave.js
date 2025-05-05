import { SlashCommandBuilder } from 'discord.js';
import { getVoiceConnection } from '@discordjs/voice';

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

            const connection = getVoiceConnection(interaction.guild.id);
            
            if (!connection) {
                return await interaction.reply({
                    content: '❌ Zaten bir ses kanalında değilim!',
                    ephemeral: true
                });
            }

            connection.destroy();
            return await interaction.reply('👋 Ses kanalından ayrıldım!');
        } catch (error) {
            console.error('Leave komutu hatası:', error);
            return await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
}; 