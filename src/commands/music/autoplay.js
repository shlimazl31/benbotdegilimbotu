import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';
import { getGuildSetting, setGuildSetting } from '../../utils/guildSettings.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('autoplay')
        .setDescription('Otomatik oynatma modunu açar/kapatır'),

    async execute(interaction) {
        try {
            if (!interaction.member.voice.channel) {
                return await interaction.reply({
                    content: '❌ Önce bir ses kanalına katılmalısın!',
                    ephemeral: true
                });
            }

            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guildId);

            if (!queue) {
                return await interaction.reply({
                    content: '❌ Şu anda çalan bir şarkı yok!',
                    ephemeral: true
                });
            }

            const autoplay = getGuildSetting(interaction.guildId, 'autoplay');
            const newMode = !autoplay;
            
            setGuildSetting(interaction.guildId, 'autoplay', newMode);
            queue.setRepeatMode(newMode ? 3 : 0); // 3: autoplay mode, 0: off

            return await interaction.reply(
                newMode 
                    ? '✅ Otomatik oynatma açıldı! Sıra bitince benzer şarkılar çalacak.'
                    : '✅ Otomatik oynatma kapatıldı!'
            );
        } catch (error) {
            console.error('Autoplay komutu hatası:', error);
            return await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
}; 