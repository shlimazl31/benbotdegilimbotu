import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Şarkı sırasını gösterir'),

    async execute(interaction) {
        try {
            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guildId);

            if (!queue || !queue.isPlaying()) {
                return await interaction.reply('Şu anda çalan bir şarkı yok!');
            }

            const tracks = queue.tracks.toArray();
            const currentTrack = queue.currentTrack;

            const embed = new EmbedBuilder()
                .setTitle('🎵 Şarkı Sırası')
                .setColor('#FF0000')
                .addFields(
                    { name: 'Şu anda çalıyor', value: `${currentTrack.title}` }
                );

            if (tracks.length > 0) {
                const trackList = tracks
                    .slice(0, 10)
                    .map((track, i) => `${i + 1}. ${track.title}`)
                    .join('\n');

                embed.addFields(
                    { name: 'Sıradaki Şarkılar', value: trackList }
                );

                if (tracks.length > 10) {
                    embed.setFooter({ text: `Ve ${tracks.length - 10} şarkı daha...` });
                }
            }

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Queue komutu hatası:', error);
            await interaction.reply('Şarkı sırası gösterilirken bir hata oluştu!');
        }
    }
};
