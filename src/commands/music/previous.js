import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('previous')
        .setDescription('Önceki çalınan şarkıya döner'),

    async execute(interaction) {
        try {
            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guildId);

            if (!queue || !queue.history.tracks.size) {
                return await interaction.reply({
                    content: '❌ Önceki şarkı yok!',
                    ephemeral: true
                });
            }

            await queue.history.back();
            
            return await interaction.reply('⏮️ Önceki şarkıya dönüldü!');
        } catch (error) {
            console.error('Previous komutu hatası:', error);
            return await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
}; 