import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';
import { getGuildSetting, setGuildSetting } from '../../utils/guildSettings.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('autoplay')
        .setDescription('Otomatik oynatma modunu açar/kapatır'),

    async execute(interaction) {
        try {
            if (!interaction.member.voice.channel) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Ses Kanalı Gerekli')
                    .setDescription('Önce bir ses kanalına katılmalısın!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guildId);

            if (!queue) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Şu Anda Şarkı Yok')
                    .setDescription('Şu anda çalan bir şarkı yok!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const autoplay = getGuildSetting(interaction.guildId, 'autoplay');
            const newMode = !autoplay;
            setGuildSetting(interaction.guildId, 'autoplay', newMode);
            queue.setRepeatMode(newMode ? 3 : 0); // 3: autoplay mode, 0: off

            const embed = new EmbedBuilder()
                .setTitle(newMode ? '✅ Otomatik Oynatma Açıldı' : '✅ Otomatik Oynatma Kapatıldı')
                .setDescription(newMode
                    ? 'Otomatik oynatma açıldı! Sıra bitince benzer şarkılar çalacak.'
                    : 'Otomatik oynatma kapatıldı!')
                .setColor('#00C851');
            return await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Autoplay komutu hatası:', error);
            const embed = new EmbedBuilder()
                .setTitle('❌ Hata')
                .setDescription('Bir hata oluştu!')
                .setColor('#FF0000');
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
}; 