import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Şu an çalan şarkının bilgilerini gösterir'),

    async execute(interaction) {
        try {
            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guildId);

            if (!queue || !queue.isPlaying()) {
                return await interaction.reply({
                    content: '❌ Şu anda çalan bir şarkı yok!',
                    ephemeral: true
                });
            }

            const track = queue.currentTrack;
            const progress = queue.node.createProgressBar();

            const embed = new EmbedBuilder()
                .setTitle('🎵 Şu An Çalıyor')
                .setDescription(`**${track.title}**\n${progress}`)
                .addFields(
                    { name: '👤 Kanal', value: track.author, inline: true },
                    { name: '⏱️ Süre', value: track.duration, inline: true },
                    { name: '🔊 Ses Seviyesi', value: `${queue.node.volume}%`, inline: true }
                )
                .setThumbnail(track.thumbnail)
                .setColor('#FF0000');

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Nowplaying hatası:', error);
            await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
}; 