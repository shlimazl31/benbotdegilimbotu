import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';
import { getGuildSetting, setGuildSetting } from '../../utils/guildSettings.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('247')
        .setDescription('24/7 modu açar/kapatır'),

    async execute(interaction) {
        try {
            if (!interaction.member.voice.channel) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Ses Kanalı Gerekli')
                    .setDescription('Önce bir ses kanalına katılmalısın!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
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
                        const embed = new EmbedBuilder()
                            .setTitle('❌ Katılım Hatası')
                            .setDescription('Ses kanalına katılırken bir hata oluştu!')
                            .setColor('#FF0000');
                        return await interaction.reply({ embeds: [embed], ephemeral: true });
                    }
                }
                const embed = new EmbedBuilder()
                    .setTitle('✅ 24/7 Modu Açıldı')
                    .setDescription('24/7 modu açıldı! Artık ses kanalından çıkmayacağım.')
                    .setColor('#00C851');
                return await interaction.reply({ embeds: [embed] });
            } else {
                if (queue && !queue.currentTrack) {
                    await queue.delete();
                }
                const embed = new EmbedBuilder()
                    .setTitle('✅ 24/7 Modu Kapatıldı')
                    .setDescription('24/7 modu kapatıldı! Müzik bitince kanaldan çıkacağım.')
                    .setColor('#00C851');
                return await interaction.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('247 komutu hatası:', error);
            const embed = new EmbedBuilder()
                .setTitle('❌ Hata')
                .setDescription('Bir hata oluştu!')
                .setColor('#FF0000');
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
}; 