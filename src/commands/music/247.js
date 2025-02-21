import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';
import { getGuildSetting, setGuildSetting } from '../../utils/guildSettings.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('247')
        .setDescription('24/7 modu açar/kapatır'),

    async execute(interaction) {
        try {
            if (!interaction.member.voice.channel) {
                return await interaction.reply({
                    content: '❌ Önce bir ses kanalına katılmalısın!',
                    ephemeral: true
                });
            }

            const mode247 = getGuildSetting(interaction.guildId, '247');
            const newMode = !mode247;
            
            setGuildSetting(interaction.guildId, '247', newMode);
            
            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guildId);

            if (newMode) {
                if (!queue) {
                    await player.voices.join(interaction.member.voice.channel);
                }
                return await interaction.reply('✅ 24/7 modu açıldı! Artık ses kanalından çıkmayacağım.');
            } else {
                if (queue && !queue.currentTrack) {
                    await queue.destroy();
                }
                return await interaction.reply('✅ 24/7 modu kapatıldı! Müzik bitince kanaldan çıkacağım.');
            }
        } catch (error) {
            console.error('247 komutu hatası:', error);
            return await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
}; 