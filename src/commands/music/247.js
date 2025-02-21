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
                    try {
                        await player.nodes.create(interaction.guild, {
                            metadata: interaction,
                            channelId: interaction.member.voice.channel.id,
                            selfDeaf: true,
                            volume: 80,
                            leaveOnEmpty: false,
                            leaveOnEmptyCooldown: 300000,
                            leaveOnEnd: false,
                            leaveOnEndCooldown: 300000,
                        });
                    } catch (error) {
                        console.error('Ses kanalına katılma hatası:', error);
                        return await interaction.reply({
                            content: '❌ Ses kanalına katılırken bir hata oluştu!',
                            ephemeral: true
                        });
                    }
                }
                return await interaction.reply('✅ 24/7 modu açıldı! Artık ses kanalından çıkmayacağım.');
            } else {
                if (queue && !queue.currentTrack) {
                    await queue.delete();
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