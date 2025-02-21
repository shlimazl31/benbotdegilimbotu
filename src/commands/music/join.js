import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Ses kanalına katılır'),

    async execute(interaction) {
        try {
            if (!interaction.member.voice.channel) {
                return await interaction.reply({
                    content: '❌ Önce bir ses kanalına katılmalısın!',
                    ephemeral: true
                });
            }

            const player = await getPlayer(interaction.client);
            await player.voices.join(interaction.member.voice.channel);

            return await interaction.reply('👋 Ses kanalına katıldım!');
        } catch (error) {
            console.error('Join komutu hatası:', error);
            return await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
}; 