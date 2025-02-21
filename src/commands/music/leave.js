import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';
import { getGuildSetting } from '../../utils/guildSettings.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Ses kanalından çıkar'),

    async execute(interaction) {
        try {
            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guildId);

            if (!queue) {
                return await interaction.reply({
                    content: '❌ Zaten ses kanalında değilim!',
                    ephemeral: true
                });
            }

            const mode247 = getGuildSetting(interaction.guildId, '247');
            if (mode247) {
                return await interaction.reply({
                    content: '❌ 24/7 modu açık! Önce `/247` komutu ile kapatmalısın.',
                    ephemeral: true
                });
            }

            await queue.destroy();
            return await interaction.reply('👋 Ses kanalından çıktım!');
        } catch (error) {
            console.error('Leave komutu hatası:', error);
            return await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
}; 